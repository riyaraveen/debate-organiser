from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.session import SessionMode, SessionStatus
from app.schemas.user import UserOut


class ParticipantIn(BaseModel):
    user_id: int
    role_name: Optional[str] = None
    side: Optional[str] = None


class ParticipantOut(BaseModel):
    id: int
    user_id: int
    role_name: Optional[str]
    side: Optional[str]
    attended: Optional[bool] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


class AttendanceUpdate(BaseModel):
    attended: bool


class ManualAssignment(BaseModel):
    user_id: int
    role_name: Optional[str] = None
    side: Optional[str] = None


class SessionCreate(BaseModel):
    title: str
    topic_id: Optional[int] = None
    topic_text: Optional[str] = None
    format_id: int
    mode: SessionMode
    scheduled_at: Optional[datetime] = None
    location: Optional[str] = None
    participant_ids: Optional[List[int]] = []
    auto_assign_roles: bool = True
    manual_assignments: Optional[List[ManualAssignment]] = None


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    topic_id: Optional[int] = None
    topic_text: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[SessionStatus] = None
    winner_team: Optional[str] = None
    result_notes: Optional[str] = None
    additional_notes: Optional[str] = None
    location_maps: Optional[bool] = None


class SessionOut(BaseModel):
    id: int
    title: str
    topic_id: Optional[int]
    topic_text: Optional[str]
    format_id: int
    mode: SessionMode
    scheduled_at: Optional[datetime]
    location: Optional[str]
    status: SessionStatus
    created_by: int
    winner_team: Optional[str]
    result_notes: Optional[str]
    additional_notes: Optional[str]
    location_maps: Optional[bool]
    participants: List[ParticipantOut] = []

    class Config:
        from_attributes = True
