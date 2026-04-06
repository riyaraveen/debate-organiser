from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.debate_format import DebateFormat
from app.schemas.format import FormatOut, FormatCreate, FormatUpdate
from app.services.auth import get_club_membership, require_club_admin
from app.models.club import ClubMembership

router = APIRouter(prefix="/api/formats", tags=["formats"])


@router.get("/", response_model=List[FormatOut])
def list_formats(all: bool = False, db: Session = Depends(get_db), membership: ClubMembership = Depends(get_club_membership)):
    q = db.query(DebateFormat).filter(
        or_(DebateFormat.club_id == None, DebateFormat.club_id == membership.club_id)
    )
    if not all:
        q = q.filter(DebateFormat.is_active == True)
    return q.all()


@router.get("/{format_id}", response_model=FormatOut)
def get_format(format_id: int, db: Session = Depends(get_db), membership: ClubMembership = Depends(get_club_membership)):
    fmt = db.query(DebateFormat).filter(
        DebateFormat.id == format_id,
        or_(DebateFormat.club_id == None, DebateFormat.club_id == membership.club_id),
    ).first()
    if not fmt:
        raise HTTPException(status_code=404, detail="Format not found")
    return fmt


@router.post("/", response_model=FormatOut, status_code=201)
def create_format(body: FormatCreate, db: Session = Depends(get_db), membership: ClubMembership = Depends(require_club_admin)):
    fmt = DebateFormat(**body.model_dump(), is_builtin=False, club_id=membership.club_id)
    db.add(fmt)
    db.commit()
    db.refresh(fmt)
    return fmt


@router.patch("/{format_id}", response_model=FormatOut)
def update_format(format_id: int, body: FormatUpdate, db: Session = Depends(get_db), membership: ClubMembership = Depends(require_club_admin)):
    fmt = db.query(DebateFormat).filter(DebateFormat.id == format_id).first()
    if not fmt:
        raise HTTPException(status_code=404, detail="Format not found")
    if fmt.is_builtin:
        raise HTTPException(status_code=403, detail="Built-in formats cannot be edited")
    if fmt.club_id != membership.club_id:
        raise HTTPException(status_code=403, detail="Not your club's format")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(fmt, k, v)
    db.commit()
    db.refresh(fmt)
    return fmt


@router.delete("/{format_id}", status_code=204)
def delete_format(format_id: int, db: Session = Depends(get_db), membership: ClubMembership = Depends(require_club_admin)):
    fmt = db.query(DebateFormat).filter(DebateFormat.id == format_id).first()
    if not fmt:
        raise HTTPException(status_code=404, detail="Format not found")
    if fmt.is_builtin:
        raise HTTPException(status_code=403, detail="Built-in formats cannot be deleted")
    if fmt.club_id != membership.club_id:
        raise HTTPException(status_code=403, detail="Not your club's format")
    db.delete(fmt)
    db.commit()


@router.patch("/{format_id}/toggle", response_model=FormatOut)
def toggle_format(format_id: int, db: Session = Depends(get_db), membership: ClubMembership = Depends(require_club_admin)):
    fmt = db.query(DebateFormat).filter(DebateFormat.id == format_id).first()
    if not fmt:
        raise HTTPException(status_code=404, detail="Format not found")
    if fmt.club_id is not None and fmt.club_id != membership.club_id:
        raise HTTPException(status_code=403, detail="Not your club's format")
    fmt.is_active = not fmt.is_active
    db.commit()
    db.refresh(fmt)
    return fmt
