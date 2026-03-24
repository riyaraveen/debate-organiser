from sqlalchemy import Column, Integer, String
from app.db.database import Base


class ClubSettings(Base):
    __tablename__ = "club_settings"

    id = Column(Integer, primary_key=True, index=True)
    club_name = Column(String, default="Debate Club")
    school_name = Column(String, nullable=True)
    description = Column(String, nullable=True)
