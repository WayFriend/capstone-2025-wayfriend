# backend/main.py

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.auth import models
from app import database
from app.auth import api

# FastAPI 인스턴스
app = FastAPI()

# CORS 설정 - Starlette의 CORSMiddleware는 자동으로 OPTIONS를 처리합니다
# 미들웨어는 역순으로 실행되므로, CORSMiddleware를 먼저 추가하면 마지막에 실행됩니다
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://34.239.248.132:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # 모든 메서드 허용 (OPTIONS 포함)
    allow_headers=["*"],  # 모든 헤더 허용
    expose_headers=["*"],
    max_age=3600,
)

# DB 테이블 생성
models.Base.metadata.create_all(bind=database.engine)

# 라우터 등록
app.include_router(api.router, prefix="/user", tags=["User"])

@app.get("/")
def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}

@app.get("/health")
def health():
    return {"ok": True}