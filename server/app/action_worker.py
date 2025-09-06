"""
Modal worker for executing approved business actions

This worker polls for approved actions and executes them using the appropriate integrations.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import asyncio

from .supabase_client import sb
from .models import ActionType, ActionStatus
from .integrations import GoogleBusinessIntegration, YelpBusinessIntegration, SocialMediaIntegration

logger = logging.getLogger(__name__)

class ActionExecutor:
    """Executes approved business actions using platform integrations"""
    
    def __init__(self):
        self.integrations = {}
        self.setup_integrations()
    
    def setup_integrations(self):
        """Initialize platform integrations with mock credentials"""
        mock_credentials = {
            "google_business": {
                "location_id": "demo_location_123",
                "access_token": "mock_google_token",
                "api_key": os.getenv("GOOGLE_API_KEY", "mock_key")
            },
            "yelp": {
                "business_id": "demo_business_456", 
                "access_token": "mock_yelp_token",
                "api_key": os.getenv("YELP_API_KEY", "mock_key")
            },
            "social_media": {
                "platforms": ["facebook", "instagram", "twitter"],
                "access_tokens": {
                    "facebook": "mock_fb_token",
                    "instagram": "mock_ig_token", 
                    "twitter": "mock_twitter_token"
                }
            }
        }
        
        self.integrations["google_business"] = GoogleBusinessIntegration("demo-org", mock_credentials["google_business"])
        self.integrations["yelp"] = YelpBusinessIntegration("demo-org", mock_credentials["yelp"])
        self.integrations["social_media"] = SocialMediaIntegration("demo-org", mock_credentials["social_media"])
    
    def get_pending_actions(self) -> List[Dict[str, Any]]:
        """Fetch approved actions that need to be executed"""
        try:
            result = sb.table("actions").select("*").eq("status", ActionStatus.APPROVED.value).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching pending actions: {e}")
            return []
    
    def update_action_status(self, action_id: str, status: ActionStatus, result: Optional[Dict[str, Any]] = None, error_message: Optional[str] = None):
        """Update action status in database"""
        try:
            update_data = {
                "status": status.value,
                "executed_at": datetime.now().isoformat(),
                "executed_by": "action_worker"
            }
            
            if result:
                update_data["result"] = json.dumps(result)
            if error_message:
                update_data["error_message"] = error_message
            
            sb.table("actions").update(update_data).eq("id", action_id).execute()
            logger.info(f"Updated action {action_id} to status {status.value}")
        except Exception as e:
            logger.error(f"Error updating action {action_id}: {e}")
    
    def execute_business_hours_update(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute business hours update across platforms"""
        action_id = action["id"]
        params = action["params"]
        hours = params.get("hours", {})
        platforms = params.get("platforms", ["google_business", "yelp"])
        
        results = {}
        overall_success = True
        
        for platform in platforms:
            if platform in self.integrations:
                try:
                    integration = self.integrations[platform]
                    result = integration.update_business_hours(hours)
                    results[platform] = result
                    
                    if not result.get("success", False):
                        overall_success = False
                        
                except Exception as e:
                    error_msg = f"Error updating {platform}: {str(e)}"
                    results[platform] = {"success": False, "error": error_msg}
                    overall_success = False
                    logger.error(error_msg)
            else:
                error_msg = f"Integration not available for platform: {platform}"
                results[platform] = {"success": False, "error": error_msg}
                overall_success = False
        
        return {
            "success": overall_success,
            "platforms": results,
            "updated_hours": hours,
            "message": f"Business hours update {'completed' if overall_success else 'completed with errors'}"
        }
    
    def execute_social_media_post(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute social media post creation"""
        action_id = action["id"]
        params = action["params"]
        
        try:
            integration = self.integrations["social_media"]
            
            result = integration.draft_post(
                content=params.get("content", ""),
                platform=params.get("platform", "facebook"),
                media_urls=params.get("media_urls", []),
                hashtags=params.get("hashtags", [])
            )
            
            return {
                "success": result.get("success", False),
                "post_data": result.get("post_data", {}),
                "message": result.get("message", "Social media post created")
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create social media post"
            }
    
    def execute_listing_update(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute business listing update"""
        action_id = action["id"]
        params = action["params"]
        platform = params.get("platform", "google_business")
        
        try:
            if platform in self.integrations:
                integration = self.integrations[platform]
                result = integration.update_business_info(params.get("info", {}))
                
                return {
                    "success": result.get("success", False),
                    "platform": platform,
                    "updated_info": result.get("updated_info", {}),
                    "message": result.get("message", f"Listing updated on {platform}")
                }
            else:
                return {
                    "success": False,
                    "error": f"Integration not available for platform: {platform}",
                    "message": "Failed to update listing"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to update business listing"
            }
    
    def execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single action based on its type"""
        action_id = action["id"]
        action_type = action["type"]
        
        logger.info(f"Executing action {action_id} of type {action_type}")
        
        self.update_action_status(action_id, ActionStatus.EXECUTING)
        
        try:
            if action_type == ActionType.UPDATE_BUSINESS_HOURS.value:
                result = self.execute_business_hours_update(action)
            elif action_type == ActionType.DRAFT_SOCIAL_POST.value:
                result = self.execute_social_media_post(action)
            elif action_type in [ActionType.UPDATE_GOOGLE_BUSINESS_PROFILE.value, ActionType.UPDATE_YELP_LISTING.value]:
                result = self.execute_listing_update(action)
            else:
                result = {
                    "success": False,
                    "error": f"Unknown action type: {action_type}",
                    "message": "Action type not supported"
                }
            
            if result.get("success", False):
                self.update_action_status(action_id, ActionStatus.COMPLETED, result)
            else:
                self.update_action_status(action_id, ActionStatus.FAILED, result, result.get("error", "Execution failed"))
            
            return result
            
        except Exception as e:
            error_msg = f"Unexpected error executing action {action_id}: {str(e)}"
            logger.error(error_msg)
            self.update_action_status(action_id, ActionStatus.FAILED, error_message=error_msg)
            return {"success": False, "error": error_msg}
    
    def process_pending_actions(self) -> Dict[str, Any]:
        """Process all pending approved actions"""
        actions = self.get_pending_actions()
        
        if not actions:
            return {"processed": 0, "message": "No pending actions to process"}
        
        results = []
        successful = 0
        failed = 0
        
        for action in actions:
            result = self.execute_action(action)
            results.append({
                "action_id": action["id"],
                "type": action["type"],
                "result": result
            })
            
            if result.get("success", False):
                successful += 1
            else:
                failed += 1
        
        return {
            "processed": len(actions),
            "successful": successful,
            "failed": failed,
            "results": results,
            "message": f"Processed {len(actions)} actions: {successful} successful, {failed} failed"
        }

executor = ActionExecutor()

def process_actions():
    """Main function to process pending actions"""
    return executor.process_pending_actions()

def execute_single_action(action_id: str):
    """Execute a specific action by ID"""
    try:
        result = sb.table("actions").select("*").eq("id", action_id).single().execute()
        if result.data:
            return executor.execute_action(result.data)
        else:
            return {"success": False, "error": f"Action {action_id} not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}
