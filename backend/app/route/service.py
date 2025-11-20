# backend/app/route/service.py

from sqlalchemy.orm import Session

from app.route.pathfinding import astar_path_with_penalty
from app.route.models import RouteResult, Obstacle


# ---------------------------------------------------------
# 1) 경로 계산 (A* 1회 실행, v3 로직에 맞게 단순화)
# ---------------------------------------------------------
def find_path_from_request(req, db: Session, user_id: int):
    """
    v3 로직:
    - A*는 단 한 번만 실행
    - pathfinding.py에서 개별 장애물 성공/실패를 모두 판단
    - 타입 전체 회피 포기 삭제
    - 결과는 pathfinding.py에 있는 obstacle_stats / unavoidable / risk_factors 그대로 반환
    """
    res = astar_path_with_penalty(
        start=(req.start_lat, req.start_lng),
        end=(req.end_lat, req.end_lng),
        db=db,
        avoid_types=req.avoid_types,
        radius_m=req.radius_m,
        penalties=req.penalties,
    )

    return res


# ---------------------------------------------------------
# 2) 사용자가 선택한 경로 저장
# ---------------------------------------------------------
def save_route(req, db: Session, user_id: int) -> RouteResult:
    route_obj = RouteResult(
        user_id=user_id,
        start_lat=req.start_lat,
        start_lng=req.start_lng,
        end_lat=req.end_lat,
        end_lng=req.end_lng,
        route_points=req.route_points,
        distance_m=req.distance_m,
        avoided=",".join(req.avoided),
    )

    db.add(route_obj)
    db.commit()
    db.refresh(route_obj)
    return route_obj


# ---------------------------------------------------------
# 3) 저장된 경로 삭제
# ---------------------------------------------------------
def delete_route(route_id: int, db: Session, user_id: int):
    route = (
        db.query(RouteResult)
        .filter(RouteResult.id == route_id, RouteResult.user_id == user_id)
        .first()
    )

    if not route:
        return None

    db.delete(route)
    db.commit()
    return True


# ---------------------------------------------------------
# 4) 저장된 경로 목록 조회
# ---------------------------------------------------------
def get_my_routes(db: Session, user_id: int):
    return (
        db.query(RouteResult)
        .filter(RouteResult.user_id == user_id)
        .order_by(RouteResult.created_at.desc())
        .all()
    )


# ---------------------------------------------------------
# 5) 장애물 전체 조회
# ---------------------------------------------------------
def get_all_obstacles(db: Session):
    return db.query(Obstacle).all()
