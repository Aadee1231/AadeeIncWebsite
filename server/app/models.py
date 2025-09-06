from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class ActionType(str, Enum):
    UPDATE_BUSINESS_HOURS = "update_business_hours"
    UPDATE_GOOGLE_BUSINESS_PROFILE = "update_google_business_profile"
    UPDATE_YELP_LISTING = "update_yelp_listing"
    DRAFT_SOCIAL_POST = "draft_social_post"
    UPDATE_WEBSITE_CONTENT = "update_website_content"

class ActionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"

class SuggestionType(str, Enum):
    SEASONAL_REMINDER = "seasonal_reminder"
    ENGAGEMENT_ALERT = "engagement_alert"
    HOURS_OPTIMIZATION = "hours_optimization"
    LISTING_UPDATE = "listing_update"
    SOCIAL_OPPORTUNITY = "social_opportunity"

class SuggestionPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ChatMessage(BaseModel):
    session_id: str
    text: str
    agent: str = "king_ai"
    org_id: Optional[str] = "demo-org"

class ActionCreate(BaseModel):
    org_id: str
    type: ActionType
    params: Dict[str, Any]
    description: Optional[str] = None
    session_id: Optional[str] = None

class ActionUpdate(BaseModel):
    status: ActionStatus
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    executed_by: Optional[str] = None
    executed_at: Optional[datetime] = None

class ActionApproval(BaseModel):
    action_id: str
    approve: bool
    note: Optional[str] = None

class SuggestionCreate(BaseModel):
    org_id: str
    type: SuggestionType
    priority: SuggestionPriority
    title: str
    description: str
    suggested_action: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class BusinessHoursUpdate(BaseModel):
    hours: Dict[str, str]  # {"mon": "9-17", "tue": "9-17", ...}
    timezone: Optional[str] = "America/New_York"

class GoogleBusinessProfileUpdate(BaseModel):
    location_id: str
    hours: Optional[Dict[str, str]] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None

class YelpListingUpdate(BaseModel):
    business_id: str
    hours: Optional[Dict[str, str]] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None

class SocialPostDraft(BaseModel):
    platform: str  # "facebook", "instagram", "twitter"
    content: str
    media_urls: Optional[List[str]] = None
    scheduled_time: Optional[datetime] = None
    hashtags: Optional[List[str]] = None

"""
Supabase Tables Schema:

-- Enhanced actions table
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    session_id TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    params JSONB NOT NULL,
    description TEXT,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    executed_at TIMESTAMP WITH TIME ZONE,
    executed_by TEXT
);

-- New suggestions table
CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suggested_action JSONB,
    metadata JSONB,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    dismissed_by TEXT
);

-- Enhanced chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    org_id TEXT,
    user_id TEXT,
    agent TEXT DEFAULT 'king_ai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES chat_sessions(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base table (existing)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google OAuth table (existing)
CREATE TABLE IF NOT EXISTS google_oauth (
    id INTEGER PRIMARY KEY,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business integrations table
CREATE TABLE business_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'google_business', 'yelp', 'facebook', etc.
    integration_id TEXT NOT NULL, -- external platform ID
    credentials JSONB, -- encrypted credentials
    config JSONB, -- platform-specific configuration
    status TEXT NOT NULL DEFAULT 'active',
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, platform, integration_id)
);

-- Indexes for performance
CREATE INDEX idx_actions_org_status ON actions(org_id, status);
CREATE INDEX idx_actions_created_at ON actions(created_at);
CREATE INDEX idx_suggestions_org_status ON suggestions(org_id, status);
CREATE INDEX idx_suggestions_priority ON suggestions(priority);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_business_integrations_org ON business_integrations(org_id);
"""
