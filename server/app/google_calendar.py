import os
import datetime as dt
from typing import List, Tuple
from uuid import uuid4
from zoneinfo import ZoneInfo
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from .supabase_client import sb


SCOPES = ["https://www.googleapis.com/auth/calendar"]
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID") or "primary"

# Business-hours knobs (you can override with env)
BUSINESS_TZ = os.getenv("BUSINESS_TZ", "America/New_York")
BUSINESS_START = int(os.getenv("BUSINESS_START_HOUR", "9"))
BUSINESS_END   = int(os.getenv("BUSINESS_END_HOUR", "17"))
SLOT_MINUTES   = int(os.getenv("SLOT_MINUTES", "30"))

def _maybe_creds():
    row = sb.table("google_oauth").select("*").eq("id", 1).single().execute().data
    if not row:
        return None
    return Credentials(
        token=row["access_token"],
        refresh_token=row["refresh_token"],
        token_uri=row["token_uri"],
        client_id=row["client_id"],
        client_secret=row["client_secret"],
        scopes=row.get("scopes") or SCOPES,
    )

def _busy_events(service, start_utc: dt.datetime, end_utc: dt.datetime) -> List[Tuple[dt.datetime, dt.datetime]]:
    items = service.events().list(
        calendarId=CALENDAR_ID,
        timeMin=start_utc.isoformat().replace("+00:00", "Z"),
        timeMax=end_utc.isoformat().replace("+00:00", "Z"),
        singleEvents=True,
        orderBy="startTime",
    ).execute().get("items", [])
    busy = []
    for e in items:
        s = e["start"].get("dateTime")
        t = e["end"].get("dateTime")
        if not s or not t:
            continue
        sdt = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        edt = dt.datetime.fromisoformat(t.replace("Z", "+00:00"))
        busy.append((sdt, edt))
    return busy

def _overlaps(a0: dt.datetime, a1: dt.datetime, b0: dt.datetime, b1: dt.datetime) -> bool:
    return not (a1 <= b0 or b1 <= a0)

def _generate_business_slots(days: int, limit: int) -> List[str]:
    """Generate slots in business TZ; return as UTC ISO Z."""
    now_utc = dt.datetime.utcnow().replace(second=0, microsecond=0, tzinfo=dt.timezone.utc)
    tz = ZoneInfo(BUSINESS_TZ)
    out: List[str] = []
    d = now_utc.astimezone(tz).date()
    last = (now_utc + dt.timedelta(days=days)).astimezone(tz).date()
    while d <= last and len(out) < limit:
        start_local = dt.datetime.combine(d, dt.time(BUSINESS_START, 0, tzinfo=tz))
        end_local   = dt.datetime.combine(d, dt.time(BUSINESS_END,   0, tzinfo=tz))
        cur = start_local
        while cur < end_local and len(out) < limit:
            cur_utc = cur.astimezone(dt.timezone.utc)
            if cur_utc > now_utc:
                out.append(cur_utc.isoformat().replace("+00:00", "Z"))
            cur += dt.timedelta(minutes=SLOT_MINUTES)
        d += dt.timedelta(days=1)
    return out

def find_free_slots(days: int = 14, limit: int = 60) -> List[str]:
    """
    If Google is connected, return business-hour slots FILTERED by real busy events.
    If Google is NOT connected, return business-hour candidates (best-effort fallback).
    """
    now_utc = dt.datetime.utcnow().replace(second=0, microsecond=0, tzinfo=dt.timezone.utc)
    end_utc = now_utc + dt.timedelta(days=days)

    slots = _generate_business_slots(days, limit * 3)  # generate extra, filter down
    creds = _maybe_creds()
    if not creds:
        # Fallback: no busy info → just candidates (UI still ok; booking will fail until OAuth done)
        return slots[:limit]

    service = build("calendar", "v3", credentials=creds)
    busy = _busy_events(service, now_utc, end_utc)
    free: List[str] = []
    for iso in slots:
        if len(free) >= limit:
            break
        s = dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
        e = s + dt.timedelta(minutes=SLOT_MINUTES)
        if any(_overlaps(s, e, b0, b1) for (b0, b1) in busy):
            continue
        free.append(iso)
    return free

def create_booking(
    start_iso: str,
    attendee_email: str,
    duration_min: int = 30,
    name: str | None = None,
    phone: str | None = None,
    purpose: str | None = None,
    summary: str | None = None,
) -> dict:
    """
    Create a Google Calendar event at start_iso (UTC ISO string).
    Adds attendee, Meet link, and an info-rich description.
    """
    creds = _maybe_creds()
    if not creds:
        raise RuntimeError("Google Calendar is not connected yet (visit /api/oauth/start).")

    service = build("calendar", "v3", credentials=creds)

    # Parse start in UTC; end = start + duration
    start = dt.datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
    end = start + dt.timedelta(minutes=duration_min)

    # Build a concise description with only provided fields
    desc_lines = []
    if purpose:
        desc_lines.append(f"Purpose: {purpose}")
    if name:
        desc_lines.append(f"Name: {name}")
    if phone:
        desc_lines.append(f"Phone: {phone}")
    description = "\n".join(desc_lines)

    # Nice default title if none provided
    event_summary = summary or f"Aadee Inc - Meeting with {name or attendee_email}"

    body = {
        "summary": event_summary,
        "description": description,
        "start": {"dateTime": start.isoformat()},  # already has +00:00
        "end":   {"dateTime": end.isoformat()},
        "attendees": [{"email": attendee_email}],
        # Create a Google Meet link
        "conferenceData": {
            "createRequest": {
                "requestId": f"aadee-{uuid4()}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }

    ev = service.events().insert(
        calendarId=CALENDAR_ID,
        body=body,
        sendUpdates="all",
        conferenceDataVersion=1,
    ).execute()

    return {"id": ev.get("id"), "htmlLink": ev.get("htmlLink")}
