# app/route/schemas.py

from pydantic import BaseModel
from typing import List, Dict, Tuple

class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    avoid_types: List[str] = []  # 프론트에서 ["curb", "stairs"] 식으로 전달
    radius_m: float = 3.0
    penalties: Dict[str, float] = {
        "curb": 1000.0,
        "bollard": 300.0,
        "crosswalk": 150.0,
        "slope": 500.0,
        "stairs": 3000.0
    }

class RouteResponse(BaseModel):
    route: list[tuple[float, float]]
    distance_m: float
    risk_factors: list[str]
    message: str | None = None

# DB에 저장된 경로를 사용자에게 보여줄 때 필yo
class RouteStored(BaseModel):
    id: int
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    route_points: list[tuple[float, float]]
    distance_m: float | None = None
    avoided: str | None = None
    created_at: str

    class Config:
        orm_mode = True

class ObstacleResponse(BaseModel):
    id: int
    type: str
    lat: float
    lng: float
    confidence: float | None
    detected_at: str

    class Config:
        orm_mode = True