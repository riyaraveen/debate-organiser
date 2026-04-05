from sqlalchemy import Column, Integer, Boolean, Text, ForeignKey, DateTime, func
from app.db.database import Base


class SessionNote(Base):
    __tablename__ = "session_notes"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, default="")
    is_private = Column(Boolean, default=False, nullable=False)
    side_at_save = Column(Text, nullable=True)   # 'proposition' | 'opposition' — stamped on each save
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class SessionNoteVersion(Base):
    __tablename__ = "session_note_versions"

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("session_notes.id"), nullable=False)
    content = Column(Text, nullable=False)
    saved_at = Column(DateTime, server_default=func.now())
