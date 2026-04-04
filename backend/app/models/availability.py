from sqlalchemy import Column, Integer, ForeignKey, Date, UniqueConstraint
from app.db.database import Base


class UserAvailability(Base):
    __tablename__ = "user_availability"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)
