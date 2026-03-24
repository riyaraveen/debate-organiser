from pydantic import BaseModel
from typing import Optional
from app.models.topic import ProficiencyLevel, TopicSource


class TopicCreate(BaseModel):
    text: str
    category: Optional[str] = None
    is_go: bool = True
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    proficiency: Optional[ProficiencyLevel] = None


class TopicUpdate(BaseModel):
    text: Optional[str] = None
    category: Optional[str] = None
    is_go: Optional[bool] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    proficiency: Optional[ProficiencyLevel] = None


class TopicOut(BaseModel):
    id: int
    text: str
    category: Optional[str]
    is_go: bool
    min_age: Optional[int]
    max_age: Optional[int]
    proficiency: Optional[ProficiencyLevel]
    source: TopicSource

    class Config:
        from_attributes = True
