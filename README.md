# Debate Organiser

A debate organisation and planning web application for school clubs.

## Stack
- **Frontend**: React + Vite + React Router
- **Backend**: FastAPI (Python) + SQLite (SQLAlchemy)
- **Auth**: JWT (Auth0-ready)

## Quick Start

### Backend
```bash
cd backend
python3.8 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/pip install "bcrypt==4.0.1"  # passlib compat fix
.venv/bin/python -m app.db.seed        # seeds formats + admin user
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Default admin: `admin@debateclub.com` / `admin123`

API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## MVP Features (Epics 1–6)
- Admin and member accounts with role-based access
- 5 built-in debate formats (Oxford, BP, Lincoln-Douglas, US Collegiate, World Schools)
- Topic bank with go/no-go flags, age and proficiency filters
- Session creation wizard (online/offline, debater assignment, auto role assignment)
- Calendar view of all sessions
- In-app notification system
- Google Calendar export link (`.ics`)
