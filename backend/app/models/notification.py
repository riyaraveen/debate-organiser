from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    link = Column(String, nullable=True)   # e.g. /sessions/42
    is_read = Column(Boolean, default=False)
    notification_type = Column(String, nullable=True)   # e.g. "session_reminder"
    ref_key = Column(String, nullable=True)             # dedup key, unique per user+event
    created_at = Column(DateTime, server_default=func.now())
