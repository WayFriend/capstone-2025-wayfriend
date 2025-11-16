# backend/app/route/service.py

from sqlalchemy.orm import Session

from app.route.pathfinding import astar_path_with_penalty
from app.route.models import RouteResult, Obstacle


# ---------------------------------------------------------
# 1) 경로 계산만 수행 (DB 저장 없음)
# ---------------------------------------------------------
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

    # 사용자가 선택했을 때만 저장 → 여기서는 저장 안 함
    return result


# ---------------------------------------------------------
# 2) 사용자가 선택한 경로만 저장하는 함수
# ---------------------------------------------------------
def save_route(req, db: Session, user_id: int) -> RouteResult:
    """
    프론트에서 사용자가 '이 경로 저장'을 눌렀을 때 호출됨.
    """
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
# 3) 저장된 경로 삭제 기능
# ---------------------------------------------------------
def delete_route(route_id: int, db: Session, user_id: int):
    """
    로그인한 사용자의 저장된 경로만 삭제 가능
    """
    route = (
        db.query(RouteResult)
        .filter(RouteResult.id == route_id, RouteResult.user_id == user_id)
        .first()
    )

    if not route:
        return None  # 없는 경우 or 권한 없음

    db.delete(route)
    db.commit()
    return True


# ---------------------------------------------------------
# 4) 저장된 경로 목록 조회
# ---------------------------------------------------------
def get_my_routes(db: Session, user_id: int):
    """
    로그인한 사용자의 저장된 경로 목록 반환
    """
    return (
        db.query(RouteResult)
        .filter(RouteResult.user_id == user_id)
        .order_by(RouteResult.created_at.desc())  # 최신 순
        .all()
    )


# ---------------------------------------------------------
# 5) 장애물 전체 조회 (기존 기능)
# ---------------------------------------------------------
def get_all_obstacles(db: Session):
    return db.query(Obstacle).all()
