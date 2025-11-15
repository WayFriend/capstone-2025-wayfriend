# backend\app\route\api.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.route import service, schemas
from app.auth.utils import get_current_user  # ← 기존 로그인 확인 함수

router = APIRouter()


# 🔥 유저별 경로 탐색 + DB 저장
@router.post("/find", response_model=schemas.RouteResponse)
def find_route(
    request: schemas.RouteRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return service.find_path_from_request(
        req=request,
        db=db,
        user_id=current_user.id
    )


# 🔍 장애물 조회는 그대로 유지
@router.get("/obstacles", response_model=list[schemas.ObstacleResponse])
def get_obstacles(db: Session = Depends(get_db)):
    return service.get_all_obstacles(db)
