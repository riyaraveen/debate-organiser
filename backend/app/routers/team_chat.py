from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession
from typing import Optional, List, Dict, Tuple
from jose import jwt, JWTError

from app.db.database import get_db
from app.models.user import User
from app.models.session import Session, SessionParticipant
from app.models.team_message import TeamMessage
from app.services.auth import get_current_user, SECRET_KEY, ALGORITHM
from app.services.notifications import notify_users

router = APIRouter(prefix="/api/sessions", tags=["team-chat"])


# ── In-memory connection manager ─────────────────────────────────────────────
class _ConnectionManager:
    def __init__(self):
        # room_key → list of (websocket, user_name, user_id) tuples
        self._rooms: Dict[str, List[Tuple[WebSocket, str, int]]] = {}

    def _key(self, session_id: int, side: str) -> str:
        return f"{session_id}:{side}"

    async def connect(self, ws: WebSocket, session_id: int, side: str, user_name: str, user_id: int):
        await ws.accept()
        key = self._key(session_id, side)
        self._rooms.setdefault(key, []).append((ws, user_name, user_id))

    def disconnect(self, ws: WebSocket, session_id: int, side: str):
        key = self._key(session_id, side)
        self._rooms[key] = [(w, n, uid) for w, n, uid in self._rooms.get(key, []) if w is not ws]

    async def broadcast(self, session_id: int, side: str, payload: dict):
        key = self._key(session_id, side)
        dead = []
        for ws, _, __ in self._rooms.get(key, []):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        # Clean up dead connections
        self._rooms[key] = [(w, n, uid) for w, n, uid in self._rooms.get(key, []) if w not in dead]

    def connected_user_ids(self, session_id: int, side: str) -> set[int]:
        """Return the set of user_ids currently connected to this room."""
        key = self._key(session_id, side)
        return {uid for _, _, uid in self._rooms.get(key, [])}

    async def kick_user(self, session_id: int, user_id: int, reason: str = "removed"):
        """Close all WebSocket connections for a user across all sides of a session.
        reason: 'removed' (kicked out) or 'side_changed' (reassigned, should reconnect).
        """
        prefix = f"{session_id}:"
        for key in list(self._rooms.keys()):
            if not key.startswith(prefix):
                continue
            to_kick = [ws for ws, _, uid in self._rooms[key] if uid == user_id]
            for ws in to_kick:
                try:
                    await ws.send_json({"type": reason})
                    await ws.close(code=4003)
                except Exception:
                    pass
            self._rooms[key] = [(w, n, uid) for w, n, uid in self._rooms[key] if uid != user_id]


manager = _ConnectionManager()


# ── Helpers ───────────────────────────────────────────────────────────────────
def _get_user_side(session_id: int, user_id: int, db: DBSession) -> Optional[str]:
    """Return the user's side in this session, or 'general' if unassigned."""
    p = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.user_id == user_id,
    ).first()
    if p is None:
        return None           # not a participant at all
    return p.side or "general"


def _decode_token(token: str, db: DBSession) -> Optional[User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except (JWTError, Exception):
        return None


def _messages_to_dict(messages: List[TeamMessage], db: DBSession) -> List[dict]:
    user_cache: dict[int, str] = {}
    result = []
    for m in messages:
        if m.user_id not in user_cache:
            u = db.query(User).filter(User.id == m.user_id).first()
            user_cache[m.user_id] = u.name if u else "Unknown"
        result.append({
            "id": m.id,
            "user_id": m.user_id,
            "user_name": user_cache[m.user_id],
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        })
    return result


# ── REST: get message history ─────────────────────────────────────────────────
@router.get("/{session_id}/chat/history")
def get_chat_history(
    session_id: int,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    side = _get_user_side(session_id, current_user.id, db)
    if side is None:
        raise HTTPException(status_code=403, detail="You are not a participant in this session")

    messages = (
        db.query(TeamMessage)
        .filter(TeamMessage.session_id == session_id, TeamMessage.side == side)
        .order_by(TeamMessage.created_at)
        .all()
    )
    return {
        "side": side,
        "session_status": session.status,
        "messages": _messages_to_dict(messages, db),
    }


# ── WebSocket ─────────────────────────────────────────────────────────────────
@router.websocket("/{session_id}/chat/ws")
async def chat_ws(
    websocket: WebSocket,
    session_id: int,
    token: str = Query(...),
    db: DBSession = Depends(get_db),
):
    # Authenticate
    user = _decode_token(token, db)
    if not user:
        await websocket.close(code=4001)
        return

    # Authorise — must be a participant
    side = _get_user_side(session_id, user.id, db)
    if side is None:
        await websocket.close(code=4003)
        return

    # Check session exists and is not completed (read-only if completed)
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        await websocket.close(code=4004)
        return

    await manager.connect(websocket, session_id, side, user.name, user.id)

    # Send join confirmation
    await websocket.send_json({
        "type": "joined",
        "side": side,
        "user_name": user.name,
        "session_status": session.status,
    })

    try:
        while True:
            data = await websocket.receive_json()

            # Refresh session status on each message
            db.refresh(session)
            if session.status == "completed":
                await websocket.send_json({"type": "error", "detail": "Session has ended. Chat is closed."})
                continue

            content = (data.get("content") or "").strip()
            if not content:
                continue

            # Persist message
            msg = TeamMessage(
                session_id=session_id,
                user_id=user.id,
                side=side,
                content=content,
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)

            # Notify side members who are offline (not currently connected)
            online_ids = manager.connected_user_ids(session_id, side)
            all_side_ids = {
                p.user_id for p in db.query(SessionParticipant).filter(
                    SessionParticipant.session_id == session_id,
                    SessionParticipant.side == side,
                ).all()
            }
            offline_ids = list(all_side_ids - online_ids - {user.id})
            if offline_ids:
                preview = content[:60] + ("…" if len(content) > 60 else "")
                await notify_users(
                    db, offline_ids,
                    f"{user.name}: {preview}",
                    link=f"/sessions/{session_id}/chat",
                )

            # Broadcast to all room members
            await manager.broadcast(session_id, side, {
                "type": "message",
                "id": msg.id,
                "user_id": user.id,
                "user_name": user.name,
                "content": content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id, side)
        await manager.broadcast(session_id, side, {
            "type": "system",
            "content": f"{user.name} left the chat.",
        })
