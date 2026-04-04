from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User
from app.models.template import SessionTemplate
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/templates", tags=["templates"])


class TemplateCreate(BaseModel):
    name: str
    format_id: int
    mode: str = "offline"
    location: Optional[str] = None
    auto_assign_roles: bool = True


class TemplateOut(BaseModel):
    id: int
    name: str
    format_id: int
    mode: str
    location: Optional[str]
    auto_assign_roles: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[TemplateOut])
def list_templates(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SessionTemplate).order_by(SessionTemplate.created_at.desc()).all()


@router.post("/", response_model=TemplateOut, status_code=201)
def create_template(body: TemplateCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    t = SessionTemplate(**body.model_dump(), created_by=current_user.id)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    t = db.query(SessionTemplate).filter(SessionTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(t)
    db.commit()
