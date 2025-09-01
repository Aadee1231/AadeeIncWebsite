import os, datetime as dt
from typing import List, Tuple
from zoneinfo import ZoneInfo
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from .supabase_client import sb

SCOPES = ["https://www.googleapis.com/auth/calendar"]
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID") or "primary"

BUSINESS_TZ = os.getenv("BUSINESS_TZ", "America/New_York")
BUSINESS_START = int(os.getenv("BUSINESS_START_HOUR", "9"))   # 9am
BUSINESS_END   = int(os.getenv("BUSINESS_END_HOUR", "17"))    # 5pm
SLOT_MINUTES   = int(os.getenv("SLOT_MINUTES", "30"))         # 30-min slots

def _creds():
    data = sb.table("google_oauth").select("*").eq("id",1).single().execute().data
    if not data:
        raise RuntimeError("Google OAuth not connected yet")
    return Credentials(
        token=data["access_token"],
        refresh_token=data["refresh_token"],
        token_uri=data["token_uri"],
        client_id=data["client_id"],
        client_secret=data["client_secret"],
        scopes=data.get("scopes") or SCOPES
    )

def _busy_events(service, start_utc: dt.datetime, end_utc: dt.datetime) -> List[Tuple[dt.datetime, dt.datetime]]:
    events = service.events().list(
        calendarId=CALENDAR_ID,
        timeMin=start_utc.isoformat() + "Z",
        timeMax=end_utc.isoformat() + "Z",
        singleEvents=True,
        orderBy="startTime"
    ).execute().get("items", [])
    busy = []
    for e in events:
        s = e["start"].get("dateTime")
        e_ = e["end"].get("dateTime")
        if not s or not e_:
            continue
        sdt = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        edt = dt.datetime.fromisoformat(e_.replace("Z", "+00:00"))
        busy.append((sdt, edt))
    return busy

def _overlaps(a_start: dt.datetime, a_end: dt.datetime, b_start: dt.datetime, b_end: dt.datetime) -> bool:
    return not (a_end <= b_start or b_end <= a_start)

def find_free_slots(days: int = 14, limit: int = 60) -> List[str]:
    """Return ISO times (UTC) for the next days during business hours, excluding busy events."""
    creds = _creds()
    service = build("calendar", "v3", credentials=creds)

    now_utc = dt.datetime.utcnow().replace(second=0, microsecond=0, tzinfo=dt.timezone.utc)
    end_utc = now_utc + dt.timedelta(days=days)

    # Busy windows from calendar
    busy = _busy_events(service, now_utc, end_utc)

    # Generate candidate slots in business timezone, then convert to UTC
    tz = ZoneInfo(BUSINESS_TZ)
    slots = []
    day = now_utc.astimezone(tz).date()
    last_day = (now_utc + dt.timedelta(days=days)).astimezone(tz).date()

    while day <= last_day and len(slots) < limit:
        start_local = dt.datetime.combine(day, dt.time(hour=BUSINESS_START, minute=0, tzinfo=tz))
        end_local   = dt.datetime.combine(day, dt.time(hour=BUSINESS_END,   minute=0, tzinfo=tz))
        cur = start_local
        while cur < end_local and len(slots) < limit:
            cur_end = cur + dt.timedelta(minutes=SLOT_MINUTES)
            cur_utc = cur.astimezone(dt.timezone.utc)
            cur_end_utc = cur_end.astimezone(dt.timezone.utc)
            # filter out slots that overlap any busy window
            conflict = any(_overlaps(cur_utc, cur_end_utc, b0, b1) for (b0, b1) in busy)
            if not conflict and cur_utc > now_utc:
                slots.append(cur_utc.isoformat().replace("+00:00", "Z"))
            cur = cur_end
        day = day + dt.timedelta(days=1)

    return slots

def create_booking(start_iso: str, attendee_email: str | None = None, summary="Aadee Inc – Consult", duration_min=30):
    creds = _creds()
    service = build("calendar","v3",credentials=creds)
    start = dt.datetime.fromisoformat(start_iso.replace("Z","+00:00"))
    end = start + dt.timedelta(minutes=duration_min)
    body = {
        "summary": summary,
        "start": {"dateTime": start.isoformat()},
        "end": {"dateTime": end.isoformat()},
        "attendees": ([{"email": attendee_email}] if attendee_email else []),
    }
    ev = service.events().insert(calendarId=CALENDAR_ID, body=body, sendUpdates="all").execute()
    return {"id": ev.get("id"), "htmlLink": ev.get("htmlLink")}
