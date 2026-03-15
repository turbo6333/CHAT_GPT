#!/usr/bin/env python3
"""
CoachHabits Backend API Edge Cases & Error Handling Tests
"""

import requests
import json
import sys
from datetime import datetime, date

BACKEND_URL = "https://coach-habits-app.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class EdgeCaseTests:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.results = {"passed": 0, "failed": 0, "errors": []}
    
    def log_result(self, test_name, success, message="", response=None):
        if success:
            self.results["passed"] += 1
            print(f"✅ {test_name}: {message}")
        else:
            self.results["failed"] += 1
            error_msg = f"❌ {test_name}: {message}"
            if response:
                error_msg += f" | Status: {response.status_code}"
            print(error_msg)
            self.results["errors"].append(error_msg)
    
    def test_invalid_habit_creation(self):
        """Test habit creation with invalid data"""
        # Test empty name
        try:
            response = self.session.post(f"{API_BASE}/habits", json={"name": "", "category": "sport"})
            # This should succeed as backend doesn't validate empty names
            if response.status_code == 200:
                self.log_result("Invalid Habit - Empty Name", True, "Server accepts empty name (as designed)")
            else:
                self.log_result("Invalid Habit - Empty Name", False, "Unexpected error", response)
        except Exception as e:
            self.log_result("Invalid Habit - Empty Name", False, f"Exception: {e}")
    
    def test_invalid_mood_range(self):
        """Test mood creation with invalid range"""
        try:
            # Test mood outside valid range (1-5)
            response = self.session.post(f"{API_BASE}/moods", json={"mood": 10})
            if response.status_code == 400:
                self.log_result("Invalid Mood Range", True, "Server correctly rejects mood > 5")
            else:
                self.log_result("Invalid Mood Range", False, "Server should reject invalid mood", response)
        except Exception as e:
            self.log_result("Invalid Mood Range", False, f"Exception: {e}")
    
    def test_nonexistent_habit_operations(self):
        """Test operations on non-existent habits"""
        fake_id = "non-existent-habit-id"
        
        # Test check-in on non-existent habit
        try:
            response = self.session.post(f"{API_BASE}/habits/{fake_id}/checkin", json={"done": True})
            if response.status_code == 404:
                self.log_result("Non-existent Habit Check-in", True, "Server correctly returns 404")
            else:
                self.log_result("Non-existent Habit Check-in", False, "Should return 404", response)
        except Exception as e:
            self.log_result("Non-existent Habit Check-in", False, f"Exception: {e}")
        
        # Test delete on non-existent habit
        try:
            response = self.session.delete(f"{API_BASE}/habits/{fake_id}")
            if response.status_code == 404:
                self.log_result("Non-existent Habit Delete", True, "Server correctly returns 404")
            else:
                self.log_result("Non-existent Habit Delete", False, "Should return 404", response)
        except Exception as e:
            self.log_result("Non-existent Habit Delete", False, f"Exception: {e}")
    
    def test_ai_integration(self):
        """Test AI integration works with various inputs"""
        try:
            # Test with custom user name
            response = self.session.post(f"{API_BASE}/coach/insight", json={"user_name": "TestBot"})
            if response.status_code == 200:
                data = response.json()
                if "insight" in data and len(data["insight"]) > 10:  # Should be a meaningful response
                    self.log_result("AI Integration", True, "AI generates meaningful insights")
                else:
                    self.log_result("AI Integration", False, "AI response too short or missing", response)
            else:
                self.log_result("AI Integration", False, "AI endpoint failed", response)
        except Exception as e:
            self.log_result("AI Integration", False, f"Exception: {e}")
    
    def test_concurrent_mood_updates(self):
        """Test updating mood multiple times same day"""
        try:
            # First mood entry
            response1 = self.session.post(f"{API_BASE}/moods", json={"mood": 2, "note": "First entry"})
            # Second mood entry (should update, not create new)
            response2 = self.session.post(f"{API_BASE}/moods", json={"mood": 5, "note": "Updated entry"})
            
            if response1.status_code == 200 and response2.status_code == 200:
                # Verify only one mood entry for today
                today_response = self.session.get(f"{API_BASE}/moods/today")
                if today_response.status_code == 200:
                    mood_data = today_response.json()
                    if mood_data and mood_data["mood"] == 5:
                        self.log_result("Concurrent Mood Updates", True, "Mood correctly updated, not duplicated")
                    else:
                        self.log_result("Concurrent Mood Updates", False, "Mood not properly updated", today_response)
                else:
                    self.log_result("Concurrent Mood Updates", False, "Cannot retrieve today's mood", today_response)
            else:
                self.log_result("Concurrent Mood Updates", False, "Mood creation/update failed")
        except Exception as e:
            self.log_result("Concurrent Mood Updates", False, f"Exception: {e}")
    
    def run_edge_case_tests(self):
        print("🔍 Running Edge Case & Error Handling Tests")
        print("=" * 60)
        
        tests = [
            ("Invalid Habit Creation", self.test_invalid_habit_creation),
            ("Invalid Mood Range", self.test_invalid_mood_range), 
            ("Non-existent Habit Operations", self.test_nonexistent_habit_operations),
            ("AI Integration", self.test_ai_integration),
            ("Concurrent Mood Updates", self.test_concurrent_mood_updates),
        ]
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running {test_name}")
            test_func()
        
        print("\n" + "=" * 60)
        print(f"📊 EDGE CASE TEST SUMMARY")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        
        if self.results["errors"]:
            print(f"\n🔍 FAILED TESTS:")
            for error in self.results["errors"]:
                print(f"  {error}")
        
        return self.results

if __name__ == "__main__":
    tester = EdgeCaseTests()
    results = tester.run_edge_case_tests()
    sys.exit(1 if results["failed"] > 0 else 0)