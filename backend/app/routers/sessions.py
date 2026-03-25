from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.session import Session, SessionParticipant
from app.models.debate_format import DebateFormat
from app.models.topic import Topic
from app.schemas.session import SessionCreate, SessionUpdate, SessionOut, ParticipantOut
from app.services.auth import get_current_user, require_admin
from app.services.role_assignment import assign_roles
from app.services.notifications import notify_users

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _enrich_session(session: Session, db: DBSession) -> dict:
    """Attach participant + user info to a session object."""
    participants = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session.id
    ).all()
    enriched_participants = []
    for p in participants:
        user = db.query(User).filter(User.id == p.user_id).first()
        enriched_participants.append({
            "id": p.id,
            "user_id": p.user_id,
            "role_name": p.role_name,
            "side": p.side,
            "user": user,
        })
    result = {c.name: getattr(session, c.name) for c in session.__table__.columns}
    result["participants"] = enriched_participants
    return result


@router.get("/", response_model=List[SessionOut])
def list_sessions(db: DBSession = Depends(get_db), _: User = Depends(get_current_user)):
    sessions = db.query(Session).order_by(Session.scheduled_at.desc()).all()
    return [_enrich_session(s, db) for s in sessions]


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: DBSession = Depends(get_db), _: User = Depends(get_current_user)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _enrich_session(session, db)


@router.post("/", response_model=SessionOut, status_code=201)
def create_session(body: SessionCreate, db: DBSession = Depends(get_db), current_user: User = Depends(require_admin)):
    # Snapshot topic text
    topic_text = body.topic_text
    if body.topic_id and not topic_text:
        topic = db.query(Topic).filter(Topic.id == body.topic_id).first()
        if topic:
            topic_text = topic.text

    session = Session(
        title=body.title,
        topic_id=body.topic_id,
        topic_text=topic_text,
        format_id=body.format_id,
        mode=body.mode,
        scheduled_at=body.scheduled_at,
        location=body.location,
        created_by=current_user.id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    if body.participant_ids:
        fmt = db.query(DebateFormat).filter(DebateFormat.id == body.format_id).first()
        if body.auto_assign_roles and fmt:
            assignments = assign_roles(fmt.roles, body.participant_ids)
        else:
            assignments = [{"user_id": uid, "role_name": None, "side": None} for uid in body.participant_ids]

        for a in assignments:
            db.add(SessionParticipant(
                session_id=session.id,
                user_id=a["user_id"],
                role_name=a["role_name"],
                side=a["side"],
            ))
        db.commit()

        # Notify participants
        notify_users(db, body.participant_ids,
                     f"You've been added to the session: {session.title}",
                     link=f"/sessions/{session.id}")

    return _enrich_session(session, db)


@router.patch("/{session_id}", response_model=SessionOut)
def update_session(
    session_id: int,
    body: SessionUpdate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    changed_fields = []
    for field, value in body.model_dump(exclude_none=True).items():
        if getattr(session, field) != value:
            changed_fields.append(field)
            setattr(session, field, value)
    db.commit()
    db.refresh(session)

    if changed_fields:
        participants = db.query(SessionParticipant).filter(
            SessionParticipant.session_id == session_id
        ).all()
        participant_ids = [p.user_id for p in participants]
        if participant_ids:
            fields_str = ", ".join(changed_fields)
            notify_users(
                db, participant_ids,
                f"Session '{session.title}' was updated ({fields_str})",
                link=f"/sessions/{session_id}",
            )

    return _enrich_session(session, db)


@router.get("/{session_id}/team-notes")
def get_team_notes(session_id: int, db: DBSession = Depends(get_db), _: User = Depends(get_current_user)):
    from app.models.session_note import SessionNote
    from app.models.user import User as UserModel
    notes = db.query(SessionNote).filter(
        SessionNote.session_id == session_id,
        SessionNote.content != ""
    ).all()
    result = []
    for n in notes:
        u = db.query(UserModel).filter(UserModel.id == n.user_id).first()
        result.append({
            "user_id": n.user_id,
            "user_name": u.name if u else f"User #{n.user_id}",
            "content": n.content,
            "updated_at": str(n.updated_at),
        })
    return result


@router.post("/{session_id}/notify-calendar", status_code=200)
def notify_calendar(session_id: int, db: DBSession = Depends(get_db), _: User = Depends(require_admin)):
    """Send all participants a notification with the Google Calendar link."""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.scheduled_at:
        raise HTTPException(status_code=400, detail="Session has no scheduled date")
    participants = db.query(SessionParticipant).filter(SessionParticipant.session_id == session_id).all()
    participant_ids = [p.user_id for p in participants]
    if participant_ids:
        notify_users(
            db, participant_ids,
            f"📅 Calendar invite: '{session.title}' — add it to your Google Calendar",
            link=f"/sessions/{session_id}",
        )
    return {"notified": len(participant_ids)}


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: DBSession = Depends(get_db), _: User = Depends(require_admin)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.query(SessionParticipant).filter(SessionParticipant.session_id == session_id).delete()
    db.delete(session)
    db.commit()
