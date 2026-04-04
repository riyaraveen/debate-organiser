import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User
from app.models.club import Club, ClubMembership
from app.services.auth import get_current_user, get_club_membership, require_club_admin

router = APIRouter(prefix="/api/clubs", tags=["clubs"])


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "club"


class ClubCreate(BaseModel):
    name: str


class ClubOut(BaseModel):
    id: int
    name: str
    role: str

    class Config:
        from_attributes = True


class MemberOut(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    grade: str | None = None

    class Config:
        from_attributes = True


class MemberRoleUpdate(BaseModel):
    role: str  # admin, member


@router.get("/mine", response_model=List[ClubOut])
def my_clubs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memberships = db.query(ClubMembership).filter(ClubMembership.user_id == current_user.id).all()
    result = []
    for m in memberships:
        club = db.query(Club).filter(Club.id == m.club_id).first()
        if club:
            result.append(ClubOut(id=club.id, name=club.name, role=m.role))
    return result


@router.post("/", response_model=ClubOut, status_code=201)
def create_club(body: ClubCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    slug = _slugify(body.name)
    # Ensure unique slug
    base_slug = slug
    counter = 1
    while db.query(Club).filter(Club.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    club = Club(name=body.name, slug=slug, created_by=current_user.id)
    db.add(club)
    db.flush()
    membership = ClubMembership(club_id=club.id, user_id=current_user.id, role="owner")
    db.add(membership)
    db.commit()
    db.refresh(club)
    return ClubOut(id=club.id, name=club.name, role="owner")


@router.get("/{club_id}/members", response_model=List[MemberOut])
def list_members(
    club_id: int,
    db: Session = Depends(get_db),
    membership: ClubMembership = Depends(get_club_membership),
):
    memberships = db.query(ClubMembership).filter(ClubMembership.club_id == club_id).all()
    result = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append(MemberOut(user_id=user.id, name=user.name, email=user.email, role=m.role, grade=user.grade))
    return result


@router.patch("/{club_id}/members/{user_id}", response_model=MemberOut)
def update_member_role(
    club_id: int,
    user_id: int,
    body: MemberRoleUpdate,
    db: Session = Depends(get_db),
    admin_membership: ClubMembership = Depends(require_club_admin),
):
    if body.role not in ("admin", "member"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'member'")
    m = db.query(ClubMembership).filter(
        ClubMembership.club_id == club_id,
        ClubMembership.user_id == user_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    if m.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot change owner's role")
    m.role = body.role
    db.commit()
    user = db.query(User).filter(User.id == user_id).first()
    return MemberOut(user_id=user.id, name=user.name, email=user.email, role=m.role, grade=user.grade)


@router.delete("/{club_id}/members/{user_id}", status_code=204)
def remove_member(
    club_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    admin_membership: ClubMembership = Depends(require_club_admin),
):
    m = db.query(ClubMembership).filter(
        ClubMembership.club_id == club_id,
        ClubMembership.user_id == user_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    if m.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot remove club owner")
    db.delete(m)
    db.commit()
