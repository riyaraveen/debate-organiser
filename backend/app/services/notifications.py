from typing import List
from sqlalchemy.orm import Session
from app.models.notification import Notification


def notify_users(db: Session, user_ids: List[int], message: str, link: str = None):
    for uid in user_ids:
        db.add(Notification(user_id=uid, message=message, link=link))
    db.commit()
