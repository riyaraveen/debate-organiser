from sqlalchemy import Column, Integer, String, Boolean, JSON
from app.db.database import Base


class DebateFormat(Base):
    __tablename__ = "debate_formats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    min_participants = Column(Integer, nullable=False)
    max_participants = Column(Integer, nullable=False)
    # JSON list of role objects: [{name, side, order, description}]
    roles = Column(JSON, nullable=False)
    # JSON list of speaking turns: [{role, duration_seconds, description}]
    speaking_order = Column(JSON, nullable=False)
    rules_summary = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_builtin = Column(Boolean, default=False)
