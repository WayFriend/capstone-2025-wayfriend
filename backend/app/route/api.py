# app/route/api.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.route import service, schemas

router = APIRouter()

# ✅ 경로 탐색 API
@router.post("/find", response_model=schemas.RouteResponse)
def find_route(request: schemas.RouteRequest, db: Session = Depends(get_db)):
    """
    시작점과 도착점을 입력받아 경로를 탐색하는 API.
    나중에 service.find_path()를 호출하도록 연결할 예정.
    """
    result = service.find_path(
        start=(request.start_lat, request.start_lng),
        end=(request.end_lat, request.end_lng),
        db=db
    )
    return result


# ✅ 장애물 데이터 조회 API (임시)
@router.get("/obstacles", response_model=list[schemas.ObstacleResponse])
def get_obstacles(db: Session = Depends(get_db)):
    """
    현재 저장된 장애물 리스트 조회.
    (YOLO 모델 결과 DB 반영 확인용)
    """
    return service.get_all_obstacles(db)

@router.post("/find", response_model=schemas.RouteResponse)
def find_route(request: schemas.RouteRequest, db: Session = Depends(get_db)):
    """
    프론트에서 넘어온 회피 조합을 기반으로 경로 탐색 수행
    """
    return service.find_path_from_request(request, db)
