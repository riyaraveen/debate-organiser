import random
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.user import User
from app.models.topic import Topic, ProficiencyLevel
from app.schemas.topic import TopicCreate, TopicUpdate, TopicOut
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.get("/", response_model=List[TopicOut])
def list_topics(
    is_go: Optional[bool] = None,
    proficiency: Optional[ProficiencyLevel] = None,
    age: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Topic)
    if is_go is not None:
        q = q.filter(Topic.is_go == is_go)
    if proficiency:
        q = q.filter(Topic.proficiency == proficiency)
    if age is not None:
        q = q.filter((Topic.min_age == None) | (Topic.min_age <= age))
        q = q.filter((Topic.max_age == None) | (Topic.max_age >= age))
    if search:
        q = q.filter(Topic.text.ilike(f"%{search}%"))
    return q.all()


@router.get("/random", response_model=TopicOut)
def random_topic(
    proficiency: Optional[ProficiencyLevel] = None,
    age: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Topic).filter(Topic.is_go == True)
    if proficiency:
        q = q.filter(Topic.proficiency == proficiency)
    if age is not None:
        q = q.filter((Topic.min_age == None) | (Topic.min_age <= age))
        q = q.filter((Topic.max_age == None) | (Topic.max_age >= age))
    topics = q.all()
    if not topics:
        raise HTTPException(status_code=404, detail="No suitable topics found")
    return random.choice(topics)


_AI_TOPICS = [
    ("This house would ban algorithmic content recommendation on social media", "Technology & Society", "intermediate"),
    ("This house believes gene editing of human embryos should be permitted", "Science & Ethics", "advanced"),
    ("This house would introduce a four-day working week by law", "Economics", "intermediate"),
    ("This house believes space exploration is a poor use of public funds", "Science & Ethics", "beginner"),
    ("This house would make mental health days a statutory right for students", "Education", "beginner"),
    ("This house believes the gig economy does more harm than good", "Economics", "intermediate"),
    ("This house would lower the voting age to 16", "Politics", "beginner"),
    ("This house believes nuclear energy is essential for a sustainable future", "Environment", "advanced"),
    ("This house would require wealthy nations to open their borders to climate refugees", "Politics", "advanced"),
    ("This house believes corporations have a moral duty to prioritise sustainability over profit", "Economics", "intermediate"),
]


@router.get("/generate")
def generate_topic(_: User = Depends(require_admin)):
    """Mocked AI topic generation — returns a curated topic as if AI-generated."""
    text, category, proficiency = random.choice(_AI_TOPICS)
    return {
        "text": text,
        "category": category,
        "proficiency": proficiency,
        "source": "ai_generated",
        "is_go": True,
    }


@router.post("/", response_model=TopicOut, status_code=201)
def create_topic(body: TopicCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    topic = Topic(**body.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.post("/bulk", response_model=List[TopicOut], status_code=201)
def bulk_create_topics(topics: List[TopicCreate], db: Session = Depends(get_db), _: User = Depends(require_admin)):
    new_topics = [Topic(**t.model_dump()) for t in topics]
    db.add_all(new_topics)
    db.commit()
    return new_topics


@router.patch("/{topic_id}", response_model=TopicOut)
def update_topic(topic_id: int, body: TopicUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(topic, field, value)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=204)
def delete_topic(topic_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    db.delete(topic)
    db.commit()
