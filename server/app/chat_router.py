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

# ----- OpenAI -----
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are Aadee Assistant, a helpful agent for Aadee Inc.
Use the company notes when relevant. If the user needs to schedule, suggest clicking the Schedule button.
Be concise and friendly.
"""

def fetch_knowledge() -> str:
    """Fetch short company notes/FAQ from Supabase."""
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

# ----- Models -----
class ChatMessage(BaseModel):
    session_id: str
    text: str

class BookRequest(BaseModel):
    session_id: str
    start_iso: str
    email: str | None = None

# ----- Routes -----
@router.post("/message")
def handle_message(msg: ChatMessage):
    # ensure session row exists
    sb.table("chat_sessions").upsert({"id": msg.session_id}).execute()

    # save user message
    sb.table("messages").insert({
        "session_id": msg.session_id, "role": "user", "content": msg.text
    }).execute()

    # FAQ / general Q&A via OpenAI + knowledge base
    reply = llm_reply(msg.text)

    # save assistant reply
    sb.table("messages").insert({
        "session_id": msg.session_id, "role": "assistant", "content": reply
    }).execute()

    return {"reply": reply}

@router.get("/availability")
def availability(days: int = Query(14, ge=1, le=30)):
    """
    Return available start times (ISO strings) and also grouped-by-day
    for easy UI rendering. Backend falls back to business-hours slots
    if Calendar is empty/unreachable.
    """
    try:
        slots = find_free_slots(days=days)
        grouped: Dict[str, List[str]] = {}
        for iso in slots:
            day = iso[:10]
            grouped.setdefault(day, []).append(iso)
        return {"slots": slots, "grouped": grouped}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/book")
def book(req: BookRequest):
    if not req.start_iso:
        raise HTTPException(status_code=400, detail="start_iso required")

    ev = create_booking(req.start_iso, attendee_email=req.email)

    # log booking as a message (handy for analytics/history)
    sb.table("messages").insert({
        "session_id": req.session_id,
        "role": "assistant",
        "content": f"Booked {req.start_iso} for {req.email}",
    }).execute()

    return ev
