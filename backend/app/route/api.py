# backend/app/route/api.py

import threading
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.auth.utils import get_current_user
from app.route import schemas
from app.route import service
from app.route.detect_service import detect_folder_and_save

router = APIRouter()

# 동시성 문제 방지: 이미지 추론 중인지 확인하는 Lock
_detection_lock = threading.Lock()
_is_detecting = False


# 1) 경로 계산 (최초 실행 시 이미지 추론 자동 실행)
@router.post(
    "/find",
    summary="경로 계산 (개별 장애물 성공/실패 분석 v3)"
)
def find_route(
    request: schemas.RouteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    경로 찾기:
    1. 최초 실행 시 DB에 장애물이 없으면 이미지 추론 후 DB 저장
    2. 이후 실행 시에는 DB에 저장된 장애물 데이터 사용
    3. 사용자가 선택한 장애물 타입을 회피하는 최적 경로 계산
    """
    # 최초 경로 찾기 시: DB에 장애물이 없으면 이미지 추론 실행
    # 동시성 문제 방지: Lock을 사용하여 동시에 여러 요청이 추론을 실행하지 않도록 함
    global _is_detecting
    
    if not service.has_obstacles(db):
        with _detection_lock:
            # Lock을 획득한 후 다시 한 번 확인 (다른 스레드가 이미 추론 완료했을 수 있음)
            if not service.has_obstacles(db) and not _is_detecting:
                _is_detecting = True
                print("📸 최초 경로 찾기: 이미지 추론 시작...")
                try:
                    detect_folder_and_save(db)
                    print("✅ 이미지 추론 완료: 장애물 데이터가 DB에 저장되었습니다.")
                except Exception as e:
                    print(f"⚠️ 이미지 추론 실패: {str(e)}")
                    # 추론 실패해도 경로 계산은 진행 (기존 장애물 데이터가 없을 수 있음)
                finally:
                    _is_detecting = False
    
    # 경로 계산 (DB에 저장된 장애물 데이터 사용)
    return service.find_path_from_request(
        req=request,
        db=db,
        user_id=current_user.id
    )


# 2) 사용자가 선택한 경로 저장
@router.post("/save")
def save_route(
    request: schemas.RouteSaveRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    route_obj = service.save_route(
        req=request,
        db=db,
        user_id=current_user.id
    )

    # created_at을 문자열로 변환하여 딕셔너리로 직접 반환
    return {
        "id": route_obj.id,
        "start_lat": route_obj.start_lat,
        "start_lng": route_obj.start_lng,
        "end_lat": route_obj.end_lat,
        "end_lng": route_obj.end_lng,
        "route_points": route_obj.route_points,
        "distance_m": route_obj.distance_m,
        "avoided": route_obj.avoided,
        "created_at": route_obj.created_at.isoformat() if isinstance(route_obj.created_at, datetime) else str(route_obj.created_at)
    }


# 조회
@router.get("/my")
def get_my_routes(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    routes = service.get_my_routes(db=db, user_id=current_user.id)
    # created_at을 문자열로 변환하여 딕셔너리 리스트로 반환
    result = []
    for route_obj in routes:
        result.append({
            "id": route_obj.id,
            "start_lat": route_obj.start_lat,
            "start_lng": route_obj.start_lng,
            "end_lat": route_obj.end_lat,
            "end_lng": route_obj.end_lng,
            "route_points": route_obj.route_points,
            "distance_m": route_obj.distance_m,
            "avoided": route_obj.avoided,
            "created_at": route_obj.created_at.isoformat() if isinstance(route_obj.created_at, datetime) else str(route_obj.created_at)
        })
    return result


# 저장된 경로 삭제 기능
@router.delete("/delete/{route_id}")
def delete_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    success = service.delete_route(
        route_id=route_id,
        db=db,
        user_id=current_user.id
    )

    if not success:
        return {"ok": False, "message": "해당 경로를 찾을 수 없거나 삭제 권한이 없습니다."}

    return {"ok": True, "message": "경로가 삭제되었습니다."}


# 장애물 조회 (지도 영역 내)
@router.get("/obstacles")
def get_obstacles_in_bounds(
    south: float,
    north: float,
    west: float,
    east: float,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """지도 영역 내의 장애물 조회"""
    from app.route.models import Obstacle

    obstacles = (
        db.query(Obstacle)
        .filter(Obstacle.lat >= south, Obstacle.lat <= north)
        .filter(Obstacle.lng >= west, Obstacle.lng <= east)
        .all()
    )

    return [
        {
            "id": obs.id,
            "type": obs.type,
            "lat": obs.lat,
            "lng": obs.lng,
            "confidence": obs.confidence,
            "detected_at": obs.detected_at.isoformat() if obs.detected_at else None
        }
        for obs in obstacles
    ]


# 이미지 추론 실행 (관리자용)
@router.post("/detect")
def run_detection(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    images 폴더의 모든 이미지를 YOLO로 추론하여 장애물 데이터를 DB에 저장
    """
    try:
        result = detect_folder_and_save(db)
        return {
            "ok": True,
            "message": "이미지 추론 완료",
            "total_images": result["total"],
            "processed_images": result["processed"],
            "total_obstacles_saved": result["saved"]
        }
    except Exception as e:
        return {
            "ok": False,
            "message": f"이미지 추론 실패: {str(e)}"
        }
