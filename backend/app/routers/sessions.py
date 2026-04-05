from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.session import Session, SessionParticipant
from app.models.debate_format import DebateFormat
from app.models.topic import Topic
from app.schemas.session import SessionCreate, SessionUpdate, SessionOut, ParticipantOut, ParticipantIn, AttendanceUpdate
from app.services.auth import get_current_user, require_admin, get_club_membership, require_club_admin
from app.models.club import ClubMembership
from app.services.role_assignment import assign_roles
from app.services.notifications import notify_users
from app.models.team_message import TeamMessage
from app.routers.team_chat import manager as chat_manager

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _enrich_session(session: Session, db: DBSession) -> dict:
    """Attach participant + user info to a session object."""
    participants = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session.id
    ).all()
    user_ids = [p.user_id for p in participants]
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
    enriched_participants = [
        {
            "id": p.id,
            "user_id": p.user_id,
            "role_name": p.role_name,
            "side": p.side,
            "attended": p.attended,
            "user": users_by_id.get(p.user_id),
        }
        for p in participants
    ]
    result = {c.name: getattr(session, c.name) for c in session.__table__.columns}
    result["participants"] = enriched_participants
    return result


@router.get("/", response_model=List[SessionOut])
def list_sessions(db: DBSession = Depends(get_db), membership: ClubMembership = Depends(get_club_membership)):
    sessions = db.query(Session).filter(Session.club_id == membership.club_id).order_by(Session.scheduled_at.desc()).all()
    return [_enrich_session(s, db) for s in sessions]


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: DBSession = Depends(get_db), membership: ClubMembership = Depends(get_club_membership)):
    session = db.query(Session).filter(Session.id == session_id, Session.club_id == membership.club_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _enrich_session(session, db)


@router.post("/", response_model=SessionOut, status_code=201)
async def create_session(body: SessionCreate, db: DBSession = Depends(get_db), current_user: User = Depends(get_current_user), membership: ClubMembership = Depends(require_club_admin)):
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
        club_id=membership.club_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    if body.participant_ids:
        fmt = db.query(DebateFormat).filter(DebateFormat.id == body.format_id).first()
        if body.auto_assign_roles and fmt:
            assignments = assign_roles(fmt.roles, body.participant_ids)
        elif not body.auto_assign_roles and body.manual_assignments:
            assignments = [{"user_id": a.user_id, "role_name": a.role_name, "side": a.side} for a in body.manual_assignments]
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
        await notify_users(db, body.participant_ids,
                           f"You've been added to '{session.title}'. Check your role and session details.",
                           link=f"/sessions/{session.id}")

    return _enrich_session(session, db)


@router.patch("/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: int,
    body: SessionUpdate,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    membership: ClubMembership = Depends(require_club_admin),
):
    session = db.query(Session).filter(Session.id == session_id, Session.club_id == membership.club_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    was_completed = session.status == "completed"
    changed_fields = []
    for field, value in body.model_dump(exclude_none=True).items():
        if getattr(session, field) != value:
            changed_fields.append(field)
            setattr(session, field, value)

    # Delete all team chat messages when a session is marked completed
    now_completed = session.status == "completed"
    if not was_completed and now_completed:
        db.query(TeamMessage).filter(TeamMessage.session_id == session_id).delete()

    db.commit()
    db.refresh(session)

    _FIELD_LABELS = {
        "title": "title renamed",
        "scheduled_at": "date/time changed",
        "location": "location updated",
        "status": f"status changed to {session.status}",
        "topic_text": "topic updated",
        "topic_id": "topic updated",
        "winner_team": "result recorded",
        "result_notes": "judge's notes added",
        "additional_notes": "organiser notes updated",
    }
    if changed_fields:
        participants = db.query(SessionParticipant).filter(
            SessionParticipant.session_id == session_id
        ).all()
        participant_ids = [p.user_id for p in participants]
        if participant_ids:
            changes = ", ".join(_FIELD_LABELS.get(f, f) for f in changed_fields)
            await notify_users(
                db, participant_ids,
                f"'{session.title}' was updated — {changes}.",
                link=f"/sessions/{session_id}",
            )

    return _enrich_session(session, db)


DEBATING_SIDES = {'proposition', 'opposition'}


@router.get("/{session_id}/team-notes")
def get_team_notes(session_id: int, db: DBSession = Depends(get_db), membership: ClubMembership = Depends(get_club_membership), current_user: User = Depends(get_current_user)):
    from app.models.session_note import SessionNote

    # Determine the current user's side in this session
    my_participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == current_user.id,
    ).first()

    # Supporting roles (or not a participant) cannot see any team notes
    if not my_participant or my_participant.side not in DEBATING_SIDES:
        return []

    my_side = my_participant.side

    # Filter notes by the side they were written under (side_at_save), not the
    # author's current side — so notes survive role reassignments intact.
    notes = db.query(SessionNote).filter(
        SessionNote.session_id == session_id,
        SessionNote.content != "",
        SessionNote.side_at_save == my_side,
        (SessionNote.is_private == False) | (SessionNote.user_id == current_user.id),
    ).all()

    user_ids = [n.user_id for n in notes]
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
    participant_by_user = {p.user_id: p for p in db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id.in_(user_ids),
    ).all()}

    return [
        {
            "user_id": n.user_id,
            "user_name": users_by_id[n.user_id].name if n.user_id in users_by_id else f"User #{n.user_id}",
            "content": n.content,
            "is_private": n.is_private,
            "updated_at": str(n.updated_at),
            "role": participant_by_user[n.user_id].role_name if n.user_id in participant_by_user else None,
            "side": participant_by_user[n.user_id].side if n.user_id in participant_by_user else None,
        }
        for n in notes
    ]


@router.get("/{session_id}/notes/{user_id}")
def get_user_note(session_id: int, user_id: int, db: DBSession = Depends(get_db), membership: ClubMembership = Depends(get_club_membership), current_user: User = Depends(get_current_user)):
    from app.models.session_note import SessionNote
    from app.models.user import User as UserModel

    # Determine both sides
    my_participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == current_user.id,
    ).first()
    target_participant = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == user_id,
    ).first()

    my_side = my_participant.side if my_participant else None
    if my_side not in DEBATING_SIDES:
        raise HTTPException(status_code=403, detail="You can only view notes from members on your team")

    # Check the note's recorded side — not the author's current side
    note = db.query(SessionNote).filter(
        SessionNote.session_id == session_id,
        SessionNote.user_id == user_id,
    ).first()
    note_side = note.side_at_save if note else None
    if note_side not in DEBATING_SIDES or note_side != my_side:
        raise HTTPException(status_code=403, detail="You can only view notes from members on your team")

    note = db.query(SessionNote).filter(
        SessionNote.session_id == session_id,
        SessionNote.user_id == user_id,
    ).first()

    if note and note.is_private and note.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="These notes are private")

    u = db.query(UserModel).filter(UserModel.id == user_id).first()
    return {
        "user_id": user_id,
        "user_name": u.name if u else f"User #{user_id}",
        "content": note.content if note else "",
        "updated_at": str(note.updated_at) if note else None,
        "role": target_participant.role_name if target_participant else None,
        "side": note_side,
    }


@router.post("/{session_id}/notify-calendar", status_code=200)
async def notify_calendar(session_id: int, db: DBSession = Depends(get_db), _: ClubMembership = Depends(require_club_admin)):
    """Send all participants a notification with the Google Calendar link."""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.scheduled_at:
        raise HTTPException(status_code=400, detail="Session has no scheduled date")
    participants = db.query(SessionParticipant).filter(SessionParticipant.session_id == session_id).all()
    participant_ids = [p.user_id for p in participants]
    if participant_ids:
        await notify_users(
            db, participant_ids,
            f"📅 Calendar invite: '{session.title}' — add it to your Google Calendar",
            link=f"/sessions/{session_id}",
        )
    return {"notified": len(participant_ids)}


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: DBSession = Depends(get_db), membership: ClubMembership = Depends(require_club_admin)):
    from app.models.session_note import SessionNote
    session = db.query(Session).filter(Session.id == session_id, Session.club_id == membership.club_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.query(SessionParticipant).filter(SessionParticipant.session_id == session_id).delete()
    db.query(TeamMessage).filter(TeamMessage.session_id == session_id).delete()
    db.query(SessionNote).filter(SessionNote.session_id == session_id).delete()
    db.delete(session)
    db.commit()


# ---------------------------------------------------------------------------
# Participant management
# ---------------------------------------------------------------------------

@router.post("/{session_id}/participants", response_model=ParticipantOut, status_code=201)
async def add_participant(
    session_id: int,
    body: ParticipantIn,
    db: DBSession = Depends(get_db),
    _: ClubMembership = Depends(require_club_admin),
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    existing = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == body.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a participant")
    p = SessionParticipant(session_id=session_id, user_id=body.user_id,
                           role_name=body.role_name, side=body.side)
    db.add(p)
    db.commit()
    db.refresh(p)
    user = db.query(User).filter(User.id == p.user_id).first()
    role_str = f" as {p.role_name}" if p.role_name else ""
    await notify_users(db, [body.user_id],
                       f"You've been added to '{session.title}'{role_str}.",
                       link=f"/sessions/{session_id}/chat")
    return {**{c.name: getattr(p, c.name) for c in p.__table__.columns}, "user": user, "attended": p.attended}


@router.delete("/{session_id}/participants/{participant_id}", status_code=204)
async def remove_participant(
    session_id: int,
    participant_id: int,
    db: DBSession = Depends(get_db),
    _: ClubMembership = Depends(require_club_admin),
):
    p = db.query(SessionParticipant).filter(
        SessionParticipant.id == participant_id,
        SessionParticipant.session_id == session_id,
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    removed_user_id = p.user_id
    db.delete(p)
    db.commit()
    # Close the removed user's active chat WebSocket(s) for this session.
    # Their messages are retained in TeamMessage.
    await chat_manager.kick_user(session_id, removed_user_id)


@router.patch("/{session_id}/participants/{participant_id}", response_model=ParticipantOut)
async def update_participant(
    session_id: int,
    participant_id: int,
    body: ParticipantIn,
    db: DBSession = Depends(get_db),
    _: ClubMembership = Depends(require_club_admin),
):
    """Replace the user assigned to a participant slot, or update their role/side."""
    p = db.query(SessionParticipant).filter(
        SessionParticipant.id == participant_id,
        SessionParticipant.session_id == session_id,
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    if body.user_id != p.user_id:
        conflict = db.query(SessionParticipant).filter(
            SessionParticipant.session_id == session_id,
            SessionParticipant.user_id == body.user_id,
            SessionParticipant.id != participant_id,
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="User is already a participant")

    side_changed = body.side is not None and body.side != p.side
    user_changed = body.user_id != p.user_id
    old_user_id = p.user_id  # capture before overwrite

    p.user_id = body.user_id
    if body.role_name is not None:
        p.role_name = body.role_name
    if body.side is not None:
        p.side = body.side
    db.commit()
    db.refresh(p)

    # Kick affected users so they reconnect to the correct room on next page load.
    if side_changed or user_changed:
        # Kick the original occupant (their side/slot changed).
        await chat_manager.kick_user(session_id, old_user_id, reason="side_changed")
        if user_changed:
            # Also kick the incoming user in case they were already connected under a different side.
            await chat_manager.kick_user(session_id, body.user_id, reason="side_changed")

    user = db.query(User).filter(User.id == p.user_id).first()
    return {**{c.name: getattr(p, c.name) for c in p.__table__.columns}, "user": user}


@router.patch("/{session_id}/participants/{participant_id}/attendance", response_model=ParticipantOut)
def mark_attendance(
    session_id: int,
    participant_id: int,
    body: AttendanceUpdate,
    db: DBSession = Depends(get_db),
    _: ClubMembership = Depends(require_club_admin),
):
    p = db.query(SessionParticipant).filter(
        SessionParticipant.id == participant_id,
        SessionParticipant.session_id == session_id,
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    p.attended = body.attended
    db.commit()
    db.refresh(p)
    user = db.query(User).filter(User.id == p.user_id).first()
    return {**{c.name: getattr(p, c.name) for c in p.__table__.columns}, "user": user}
