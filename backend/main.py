# backend/main.py

from fastapi import FastAPI
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
import re
additional_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
additional_origins = [origin.strip() for origin in additional_origins if origin.strip()]

# 허용된 Origin 목록
allowed_origins_list = [
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
]

def is_allowed_origin(origin: str) -> bool:
    """Origin이 허용된 도메인인지 확인 (Vercel 도메인 포함)"""
    if not origin:
        return False

    # 명시적으로 허용된 Origin 확인
    if origin in allowed_origins_list:
        print(f"[CORS] Origin 허용 (명시적): {origin}")
        return True

    # Vercel 도메인 패턴 확인 (프로덕션 및 프리뷰 모두 지원)
    if re.match(r"https://.*\.vercel\.app$", origin):
        print(f"[CORS] Origin 허용 (Vercel 패턴): {origin}")
        return True

    print(f"[CORS] Origin 거부: {origin}")
    return False

# 커스텀 CORS 미들웨어를 위한 함수
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        print(f"[CORS Middleware] 요청: {request.method} {request.url.path}, Origin: {origin}")

        # OPTIONS 요청 처리 (preflight)
        if request.method == "OPTIONS":
            print(f"[CORS Middleware] OPTIONS 요청 처리 시작")
            response = Response(status_code=200)
            if origin and is_allowed_origin(origin):
                print(f"[CORS Middleware] Origin 허용, CORS 헤더 추가")
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                # credentials: true일 때는 와일드카드(*) 사용 불가, 명시적으로 헤더 나열 필요
                response.headers["Access-Control-Allow-Headers"] = "content-type, authorization, accept, origin, x-requested-with"
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Max-Age"] = "3600"
            else:
                print(f"[CORS Middleware] Origin 거부됨")
                # 허용되지 않은 Origin인 경우에도 CORS 헤더는 반환 (보안상 빈 값)
                response.headers["Access-Control-Allow-Origin"] = "null"
            return response

        # 일반 요청 처리
        response = await call_next(request)
        if origin and is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Expose-Headers"] = "*"
        return response

app.add_middleware(CustomCORSMiddleware)

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