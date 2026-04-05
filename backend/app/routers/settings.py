from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.models.club_settings import ClubSettings
from app.models.club import Club, ClubMembership
from app.services.auth import get_club_membership, require_club_admin

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsOut(BaseModel):
    id: int
    club_name: str
    school_name: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    club_name: Optional[str] = None
    school_name: Optional[str] = None
    description: Optional[str] = None


def _get_or_create_settings(db: Session, club_id: int) -> ClubSettings:
    settings = db.query(ClubSettings).filter(ClubSettings.club_id == club_id).first()
    if not settings:
        club = db.query(Club).filter(Club.id == club_id).first()
        default_name = club.name if club else "My Debate Club"
        settings = ClubSettings(club_id=club_id, club_name=default_name)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db), membership: ClubMembership = Depends(get_club_membership)):
    return _get_or_create_settings(db, membership.club_id)


@router.patch("/", response_model=SettingsOut)
def update_settings(body: SettingsUpdate, db: Session = Depends(get_db), membership: ClubMembership = Depends(require_club_admin)):
    settings = _get_or_create_settings(db, membership.club_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
