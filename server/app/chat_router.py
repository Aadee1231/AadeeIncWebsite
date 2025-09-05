# server/app/chat_router.py
import os
import re
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam
from .supabase_client import sb
from .google_calendar import find_free_slots, create_booking

router = APIRouter()

# ---------- OpenAI ----------
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are Aadee Assistant for Aadee Inc.
Answer questions using the company notes below when relevant.
When the user mentions scheduling, be encouraging and concise, e.g.:
"Absolutely, I'm showing availability. Choose a time that works for you."
Keep replies short and friendly.
"""

def fetch_knowledge() -> str:
    res = sb.table("knowledge_base").select("topic,content").execute()
    rows = res.data or []
    return "\n\n".join([f"[{r['topic']}]\n{r['content']}" for r in rows]) or "No company notes yet."

def llm_reply(user_text: str) -> str:
    notes = fetch_knowledge()
    messages: List[ChatCompletionMessageParam] = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\nCompany notes:\n" + notes},
        {"role": "user", "content": user_text},
    ]
    resp = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
    content = resp.choices[0].message.content or ""
    return content.strip() if content else "Sorry—I couldn’t generate a reply."

# ---------- Models ----------
class ChatMessage(BaseModel):
    session_id: str
    text: str
    agent: str = "king_ai"              # which agent is handling this chat
    org_id: Optional[str] = "demo-org"  # simple default for now

class BookRequest(BaseModel):
    session_id: str
    start_iso: str
    email: str
    name: str | None = None
    phone: str | None = None
    purpose: str | None = None

# ---------- Helpers ----------
_DAY_MAP = {
    "mon": "mon", "monday": "mon",
    "tue": "tue", "tuesday": "tue",
    "wed": "wed", "wednesday": "wed",
    "thu": "thu", "thursday": "thu",
    "fri": "fri", "friday": "fri",
    "sat": "sat", "saturday": "sat",
    "sun": "sun", "sunday": "sun",
}

def parse_hours(user_text: str) -> Optional[Dict[str, str]]:
    """
    Improved parser for business-hours updates.
    Accepts things like:
      - "fri 9-3"
      - "friday to 9-3"
      - "sunday closed"
      - "mon-fri 9-5" (will just catch individual days if listed)
    """
    t = user_text.lower()
    hours: Dict[str, str] = {}

    # matches "friday to 9-3", "fri 9-3", "sun closed"
    pattern = r"(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(?:to|:)?\s*(closed|\d{1,2}\s*-\s*\d{1,2})"

    for m in re.finditer(pattern, t):
        day_raw, val_raw = m.group(1), m.group(2)
        day = _DAY_MAP.get(day_raw, day_raw)
        val = val_raw.replace(" ", "")
        hours[day] = val

    return hours or None

def draft_hours_action(org_id: str, session_id: str, hours: Dict[str, str]) -> None:
    sb.table("actions").insert({
        "org_id": org_id,
        "session_id": session_id,
        "type": "update_business_hours",
        "params": hours,
        "status": "pending",
    }).execute()

# ---------- Routes ----------
@router.post("/message")
def handle_message(msg: ChatMessage):
    # Ensure session exists
    sb.table("chat_sessions").upsert({"id": msg.session_id}).execute()

    # Log user message
    sb.table("messages").insert({
        "session_id": msg.session_id, "role": "user", "content": msg.text
    }).execute()

    # Only King AI is implemented right now
    if msg.agent != "king_ai":
        reply = "This chat currently supports AadeeChat (King AI) only."
    else:
        # 1) Try to interpret as a business-hours update
        maybe_hours = parse_hours(msg.text)
        if maybe_hours:
            draft_hours_action(org_id=msg.org_id or "demo-org", session_id=msg.session_id, hours=maybe_hours)
            reply = (
                "I drafted an hours update with these values: "
                f"{maybe_hours}. It’s now awaiting approval in the Operator Dashboard."
            )
        else:
            # 2) Otherwise, general Q&A using your knowledge base
            reply = llm_reply(msg.text)

    # Log assistant reply
    sb.table("messages").insert({
        "session_id": msg.session_id, "role": "assistant", "content": reply
    }).execute()

    return {"reply": reply}

@router.get("/availability")
def availability(days: int = Query(14, ge=1, le=30)):
    """Return available ISO start times and grouped-by-day for clean UI."""
    try:
        slots = find_free_slots(days=days)
        grouped: Dict[str, List[str]] = {}
        for iso in slots:
            day = iso[:10]  # YYYY-MM-DD
            grouped.setdefault(day, []).append(iso)
        return {"slots": slots, "grouped": grouped}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/book")
def book(req: BookRequest):
    if not req.start_iso or not req.email:
        raise HTTPException(status_code=400, detail="start_iso and email required")

    ev = create_booking(
        start_iso=req.start_iso,
        attendee_email=req.email,
        name=req.name,
        phone=req.phone,
        purpose=req.purpose,
        duration_min=30,
    )

    # (optional) log to messages or a bookings table
    sb.table("messages").insert({
        "session_id": req.session_id,
        "role": "assistant",
        "content": f"Booked {req.start_iso} for {req.email} (purpose: {req.purpose or 'n/a'})"
    }).execute()

    return ev
