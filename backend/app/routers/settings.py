from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.models.club_settings import ClubSettings
from app.models.user import User
from app.services.auth import get_current_user, require_admin

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


@router.get("/", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(ClubSettings).first()


@router.patch("/", response_model=SettingsOut)
def update_settings(body: SettingsUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    settings = db.query(ClubSettings).first()
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
