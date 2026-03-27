from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.models.session import Session as DebateSession, SessionStatus
from app.services.auth import get_current_user
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    message: str
    link: Optional[str]
    is_read: bool
    notification_type: Optional[str]

    class Config:
        from_attributes = True


router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationOut])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.post("/read-all", status_code=204)
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()


@router.post("/{notification_id}/read", status_code=204)
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).update({"is_read": True})
    db.commit()


@router.post("/check-reminders", status_code=204)
def check_reminders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Creates session reminder notifications for all users.
    Called by the frontend on load; uses ref_key to prevent duplicates.
    Sends a reminder 2 days before and 1 day before each scheduled session.
    """
    now = datetime.utcnow()
    windows = [
        (timedelta(hours=23), timedelta(hours=25), "1day",  "is tomorrow"),
        (timedelta(hours=47), timedelta(hours=49), "2days", "is in 2 days"),
    ]

    all_users = db.query(User).all()

    for low, high, key_suffix, label in windows:
        sessions = (
            db.query(DebateSession)
            .filter(
                DebateSession.scheduled_at >= now + low,
                DebateSession.scheduled_at <= now + high,
                DebateSession.status.in_([SessionStatus.scheduled, SessionStatus.draft]),
            )
            .all()
        )

        for session in sessions:
            for user in all_users:
                ref_key = f"session_reminder_{session.id}_{key_suffix}"
                exists = db.query(Notification).filter(
                    Notification.user_id == user.id,
                    Notification.ref_key == ref_key,
                ).first()
                if not exists:
                    db.add(Notification(
                        user_id=user.id,
                        message=f'Upcoming session: "{session.title}" {label}',
                        link=f"/sessions/{session.id}",
                        notification_type="session_reminder",
                        ref_key=ref_key,
                    ))

    db.commit()
