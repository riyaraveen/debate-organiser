import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User
from app.models.club import Club, ClubMembership
from app.models.topic import Topic, TopicSource, ProficiencyLevel
from app.services.auth import get_current_user, get_club_membership, require_club_admin

_DEFAULT_TOPICS = [
    {"text": "This house would ban social media for under-16s", "category": "Technology", "proficiency": ProficiencyLevel.beginner},
    {"text": "This house believes that artificial intelligence will do more harm than good", "category": "Technology", "proficiency": ProficiencyLevel.intermediate},
    {"text": "This house would make voting compulsory", "category": "Politics", "proficiency": ProficiencyLevel.beginner},
    {"text": "This house believes that celebrities have a responsibility to be role models", "category": "Society", "proficiency": ProficiencyLevel.beginner},
    {"text": "This house would abolish zoos", "category": "Environment", "proficiency": ProficiencyLevel.beginner},
    {"text": "This house believes that economic growth should be prioritised over environmental protection", "category": "Environment", "proficiency": ProficiencyLevel.intermediate},
    {"text": "This house would legalise the sale of human organs", "category": "Ethics", "proficiency": ProficiencyLevel.advanced},
    {"text": "This house believes that schools should teach financial literacy as a core subject", "category": "Education", "proficiency": ProficiencyLevel.beginner},
    {"text": "This house would introduce a universal basic income", "category": "Economics", "proficiency": ProficiencyLevel.intermediate},
    {"text": "This house believes that the media does more harm than good", "category": "Society", "proficiency": ProficiencyLevel.intermediate},
]

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
    for t in _DEFAULT_TOPICS:
        db.add(Topic(club_id=club.id, source=TopicSource.admin, is_go=True, **t))
    db.commit()
    db.refresh(club)
    return ClubOut(id=club.id, name=club.name, role="owner")


@router.get("/{club_id}/members", response_model=List[MemberOut])
def list_members(
    club_id: int,
    db: Session = Depends(get_db),
    membership: ClubMembership = Depends(get_club_membership),
):
    if club_id != membership.club_id:
        raise HTTPException(status_code=403, detail="Access denied")
    memberships = db.query(ClubMembership).filter(ClubMembership.club_id == club_id).all()
    user_ids = [m.user_id for m in memberships]
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
    return [
        MemberOut(user_id=m.user_id, name=users_by_id[m.user_id].name, email=users_by_id[m.user_id].email,
                  role=m.role, grade=users_by_id[m.user_id].grade)
        for m in memberships if m.user_id in users_by_id
    ]


@router.patch("/{club_id}/members/{user_id}", response_model=MemberOut)
def update_member_role(
    club_id: int,
    user_id: int,
    body: MemberRoleUpdate,
    db: Session = Depends(get_db),
    admin_membership: ClubMembership = Depends(require_club_admin),
):
    if club_id != admin_membership.club_id:
        raise HTTPException(status_code=403, detail="Access denied")
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
    if club_id != admin_membership.club_id:
        raise HTTPException(status_code=403, detail="Access denied")
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
