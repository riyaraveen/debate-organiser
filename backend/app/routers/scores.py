from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.session import Session, SessionParticipant
from app.models.speaker_score import SpeakerScore
from app.models.club import ClubMembership
from app.services.auth import get_current_user, get_club_membership, require_club_admin

router = APIRouter(prefix="/api/sessions", tags=["scores"])


class ScoreIn(BaseModel):
    subject_user_id: int
    score: int
    notes: Optional[str] = None

    @field_validator("score")
    @classmethod
    def validate_score(cls, v):
        if not 0 <= v <= 100:
            raise ValueError("Score must be between 0 and 100")
        return v


class ScoreOut(BaseModel):
    id: int
    session_id: int
    scorer_id: int
    subject_user_id: int
    subject_user_name: Optional[str] = None
    score: int
    notes: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


def _score_to_dict(score: SpeakerScore, users: dict) -> dict:
    return {
        **{c.name: getattr(score, c.name) for c in score.__table__.columns},
        "subject_user_name": users.get(score.subject_user_id, {name: None}).get("name") if False else
            (users[score.subject_user_id].name if score.subject_user_id in users else None),
    }


@router.post("/{session_id}/scores", response_model=ScoreOut, status_code=201)
def create_score(
    session_id: int,
    body: ScoreIn,
    db: DBSession = Depends(get_db),
    membership: ClubMembership = Depends(require_club_admin),
    current_user: User = Depends(get_current_user),
):
    session = db.query(Session).filter(
        Session.id == session_id, Session.club_id == membership.club_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Upsert: one score per scorer per subject per session
    existing = db.query(SpeakerScore).filter(
        SpeakerScore.session_id == session_id,
        SpeakerScore.scorer_id == current_user.id,
        SpeakerScore.subject_user_id == body.subject_user_id,
    ).first()

    if existing:
        existing.score = body.score
        existing.notes = body.notes
        db.commit()
        db.refresh(existing)
        score = existing
    else:
        score = SpeakerScore(
            session_id=session_id,
            scorer_id=current_user.id,
            subject_user_id=body.subject_user_id,
            score=body.score,
            notes=body.notes,
        )
        db.add(score)
        db.commit()
        db.refresh(score)

    subject = db.query(User).filter(User.id == score.subject_user_id).first()
    return {
        **{c.name: getattr(score, c.name) for c in score.__table__.columns},
        "subject_user_name": subject.name if subject else None,
    }


@router.get("/{session_id}/scores", response_model=List[ScoreOut])
def get_session_scores(
    session_id: int,
    db: DBSession = Depends(get_db),
    _: ClubMembership = Depends(get_club_membership),
):
    scores = db.query(SpeakerScore).filter(SpeakerScore.session_id == session_id).all()
    user_ids = list({s.subject_user_id for s in scores})
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
    return [
        {
            **{c.name: getattr(s, c.name) for c in s.__table__.columns},
            "subject_user_name": users_by_id[s.subject_user_id].name if s.subject_user_id in users_by_id else None,
        }
        for s in scores
    ]
