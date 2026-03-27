from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.db.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    event_type = Column(String, nullable=False, default="other")  # exam, holiday, other
    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
