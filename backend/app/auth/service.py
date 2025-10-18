# backend\app\auth\service.py
from fastapi import HTTPException
from app.auth import crud, utils

def signup_user(db, user_create):
    user = crud.get_user_by_email(db, user_create.email)
    if user:
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
    hashed_pw = utils.get_password_hash(user_create.password)
    crud.create_user(db, user_create.email, hashed_pw)
    return {"msg": "회원가입 성공! 환영합니다."}

def login_user(db, user_login):
    user = crud.get_user_by_email(db, user_login.email)
    if not user or not utils.verify_password(user_login.password, user.password):
        raise HTTPException(status_code=400, detail="로그인 실패")
    token = utils.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}