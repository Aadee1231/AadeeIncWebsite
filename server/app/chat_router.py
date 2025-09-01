import os
from fastapi import APIRouter
from pydantic import BaseModel
from .supabase_client import sb
from .google_calendar import list_free_suggestions, create_booking
from openai import OpenAI

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------- Models ----------
class ChatMessage(BaseModel):
    session_id: str
    text: str
    email: str | None = None  # capture if provided

class BookRequest(BaseModel):
    session_id: str
    start_iso: str
    email: str | None = None

# ---------- Helpers ----------
SYSTEM_PROMPT = """You are Aadee Assistant, a helpful agent for Aadee Inc.
Answer precisely using the provided company notes when relevant.
If user wants to book, ask for their email and suggest available times.
Be concise and friendly."""

def fetch_knowledge():
    rows = sb.table("knowledge_base").select("topic,content").execute().data or []
    joined = "\n\n".join([f"[{r['topic']}]\n{r['content']}" for r in rows])
    return joined or "No company notes yet."

def llm_reply(user_text: str) -> str:
    notes = fetch_knowledge()
    msg = [
        {"role":"system", "content": SYSTEM_PROMPT + "\n\nCompany notes:\n" + notes},
        {"role":"user", "content": user_text}
    ]
    res = client.chat.completions.create(model="gpt-4o-mini", messages=msg)
    return res.choices[0].message.content.strip()

# ---------- Routes ----------
@router.post("/message")
def handle_message(msg: ChatMessage):
    # create session if not exists
    sb.table("chat_sessions").upsert({"id": msg.session_id, "email": msg.email}).execute()

    # save user
    sb.table("messages").insert({
        "session_id": msg.session_id, "role": "user", "content": msg.text
    }).execute()

    text_lower = msg.text.lower()
    if any(k in text_lower for k in ["book","schedule","appointment","meeting"]):
        times = list_free_suggestions()
        reply = "Here are some times (UTC). Reply with one, and your email to confirm:\n" + "\n".join(times[:6])
    else:
        reply = llm_reply(msg.text)

    # save assistant
    sb.table("messages").insert({
        "session_id": msg.session_id, "role": "assistant", "content": reply
    }).execute()
    return {"reply": reply}

@router.post("/book")
def book(req: BookRequest):
    ev = create_booking(req.start_iso, attendee_email=req.email)
    return ev
