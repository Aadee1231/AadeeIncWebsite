#!/usr/bin/env python3
"""
Test script for Aadee Chat enhancements
"""
import sys
import os
sys.path.append('server')

def test_models():
    """Test that models import correctly"""
    try:
        from app.models import ActionType, ActionStatus, SuggestionType
        print("✓ Models imported successfully")
        print(f"  ActionType values: {[t.value for t in ActionType]}")
        print(f"  ActionStatus values: {[s.value for s in ActionStatus]}")
        print(f"  SuggestionType values: {[t.value for t in SuggestionType]}")
        return True
    except Exception as e:
        print(f"✗ Models import failed: {e}")
        return False

def test_integrations():
    """Test that integrations import correctly"""
    try:
        from app.integrations import GoogleBusinessIntegration, YelpBusinessIntegration, SocialMediaIntegration
        print("✓ Integrations imported successfully")
        
        google = GoogleBusinessIntegration('demo-org', {'api_key': 'test'})
        yelp = YelpBusinessIntegration('demo-org', {'api_key': 'test'})
        social = SocialMediaIntegration('demo-org', {'api_key': 'test'})
        
        print(f"  Google Business test: {google.test_connection()}")
        print(f"  Yelp test: {yelp.test_connection()}")
        print(f"  Social Media test: {social.test_connection()}")
        return True
    except Exception as e:
        print(f"✗ Integrations test failed: {e}")
        return False

def test_hours_parser():
    """Test business hours parsing"""
    try:
        from app.chat_router import parse_hours
        print("✓ Business hours parser imported successfully")
        
        test_cases = [
            'Update Friday to 9-3 and Sunday closed',
            'Set weekend hours to 10-4',
            'Change Monday to 8-6',
            'Close on Sundays'
        ]
        
        for case in test_cases:
            result = parse_hours(case)
            print(f"  Input: '{case}' → Output: {result}")
        return True
    except Exception as e:
        print(f"✗ Hours parser test failed: {e}")
        return False

def test_action_worker():
    """Test action worker"""
    try:
        from app.action_worker import ActionExecutor
        print("✓ Action worker imported successfully")
        
        executor = ActionExecutor()
        print(f"  Available integrations: {list(executor.integrations.keys())}")
        return True
    except Exception as e:
        print(f"✗ Action worker test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Aadee Chat Enhancements...")
    print("=" * 50)
    
    tests = [
        test_models,
        test_integrations, 
        test_hours_parser,
        test_action_worker
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"Results: {passed}/{len(tests)} tests passed")
    if passed == len(tests):
        print("🎉 All tests passed! System is ready.")
    else:
        print("❌ Some tests failed. Check the errors above.")
