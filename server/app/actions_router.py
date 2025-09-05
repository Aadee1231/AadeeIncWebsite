# server/app/actions_router.py
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional
from .supabase_client import sb

router = APIRouter()

# --- Helpers ---
def _get_user_id(auth_header: Optional[str]) -> str:
    # In production, verify the Supabase JWT. For now, accept "Bearer <token>" and assume user exists.
    if not auth_header or " " not in auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    # TODO: verify token against Supabase, decode claims, etc.
    # Return a fake placeholder so we can test flows:
    return "supabase-user-id"

# --- Models ---
class UpdateHoursPayload(BaseModel):
    org_id: str
    hours: dict  # {"mon":"9-5", ...}

class ApprovePayload(BaseModel):
    action_id: str
    approve: bool
    note: Optional[str] = None

# --- Endpoints ---

@router.post("/actions/update_business_hours")
def draft_update_business_hours(p: UpdateHoursPayload, Authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(Authorization)
    row = {
        "org_id": p.org_id,
        "type": "update_business_hours",
        "params": p.hours,
        "status": "pending",
        "created_by": user_id,
    }
    res = sb.table("actions").insert(row).execute()
    return {"ok": True, "action_id": res.data[0]["id"]}

@router.get("/actions")
def list_actions(
    org_id: str,
    status: str = Query("pending"),
    Authorization: Optional[str] = Header(None),
):
    _ = _get_user_id(Authorization)
    q = sb.table("actions").select("*").eq("org_id", org_id).eq("status", status)
    res = q.execute()
    return {"actions": res.data or []}

@router.post("/actions/approve")
def approve_action(p: ApprovePayload, Authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(Authorization)

    # set approved or cancelled
    if p.approve:
        res = sb.table("actions").update({
            "status": "approved",
            "approved_by": user_id,
            "approved_at": "now()"
        }).eq("id", p.action_id).execute()
        # In the next step, a Modal worker would pick this up and execute
    else:
        res = sb.table("actions").update({"status": "cancelled"}).eq("id", p.action_id).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Action not found")
    return {"ok": True, "action": res.data[0]}
