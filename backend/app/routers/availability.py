from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date as date_type
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User
from app.models.availability import UserAvailability
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["availability"])


class AvailabilityIn(BaseModel):
    date: date_type


@router.get("/{user_id}/availability")
def get_availability(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(UserAvailability).filter(UserAvailability.user_id == user_id).all()
    return [str(r.date) for r in rows]


@router.post("/me/availability", status_code=201)
def add_availability(body: AvailabilityIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(UserAvailability).filter(
        UserAvailability.user_id == current_user.id,
        UserAvailability.date == body.date,
    ).first()
    if not existing:
        db.add(UserAvailability(user_id=current_user.id, date=body.date))
        db.commit()
    return {"date": str(body.date)}


@router.delete("/me/availability/{date_str}", status_code=204)
def remove_availability(date_str: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        d = date_type.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    row = db.query(UserAvailability).filter(
        UserAvailability.user_id == current_user.id,
        UserAvailability.date == d,
    ).first()
    if row:
        db.delete(row)
        db.commit()
