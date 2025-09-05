from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BaseIntegration(ABC):
    """Base class for all business platform integrations"""
    
    def __init__(self, org_id: str, credentials: Dict[str, Any]):
        self.org_id = org_id
        self.credentials = credentials
        self.last_sync: Optional[datetime] = None
    
    @abstractmethod
    def authenticate(self) -> bool:
        """Authenticate with the platform"""
        pass
    
    @abstractmethod
    def test_connection(self) -> bool:
        """Test if the connection is working"""
        pass
    
    @abstractmethod
    def get_business_info(self) -> Dict[str, Any]:
        """Get current business information from the platform"""
        pass
    
    def log_action(self, action: str, result: Dict[str, Any], success: bool = True):
        """Log integration actions for debugging"""
        logger.info(f"Integration {self.__class__.__name__} - {action}: {result}")
    
    def handle_error(self, error: Exception, context: str) -> Dict[str, Any]:
        """Standard error handling for integrations"""
        error_msg = f"Error in {context}: {str(error)}"
        logger.error(error_msg)
        return {
            "success": False,
            "error": error_msg,
            "error_type": type(error).__name__
        }

class BusinessHoursIntegration(BaseIntegration):
    """Base class for integrations that support business hours updates"""
    
    @abstractmethod
    def update_business_hours(self, hours: Dict[str, str]) -> Dict[str, Any]:
        """Update business hours on the platform"""
        pass
    
    @abstractmethod
    def get_business_hours(self) -> Dict[str, str]:
        """Get current business hours from the platform"""
        pass

class ListingIntegration(BaseIntegration):
    """Base class for integrations that support business listing updates"""
    
    @abstractmethod
    def update_business_info(self, info: Dict[str, Any]) -> Dict[str, Any]:
        """Update business information on the platform"""
        pass
    
    @abstractmethod
    def update_description(self, description: str) -> Dict[str, Any]:
        """Update business description"""
        pass
    
    @abstractmethod
    def update_contact_info(self, phone: Optional[str] = None, website: Optional[str] = None) -> Dict[str, Any]:
        """Update contact information"""
        pass
