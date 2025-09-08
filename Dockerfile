# 베이스 이미지: Python 3.11 slim
FROM python:3.11-slim

# 작업 디렉토리
WORKDIR /app

# 의존성 설치
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY . .

# 컨테이너가 노출할 포트
EXPOSE 50080

# 앱 실행 (FastAPI/uvicorn)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "50080"]