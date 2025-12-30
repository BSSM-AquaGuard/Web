from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from . import schemas
from .auth import create_access_token, get_password_hash, verify_password
from .database import get_session
from .models import User
from .config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.UserRead)
def signup(payload: schemas.UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=payload.email, password_hash=get_password_hash(payload.password), role="operator")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role}, settings.access_token_expire)
    return schemas.Token(access_token=token, expires_in=settings.access_token_expire_minutes * 60, token_type="bearer")
