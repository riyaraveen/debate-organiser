"""
Debate Organiser MCP Server

Wraps the Debate Organiser FastAPI backend as MCP tools.

Config (env vars or .env file):
  DEBATE_API_BASE_URL   — base URL of the running FastAPI server (default: http://localhost:8000)
  DEBATE_API_EMAIL      — login email (used for auto token refresh)
  DEBATE_API_PASSWORD   — login password (used for auto token refresh)
"""

import os
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

BASE_URL = os.getenv("DEBATE_API_BASE_URL", "http://localhost:8000")
_EMAIL = os.getenv("DEBATE_API_EMAIL", "")
_PASSWORD = os.getenv("DEBATE_API_PASSWORD", "")

# Cached token — refreshed automatically on 401
_token: str = ""

mcp = FastMCP("debate-organiser")


# ---------------------------------------------------------------------------
# Token management
# ---------------------------------------------------------------------------

def _refresh_token() -> None:
    """Log in and cache a fresh token. Raises if credentials are missing or wrong."""
    global _token
    if not _EMAIL or not _PASSWORD:
        raise RuntimeError(
            "No credentials configured. Set DEBATE_API_EMAIL and DEBATE_API_PASSWORD in your .env file."
        )
    r = httpx.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": _EMAIL, "password": _PASSWORD},
        timeout=30,
    )
    r.raise_for_status()
    _token = r.json()["access_token"]


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _headers() -> dict[str, str]:
    return {"Content-Type": "application/json", "Authorization": f"Bearer {_token}"}


def _request(method: str, path: str, **kwargs) -> Any:
    """Make an authenticated request, refreshing the token once on 401."""
    global _token
    if not _token:
        _refresh_token()

    with httpx.Client(base_url=BASE_URL, timeout=30) as c:
        r = c.request(method, path, headers=_headers(), **kwargs)
        if r.status_code == 401:
            _refresh_token()
            r = c.request(method, path, headers=_headers(), **kwargs)
        r.raise_for_status()
        return r.json() if r.content else None


def _get(path: str, params: dict | None = None) -> Any:
    return _request("GET", path, params=params)


def _post(path: str, body: dict | list | None = None) -> Any:
    return _request("POST", path, json=body)


def _patch(path: str, body: dict) -> Any:
    return _request("PATCH", path, json=body)


def _delete(path: str) -> None:
    _request("DELETE", path)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@mcp.tool()
def login(email: str, password: str) -> dict:
    """Log in and return an access token + user info.

    Store the returned access_token in the DEBATE_API_TOKEN env var to
    authenticate subsequent calls.
    """
    return _post("/api/auth/login", {"email": email, "password": password})


@mcp.tool()
def register(name: str, email: str, password: str, grade: Optional[str] = None) -> dict:
    """Register a new user account and return an access token + user info."""
    body: dict[str, Any] = {"name": name, "email": email, "password": password}
    if grade:
        body["grade"] = grade
    return _post("/api/auth/register", body)


@mcp.tool()
def get_current_user() -> dict:
    """Return the profile of the currently authenticated user."""
    return _get("/api/auth/me")


# ---------------------------------------------------------------------------
# Members / Users
# ---------------------------------------------------------------------------

@mcp.tool()
def list_members() -> list:
    """Return all registered members."""
    return _get("/api/users")


@mcp.tool()
def get_member(user_id: int) -> dict:
    """Return a single member by ID."""
    return _get(f"/api/users/{user_id}")


@mcp.tool()
def update_my_profile(
    name: Optional[str] = None,
    grade: Optional[str] = None,
    bio: Optional[str] = None,
    phone: Optional[str] = None,
    school: Optional[str] = None,
    proficiency: Optional[str] = None,
) -> dict:
    """Update the current user's own profile.

    proficiency: one of beginner | intermediate | advanced
    """
    body = {k: v for k, v in {
        "name": name,
        "grade": grade,
        "bio": bio,
        "phone": phone,
        "school": school,
        "proficiency": proficiency,
    }.items() if v is not None}
    return _patch("/api/users/me", body)


@mcp.tool()
def update_member_role(user_id: int, role: str) -> dict:
    """Update a member's role (admin only).

    role: one of admin | member
    """
    return _patch(f"/api/users/{user_id}/role", {"role": role})


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

@mcp.tool()
def list_sessions() -> list:
    """Return all debate sessions, newest first."""
    return _get("/api/sessions")


@mcp.tool()
def get_session(session_id: int) -> dict:
    """Return a single session with its participants."""
    return _get(f"/api/sessions/{session_id}")


@mcp.tool()
def create_session(
    title: str,
    format_id: int,
    mode: str,
    topic_id: Optional[int] = None,
    topic_text: Optional[str] = None,
    scheduled_at: Optional[str] = None,
    location: Optional[str] = None,
    participant_ids: Optional[list[int]] = None,
    auto_assign_roles: bool = True,
) -> dict:
    """Create a new debate session (admin only).

    mode: online | offline
    scheduled_at: ISO 8601 datetime string, e.g. "2025-06-01T14:00:00"
    """
    body: dict[str, Any] = {
        "title": title,
        "format_id": format_id,
        "mode": mode,
        "auto_assign_roles": auto_assign_roles,
    }
    if topic_id is not None:
        body["topic_id"] = topic_id
    if topic_text:
        body["topic_text"] = topic_text
    if scheduled_at:
        body["scheduled_at"] = scheduled_at
    if location:
        body["location"] = location
    if participant_ids:
        body["participant_ids"] = participant_ids
    return _post("/api/sessions", body)


@mcp.tool()
def update_session(
    session_id: int,
    title: Optional[str] = None,
    topic_id: Optional[int] = None,
    topic_text: Optional[str] = None,
    scheduled_at: Optional[str] = None,
    location: Optional[str] = None,
    status: Optional[str] = None,
    winner_team: Optional[str] = None,
    result_notes: Optional[str] = None,
    additional_notes: Optional[str] = None,
) -> dict:
    """Update an existing session (admin only).

    status: planned | ongoing | completed | cancelled
    """
    body = {k: v for k, v in {
        "title": title,
        "topic_id": topic_id,
        "topic_text": topic_text,
        "scheduled_at": scheduled_at,
        "location": location,
        "status": status,
        "winner_team": winner_team,
        "result_notes": result_notes,
        "additional_notes": additional_notes,
    }.items() if v is not None}
    return _patch(f"/api/sessions/{session_id}", body)


@mcp.tool()
def delete_session(session_id: int) -> str:
    """Delete a session and its participants (admin only)."""
    _delete(f"/api/sessions/{session_id}")
    return f"Session {session_id} deleted."


@mcp.tool()
def get_session_team_notes(session_id: int) -> list:
    """Return all participant notes for a session."""
    return _get(f"/api/sessions/{session_id}/team-notes")


@mcp.tool()
def get_session_user_note(session_id: int, user_id: int) -> dict:
    """Return the note written by a specific user for a session."""
    return _get(f"/api/sessions/{session_id}/notes/{user_id}")


@mcp.tool()
def notify_session_calendar(session_id: int) -> dict:
    """Send all session participants a Google Calendar notification (admin only)."""
    return _post(f"/api/sessions/{session_id}/notify-calendar")


# ---------------------------------------------------------------------------
# Topics
# ---------------------------------------------------------------------------

@mcp.tool()
def list_topics(
    is_go: Optional[bool] = None,
    proficiency: Optional[str] = None,
    age: Optional[int] = None,
    search: Optional[str] = None,
) -> list:
    """List topics with optional filters.

    proficiency: beginner | intermediate | advanced
    is_go: True to show approved topics only
    """
    params = {k: v for k, v in {
        "is_go": is_go,
        "proficiency": proficiency,
        "age": age,
        "search": search,
    }.items() if v is not None}
    return _get("/api/topics", params)


@mcp.tool()
def get_random_topic(proficiency: Optional[str] = None, age: Optional[int] = None) -> dict:
    """Return a random approved topic, optionally filtered by proficiency/age."""
    params = {k: v for k, v in {"proficiency": proficiency, "age": age}.items() if v is not None}
    return _get("/api/topics/random", params)


@mcp.tool()
def generate_topic() -> dict:
    """Return an AI-generated (mocked) topic suggestion (admin only)."""
    return _get("/api/topics/generate")


@mcp.tool()
def create_topic(
    text: str,
    category: Optional[str] = None,
    is_go: bool = True,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    proficiency: Optional[str] = None,
) -> dict:
    """Create a single topic (admin only)."""
    body: dict[str, Any] = {"text": text, "is_go": is_go}
    if category:
        body["category"] = category
    if min_age is not None:
        body["min_age"] = min_age
    if max_age is not None:
        body["max_age"] = max_age
    if proficiency:
        body["proficiency"] = proficiency
    return _post("/api/topics", body)


@mcp.tool()
def bulk_create_topics(topics: list[dict]) -> list:
    """Create multiple topics in one call (admin only).

    Each item in topics should have: text (required), category, is_go,
    min_age, max_age, proficiency (all optional).
    """
    return _post("/api/topics/bulk", topics)


@mcp.tool()
def update_topic(
    topic_id: int,
    text: Optional[str] = None,
    category: Optional[str] = None,
    is_go: Optional[bool] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    proficiency: Optional[str] = None,
) -> dict:
    """Update a topic (admin only)."""
    body = {k: v for k, v in {
        "text": text,
        "category": category,
        "is_go": is_go,
        "min_age": min_age,
        "max_age": max_age,
        "proficiency": proficiency,
    }.items() if v is not None}
    return _patch(f"/api/topics/{topic_id}", body)


@mcp.tool()
def delete_topic(topic_id: int) -> str:
    """Delete a topic (admin only)."""
    _delete(f"/api/topics/{topic_id}")
    return f"Topic {topic_id} deleted."


# ---------------------------------------------------------------------------
# Formats
# ---------------------------------------------------------------------------

@mcp.tool()
def list_formats() -> list:
    """Return all debate formats."""
    return _get("/api/formats")


@mcp.tool()
def get_format(format_id: int) -> dict:
    """Return a single debate format by ID."""
    return _get(f"/api/formats/{format_id}")


@mcp.tool()
def create_format(
    name: str,
    description: str,
    min_participants: int,
    max_participants: int,
    roles: list,
    speaking_order: list,
    rules_summary: Optional[str] = None,
) -> dict:
    """Create a custom debate format (admin only).

    roles: list of role objects, e.g. [{"name": "Prime Minister", "side": "proposition"}]
    speaking_order: list of role name strings in speaking order
    """
    body: dict[str, Any] = {
        "name": name,
        "description": description,
        "min_participants": min_participants,
        "max_participants": max_participants,
        "roles": roles,
        "speaking_order": speaking_order,
    }
    if rules_summary:
        body["rules_summary"] = rules_summary
    return _post("/api/formats", body)


@mcp.tool()
def toggle_format(format_id: int) -> dict:
    """Toggle a format's active/inactive state (admin only)."""
    return _patch(f"/api/formats/{format_id}/toggle", {})


# ---------------------------------------------------------------------------
# Calendar Events
# ---------------------------------------------------------------------------

@mcp.tool()
def list_events() -> list:
    """Return all calendar events."""
    return _get("/api/events")


@mcp.tool()
def create_event(
    title: str,
    start_time: str,
    end_time: str,
    description: Optional[str] = None,
    location: Optional[str] = None,
    session_id: Optional[int] = None,
) -> dict:
    """Create a calendar event.

    start_time / end_time: ISO 8601 datetime strings
    """
    body: dict[str, Any] = {"title": title, "start_time": start_time, "end_time": end_time}
    if description:
        body["description"] = description
    if location:
        body["location"] = location
    if session_id is not None:
        body["session_id"] = session_id
    return _post("/api/events", body)


@mcp.tool()
def delete_event(event_id: int) -> str:
    """Delete a calendar event."""
    _delete(f"/api/events/{event_id}")
    return f"Event {event_id} deleted."


# ---------------------------------------------------------------------------
# Schools
# ---------------------------------------------------------------------------

@mcp.tool()
def list_schools() -> list:
    """Return all schools."""
    return _get("/api/schools")


@mcp.tool()
def create_school(name: str, location: Optional[str] = None, contact_email: Optional[str] = None) -> dict:
    """Create a school (admin only)."""
    body: dict[str, Any] = {"name": name}
    if location:
        body["location"] = location
    if contact_email:
        body["contact_email"] = contact_email
    return _post("/api/schools", body)


@mcp.tool()
def update_school(
    school_id: int,
    name: Optional[str] = None,
    location: Optional[str] = None,
    contact_email: Optional[str] = None,
) -> dict:
    """Update a school (admin only)."""
    body = {k: v for k, v in {
        "name": name,
        "location": location,
        "contact_email": contact_email,
    }.items() if v is not None}
    return _patch(f"/api/schools/{school_id}", body)


@mcp.tool()
def delete_school(school_id: int) -> str:
    """Delete a school (admin only)."""
    _delete(f"/api/schools/{school_id}")
    return f"School {school_id} deleted."


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

@mcp.tool()
def list_notifications(unread_only: bool = False) -> list:
    """Return notifications for the current user."""
    params = {"unread_only": unread_only} if unread_only else None
    return _get("/api/notifications", params)


@mcp.tool()
def mark_all_notifications_read() -> str:
    """Mark all notifications as read for the current user."""
    _post("/api/notifications/read-all")
    return "All notifications marked as read."


@mcp.tool()
def mark_notification_read(notification_id: int) -> str:
    """Mark a single notification as read."""
    _post(f"/api/notifications/{notification_id}/read")
    return f"Notification {notification_id} marked as read."


@mcp.tool()
def check_notification_reminders() -> str:
    """Trigger reminder checks and send any due notifications."""
    _post("/api/notifications/check-reminders")
    return "Reminder check complete."


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    mcp.run()


if __name__ == "__main__":
    main()
