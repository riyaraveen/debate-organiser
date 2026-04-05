from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.db.database import Base


class SpeakerScore(Base):
    __tablename__ = "speaker_scores"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    scorer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)  # 0–100
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
