# backend/app/route/schemas.py

from pydantic import BaseModel
from typing import List, Tuple, Optional


# -----------------------------------------------------
# 경로 계산 요청
# -----------------------------------------------------
class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    avoid_types: List[str]
    radius_m: float
    penalties: dict


# -----------------------------------------------------
# 경로 계산 결과
# -----------------------------------------------------
class RouteResponse(BaseModel):
    route: List[Tuple[float, float]]
    distance_m: float
    risk_factors: List[str]
    message: Optional[str] = None  # 회피 실패 시 보여줄 문구


# -----------------------------------------------------
# 사용자가 선택해서 저장할 때 사용하는 요청 모델
# -----------------------------------------------------
class RouteSaveRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    route_points: List[Tuple[float, float]]
    distance_m: float
    avoided: List[str]


# -----------------------------------------------------
# DB에서 저장된 경로 조회할 때 사용하는 응답 모델
# -----------------------------------------------------
class RouteStored(BaseModel):
    id: int
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    route_points: List[Tuple[float, float]]
    distance_m: Optional[float] = None
    avoided: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True  # Pydantic v2 방식


# -----------------------------------------------------
# 장애물 조회 응답 모델
# -----------------------------------------------------
class ObstacleResponse(BaseModel):
    id: int
    type: str
    lat: float
    lng: float
    confidence: Optional[float]
    detected_at: str

    class Config:
        from_attributes = True
