import json
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.database import get_db
from app.models.school import School
from app.models.tournament import Tournament
from app.models.user import User
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/schools", tags=["schools"])
tournament_router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])


# ── Schemas ──────────────────────────────────────────

class SchoolCreate(BaseModel):
    name: str
    city: Optional[str] = None
    contact_email: Optional[str] = None
    description: Optional[str] = None


class SchoolOut(BaseModel):
    id: int
    name: str
    city: Optional[str]
    contact_email: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True


class TournamentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    format: Optional[str] = "single_elimination"
    school_ids: Optional[List[int]] = []
    scheduled_at: Optional[datetime] = None


class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class TournamentOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    format: Optional[str]
    status: str
    bracket: Optional[str]
    school_ids: Optional[str]
    scheduled_at: Optional[datetime]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── School routes ─────────────────────────────────────

@router.get("/", response_model=List[SchoolOut])
def list_schools(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(School).all()


@router.post("/", response_model=SchoolOut, status_code=201)
def create_school(body: SchoolCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    school = School(**body.model_dump())
    db.add(school)
    db.commit()
    db.refresh(school)
    return school


@router.patch("/{school_id}", response_model=SchoolOut)
def update_school(school_id: int, body: SchoolCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(school, field, value)
    db.commit()
    db.refresh(school)
    return school


@router.delete("/{school_id}", status_code=204)
def delete_school(school_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    db.delete(school)
    db.commit()


# ── Tournament routes ─────────────────────────────────

def _generate_bracket(school_ids: List[int], fmt: str) -> dict:
    """Generate an initial bracket from a list of school IDs."""
    teams = school_ids[:]
    random.shuffle(teams)

    if fmt == "round_robin":
        rounds = []
        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                rounds.append({"team_a": teams[i], "team_b": teams[j], "winner": None})
        return {"format": "round_robin", "matches": rounds}

    # Single elimination
    while len(teams) < 2:
        teams.append(None)
    # Pad to power of 2
    import math
    n = 2 ** math.ceil(math.log2(max(len(teams), 2)))
    teams += [None] * (n - len(teams))

    rounds = []
    current = teams
    round_num = 1
    while len(current) > 1:
        matches = []
        for i in range(0, len(current), 2):
            matches.append({"team_a": current[i], "team_b": current[i + 1], "winner": None, "round": round_num})
        rounds.append({"round": round_num, "matches": matches})
        current = [None] * (len(current) // 2)
        round_num += 1
    return {"format": "single_elimination", "rounds": rounds}


@tournament_router.get("/", response_model=List[TournamentOut])
def list_tournaments(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Tournament).order_by(Tournament.created_at.desc()).all()


@tournament_router.post("/", response_model=TournamentOut, status_code=201)
def create_tournament(body: TournamentCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    bracket = _generate_bracket(body.school_ids or [], body.format or "single_elimination")
    t = Tournament(
        name=body.name,
        description=body.description,
        format=body.format,
        school_ids=json.dumps(body.school_ids or []),
        bracket=json.dumps(bracket),
        scheduled_at=body.scheduled_at,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@tournament_router.get("/{tournament_id}", response_model=TournamentOut)
def get_tournament(tournament_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return t


@tournament_router.patch("/{tournament_id}", response_model=TournamentOut)
def update_tournament(tournament_id: int, body: TournamentUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(t, field, value)
    db.commit()
    db.refresh(t)
    return t


@tournament_router.patch("/{tournament_id}/bracket")
def update_bracket(tournament_id: int, bracket: dict, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Update bracket state (record match results)."""
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    t.bracket = json.dumps(bracket)
    db.commit()
    db.refresh(t)
    return t
