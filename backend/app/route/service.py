# app/route/service.py

from sqlalchemy.orm import Session
from app.route.detect_service import astar_path_with_penalty

def find_path_from_request(req, db: Session):
    start = (req.start_lat, req.start_lng)
    end = (req.end_lat, req.end_lng)

    result = astar_path_with_penalty(
        start=start,
        end=end,
        db=db,
        avoid_types=req.avoid_types,
        radius_m=req.radius_m,
        penalties=req.penalties
    )
    return result
