from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session as DBSession
from typing import Dict, List
from app.db.database import get_db
from fastapi import Depends
from app.services.auth import SECRET_KEY, ALGORITHM
from app.models.user import User
from jose import jwt, JWTError

router = APIRouter(prefix="/api/notifications", tags=["notifications-ws"])


class _NotificationManager:
    def __init__(self):
        self._connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, ws: WebSocket, user_id: int):
        await ws.accept()
        self._connections.setdefault(user_id, []).append(ws)

    def disconnect(self, ws: WebSocket, user_id: int):
        self._connections[user_id] = [
            w for w in self._connections.get(user_id, []) if w is not ws
        ]

    async def push(self, user_id: int, payload: dict):
        dead = []
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        if dead:
            self._connections[user_id] = [
                w for w in self._connections.get(user_id, []) if w not in dead
            ]


manager = _NotificationManager()


def _decode_user(token: str, db: DBSession):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except (JWTError, Exception):
        return None


@router.websocket("/ws")
async def notifications_ws(
    websocket: WebSocket,
    token: str = Query(...),
    db: DBSession = Depends(get_db),
):
    user = _decode_user(token, db)
    if not user:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user.id)
    try:
        while True:
            # Keep alive — client may send pings; we just discard them
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
