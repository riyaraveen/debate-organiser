from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from app.db.database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    member = "member"


class ProficiencyLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.member, nullable=False)
    grade = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    proficiency = Column(Enum(ProficiencyLevel), default=ProficiencyLevel.beginner)
    created_at = Column(DateTime, server_default=func.now())
