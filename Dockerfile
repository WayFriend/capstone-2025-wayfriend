# 베이스 이미지
FROM python:3.11-slim

# 시스템 패키지 설치 (bcrypt/passlib 빌드용 + OpenCV 의존성)
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libffi-dev \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리
WORKDIR /app

# requirements.txt 먼저 복사 (캐시 최적화)
COPY requirements.txt .

# 파이썬 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 코드 복사
COPY ./backend ./backend

# 환경 변수
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Seoul
ENV PYTHONPATH=/app/backend

# 포트 노출
EXPOSE 8000

# FastAPI 실행 (운영 환경)
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "backend.main:app", "--bind", "0.0.0.0:8000", "--workers", "4"]
