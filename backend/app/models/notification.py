from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    link = Column(String, nullable=True)   # e.g. /sessions/42
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
