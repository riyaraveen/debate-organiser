from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole, ProficiencyLevel


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    grade: Optional[str] = None
    invite_code: Optional[str] = None
    club_name: Optional[str] = None  # required when not using invite_code


class ClubOut(BaseModel):
    id: int
    name: str
    role: str  # owner, admin, member

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    grade: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    school: Optional[str] = None
    proficiency: Optional[ProficiencyLevel] = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    grade: Optional[str]
    bio: Optional[str]
    phone: Optional[str] = None
    school: Optional[str] = None
    proficiency: ProficiencyLevel

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    clubs: list[ClubOut] = []


class MeResponse(BaseModel):
    user: UserOut
    clubs: list[ClubOut] = []
