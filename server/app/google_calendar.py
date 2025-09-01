import os, datetime as dt
from typing import List
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from .supabase_client import sb

SCOPES = ["https://www.googleapis.com/auth/calendar"]
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID") or "primary"

def _creds():
    data = sb.table("google_oauth").select("*").eq("id",1).single().execute().data
    if not data: raise RuntimeError("Google OAuth not connected yet")
    return Credentials(
        token=data["access_token"],
        refresh_token=data["refresh_token"],
        token_uri=data["token_uri"],
        client_id=data["client_id"],
        client_secret=data["client_secret"],
        scopes=data.get("scopes") or SCOPES
    )

def list_free_suggestions(hours_ahead:int=72) -> List[str]:
    # demo: return every 3 hours as a suggestion
    now = dt.datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    return [(now + dt.timedelta(hours=h)).isoformat() + "Z" for h in range(3, hours_ahead, 3)]

def create_booking(start_iso: str, attendee_email: str|None=None, summary="Aadee Inc – Consult", duration_min=30):
    creds = _creds()
    service = build("calendar","v3",credentials=creds)
    start = dt.datetime.fromisoformat(start_iso.replace("Z","+00:00"))
    end = start + dt.timedelta(minutes=duration_min)
    body = {
        "summary": summary,
        "start": {"dateTime": start.isoformat()},
        "end": {"dateTime": end.isoformat()},
        "attendees": [{"email": attendee_email} ] if attendee_email else [],
    }
    ev = service.events().insert(calendarId=CALENDAR_ID, body=body, sendUpdates="all").execute()
    return {"id": ev.get("id"), "htmlLink": ev.get("htmlLink")}
