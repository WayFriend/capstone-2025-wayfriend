# backend/app/route/service.py

from sqlalchemy.orm import Session

from app.route.pathfinding import astar_path_with_penalty
from app.route.models import RouteResult, Obstacle


# ---------------------------------------------------------
# 1) 경로 계산 (DB 저장 없음)
# ---------------------------------------------------------
def find_path_from_request(req, db: Session, user_id: int):
    return find_best_path(req, db, user_id)


# ---------------------------------------------------------
# 2) 사용자가 선택한 경로 저장
# ---------------------------------------------------------
def save_route(req, db: Session, user_id: int) -> RouteResult:
    try:
        # avoided 리스트를 문자열로 변환 (빈 리스트 처리)
        avoided_str = ",".join(req.avoided) if req.avoided else ""
        
        route_obj = RouteResult(
            user_id=user_id,
            start_lat=req.start_lat,
            start_lng=req.start_lng,
            end_lat=req.end_lat,
            end_lng=req.end_lng,
            route_points=req.route_points,  # JSON 컬럼이므로 자동 직렬화됨
            distance_m=req.distance_m,
            avoided=avoided_str,
        )

        db.add(route_obj)
        db.commit()
        db.refresh(route_obj)
        return route_obj
    except Exception as e:
        db.rollback()
        raise e


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


# ---------------------------------------------------------
# 6) 최적 회피 경로 계산 (핵심 기능)
# ---------------------------------------------------------
def find_best_path(req, db, user_id):

    current_avoid = list(req.avoid_types)

    while True:
        # 1) 경로 계산
        res = astar_path_with_penalty(
            start=(req.start_lat, req.start_lng),
            end=(req.end_lat, req.end_lng),
            db=db,
            avoid_types=current_avoid,
            radius_m=req.radius_m,
            penalties=req.penalties,
        )

        failed = res["risk_factors"]

        # 2) 모든 회피 성공 → 반환
        if not failed:
            return {
                "route": res["route"],
                "distance_m": res["distance_m"],
                "risk_factors": failed,
                "avoided_final": current_avoid
            }

        # 3) 실패한 회피 제거
        for f in failed:
            if f in current_avoid:
                current_avoid.remove(f)

        # 4) 더 이상 회피할 것이 없으면 → 최단거리 경로
        if not current_avoid:
            final = astar_path_with_penalty(
                start=(req.start_lat, req.start_lng),
                end=(req.end_lat, req.end_lng),
                db=db,
                avoid_types=[],
                radius_m=req.radius_m,
                penalties=req.penalties
            )
            return {
                "route": final["route"],
                "distance_m": final["distance_m"],
                "risk_factors": [],
                "avoided_final": []
            }
