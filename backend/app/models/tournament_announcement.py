from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.db.database import Base


class TournamentAnnouncement(Base):
    __tablename__ = "tournament_announcements"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
