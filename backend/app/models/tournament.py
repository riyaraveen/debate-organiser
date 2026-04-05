from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, Boolean
from app.db.database import Base


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    format = Column(String, nullable=True)          # e.g. "single_elimination", "round_robin"
    status = Column(String, default="draft")        # draft | active | completed
    bracket = Column(Text, nullable=True)           # JSON string: teams, rounds, results
    school_ids = Column(Text, nullable=True)        # JSON list of participating school IDs
    scheduled_at = Column(DateTime, nullable=True)   # start date/time
    end_date = Column(DateTime, nullable=True)        # end date for multi-day events
    location = Column(String, nullable=True)          # venue / address
    details = Column(Text, nullable=True)             # additional info (travel, rules, etc.)
    hosting_school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
