# server/app/google_calendar.py
import os, datetime as dt
from typing import List, Tuple
from zoneinfo import ZoneInfo
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from .supabase_client import sb

SCOPES = ["https://www.googleapis.com/auth/calendar"]
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID") or "primary"

# Business-hours knobs (you can move these to env later)
BUSINESS_TZ = os.getenv("BUSINESS_TZ", "America/New_York")
BUSINESS_START = int(os.getenv("BUSINESS_START_HOUR", "9"))   # 9am
BUSINESS_END   = int(os.getenv("BUSINESS_END_HOUR", "17"))    # 5pm
SLOT_MINUTES   = int(os.getenv("SLOT_MINUTES", "30"))         # 30-min slots

def _maybe_creds():
    data = sb.table("google_oauth").select("*").eq("id",1).single().execute().data
    if not data:
        return None
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

def _generate_business_slots(days: int, limit: int) -> List[str]:
    """Generate candidate slots in your business TZ, return as ISO UTC Z strings."""
    now_utc = dt.datetime.utcnow().replace(second=0, microsecond=0, tzinfo=dt.timezone.utc)
    tz = ZoneInfo(BUSINESS_TZ)
    slots: List[str] = []
    current_day = now_utc.astimezone(tz).date()
    last_day = (now_utc + dt.timedelta(days=days)).astimezone(tz).date()
    while current_day <= last_day and len(slots) < limit:
        start_local = dt.datetime.combine(current_day, dt.time(hour=BUSINESS_START, minute=0, tzinfo=tz))
        end_local   = dt.datetime.combine(current_day, dt.time(hour=BUSINESS_END,   minute=0, tzinfo=tz))
        cur = start_local
        while cur < end_local and len(slots) < limit:
            cur_utc = cur.astimezone(dt.timezone.utc)
            if cur_utc > now_utc:
                slots.append(cur_utc.isoformat().replace("+00:00", "Z"))
            cur += dt.timedelta(minutes=SLOT_MINUTES)
        current_day += dt.timedelta(days=1)
    return slots

def find_free_slots(days: int = 14, limit: int = 60) -> List[str]:
    """
    Try real Calendar availability; if none or Calendar not yet connected,
    fall back to business-hours slots so we never return an empty list.
    """
    now_utc = dt.datetime.utcnow().replace(second=0, microsecond=0, tzinfo=dt.timezone.utc)
    end_utc = now_utc + dt.timedelta(days=days)

    creds = _maybe_creds()
    if creds:
        try:
            service = build("calendar", "v3", credentials=creds)
            busy = _busy_events(service, now_utc, end_utc)

            # Start from business-hours candidates then filter out conflicts
            candidates = _generate_business_slots(days, limit * 2)  # generate extra, filter down
            filtered: List[str] = []
            for iso in candidates:
                if len(filtered) >= limit:
                    break
                s = dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
                e = s + dt.timedelta(minutes=SLOT_MINUTES)
                conflict = any(_overlaps(s, e, b0, b1) for (b0, b1) in busy)
                if not conflict:
                    filtered.append(iso)
            if filtered:
                return filtered
        except Exception:
            # If Google call fails, we’ll fall back below
            pass

    # Fallback: simple business-hours list (never empty)
    return _generate_business_slots(days, limit)

def create_booking(start_iso: str, attendee_email: str | None = None, summary="Aadee Inc – Consult", duration_min=30):
    creds = _maybe_creds()
    if not creds:
        raise RuntimeError("Google Calendar is not connected yet (run /api/oauth/start).")
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
