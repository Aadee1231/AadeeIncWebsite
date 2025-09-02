# server/app/chat_router.py
import os
from typing import List, Dict
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

class BookRequest(BaseModel):
    session_id: str
    start_iso: str
    email: str
    name: str | None = None
    phone: str | None = None
    purpose: str | None = None

# ---------- Routes ----------
@router.post("/message")
def handle_message(msg: ChatMessage):
    # Create session row if needed
    sb.table("chat_sessions").upsert({"id": msg.session_id}).execute()

    # Log user message
    sb.table("messages").insert({
        "session_id": msg.session_id, "role": "user", "content": msg.text
    }).execute()

    # Q&A / FAQ
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

    # Put context into the calendar description
    desc_lines = []
    if req.purpose: desc_lines.append(f"Purpose: {req.purpose}")
    if req.name:    desc_lines.append(f"Name: {req.name}")
    if req.phone:   desc_lines.append(f"Phone: {req.phone}")
    description = "\n".join(desc_lines)

    ev = create_booking(
        start_iso=req.start_iso,
        attendee_email=req.email,
        summary="Aadee Inc – Meeting",
        duration_min=30,
        description=description or None,
    )

    # Log the booking
    sb.table("messages").insert({
        "session_id": req.session_id,
        "role": "assistant",
        "content": f"Booked {req.start_iso} for {req.email} ({req.purpose or 'n/a'})"
    }).execute()

    return ev
