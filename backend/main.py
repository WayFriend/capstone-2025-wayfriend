# backend/main.py

from fastapi import FastAPI
from app.auth import models
from app import database
from app.auth import api
from app.route import route_api
from app.route import models as route_models

# FastAPI 인스턴스
app = FastAPI()

# DB 테이블 생성
models.Base.metadata.create_all(bind=database.engine)
route_models.Base.metadata.create_all(bind=database.engine)


# 라우터 등록
app.include_router(api.router, prefix="/user", tags=["User"])
app.include_router(route_api.router, prefix="/route", tags=["Route"])

@app.get("/")
def root():
    return {"msg": "API 서버는 현재 작동 중입니다!"}

@app.get("/health")
def health():
    return {"ok": True}