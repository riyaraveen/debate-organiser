from pydantic import BaseModel
from typing import Optional, List, Any


class FormatOut(BaseModel):
    id: int
    name: str
    description: str
    min_participants: int
    max_participants: int
    roles: List[Any]
    speaking_order: List[Any]
    rules_summary: Optional[str]
    is_active: bool
    is_builtin: bool

    class Config:
        from_attributes = True


class FormatCreate(BaseModel):
    name: str
    description: str
    min_participants: int
    max_participants: int
    roles: List[Any]
    speaking_order: List[Any]
    rules_summary: Optional[str] = None
