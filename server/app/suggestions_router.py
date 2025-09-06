from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from .supabase_client import sb
from .models import SuggestionType, SuggestionPriority, SuggestionCreate

router = APIRouter()

# --- Helpers ---
def _get_user_id(auth_header: Optional[str]) -> str:
    """Extract user ID from authorization header"""
    if not auth_header or " " not in auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    return "supabase-user-id"

# --- Models ---
class DismissSuggestionPayload(BaseModel):
    suggestion_id: str
    note: Optional[str] = None

class CreateActionFromSuggestionPayload(BaseModel):
    suggestion_id: str
    action_params: Optional[Dict[str, Any]] = None

# --- Endpoints ---

@router.post("/suggestions/create")
def create_suggestion(suggestion: SuggestionCreate, Authorization: Optional[str] = Header(None)):
    """Create a new suggestion"""
    _ = _get_user_id(Authorization)
    
    suggestion_data = {
        "org_id": suggestion.org_id,
        "type": suggestion.type.value,
        "priority": suggestion.priority.value,
        "title": suggestion.title,
        "description": suggestion.description,
        "suggested_action": suggestion.suggested_action,
        "metadata": suggestion.metadata,
        "status": "active"
    }
    
    res = sb.table("suggestions").insert(suggestion_data).execute()
    return {"success": True, "suggestion_id": res.data[0]["id"], "suggestion": res.data[0]}

@router.get("/suggestions")
def list_suggestions(
    org_id: str,
    status: str = Query("active"),
    priority: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    Authorization: Optional[str] = Header(None),
):
    """List suggestions with filtering and pagination"""
    _ = _get_user_id(Authorization)
    
    query = sb.table("suggestions").select("*").eq("org_id", org_id)
    
    if status != "all":
        query = query.eq("status", status)
    
    if priority:
        query = query.eq("priority", priority)
    
    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    
    return {"suggestions": res.data or [], "count": len(res.data or []), "offset": offset, "limit": limit}

@router.get("/suggestions/{suggestion_id}")
def get_suggestion(suggestion_id: str, Authorization: Optional[str] = Header(None)):
    """Get a specific suggestion by ID"""
    _ = _get_user_id(Authorization)
    
    res = sb.table("suggestions").select("*").eq("id", suggestion_id).single().execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    return {"suggestion": res.data}

@router.post("/suggestions/dismiss")
def dismiss_suggestion(payload: DismissSuggestionPayload, Authorization: Optional[str] = Header(None)):
    """Dismiss a suggestion"""
    user_id = _get_user_id(Authorization)
    
    update_data = {
        "status": "dismissed",
        "dismissed_by": user_id,
        "dismissed_at": datetime.now().isoformat()
    }
    
    if payload.note:
        update_data["dismissal_note"] = payload.note
    
    res = sb.table("suggestions").update(update_data).eq("id", payload.suggestion_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    return {"success": True, "suggestion": res.data[0]}

@router.post("/suggestions/create_action")
def create_action_from_suggestion(payload: CreateActionFromSuggestionPayload, Authorization: Optional[str] = Header(None)):
    """Create an action from a suggestion"""
    user_id = _get_user_id(Authorization)
    
    suggestion_res = sb.table("suggestions").select("*").eq("id", payload.suggestion_id).single().execute()
    
    if not suggestion_res.data:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion = suggestion_res.data
    suggested_action = suggestion.get("suggested_action", {})
    
    action_params = suggested_action.copy()
    if payload.action_params:
        action_params.update(payload.action_params)
    
    action_data = {
        "org_id": suggestion["org_id"],
        "type": action_params.get("type", "update_business_hours"),
        "params": action_params.get("params", {}),
        "status": "pending",
        "description": f"Action created from suggestion: {suggestion['title']}",
        "created_by": user_id,
        "metadata": {
            "source": "suggestion",
            "suggestion_id": payload.suggestion_id
        }
    }
    
    action_res = sb.table("actions").insert(action_data).execute()
    
    sb.table("suggestions").update({
        "status": "actioned",
        "actioned_at": datetime.now().isoformat(),
        "action_id": action_res.data[0]["id"]
    }).eq("id", payload.suggestion_id).execute()
    
    return {
        "success": True,
        "action_id": action_res.data[0]["id"],
        "action": action_res.data[0],
        "suggestion": suggestion
    }

@router.get("/suggestions/stats/{org_id}")
def get_suggestion_stats(org_id: str, Authorization: Optional[str] = Header(None)):
    """Get suggestion statistics for an organization"""
    _ = _get_user_id(Authorization)
    
    stats = {}
    for status in ["active", "dismissed", "actioned"]:
        res = sb.table("suggestions").select("id", count="exact").eq("org_id", org_id).eq("status", status).execute()
        stats[status] = res.count or 0
    
    priority_stats = {}
    for priority in SuggestionPriority:
        res = sb.table("suggestions").select("id", count="exact").eq("org_id", org_id).eq("status", "active").eq("priority", priority.value).execute()
        priority_stats[priority.value] = res.count or 0
    
    recent_res = sb.table("suggestions").select("*").eq("org_id", org_id).order("created_at", desc=True).limit(5).execute()
    
    return {
        "stats": stats,
        "priority_stats": priority_stats,
        "recent_suggestions": recent_res.data or [],
        "total_suggestions": sum(stats.values())
    }


def generate_seasonal_suggestions(org_id: str) -> List[Dict[str, Any]]:
    """Generate seasonal business suggestions"""
    now = datetime.now()
    month = now.month
    
    suggestions = []
    
    if month in [11, 12]:  # November, December
        suggestions.append({
            "type": SuggestionType.SEASONAL_REMINDER.value,
            "priority": SuggestionPriority.MEDIUM.value,
            "title": "Holiday Hours Update",
            "description": "Consider updating your business hours for the holiday season. Many customers will be looking for holiday shopping hours.",
            "suggested_action": {
                "type": "update_business_hours",
                "params": {
                    "hours": {
                        "monday": "09:00-21:00",
                        "tuesday": "09:00-21:00",
                        "wednesday": "09:00-21:00",
                        "thursday": "09:00-21:00",
                        "friday": "09:00-21:00",
                        "saturday": "09:00-20:00",
                        "sunday": "10:00-18:00"
                    },
                    "platforms": ["google_business", "yelp"]
                }
            }
        })
    
    elif month in [6, 7, 8]:  # June, July, August
        suggestions.append({
            "type": SuggestionType.SEASONAL_REMINDER.value,
            "priority": SuggestionPriority.LOW.value,
            "title": "Summer Hours Optimization",
            "description": "Consider extending evening hours during summer months when customers stay out later.",
            "suggested_action": {
                "type": "update_business_hours",
                "params": {
                    "hours": {
                        "monday": "09:00-19:00",
                        "tuesday": "09:00-19:00",
                        "wednesday": "09:00-19:00",
                        "thursday": "09:00-19:00",
                        "friday": "09:00-20:00",
                        "saturday": "09:00-20:00",
                        "sunday": "10:00-18:00"
                    },
                    "platforms": ["google_business", "yelp"]
                }
            }
        })
    
    return suggestions

def generate_engagement_suggestions(org_id: str) -> List[Dict[str, Any]]:
    """Generate suggestions based on mock engagement data"""
    suggestions = []
    
    suggestions.append({
        "type": SuggestionType.ENGAGEMENT_ALERT.value,
        "priority": SuggestionPriority.HIGH.value,
        "title": "Social Media Engagement Drop",
        "description": "Your social media engagement has dropped 25% this week. Consider posting more engaging content or running a promotion.",
        "suggested_action": {
            "type": "draft_social_post",
            "params": {
                "platform": "facebook",
                "content": "🎉 Special offer this week! Come visit us and mention this post for 10% off your order. #specialoffer #community",
                "hashtags": ["specialoffer", "community", "discount"]
            }
        },
        "metadata": {
            "engagement_drop": 0.25,
            "period": "week",
            "platforms": ["facebook", "instagram"]
        }
    })
    
    return suggestions

def create_suggestions_for_org(org_id: str):
    """Create suggestions for an organization"""
    all_suggestions = []
    
    all_suggestions.extend(generate_seasonal_suggestions(org_id))
    all_suggestions.extend(generate_engagement_suggestions(org_id))
    
    for suggestion_data in all_suggestions:
        suggestion_data["org_id"] = org_id
        suggestion_data["status"] = "active"
        
        existing = sb.table("suggestions").select("id").eq("org_id", org_id).eq("title", suggestion_data["title"]).eq("status", "active").execute()
        
        if not existing.data:  # Only create if doesn't exist
            sb.table("suggestions").insert(suggestion_data).execute()
    
    return len(all_suggestions)
