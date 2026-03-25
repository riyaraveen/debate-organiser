from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from app.db.database import Base


class SessionNote(Base):
    __tablename__ = "session_notes"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, default="")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
