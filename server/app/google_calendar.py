import os, datetime as dt
from typing import List
from supabase import Client
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from .supabase_client import sb


SCOPES = ["https://www.googleapis.com/auth/calendar"]
CALENDAR_ID = os.environ.get("GOOGLE_CALENDAR_ID") # the calendar to book into


async def _creds_from_db() -> Credentials:
rec = sb.table("google_oauth").select("access_token,refresh_token,token_uri,client_id,client_secret,scopes").single().execute()
data = rec.data
return Credentials(
token=data["access_token"],
refresh_token=data["refresh_token"],
token_uri=data["token_uri"],
client_id=data["client_id"],
client_secret=data["client_secret"],
scopes=data.get("scopes", [*SCOPES])
)


async def find_availability(days_ahead: int = 14) -> List[str]:
creds = await _creds_from_db()
service = build("calendar", "v3", credentials=creds)
now = dt.datetime.utcnow()
end = now + dt.timedelta(days=days_ahead)
events = service.events().list(calendarId=CALENDAR_ID, timeMin=now.isoformat()+"Z", timeMax=end.isoformat()+"Z").execute()
busy_windows = [(e['start'].get('dateTime'), e['end'].get('dateTime')) for e in events.get('items', [])]
# TODO: compute free slots based on your business hours
# For demo, just return some placeholders derived from today
suggestions = [(now + dt.timedelta(hours=h)).isoformat() for h in range(24) if h % 3 == 0]
return suggestions


async def create_booking(start_iso: str, duration_min: int = 30) -> dict:
creds = await _creds_from_db()
service = build("calendar", "v3", credentials=creds)
start = dt.datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
end = start + dt.timedelta(minutes=duration_min)
body = {
"summary": "Aadee Inc – Discovery Call",
"start": {"dateTime": start.isoformat()},
"end": {"dateTime": end.isoformat()},
}
ev = service.events().insert(calendarId=CALENDAR_ID, body=body).execute()
return {"id": ev.get("id"), "htmlLink": ev.get("htmlLink")}