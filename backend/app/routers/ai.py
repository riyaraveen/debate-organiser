import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])

_client = None


def _get_client():
    global _client
    if _client is None:
        try:
            import anthropic
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                return None
            _client = anthropic.Anthropic(api_key=api_key)
        except Exception:
            return None
    return _client


class CounterargumentRequest(BaseModel):
    argument: str
    topic: Optional[str] = None
    side: Optional[str] = None  # proposition or opposition


class CounterargumentResponse(BaseModel):
    counterargument: str
    rebuttal_tips: list


class EvaluationRequest(BaseModel):
    argument: str
    topic: Optional[str] = None


class EvaluationResponse(BaseModel):
    score: int           # 1–10
    strengths: list
    weaknesses: list
    suggestions: list
    summary: str


class ResearchRequest(BaseModel):
    topic: str
    side: Optional[str] = None


class ResearchResponse(BaseModel):
    key_arguments: list
    evidence_types: list
    search_queries: list
    pitfalls: list


class FallacyRequest(BaseModel):
    argument: str


class FallacyResponse(BaseModel):
    fallacies: list   # list of {name, explanation, quote}
    overall: str


@router.post("/counterargument", response_model=CounterargumentResponse)
def generate_counterargument(body: CounterargumentRequest, _: User = Depends(get_current_user)):
    client = _get_client()
    if not client:
        # Graceful mock fallback when no API key configured
        return CounterargumentResponse(
            counterargument=f"[AI unavailable] Counter to: \"{body.argument[:80]}\" — Configure ANTHROPIC_API_KEY to enable.",
            rebuttal_tips=[
                "Challenge the underlying assumption",
                "Ask for empirical evidence",
                "Offer an alternative framework",
            ]
        )

    side_context = f" You are arguing from the {body.side} side." if body.side else ""
    topic_context = f" The debate topic is: \"{body.topic}\"." if body.topic else ""

    prompt = (
        f"You are a debate coach.{topic_context}{side_context}\n\n"
        f"The opponent has made this argument:\n\"{body.argument}\"\n\n"
        "Provide:\n"
        "1. A strong counterargument (2-3 sentences)\n"
        "2. Three specific rebuttal tips (bullet points)\n\n"
        "Format as JSON: {\"counterargument\": \"...\", \"rebuttal_tips\": [\"...\", \"...\", \"...\"]}"
    )

    try:
        import json
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}]
        )
        text = message.content[0].text.strip()
        # Extract JSON from response
        start = text.find("{")
        end = text.rfind("}") + 1
        data = json.loads(text[start:end])
        return CounterargumentResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate_argument(body: EvaluationRequest, _: User = Depends(get_current_user)):
    client = _get_client()
    if not client:
        return EvaluationResponse(
            score=7,
            strengths=["Clear structure", "Uses evidence"],
            weaknesses=["Could be more specific"],
            suggestions=["Add a real-world example", "Address the opposing view directly"],
            summary="[AI unavailable] Configure ANTHROPIC_API_KEY to enable real evaluation."
        )

    topic_context = f" The debate topic is: \"{body.topic}\"." if body.topic else ""

    prompt = (
        f"You are an experienced debate judge.{topic_context}\n\n"
        f"Evaluate this argument:\n\"{body.argument}\"\n\n"
        "Rate it 1-10 and provide feedback.\n"
        "Format as JSON: {\"score\": 7, \"strengths\": [\"...\"], \"weaknesses\": [\"...\"], \"suggestions\": [\"...\"], \"summary\": \"...\"}"
    )

    try:
        import json
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}]
        )
        text = message.content[0].text.strip()
        start = text.find("{")
        end = text.rfind("}") + 1
        data = json.loads(text[start:end])
        return EvaluationResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@router.post("/research", response_model=ResearchResponse)
def research_suggestions(body: ResearchRequest, _: User = Depends(get_current_user)):
    client = _get_client()
    side_ctx = f" You are helping the {body.side} side." if body.side else ""
    if not client:
        return ResearchResponse(
            key_arguments=["Economic impact argument", "Rights-based argument", "Historical precedent"],
            evidence_types=["Academic studies", "Government statistics", "Expert testimony"],
            search_queries=[f'"{body.topic}" evidence', f'"{body.topic}" research study', f'arguments for {body.topic}'],
            pitfalls=["Avoid anecdotal evidence", "Watch for confirmation bias"]
        )
    prompt = (
        f"You are a debate research coach.{side_ctx}\n"
        f"Topic: \"{body.topic}\"\n\n"
        "Provide research guidance as JSON:\n"
        "{\"key_arguments\": [\"...\"], \"evidence_types\": [\"...\"], \"search_queries\": [\"...\"], \"pitfalls\": [\"...\"]}"
    )
    try:
        import json
        msg = client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=512,
                                     messages=[{"role": "user", "content": prompt}])
        text = msg.content[0].text.strip()
        data = json.loads(text[text.find("{"):text.rfind("}") + 1])
        return ResearchResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@router.post("/detect-fallacies", response_model=FallacyResponse)
def detect_fallacies(body: FallacyRequest, _: User = Depends(get_current_user)):
    client = _get_client()
    if not client:
        return FallacyResponse(
            fallacies=[{"name": "Ad Hominem", "explanation": "Attacks the person rather than the argument.", "quote": body.argument[:60]}],
            overall="[AI unavailable] Configure ANTHROPIC_API_KEY for real fallacy detection."
        )
    prompt = (
        f"You are a logic expert. Identify logical fallacies in this argument:\n\"{body.argument}\"\n\n"
        "Return JSON: {\"fallacies\": [{\"name\": \"...\", \"explanation\": \"...\", \"quote\": \"...\"}], \"overall\": \"...\"}\n"
        "If no fallacies found, return empty fallacies list with overall feedback."
    )
    try:
        import json
        msg = client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=512,
                                     messages=[{"role": "user", "content": prompt}])
        text = msg.content[0].text.strip()
        data = json.loads(text[text.find("{"):text.rfind("}") + 1])
        return FallacyResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
