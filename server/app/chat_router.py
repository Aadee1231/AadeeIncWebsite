from fastapi import APIRouter
from pydantic import BaseModel
from .supabase_client import supabase

router = APIRouter()

class ChatMessage(BaseModel):
    session_id: str
    text: str

@router.post("/message")
def handle_message(msg: ChatMessage):
    # 1) Save user message
    supabase.table("messages").insert({
        "session_id": msg.session_id,
        "role": "user",
        "content": msg.text,
    }).execute()

    # 2) Simple reply
    reply = "Hi! I'm Aadee Assistant. I can answer questions or help book a meeting."

    # 3) Save assistant reply
    supabase.table("messages").insert({
        "session_id": msg.session_id,
        "role": "assistant",
        "content": reply,
    }).execute()

    return {"reply": reply}
