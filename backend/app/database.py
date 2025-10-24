#backend\app\database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# === .env 자동 로드 ===
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# === 환경 변수 로드 ===
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "환경변수 DATABASE_URL이 설정되지 않았습니다. "
        "EC2 환경이라면 .env 또는 Docker env_file에 DB URL을 추가하세요."
    )

# === SQL 로그 출력 여부 설정 ===
# 개발 단계: 기본값 True / 배포 시 .env에서 DB_ECHO=False 설정
DB_ECHO = os.getenv("DB_ECHO", "True").lower() in ("true", "1", "t")

# === SQLAlchemy 엔진 생성 ===
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 연결 유지
    echo=DB_ECHO         # SQL 출력 (True면 쿼리 출력, False면 비활성화)
)

# === 세션 및 베이스 설정 ===
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# === DB 세션 의존성 주입 ===
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
