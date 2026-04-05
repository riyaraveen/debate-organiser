from typing import List
from sqlalchemy.orm import Session
from app.models.notification import Notification


async def notify_users(db: Session, user_ids: List[int], message: str, link: str = None):
    """Persist notifications to DB and push to any connected WS clients."""
    from app.routers.ws_notifications import manager

    for uid in user_ids:
        db.add(Notification(user_id=uid, message=message, link=link))
    db.commit()

    payload = {"type": "notification", "message": message, "link": link}
    for uid in user_ids:
        await manager.push(uid, payload)
