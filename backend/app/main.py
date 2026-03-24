from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, topics, formats, sessions, notifications
from app.db.database import engine
from app.db import database
import app.models  # noqa: F401 — registers all models with Base

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


@app.get("/api/health")
def health():
    return {"status": "ok"}
