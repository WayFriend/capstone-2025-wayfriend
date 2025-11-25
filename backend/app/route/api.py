# backend/app/route/api.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.utils import get_current_user
from app.route import schemas
from app.route import service

router = APIRouter()


# 1) 경로 계산 (DB 저장 없음)
@router.post(
    "/find",
    response_model=schemas.RouteResponse,
    summary="경로 계산 (개별 장애물 성공/실패 분석 v3)"
)
def find_route(
    request: schemas.RouteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return service.find_path_from_request(
        req=request,
        db=db,
        user_id=current_user.id
    )


# 2) 사용자가 선택한 경로 저장
@router.post("/save", response_model=schemas.RouteStored)
def save_route(
    request: schemas.RouteSaveRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return service.save_route(
        req=request,
        db=db,
        user_id=current_user.id
    )


# 조회
@router.get("/my", response_model=list[schemas.RouteStored])
def get_my_routes(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    routes = service.get_my_routes(db=db, user_id=current_user.id)
    return routes


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
