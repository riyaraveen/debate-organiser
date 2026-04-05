import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.invite_code import InviteCode
from app.models.club import ClubMembership
from app.services.auth import get_club_membership, require_club_admin

router = APIRouter(prefix="/api/invites", tags=["invites"])


_SAFE_CHARS = "ACDEFGHJKLMNPQRTUVWXY34679"  # no O/0, I/1, B/8, S/5, Z/2

def _generate_code() -> str:
    return ''.join(random.choices(_SAFE_CHARS, k=8))


class InviteOut(BaseModel):
    id: int
    code: str
    created_by: int
    created_at: Optional[datetime] = None
    is_active: bool
    used_count: int

    class Config:
        from_attributes = True


@router.get("/", response_model=List[InviteOut])
def list_invites(db: Session = Depends(get_db), membership: ClubMembership = Depends(require_club_admin)):
    return (
        db.query(InviteCode)
        .filter(InviteCode.club_id == membership.club_id)
        .order_by(InviteCode.created_at.desc())
        .all()
    )


@router.post("/", response_model=InviteOut, status_code=201)
def create_invite(db: Session = Depends(get_db), membership: ClubMembership = Depends(require_club_admin)):
    code = _generate_code()
    while db.query(InviteCode).filter(InviteCode.code == code).first():
        code = _generate_code()
    inv = InviteCode(code=code, created_by=membership.user_id, club_id=membership.club_id)
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.delete("/{invite_id}", status_code=204)
def deactivate_invite(invite_id: int, db: Session = Depends(get_db), membership: ClubMembership = Depends(require_club_admin)):
    inv = db.query(InviteCode).filter(
        InviteCode.id == invite_id,
        InviteCode.club_id == membership.club_id,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found")
    inv.is_active = False
    db.commit()


@router.get("/validate/{code}")
def validate_invite(code: str, db: Session = Depends(get_db)):
    inv = db.query(InviteCode).filter(InviteCode.code == code, InviteCode.is_active == True).first()
    if not inv:
        return {"valid": False, "club_name": None}
    from app.models.club import Club
    club = db.query(Club).filter(Club.id == inv.club_id).first()
    return {"valid": True, "club_name": club.name if club else None}
