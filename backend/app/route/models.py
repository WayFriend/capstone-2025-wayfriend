# app/route/models.py

from sqlalchemy import Column, Integer, String, Float, DateTime
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
