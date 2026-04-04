import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.invite_code import InviteCode
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/invites", tags=["invites"])


def _generate_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


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
def list_invites(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(InviteCode).order_by(InviteCode.created_at.desc()).all()


@router.post("/", response_model=InviteOut, status_code=201)
def create_invite(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    code = _generate_code()
    while db.query(InviteCode).filter(InviteCode.code == code).first():
        code = _generate_code()
    inv = InviteCode(code=code, created_by=current_user.id)
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.delete("/{invite_id}", status_code=204)
def deactivate_invite(invite_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    inv = db.query(InviteCode).filter(InviteCode.id == invite_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found")
    inv.is_active = False
    db.commit()


@router.get("/validate/{code}")
def validate_invite(code: str, db: Session = Depends(get_db)):
    inv = db.query(InviteCode).filter(InviteCode.code == code, InviteCode.is_active == True).first()
    return {"valid": inv is not None}
