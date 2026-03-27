from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.calendar_event import CalendarEvent
from app.models.user import User, UserRole
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/events", tags=["events"])


class EventCreate(BaseModel):
    title: str
    event_type: str = "other"
    start_at: datetime
    end_at: datetime


class EventOut(BaseModel):
    id: int
    title: str
    event_type: str
    start_at: datetime
    end_at: datetime
    created_by: int

    class Config:
        from_attributes = True


@router.get("/", response_model=list[EventOut])
def list_events(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CalendarEvent).order_by(CalendarEvent.start_at).all()


@router.post("/", response_model=EventOut)
def create_event(data: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = CalendarEvent(
        title=data.title,
        event_type=data.event_type,
        start_at=data.start_at,
        end_at=data.end_at,
        created_by=current_user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.get(CalendarEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.created_by != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(event)
    db.commit()
    return {"ok": True}
