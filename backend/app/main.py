from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, topics, formats, sessions, notifications, settings, notes, ai, events
from app.routers.availability import router as availability_router
from app.routers.templates import router as templates_router
from app.routers.announcements import router as announcements_router
from app.routers.invites import router as invites_router
from app.routers.schools import router as schools_router, tournament_router
from app.routers.team_chat import router as team_chat_router
from app.db.database import engine
from app.db import database
import app.models  # noqa: F401 — registers all models with Base
from app.db.database import Base, engine

# Create any new tables that don't exist yet (non-destructive)
Base.metadata.create_all(bind=engine)

# Add any new columns that don't exist yet (non-destructive ALTER TABLE)
from sqlalchemy import text, inspect as sa_inspect
def _add_column_if_missing(table: str, column: str, col_type: str):
    cols = [c["name"] for c in sa_inspect(engine).get_columns(table)]
    if column not in cols:
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))

_add_column_if_missing("sessions",      "additional_notes",  "VARCHAR")
_add_column_if_missing("notifications", "notification_type", "VARCHAR")
_add_column_if_missing("notifications", "ref_key",           "VARCHAR")

app = FastAPI(title="Debate Organiser API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "ws://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(topics.router)
app.include_router(formats.router)
app.include_router(sessions.router)
app.include_router(notifications.router)
app.include_router(settings.router)
app.include_router(notes.router)
app.include_router(ai.router)
app.include_router(events.router)
app.include_router(schools_router)
app.include_router(tournament_router)
app.include_router(team_chat_router)
app.include_router(availability_router)
app.include_router(templates_router)
app.include_router(announcements_router)
app.include_router(invites_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
