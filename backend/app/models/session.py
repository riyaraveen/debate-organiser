from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, func
from app.db.database import Base
import enum


class SessionMode(str, enum.Enum):
    online = "online"
    offline = "offline"


class SessionStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    topic_text = Column(String, nullable=True)  # snapshot in case topic is deleted
    format_id = Column(Integer, ForeignKey("debate_formats.id"), nullable=False)
    mode = Column(Enum(SessionMode), nullable=False)
    scheduled_at = Column(DateTime, nullable=True)
    location = Column(String, nullable=True)      # offline: venue; online: meet link
    status = Column(Enum(SessionStatus), default=SessionStatus.draft)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    winner_team = Column(String, nullable=True)   # proposition / opposition
    result_notes = Column(String, nullable=True)
    additional_notes = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class SessionParticipant(Base):
    __tablename__ = "session_participants"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_name = Column(String, nullable=True)    # e.g. "First Speaker", "Chair"
    side = Column(String, nullable=True)         # proposition / opposition / neutral
