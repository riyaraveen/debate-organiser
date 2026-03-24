from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, func
from app.db.database import Base
import enum


class ProficiencyLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class TopicSource(str, enum.Enum):
    admin = "admin"
    ai = "ai"
    imported = "imported"


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    category = Column(String, nullable=True)
    is_go = Column(Boolean, default=True, nullable=False)
    min_age = Column(Integer, nullable=True)
    max_age = Column(Integer, nullable=True)
    proficiency = Column(Enum(ProficiencyLevel), nullable=True)
    source = Column(Enum(TopicSource), default=TopicSource.admin)
    created_at = Column(DateTime, server_default=func.now())
