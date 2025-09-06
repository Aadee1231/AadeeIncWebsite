# server/app/actions_router.py
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from .supabase_client import sb
from .models import ActionType, ActionStatus, ActionCreate, ActionApproval

router = APIRouter()

# --- Helpers ---
def _get_user_id(auth_header: Optional[str]) -> str:
    """Extract user ID from authorization header"""
    # In production, verify the Supabase JWT. For now, accept "Bearer <token>" and assume user exists.
    if not auth_header or " " not in auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    # TODO: verify token against Supabase, decode claims, etc.
    # Return a fake placeholder so we can test flows:
    return "supabase-user-id"

class UpdateHoursPayload(BaseModel):
    org_id: str
    hours: dict  # {"mon":"9-5", ...}

class ApprovePayload(BaseModel):
    action_id: str
    approve: bool
    note: Optional[str] = None

# --- Enhanced Models ---
class CreateSocialPostPayload(BaseModel):
    org_id: str
    platform: str  # "facebook", "instagram", "twitter"
    content: str
    media_urls: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    scheduled_time: Optional[str] = None  # ISO format

class UpdateListingPayload(BaseModel):
    org_id: str
    platform: str  # "google_business", "yelp"
    info: Dict[str, Any]  # Business information to update

# --- Endpoints ---

@router.post("/actions/create")
def create_action(action: ActionCreate, Authorization: Optional[str] = Header(None)):
    """Create a new pending action"""
    user_id = _get_user_id(Authorization)
    
    action_data = {
        "org_id": action.org_id,
        "type": action.type.value,
        "params": action.params,
        "status": ActionStatus.PENDING.value,
        "description": action.description,
        "session_id": action.session_id,
        "created_by": user_id,
    }
    
    res = sb.table("actions").insert(action_data).execute()
    return {"success": True, "action_id": res.data[0]["id"], "action": res.data[0]}

@router.post("/actions/update_business_hours")
def draft_update_business_hours(p: UpdateHoursPayload, Authorization: Optional[str] = Header(None)):
    """Legacy endpoint for business hours updates"""
    user_id = _get_user_id(Authorization)
    
    description = f"Update business hours: {', '.join([f'{day} {time}' for day, time in p.hours.items()])}"
    
    action_data = {
        "org_id": p.org_id,
        "type": ActionType.UPDATE_BUSINESS_HOURS.value,
        "params": {
            "hours": p.hours,
            "platforms": ["google_business", "yelp"]
        },
        "status": ActionStatus.PENDING.value,
        "description": description,
        "created_by": user_id,
    }
    
    res = sb.table("actions").insert(action_data).execute()
    return {"ok": True, "action_id": res.data[0]["id"]}

@router.post("/actions/social_post")
def create_social_post_action(p: CreateSocialPostPayload, Authorization: Optional[str] = Header(None)):
    """Create a social media post action"""
    user_id = _get_user_id(Authorization)
    
    description = f"Create {p.platform} post: {p.content[:50]}{'...' if len(p.content) > 50 else ''}"
    
    action_data = {
        "org_id": p.org_id,
        "type": ActionType.DRAFT_SOCIAL_POST.value,
        "params": {
            "platform": p.platform,
            "content": p.content,
            "media_urls": p.media_urls or [],
            "hashtags": p.hashtags or [],
            "scheduled_time": p.scheduled_time
        },
        "status": ActionStatus.PENDING.value,
        "description": description,
        "created_by": user_id,
    }
    
    res = sb.table("actions").insert(action_data).execute()
    return {"success": True, "action_id": res.data[0]["id"], "action": res.data[0]}

@router.post("/actions/update_listing")
def create_listing_update_action(p: UpdateListingPayload, Authorization: Optional[str] = Header(None)):
    """Create a business listing update action"""
    user_id = _get_user_id(Authorization)
    
    description = f"Update {p.platform} listing: {', '.join(p.info.keys())}"
    
    action_type = ActionType.UPDATE_GOOGLE_BUSINESS_PROFILE if p.platform == "google_business" else ActionType.UPDATE_YELP_LISTING
    
    action_data = {
        "org_id": p.org_id,
        "type": action_type.value,
        "params": {
            "platform": p.platform,
            "info": p.info
        },
        "status": ActionStatus.PENDING.value,
        "description": description,
        "created_by": user_id,
    }
    
    res = sb.table("actions").insert(action_data).execute()
    return {"success": True, "action_id": res.data[0]["id"], "action": res.data[0]}

@router.get("/actions")
def list_actions(
    org_id: str,
    status: str = Query("pending"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    Authorization: Optional[str] = Header(None),
):
    """List actions with pagination"""
    _ = _get_user_id(Authorization)
    
    query = sb.table("actions").select("*").eq("org_id", org_id)
    
    if status != "all":
        query = query.eq("status", status)
    
    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    
    return {"actions": res.data or [], "count": len(res.data or []), "offset": offset, "limit": limit}

@router.get("/actions/{action_id}")
def get_action(action_id: str, Authorization: Optional[str] = Header(None)):
    """Get a specific action by ID"""
    _ = _get_user_id(Authorization)
    
    res = sb.table("actions").select("*").eq("id", action_id).single().execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Action not found")
    
    return {"action": res.data}

@router.post("/actions/approve")
def approve_action(p: ApprovePayload, Authorization: Optional[str] = Header(None)):
    """Approve or reject an action"""
    user_id = _get_user_id(Authorization)

    if p.approve:
        update_data = {
            "status": ActionStatus.APPROVED.value,
            "approved_by": user_id,
            "approved_at": datetime.now().isoformat()
        }
        if p.note:
            update_data["approval_note"] = p.note
    else:
        update_data = {
            "status": ActionStatus.REJECTED.value,
            "approved_by": user_id,
            "approved_at": datetime.now().isoformat()
        }
        if p.note:
            update_data["rejection_note"] = p.note

    res = sb.table("actions").update(update_data).eq("id", p.action_id).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Action not found")
    
    return {"success": True, "action": res.data[0]}

@router.post("/actions/{action_id}/execute")
def execute_action_manually(action_id: str, Authorization: Optional[str] = Header(None)):
    """Manually trigger execution of an approved action"""
    _ = _get_user_id(Authorization)
    
    res = sb.table("actions").select("*").eq("id", action_id).single().execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Action not found")
    
    action = res.data
    if action["status"] != ActionStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Action must be approved before execution")
    
    return {
        "success": True, 
        "message": f"Action {action_id} queued for execution",
        "action": action
    }

@router.get("/actions/stats/{org_id}")
def get_action_stats(org_id: str, Authorization: Optional[str] = Header(None)):
    """Get action statistics for an organization"""
    _ = _get_user_id(Authorization)
    
    stats = {}
    for status in ActionStatus:
        res = sb.table("actions").select("id", count="exact").eq("org_id", org_id).eq("status", status.value).execute()
        stats[status.value] = res.count or 0
    
    recent_res = sb.table("actions").select("*").eq("org_id", org_id).order("created_at", desc=True).limit(5).execute()
    
    return {
        "stats": stats,
        "recent_actions": recent_res.data or [],
        "total_actions": sum(stats.values())
    }
