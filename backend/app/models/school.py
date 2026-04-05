from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.db.database import Base


class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
