from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.db.database import get_db
from app.models.session_note import SessionNote, SessionNoteVersion
from app.models.session import Session as SessionModel
from app.models.user import User
from app.services.auth import get_current_user, get_club_membership
from app.models.club import ClubMembership

router = APIRouter(prefix="/api/sessions", tags=["notes"])

MAX_VERSIONS = 10


class NoteOut(BaseModel):
    id: int
    session_id: int
    user_id: int
    content: str
    is_private: bool
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class NoteUpsert(BaseModel):
    content: str
    is_private: bool = False


class VersionOut(BaseModel):
    id: int
    content: str
    saved_at: datetime

    class Config:
        from_attributes = True


def _get_session_or_404(session_id: int, club_id: int, db: Session):
    s = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.club_id == club_id,
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s


def _get_or_create_note(session_id: int, user_id: int, db: Session) -> SessionNote:
    note = db.query(SessionNote).filter(
        SessionNote.session_id == session_id,
        SessionNote.user_id == user_id,
    ).first()
    if not note:
        note = SessionNote(session_id=session_id, user_id=user_id, content="", is_private=False)
        db.add(note)
        db.commit()
        db.refresh(note)
    return note


@router.get("/{session_id}/notes/me", response_model=NoteOut)
def get_my_note(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), membership: ClubMembership = Depends(get_club_membership)):
    _get_session_or_404(session_id, membership.club_id, db)
    return _get_or_create_note(session_id, current_user.id, db)


@router.put("/{session_id}/notes/me", response_model=NoteOut)
def save_my_note(session_id: int, body: NoteUpsert, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), membership: ClubMembership = Depends(get_club_membership)):
    _get_session_or_404(session_id, membership.club_id, db)
    note = _get_or_create_note(session_id, current_user.id, db)

    # Save a version snapshot if content changed and is non-empty
    if note.content and note.content != body.content:
        db.add(SessionNoteVersion(note_id=note.id, content=note.content))
        # Prune oldest versions beyond MAX_VERSIONS
        versions = db.query(SessionNoteVersion).filter(
            SessionNoteVersion.note_id == note.id
        ).order_by(SessionNoteVersion.saved_at.asc()).all()
        if len(versions) > MAX_VERSIONS:
            for old in versions[:len(versions) - MAX_VERSIONS]:
                db.delete(old)

    note.content = body.content
    note.is_private = body.is_private
    db.commit()
    db.refresh(note)
    return note


@router.get("/{session_id}/notes/me/versions")
def get_my_note_versions(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), membership: ClubMembership = Depends(get_club_membership)):
    _get_session_or_404(session_id, membership.club_id, db)
    note = db.query(SessionNote).filter(
        SessionNote.session_id == session_id,
        SessionNote.user_id == current_user.id,
    ).first()
    if not note:
        return []
    return db.query(SessionNoteVersion).filter(
        SessionNoteVersion.note_id == note.id
    ).order_by(SessionNoteVersion.saved_at.desc()).all()
