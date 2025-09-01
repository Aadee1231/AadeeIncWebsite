import os
from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from .supabase_client import sb
from .google_calendar import list_free_suggestions, create_booking
from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from .supabase_client import sb
from .google_calendar import find_free_slots, create_booking

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are Aadee Assistant, a helpful agent for Aadee Inc.
Use the company notes when relevant. If asked to book, request an email and a time.
Be concise and friendly."""

def fetch_knowledge() -> str:
    res = sb.table("knowledge_base").select("topic,content").execute()
    rows = res.data or []
    return "\n\n".join([f"[{r['topic']}]\n{r['content']}" for r in rows]) or "No company notes yet."

class ChatMessage(BaseModel):
    session_id: str
    text: str
    email: str | None = None

class BookRequest(BaseModel):
    session_id: str
    start_iso: str
    email: str | None = None

def llm_reply(user_text: str) -> str:
    notes = fetch_knowledge()
    messages: List[ChatCompletionMessageParam] = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\nCompany notes:\n" + notes},
        {"role": "user", "content": user_text},
    ]
    resp = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
    content = resp.choices[0].message.content or ""
    return content.strip() if content else "Sorry—I couldn’t generate a reply."

@router.post("/message")
def handle_message(msg: ChatMessage):
    # ensure session exists
    sb.table("chat_sessions").upsert({"id": msg.session_id, "email": msg.email}).execute()

    # save user message
    sb.table("messages").insert({
        "session_id": msg.session_id, "role": "user", "content": msg.text
    }).execute()

    lower = msg.text.lower()
    if any(k in lower for k in ["book", "schedule", "appointment", "meeting"]):
        times = list_free_suggestions()
        reply = "Here are some times (UTC). Reply with one, plus your email to confirm:\n" + "\n".join(times[:6])
    else:
        reply = llm_reply(msg.text)

    # save assistant reply
    sb.table("messages").insert({
        "session_id": msg.session_id, "role": "assistant", "content": reply
    }).execute()

    return {"reply": reply}

@router.post("/book")
def book(req: BookRequest):
    ev = create_booking(req.start_iso, attendee_email=req.email)
    return ev

class BookRequest(BaseModel):
    session_id: str
    start_iso: str
    email: str | None = None

@router.get("/availability")
def availability(days: int = Query(14, ge=1, le=30)):
    try:
        slots = find_free_slots(days=days)
        return {"slots": slots}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/book")
def book(req: BookRequest):
    if not req.start_iso:
        raise HTTPException(status_code=400, detail="start_iso required")
    ev = create_booking(req.start_iso, attendee_email=req.email)
    # persist for your own analytics
    sb.table("messages").insert({
        "session_id": req.session_id, "role": "assistant",
        "content": f"Booked {req.start_iso} for {req.email}"
    }).execute()
    return ev