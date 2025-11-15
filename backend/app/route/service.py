# backend/app/route/service.py

from sqlalchemy.orm import Session

from app.route.pathfinding import astar_path_with_penalty
from app.route.models import RouteResult, Obstacle


def find_path_from_request(req, db: Session, user_id: int):
    start = (req.start_lat, req.start_lng)
    end = (req.end_lat, req.end_lng)

    # A* + 패널티 + 회피 실패 판정
    result = astar_path_with_penalty(
        start=start,
        end=end,
        db=db,
        avoid_types=req.avoid_types,
        radius_m=req.radius_m,
        penalties=req.penalties,
    )

    # 경로 결과를 DB에 저장
    route_obj = RouteResult(
        user_id=user_id,
        start_lat=req.start_lat,
        start_lng=req.start_lng,
        end_lat=req.end_lat,
        end_lng=req.end_lng,
        route_points=result["route"],
        distance_m=result["distance_m"],
        avoided=",".join(req.avoid_types),
    )

    db.add(route_obj)
    db.commit()
    db.refresh(route_obj)

    # 프론트에는 계산 결과만 반환
    return result


def get_all_obstacles(db: Session):
    return db.query(Obstacle).all()
