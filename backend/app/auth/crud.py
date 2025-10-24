# backend\app\auth\crud.py
from sqlalchemy.orm import Session
from app.auth import models

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, email: str, password: str):
    user = models.User(email=email, password=password)
    db.add(user)
    db.commit()
    return user