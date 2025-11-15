# app/route/models.py

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# ✅ 장애물 데이터 테이블 (YOLO 결과 반영)
class Obstacle(Base):
    __tablename__ = "obstacles"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50))           # 예: "curb", "crosswalk", "ramp"
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow)

class RouteResult(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)

    # 어떤 사용자의 경로인지
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 출발/도착 좌표
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)

    # 경로 자체 (좌표 리스트 형태)
    route_points = Column(JSON, nullable=False)

    # 총 거리
    distance_m = Column(Float)

    # 어떤 장애물을 피했는지
    avoided = Column(String(200))

    created_at = Column(DateTime, default=datetime.utcnow)

    # 유저와 연결
    user = relationship("User", back_populates="routes")
    