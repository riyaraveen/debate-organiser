from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.debate_format import DebateFormat
from app.schemas.format import FormatOut, FormatCreate
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/formats", tags=["formats"])


@router.get("/", response_model=List[FormatOut])
def list_formats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(DebateFormat).filter(DebateFormat.is_active == True).all()


@router.get("/{format_id}", response_model=FormatOut)
def get_format(format_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    fmt = db.query(DebateFormat).filter(DebateFormat.id == format_id).first()
    if not fmt:
        raise HTTPException(status_code=404, detail="Format not found")
    return fmt


@router.post("/", response_model=FormatOut, status_code=201)
def create_format(body: FormatCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    fmt = DebateFormat(**body.model_dump(), is_builtin=False)
    db.add(fmt)
    db.commit()
    db.refresh(fmt)
    return fmt


@router.patch("/{format_id}/toggle", response_model=FormatOut)
def toggle_format(format_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    fmt = db.query(DebateFormat).filter(DebateFormat.id == format_id).first()
    if not fmt:
        raise HTTPException(status_code=404, detail="Format not found")
    fmt.is_active = not fmt.is_active
    db.commit()
    db.refresh(fmt)
    return fmt
