# backend/main.py

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.auth import models
from app import database
from app.auth import api
from app.route import api as route_api
from app.route import models as route_models
from app.map import api as map_api

# FastAPI 인스턴스
app = FastAPI()

# CORS 설정
# Vercel 도메인 추가 (프로덕션 및 프리뷰)
vercel_domains = [
    "https://capstone-2025-wayfriend.vercel.app",
    # 환경 변수에서 추가 도메인 가져오기 (선택사항)
]

# 환경 변수에서 추가 허용 도메인 가져오기
import os
additional_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
additional_origins = [origin.strip() for origin in additional_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://34.239.248.132:3000",
        "http://34.239.248.132:5173",
        "http://34.239.248.132:8000",  # 백엔드 자체 origin도 추가
        "https://34.239.248.132",  # HTTPS 백엔드 URL 추가
        *vercel_domains,
        *additional_origins,
    ],
    allow_origin_regex=r"https://.*vercel\.app",  # Vercel 프리뷰 배포 지원 (더 포괄적인 패턴)
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# DB 테이블 생성
models.Base.metadata.create_all(bind=database.engine)
route_models.Base.metadata.create_all(bind=database.engine)


# 라우터 등록
app.include_router(api.router, prefix="/user", tags=["User"])
app.include_router(route_api.router, prefix="/route", tags=["Route"])
app.include_router(map_api.router, tags=["Map"])

@app.get("/")
def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}

@app.get("/health")
def health():
    return {"ok": True}