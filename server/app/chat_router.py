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
from .models import ChatMessage, ActionType, ActionStatus

router = APIRouter()

# ---------- OpenAI ----------
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are Aadee Assistant, an AI business operations copilot for Aadee Inc.

You help business owners manage their operations through natural conversation. You can:
- Update business hours across platforms (Google Business Profile, Yelp, etc.)
- Draft social media posts
- Manage business listings
- Schedule meetings and appointments
- Answer questions using company knowledge

When users request business operations changes, always create a pending action for human approval.
Keep replies conversational, helpful, and concise.

For business hours, understand formats like:
- "Update Friday to 9-3" 
- "Set Monday through Friday 9am to 5pm"
- "Close on Sundays"
- "Weekend hours 10-4"

Always confirm what you understood and let them know the change is pending approval.
"""

def fetch_knowledge() -> str:
    """Fetch company knowledge base for context"""
    res = sb.table("knowledge_base").select("topic,content").execute()
    rows = res.data or []
    return "\n\n".join([f"[{r['topic']}]\n{r['content']}" for r in rows]) or "No company notes yet."

def llm_reply(user_text: str, org_id: str = "demo-org") -> str:
    """Generate AI response using OpenAI with company context"""
    notes = fetch_knowledge()
    messages: List[ChatCompletionMessageParam] = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\nCompany notes:\n" + notes},
        {"role": "user", "content": user_text},
    ]
    resp = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
    content = resp.choices[0].message.content or ""
    return content.strip() if content else "Sorry—I couldn't generate a reply."

# ---------- Enhanced Business Hours Parser ----------
_DAY_MAP = {
    "mon": "monday", "monday": "monday",
    "tue": "tuesday", "tuesday": "tuesday", 
    "wed": "wednesday", "wednesday": "wednesday",
    "thu": "thursday", "thursday": "thursday",
    "fri": "friday", "friday": "friday",
    "sat": "saturday", "saturday": "saturday",
    "sun": "sunday", "sunday": "sunday",
}

_TIME_PATTERNS = [
    r"(\d{1,2})(?::(\d{2}))?\s*(?:am|a\.m\.)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(?:pm|p\.m\.)?",
    r"(closed|close)",
]

def normalize_time(hour: str, minute: str = "00", is_pm: bool = False) -> str:
    """Convert time to 24-hour format"""
    h = int(hour)
    m = int(minute) if minute else 0
    
    if is_pm and h != 12:
        h += 12
    elif not is_pm and h == 12:
        h = 0
        
    return f"{h:02d}:{m:02d}"

def parse_hours(user_text: str) -> Optional[Dict[str, str]]:
    """
    Enhanced parser for business hours updates.
    Handles formats like:
    - "Friday 9-3" -> {"friday": "09:00-15:00"}
    - "Monday through Friday 9am to 5pm" -> {"monday": "09:00-17:00", ...}
    - "Weekend hours 10-4" -> {"saturday": "10:00-16:00", "sunday": "10:00-16:00"}
    - "Sunday closed" -> {"sunday": "closed"}
    """
    text = user_text.lower().strip()
    hours: Dict[str, str] = {}
    
    if "closed" in text or "close" in text:
        for day_pattern in _DAY_MAP.keys():
            if day_pattern in text:
                hours[_DAY_MAP[day_pattern]] = "closed"
    
    day_range_pattern = r"(monday|mon)\s*(?:through|to|-)\s*(friday|fri)"
    if re.search(day_range_pattern, text):
        weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"]
        time_match = re.search(r"(\d{1,2})\s*(?:am|a\.m\.)?\s*(?:to|-)\s*(\d{1,2})\s*(?:pm|p\.m\.)?", text)
        if time_match:
            start_hour, end_hour = time_match.groups()
            start_time = normalize_time(start_hour)
            end_time = normalize_time(end_hour, is_pm=True)
            time_str = f"{start_time}-{end_time}"
            for day in weekdays:
                hours[day] = time_str
    
    if "weekend" in text:
        weekend_days = ["saturday", "sunday"]
        time_match = re.search(r"(\d{1,2})\s*-\s*(\d{1,2})", text)
        if time_match:
            start_hour, end_hour = time_match.groups()
            start_time = normalize_time(start_hour)
            end_time = normalize_time(end_hour, is_pm=True)
            time_str = f"{start_time}-{end_time}"
            for day in weekend_days:
                hours[day] = time_str
    
    for day_key, day_name in _DAY_MAP.items():
        if day_key in text:
            day_index = text.find(day_key)
            remaining_text = text[day_index:]
            
            if "closed" in remaining_text or "close" in remaining_text:
                hours[day_name] = "closed"
                continue
                
            time_match = re.search(r"(\d{1,2})\s*(?:am|a\.m\.)?\s*-\s*(\d{1,2})\s*(?:pm|p\.m\.)?", remaining_text)
            if time_match:
                start_hour, end_hour = time_match.groups()
                start_time = normalize_time(start_hour)
                end_time = normalize_time(end_hour, is_pm=True)
                hours[day_name] = f"{start_time}-{end_time}"
    
    return hours if hours else None

def create_business_hours_action(org_id: str, session_id: str, hours: Dict[str, str], user_text: str) -> str:
    """Create a pending action for business hours update"""
    description = f"Update business hours: {', '.join([f'{day} {time}' for day, time in hours.items()])}"
    
    action_data = {
        "org_id": org_id,
        "session_id": session_id,
        "type": ActionType.UPDATE_BUSINESS_HOURS.value,
        "status": ActionStatus.PENDING.value,
        "description": description,
        "params": {
            "hours": hours,
            "original_request": user_text,
            "platforms": ["google_business", "yelp"]  # Default platforms to update
        }
    }
    
    result = sb.table("actions").insert(action_data).execute()
    action_id = result.data[0]["id"] if result.data else "unknown"
    
    return f"I've created a pending action to {description.lower()}. This will be sent to your operator dashboard for approval (Action ID: {action_id[:8]})."

def detect_business_intent(user_text: str) -> Optional[str]:
    """Detect if user is requesting a business operation"""
    text = user_text.lower()
    
    hours_keywords = ["hours", "open", "close", "closed", "schedule", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "weekend", "weekday"]
    update_keywords = ["update", "change", "set", "modify", "adjust"]
    
    if any(keyword in text for keyword in hours_keywords) and any(keyword in text for keyword in update_keywords):
        return "business_hours"
    
    social_keywords = ["post", "social", "facebook", "instagram", "twitter", "linkedin"]
    if any(keyword in text for keyword in social_keywords) and any(keyword in text for keyword in ["create", "draft", "write", "publish"]):
        return "social_media"
    
    listing_keywords = ["listing", "profile", "google business", "yelp", "description", "phone", "website"]
    if any(keyword in text for keyword in listing_keywords) and any(keyword in text for keyword in update_keywords):
        return "listing_update"
    
    return None

# ---------- Models ----------
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
    """Enhanced message handler with business operations detection"""
    org_id = msg.org_id or "demo-org"
    
    # Ensure session exists with enhanced data
    sb.table("chat_sessions").upsert({
        "id": msg.session_id,
        "org_id": org_id,
        "agent": msg.agent,
        "last_activity": "now()"
    }).execute()

    # Log user message
    sb.table("messages").insert({
        "session_id": msg.session_id, 
        "role": "user", 
        "content": msg.text,
        "metadata": {"agent": msg.agent, "org_id": org_id}
    }).execute()

    # Only King AI is implemented right now
    if msg.agent != "king_ai":
        reply = "This chat currently supports AadeeChat (King AI) only."
    else:
        intent = detect_business_intent(msg.text)
        
        if intent == "business_hours":
            parsed_hours = parse_hours(msg.text)
            if parsed_hours:
                reply = create_business_hours_action(org_id, msg.session_id, parsed_hours, msg.text)
            else:
                reply = "I understand you want to update business hours, but I couldn't parse the specific times. Could you try a format like 'Update Friday to 9am-3pm' or 'Set weekend hours to 10-4'?"
        
        elif intent == "social_media":
            reply = "I can help you draft social media posts! This feature is coming soon - it will create a pending action for your approval."
        
        elif intent == "listing_update":
            reply = "I can help update your business listings on Google and Yelp! This feature is coming soon - it will create a pending action for your approval."
        
        else:
            # General Q&A using knowledge base
            reply = llm_reply(msg.text, org_id)

    # Log assistant reply
    sb.table("messages").insert({
        "session_id": msg.session_id, 
        "role": "assistant", 
        "content": reply,
        "metadata": {"agent": msg.agent, "org_id": org_id, "intent": intent}
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
