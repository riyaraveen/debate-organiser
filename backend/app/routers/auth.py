from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, LoginRequest, TokenResponse, UserOut
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user
from app.models.invite_code import InviteCode

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Validate invite code if provided
    invite = None
    if body.invite_code:
        invite = db.query(InviteCode).filter(InviteCode.code == body.invite_code, InviteCode.is_active == True).first()
        if not invite:
            raise HTTPException(status_code=400, detail="Invalid or expired invite code")
    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        grade=body.grade,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    if invite:
        invite.used_count += 1
        db.commit()
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.from_orm(user))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.from_orm(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
