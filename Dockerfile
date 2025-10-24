# 베이스 이미지
FROM python:3.11-slim

# 작업 디렉토리
WORKDIR /app

# requirements.txt 먼저 복사 (캐시 최적화)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 코드 복사
COPY ./backend ./backend

# 환경 변수
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Seoul

# 포트 노출
EXPOSE 8000

# FastAPI 실행 (운영 환경)
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "backend.main:app", "--bind", "0.0.0.0:8000", "--workers", "4"]
