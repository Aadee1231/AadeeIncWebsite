# backend/actions_router.py
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid

# -----------------
# Simple Auth (demo)
# -----------------
auth_router = APIRouter()
TOKENS: Dict[str, dict] = {}  # in-memory demo storage

class LoginBody(BaseModel):
    username: str
    password: str

@auth_router.post("/login")
def login(body: LoginBody):
    # Demo: accept any username/password, issue fake token.
    token = f"demo-{uuid.uuid4()}"
    TOKENS[token] = {"sub": body.username}
    return {"access_token": token, "token_type": "bearer", "user": {"username": body.username}}

def require_auth(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = authorization.split(" ", 1)[1]
    if token not in TOKENS:
        raise HTTPException(401, "Invalid token")
    return TOKENS[token]

@auth_router.get("/me")
def me(user=Depends(require_auth)):
    return {"user": user}

# ----------------------
# Actions Router (stubs)
# ----------------------
router = APIRouter()

# ---- King AI: Listings / Hours ----
class UpdateHoursBody(BaseModel):
    business_name: str
    date: Optional[str] = None     # e.g., "2025-09-14" (for special closure)
    weekday: Optional[str] = None  # e.g., "sunday"
    closed: bool = True
    providers: List[str] = Field(default_factory=lambda: ["google", "yelp"])

@router.post("/listings/update-hours")
def update_hours(body: UpdateHoursBody, user=Depends(require_auth)):
    """
    STUB: In Part 2 we'll call Google Business Profile API etc.
    For now we just echo a plan based on request.
    """
    plan = []
    for p in body.providers:
        if p.lower() == "google":
            plan.append("Would call Google Business Profile API to set hours/holiday hours.")
        elif p.lower() == "yelp":
            plan.append("Yelp write access is limited; would use partner/business APIs if available.")
        else:
            plan.append(f"Provider '{p}' not recognized (stub).")
    return {
        "ok": True,
        "action": "update_hours",
        "business_name": body.business_name,
        "date": body.date, "weekday": body.weekday, "closed": body.closed,
        "providers": body.providers,
        "plan": plan
    }

# ---- Social: Instagram ideas (approval flow) ----
class PostIdeaReq(BaseModel):
    topic: str
    vibe: Optional[str] = "excited"
    call_to_action: Optional[str] = "Follow us for updates!"
    count: int = 3

@router.post("/social/instagram/ideas")
def instagram_ideas(req: PostIdeaReq, user=Depends(require_auth)):
    # Stub: produce templated ideas (Part 2 will use LLM + images)
    ideas = []
    for i in range(req.count):
        ideas.append({
            "id": str(uuid.uuid4()),
            "headline": f"🎉 Grand Opening: {req.topic}",
            "caption": f"We're officially open! {req.topic} is here. {req.call_to_action}",
            "image_prompt": f"Clean, minimalist post about {req.topic}, {req.vibe} tone"
        })
    return {"ok": True, "ideas": ideas}

class ApprovePostReq(BaseModel):
    idea_id: str
    platform: str = "instagram"
    schedule_at: Optional[str] = None  # ISO8601; if None, post now

@router.post("/social/instagram/approve")
def instagram_approve(req: ApprovePostReq, user=Depends(require_auth)):
    # Stub: in Part 2 we'll hit Instagram Graph API (Media Publish)
    return {"ok": True, "posted": True, "platform": req.platform, "idea_id": req.idea_id, "note": "Stub publish"}

# ---- Brand Tools: Name & simple SVG logo demo ----
class BrandReq(BaseModel):
    keywords: List[str] = []
    tone: Optional[str] = "modern"
    initials: Optional[str] = None  # if given, we build a simple SVG logo

@router.post("/brand/generate")
def brand_generate(req: BrandReq, user=Depends(require_auth)):
    # Stub: name suggestions
    base = "-".join([k.capitalize() for k in req.keywords]) or "Aadee"
    names = [f"{base} Labs", f"{base} Studio", f"{base} Works", f"{base} Collective"]
    svg = None
    if req.initials:
        # Simple SVG monogram (no external APIs)
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="100%" height="100%" rx="42" fill="#111827"/>
  <text x="50%" y="52%" font-size="220" font-family="Arial, Helvetica, sans-serif"
        text-anchor="middle" fill="#F3F4F6" dy=".35em">{req.initials.upper()}</text>
</svg>"""
    return {"ok": True, "names": names, "svg_logo": svg, "tone": req.tone}
