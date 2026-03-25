from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, topics, formats, sessions, notifications, settings, notes, ai
from app.routers.schools import router as schools_router, tournament_router
from app.db.database import engine
from app.db import database
import app.models  # noqa: F401 — registers all models with Base
from app.db.database import Base, engine

# Create any new tables that don't exist yet (non-destructive)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Debate Organiser API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
app.include_router(schools_router)
app.include_router(tournament_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
