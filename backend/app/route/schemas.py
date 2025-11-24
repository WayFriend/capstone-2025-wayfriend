from pydantic import BaseModel, field_serializer
from typing import List, Tuple, Optional, Dict
from datetime import datetime


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
# v3: 장애물 통계 스키마
# -----------------------------------------------------
class ObstacleStats(BaseModel):
    total: int
    success: int
    failed: int


# v3: 개별 장애물(경로 반경 내 포함된 장애물)
class UnavoidableItem(BaseModel):
    type: str
    lat: float
    lng: float


# -----------------------------------------------------
# v3: 경로 계산 결과 (A* 1회 + 상세 리포트)
# -----------------------------------------------------
class RouteResponse(BaseModel):
    route: List[Tuple[float, float]]
    distance_m: float
    risk_factors: List[str]
    avoided_final: List[str]
    message: Optional[str] = None  # 회피 실패 시 보여줄 문구


# -----------------------------------------------------
# 저장 요청 모델 (변경 없음)
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
# 저장된 경로 조회 응답
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
    created_at: datetime

    @field_serializer('created_at')
    def serialize_created_at(self, value: datetime) -> str:
        return value.isoformat() if value else ""

    class Config:
        from_attributes = True


# -----------------------------------------------------
# 장애물 조회 응답 모델 (변경 없음)
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
