from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, topics, formats, sessions, notifications, settings, notes, ai, events
from app.routers.availability import router as availability_router
from app.routers.templates import router as templates_router
from app.routers.announcements import router as announcements_router
from app.routers.invites import router as invites_router
from app.routers.schools import router as schools_router, tournament_router
from app.routers.team_chat import router as team_chat_router
from app.routers.clubs import router as clubs_router
from app.routers.scores import router as scores_router
from app.routers.ws_notifications import router as ws_notifications_router
from app.db.database import engine, DATABASE_URL
from app.db import database
import app.models  # noqa: F401 — registers all models with Base
from app.db.database import Base, engine

# ── Create tables (SQLite dev only; Postgres uses Alembic) ──────────────────
if DATABASE_URL.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)

# ── Non-destructive column migrations (SQLite only) ──────────────────────────
from sqlalchemy import text, inspect as sa_inspect

def _add_column_if_missing(table: str, column: str, col_type: str):
    try:
        cols = [c["name"] for c in sa_inspect(engine).get_columns(table)]
        if column not in cols:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                conn.commit()
    except Exception:
        pass  # Table may not exist yet on first run


if DATABASE_URL.startswith("sqlite"):
    _add_column_if_missing("sessions",            "additional_notes",  "VARCHAR")
    _add_column_if_missing("notifications",       "notification_type", "VARCHAR")
    _add_column_if_missing("notifications",       "ref_key",           "VARCHAR")
    _add_column_if_missing("sessions",            "club_id",           "INTEGER")
    _add_column_if_missing("debate_formats",      "club_id",           "INTEGER")
    _add_column_if_missing("topics",              "club_id",           "INTEGER")
    _add_column_if_missing("club_settings",       "club_id",           "INTEGER")
    _add_column_if_missing("calendar_events",     "club_id",           "INTEGER")
    _add_column_if_missing("announcements",       "club_id",           "INTEGER")
    _add_column_if_missing("invite_codes",        "club_id",           "INTEGER")
    _add_column_if_missing("session_templates",   "club_id",           "INTEGER")
    _add_column_if_missing("session_participants","attended",          "INTEGER")
    _add_column_if_missing("users",               "reset_token",       "VARCHAR")
    _add_column_if_missing("users",               "reset_token_expiry","DATETIME")
    _add_column_if_missing("schools",             "club_id",           "INTEGER")
    _add_column_if_missing("tournaments",         "club_id",           "INTEGER")

# ── Seed a default club for existing data ────────────────────────────────────
from sqlalchemy.orm import Session as DBSession
from app.models.club import Club, ClubMembership
from app.models.user import User

def _seed_default_club():
    with DBSession(bind=engine) as db:
        if db.query(Club).count() > 0:
            return  # Already migrated

        owner = db.query(User).filter(User.role == "admin").first() or db.query(User).first()
        if not owner:
            return  # Fresh install — nothing to migrate

        club = Club(name="My Debate Club", slug="my-debate-club", created_by=owner.id)
        db.add(club)
        db.flush()

        users = db.query(User).all()
        for u in users:
            role = "owner" if u.id == owner.id else ("admin" if u.role == "admin" else "member")
            membership = ClubMembership(club_id=club.id, user_id=u.id, role=role)
            db.add(membership)

        db.execute(text(f"UPDATE sessions SET club_id = {club.id} WHERE club_id IS NULL"))
        db.execute(text(f"UPDATE topics SET club_id = {club.id} WHERE club_id IS NULL"))
        db.execute(text(f"UPDATE club_settings SET club_id = {club.id} WHERE club_id IS NULL"))
        db.execute(text(f"UPDATE calendar_events SET club_id = {club.id} WHERE club_id IS NULL"))
        db.execute(text(f"UPDATE announcements SET club_id = {club.id} WHERE club_id IS NULL"))
        db.execute(text(f"UPDATE invite_codes SET club_id = {club.id} WHERE club_id IS NULL"))
        db.execute(text(f"UPDATE session_templates SET club_id = {club.id} WHERE club_id IS NULL"))
        db.execute(text(f"UPDATE schools SET club_id = {club.id} WHERE club_id IS NULL"))
        db.execute(text(f"UPDATE tournaments SET club_id = {club.id} WHERE club_id IS NULL"))
        db.execute(text(f"UPDATE debate_formats SET club_id = {club.id} WHERE club_id IS NULL AND is_builtin = 0"))

        db.commit()

_seed_default_club()


def _seed_default_topics():
    """Insert default topics into any club that has no topics yet."""
    from app.models.topic import Topic, TopicSource, ProficiencyLevel
    from app.routers.clubs import _DEFAULT_TOPICS
    with DBSession(bind=engine) as db:
        clubs = db.query(Club).all()
        for club in clubs:
            if db.query(Topic).filter(Topic.club_id == club.id).count() > 0:
                continue
            for t in _DEFAULT_TOPICS:
                db.add(Topic(club_id=club.id, source=TopicSource.admin, is_go=True, **t))
        db.commit()

_seed_default_topics()


def _seed_default_schools():
    """Insert sample schools for each club, skipping any that already exist by name."""
    from app.models.school import School
    _DEFAULT_SCHOOLS = [
        {"name": "Oakridge Academy",        "city": "London",     "contact_email": "debate@oakridge.ac.uk",        "description": "Strong parliamentary tradition"},
        {"name": "Westfield High",           "city": "Manchester", "contact_email": "debate@westfield.sch.uk",      "description": None},
        {"name": "St. Catherine's College",  "city": "Oxford",     "contact_email": "debate@stcatherines.ox.ac.uk", "description": "Annual inter-collegiate champions"},
        {"name": "Greenhaven Grammar",       "city": "Bristol",    "contact_email": "debate@greenhavengrammar.ac.uk","description": "Regional finalist 2024"},
        {"name": "King's Cross Academy",     "city": "London",     "contact_email": "debate@kca.sch.uk",            "description": None},
        {"name": "Riverdale Sixth Form",     "city": "Leeds",      "contact_email": "debate@riverdale.sch.uk",      "description": "Strong WSDC record"},
        {"name": "The Pemberton School",     "city": "Edinburgh",  "contact_email": "debate@pemberton.ac.uk",       "description": None},
        {"name": "Hartwell College",         "city": "Cambridge",  "contact_email": "debate@hartwell.ac.uk",        "description": "BP format specialists"},
        {"name": "Ashford International",    "city": "Birmingham", "contact_email": "debate@ashfordinternational.ac.uk", "description": None},
    ]
    with DBSession(bind=engine) as db:
        clubs = db.query(Club).all()
        for club in clubs:
            existing_names = {s.name for s in db.query(School).filter(School.club_id == club.id).all()}
            for s in _DEFAULT_SCHOOLS:
                if s["name"] not in existing_names:
                    db.add(School(club_id=club.id, **s))
        db.commit()

_seed_default_schools()
# ─────────────────────────────────────────────────────────────────────────────

# ── APScheduler: session reminders every hour ────────────────────────────────
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.routers.notifications import run_reminder_job

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_reminder_job, "interval", hours=1)
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)

# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Debate Organiser API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "ws://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Club-ID"],
)

app.include_router(auth.router)
app.include_router(clubs_router)
app.include_router(users.router)
app.include_router(topics.router)
app.include_router(formats.router)
app.include_router(sessions.router)
app.include_router(scores_router)
app.include_router(notifications.router)
app.include_router(ws_notifications_router)
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
