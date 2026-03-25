from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.db.database import get_db
from app.models.session_note import SessionNote
from app.models.session import Session as SessionModel
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["notes"])


class NoteOut(BaseModel):
    id: int
    session_id: int
    user_id: int
    content: str
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class NoteUpsert(BaseModel):
    content: str


@router.get("/{session_id}/notes/me", response_model=NoteOut)
def get_my_note(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    note = db.query(SessionNote).filter(
        SessionNote.session_id == session_id,
        SessionNote.user_id == current_user.id,
    ).first()
    if not note:
        note = SessionNote(session_id=session_id, user_id=current_user.id, content="")
        db.add(note)
        db.commit()
        db.refresh(note)
    return note


@router.put("/{session_id}/notes/me", response_model=NoteOut)
def save_my_note(session_id: int, body: NoteUpsert, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    note = db.query(SessionNote).filter(
        SessionNote.session_id == session_id,
        SessionNote.user_id == current_user.id,
    ).first()
    if note:
        note.content = body.content
    else:
        note = SessionNote(session_id=session_id, user_id=current_user.id, content=body.content)
        db.add(note)
    db.commit()
    db.refresh(note)
    return note
