from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from typing import List, Optional
from app.db.database import get_db
from app.models.user import User
from app.models.club import ClubMembership
from app.models.session import Session as DebateSession, SessionParticipant
from app.models.speaker_score import SpeakerScore
from app.schemas.user import UserOut, UserUpdate
from app.services.auth import get_current_user, get_club_membership, require_club_admin
from pydantic import BaseModel

router = APIRouter(prefix="/api/users", tags=["users"])


class ClubRoleUpdate(BaseModel):
    role: str  # admin, member


@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), membership: ClubMembership = Depends(get_club_membership)):
    memberships = db.query(ClubMembership).filter(ClubMembership.club_id == membership.club_id).all()
    user_ids = [m.user_id for m in memberships]
    return db.query(User).filter(User.id.in_(user_ids)).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), membership: ClubMembership = Depends(get_club_membership)):
    # Verify the requested user is a member of the same club
    target_membership = db.query(ClubMembership).filter(
        ClubMembership.club_id == membership.club_id,
        ClubMembership.user_id == user_id,
    ).first()
    if not target_membership:
        raise HTTPException(status_code=404, detail="User not found")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(body: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/{user_id}/role", response_model=UserOut)
def update_role(
    user_id: int,
    body: ClubRoleUpdate,
    db: Session = Depends(get_db),
    admin_membership: ClubMembership = Depends(require_club_admin),
):
    if body.role not in ("admin", "member"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'member'")
    target = db.query(ClubMembership).filter(
        ClubMembership.club_id == admin_membership.club_id,
        ClubMembership.user_id == user_id,
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found in this club")
    if target.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot change owner's role")
    target.role = body.role
    # Mirror to global user.role so ProtectedRoute still works for club-specific admin status
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.role = body.role
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}/stats")
def get_user_stats(
    user_id: int,
    db: Session = Depends(get_db),
    membership: ClubMembership = Depends(get_club_membership),
):
    participants = (
        db.query(SessionParticipant)
        .join(DebateSession, DebateSession.id == SessionParticipant.session_id)
        .filter(
            SessionParticipant.user_id == user_id,
            DebateSession.club_id == membership.club_id,
        )
        .all()
    )
    total_sessions = len(participants)
    sessions_attended = sum(1 for p in participants if p.attended is True)
    roles_played = sorted({p.role_name for p in participants if p.role_name})
    sides_played = sorted({p.side for p in participants if p.side})

    avg_score_result = (
        db.query(sqlfunc.avg(SpeakerScore.score))
        .filter(SpeakerScore.subject_user_id == user_id)
        .scalar()
    )
    avg_score = round(float(avg_score_result), 1) if avg_score_result is not None else None

    return {
        "sessions_attended": sessions_attended,
        "total_sessions": total_sessions,
        "roles_played": roles_played,
        "sides_played": sides_played,
        "avg_score": avg_score,
    }
