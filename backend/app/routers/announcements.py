from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.announcement import Announcement
from app.models.club import ClubMembership
from app.services.auth import get_current_user, get_club_membership, require_club_admin

router = APIRouter(prefix="/api/announcements", tags=["announcements"])


class AnnouncementIn(BaseModel):
    title: str
    content: Optional[str] = None


class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: Optional[str]
    created_by: int
    created_at: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[AnnouncementOut])
def list_announcements(db: Session = Depends(get_db), membership: ClubMembership = Depends(get_club_membership)):
    return (
        db.query(Announcement)
        .filter(Announcement.club_id == membership.club_id, Announcement.is_active == True)
        .order_by(Announcement.created_at.desc())
        .all()
    )


@router.post("/", response_model=AnnouncementOut, status_code=201)
def create_announcement(
    body: AnnouncementIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    membership: ClubMembership = Depends(require_club_admin),
):
    a = Announcement(title=body.title, content=body.content, created_by=current_user.id, club_id=membership.club_id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{announcement_id}", status_code=204)
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    membership: ClubMembership = Depends(require_club_admin),
):
    a = db.query(Announcement).filter(
        Announcement.id == announcement_id,
        Announcement.club_id == membership.club_id,
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Announcement not found")
    a.is_active = False
    db.commit()
