from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from app.db.database import Base


class SessionTemplate(Base):
    __tablename__ = "session_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    format_id = Column(Integer, ForeignKey("debate_formats.id"), nullable=False)
    mode = Column(String, default="offline")
    location = Column(String, nullable=True)
    auto_assign_roles = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
