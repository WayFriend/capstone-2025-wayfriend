# backend/app/auth/utils.py
import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.auth import models
from app.database import get_db

# .env 로드: python-dotenv가 설치되어 있으면 사용, 없으면 조용히 스킵
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # requirements에 python-dotenv가 없더라도 동작하도록 무시
    pass

# === 환경 변수 ===
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

# 필수 값 검증 (하드코딩 금지)
if not SECRET_KEY:
    # 배포/개발 어디서든 키가 없으면 바로 중단해 안전하게 실패
    raise RuntimeError(
        "환경변수 SECRET_KEY가 설정되지 않았습니다. "
        "'.env' 또는 실행 환경에 SECRET_KEY를 지정해 주세요."
    )

# === 보안 관련 설정 ===
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = HTTPBearer()  # Authorization: Bearer <token>

# === 비밀번호 해시/검증 ===
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# === JWT 발급 ===
def create_access_token(data: dict) -> str:
    """
    data에는 반드시 'sub' 키(이메일)를 포함시키는 것을 권장.
    만료 계산은 졸업작품 요구사항에 따라 현재 방식 유지.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# === 현재 사용자 조회(토큰 검증) ===
def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    # 공통 예외 객체 (중복 제거)
    credentials_exception = HTTPException(
        status_code=401,
        detail="유효하지 않은 토큰입니다.",
    )

    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    return user