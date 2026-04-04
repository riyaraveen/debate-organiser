import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.club import Club, ClubMembership
from app.schemas.user import UserCreate, LoginRequest, TokenResponse, UserOut, ClubOut
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user
from app.models.invite_code import InviteCode

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "club"


def _get_user_clubs(user_id: int, db: Session) -> list[ClubOut]:
    memberships = db.query(ClubMembership).filter(ClubMembership.user_id == user_id).all()
    result = []
    for m in memberships:
        club = db.query(Club).filter(Club.id == m.club_id).first()
        if club:
            result.append(ClubOut(id=club.id, name=club.name, role=m.role))
    return result


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    invite = None
    invite_club_id = None

    if body.invite_code:
        invite = db.query(InviteCode).filter(
            InviteCode.code == body.invite_code,
            InviteCode.is_active == True,
        ).first()
        if not invite:
            raise HTTPException(status_code=400, detail="Invalid or expired invite code")
        if not invite.club_id:
            raise HTTPException(status_code=400, detail="Invite code is not linked to a club")
        invite_club_id = invite.club_id
    elif not body.club_name:
        raise HTTPException(status_code=400, detail="Provide either an invite code or a club name")

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        grade=body.grade,
        role="admin" if not body.invite_code else "member",
    )
    db.add(user)
    db.flush()

    if invite_club_id:
        # Join existing club
        membership = ClubMembership(club_id=invite_club_id, user_id=user.id, role="member")
        db.add(membership)
        invite.used_count += 1
    else:
        # Create new club
        slug = _slugify(body.club_name)
        base_slug = slug
        counter = 1
        while db.query(Club).filter(Club.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        club = Club(name=body.club_name, slug=slug, created_by=user.id)
        db.add(club)
        db.flush()
        membership = ClubMembership(club_id=club.id, user_id=user.id, role="owner")
        db.add(membership)

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    clubs = _get_user_clubs(user.id, db)
    return TokenResponse(access_token=token, user=UserOut.from_orm(user), clubs=clubs)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    clubs = _get_user_clubs(user.id, db)
    return TokenResponse(access_token=token, user=UserOut.from_orm(user), clubs=clubs)


@router.get("/me", response_model=TokenResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    clubs = _get_user_clubs(current_user.id, db)
    token = create_access_token({"sub": str(current_user.id)})
    return TokenResponse(access_token=token, user=UserOut.from_orm(current_user), clubs=clubs)
