#!/usr/bin/env python3
"""
CoachHabits Backend API Test Suite
Tests all backend endpoints according to the review request flow.
"""

import requests
import json
import sys
from datetime import datetime, date
import uuid

# Backend URL from frontend environment
BACKEND_URL = "https://coach-habits-app.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test data
HABIT_NAMES = ["Morning Jog", "Read Books"]
HABIT_CATEGORIES = ["sport", "study"]

class CoachHabitsAPITest:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.created_habits = []
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name, success, message="", response=None):
        """Log test results"""
        if success:
            self.results["passed"] += 1
            print(f"✅ {test_name}: {message}")
        else:
            self.results["failed"] += 1
            error_msg = f"❌ {test_name}: {message}"
            if response:
                error_msg += f" | Status: {response.status_code} | Response: {response.text[:200]}"
            print(error_msg)
            self.results["errors"].append(error_msg)
    
    def test_1_root_endpoint(self):
        """Test GET /api/ - Root endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "CoachHabits" in data["message"]:
                    self.log_result("Root Endpoint", True, "API root accessible")
                    return True
                else:
                    self.log_result("Root Endpoint", False, "Unexpected response format", response)
            else:
                self.log_result("Root Endpoint", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Root Endpoint", False, f"Exception: {str(e)}")
        return False
    
    def test_2_create_habits(self):
        """Test POST /api/habits - Create habits"""
        success_count = 0
        
        for i, (name, category) in enumerate(zip(HABIT_NAMES, HABIT_CATEGORIES)):
            try:
                payload = {
                    "name": name,
                    "category": category
                }
                response = self.session.post(f"{API_BASE}/habits", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if all(key in data for key in ["id", "name", "category", "streak", "is_active"]):
                        if data["name"] == name and data["category"] == category:
                            self.created_habits.append(data)
                            success_count += 1
                            self.log_result(f"Create Habit {i+1}", True, f"Created {name}")
                        else:
                            self.log_result(f"Create Habit {i+1}", False, "Data mismatch", response)
                    else:
                        self.log_result(f"Create Habit {i+1}", False, "Missing required fields", response)
                else:
                    self.log_result(f"Create Habit {i+1}", False, "Non-200 status code", response)
            except Exception as e:
                self.log_result(f"Create Habit {i+1}", False, f"Exception: {str(e)}")
        
        return success_count == len(HABIT_NAMES)
    
    def test_3_list_habits(self):
        """Test GET /api/habits - List all active habits"""
        try:
            response = self.session.get(f"{API_BASE}/habits")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our created habits are in the list
                    created_ids = {h["id"] for h in self.created_habits}
                    returned_ids = {h["id"] for h in data if "id" in h}
                    
                    if created_ids.issubset(returned_ids):
                        self.log_result("List Habits", True, f"Found {len(data)} habits including created ones")
                        return True
                    else:
                        self.log_result("List Habits", False, "Created habits not found in list", response)
                else:
                    self.log_result("List Habits", False, "Response not a list", response)
            else:
                self.log_result("List Habits", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("List Habits", False, f"Exception: {str(e)}")
        return False
    
    def test_4_checkin_habit(self):
        """Test POST /api/habits/{id}/checkin - Check-in a habit"""
        if not self.created_habits:
            self.log_result("Habit Check-in", False, "No habits to check-in")
            return False
        
        habit = self.created_habits[0]  # Check-in first habit
        try:
            payload = {"done": True}
            response = self.session.post(f"{API_BASE}/habits/{habit['id']}/checkin", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if all(key in data for key in ["id", "habit_id", "date", "done"]):
                    if data["habit_id"] == habit["id"] and data["done"] is True:
                        self.log_result("Habit Check-in", True, f"Successfully checked-in {habit['name']}")
                        return True
                    else:
                        self.log_result("Habit Check-in", False, "Data mismatch", response)
                else:
                    self.log_result("Habit Check-in", False, "Missing required fields", response)
            else:
                self.log_result("Habit Check-in", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Habit Check-in", False, f"Exception: {str(e)}")
        return False
    
    def test_5_create_mood(self):
        """Test POST /api/moods - Create mood entry"""
        try:
            payload = {"mood": 4, "note": "Feeling good today!"}
            response = self.session.post(f"{API_BASE}/moods", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if all(key in data for key in ["id", "date", "mood"]):
                    if data["mood"] == 4 and data["date"] == date.today().isoformat():
                        self.log_result("Create Mood", True, "Mood entry created")
                        return True
                    else:
                        self.log_result("Create Mood", False, "Data mismatch", response)
                else:
                    self.log_result("Create Mood", False, "Missing required fields", response)
            else:
                self.log_result("Create Mood", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Create Mood", False, f"Exception: {str(e)}")
        return False
    
    def test_6_get_today_mood(self):
        """Test GET /api/moods/today - Get today's mood"""
        try:
            response = self.session.get(f"{API_BASE}/moods/today")
            
            if response.status_code == 200:
                data = response.json()
                if data and "mood" in data and "date" in data:
                    if data["date"] == date.today().isoformat():
                        self.log_result("Get Today Mood", True, f"Retrieved mood: {data['mood']}")
                        return True
                    else:
                        self.log_result("Get Today Mood", False, "Date mismatch", response)
                else:
                    self.log_result("Get Today Mood", False, "No mood data or missing fields", response)
            else:
                self.log_result("Get Today Mood", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Get Today Mood", False, f"Exception: {str(e)}")
        return False
    
    def test_7_get_today_status(self):
        """Test GET /api/today - Get today's habits with completion status"""
        try:
            response = self.session.get(f"{API_BASE}/today")
            
            if response.status_code == 200:
                data = response.json()
                required_keys = ["date", "habits", "progress", "mood"]
                if all(key in data for key in required_keys):
                    if data["date"] == date.today().isoformat():
                        habits = data["habits"]
                        progress = data["progress"]
                        
                        # Verify progress calculation
                        completed = sum(1 for h in habits if h.get("completed_today", False))
                        total = len(habits)
                        
                        if (progress["completed"] == completed and 
                            progress["total"] == total and 
                            isinstance(habits, list)):
                            self.log_result("Get Today Status", True, 
                                          f"Progress: {completed}/{total} habits completed")
                            return True
                        else:
                            self.log_result("Get Today Status", False, "Progress calculation error", response)
                    else:
                        self.log_result("Get Today Status", False, "Date mismatch", response)
                else:
                    self.log_result("Get Today Status", False, "Missing required fields", response)
            else:
                self.log_result("Get Today Status", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Get Today Status", False, f"Exception: {str(e)}")
        return False
    
    def test_8_get_ai_insight(self):
        """Test POST /api/coach/insight - Get AI insight"""
        try:
            payload = {"user_name": "TestUser"}
            response = self.session.post(f"{API_BASE}/coach/insight", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if all(key in data for key in ["insight", "context"]):
                    insight = data["insight"]
                    context = data["context"]
                    
                    if (isinstance(insight, str) and len(insight) > 0 and
                        all(key in context for key in ["habits_completed", "habits_total", "mood"])):
                        self.log_result("AI Insight", True, "AI insight generated successfully")
                        return True
                    else:
                        self.log_result("AI Insight", False, "Invalid insight format", response)
                else:
                    self.log_result("AI Insight", False, "Missing required fields", response)
            else:
                self.log_result("AI Insight", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("AI Insight", False, f"Exception: {str(e)}")
        return False
    
    def test_9_get_coach_messages(self):
        """Test GET /api/coach/messages - Get coach message history"""
        try:
            response = self.session.get(f"{API_BASE}/coach/messages")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if messages have required fields
                        message = data[0]
                        if all(key in message for key in ["role", "content", "created_at"]):
                            self.log_result("Coach Messages", True, f"Retrieved {len(data)} messages")
                            return True
                        else:
                            self.log_result("Coach Messages", False, "Message missing required fields", response)
                    else:
                        self.log_result("Coach Messages", True, "No messages (empty list is valid)")
                        return True
                else:
                    self.log_result("Coach Messages", False, "Response not a list", response)
            else:
                self.log_result("Coach Messages", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Coach Messages", False, f"Exception: {str(e)}")
        return False
    
    def test_10_get_profile(self):
        """Test GET /api/profile - Get user profile"""
        try:
            response = self.session.get(f"{API_BASE}/profile")
            
            if response.status_code == 200:
                data = response.json()
                if all(key in data for key in ["id", "name", "notification_time"]):
                    self.log_result("Get Profile", True, f"Retrieved profile for {data['name']}")
                    return True
                else:
                    self.log_result("Get Profile", False, "Missing required fields", response)
            else:
                self.log_result("Get Profile", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Get Profile", False, f"Exception: {str(e)}")
        return False
    
    def test_11_update_profile(self):
        """Test PUT /api/profile - Update profile"""
        try:
            payload = {
                "name": "Test Coach User",
                "notification_time": "09:30"
            }
            response = self.session.put(f"{API_BASE}/profile", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("name") == payload["name"] and 
                    data.get("notification_time") == payload["notification_time"]):
                    self.log_result("Update Profile", True, "Profile updated successfully")
                    return True
                else:
                    self.log_result("Update Profile", False, "Update not reflected", response)
            else:
                self.log_result("Update Profile", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Update Profile", False, f"Exception: {str(e)}")
        return False
    
    def test_12_get_stats(self):
        """Test GET /api/stats - Get global statistics"""
        try:
            response = self.session.get(f"{API_BASE}/stats")
            
            if response.status_code == 200:
                data = response.json()
                required_keys = ["total_habits", "total_completions", "total_streaks", "categories"]
                if all(key in data for key in required_keys):
                    if isinstance(data["categories"], dict) and data["total_habits"] >= 0:
                        self.log_result("Get Stats", True, 
                                      f"Stats: {data['total_habits']} habits, {data['total_completions']} completions")
                        return True
                    else:
                        self.log_result("Get Stats", False, "Invalid stats format", response)
                else:
                    self.log_result("Get Stats", False, "Missing required fields", response)
            else:
                self.log_result("Get Stats", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Get Stats", False, f"Exception: {str(e)}")
        return False
    
    def test_13_delete_habit(self):
        """Test DELETE /api/habits/{id} - Delete a habit"""
        if not self.created_habits:
            self.log_result("Delete Habit", False, "No habits to delete")
            return False
        
        habit = self.created_habits[-1]  # Delete last created habit
        try:
            response = self.session.delete(f"{API_BASE}/habits/{habit['id']}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "supprimée" in data["message"]:
                    self.log_result("Delete Habit", True, f"Deleted {habit['name']}")
                    return True
                else:
                    self.log_result("Delete Habit", False, "Unexpected response format", response)
            else:
                self.log_result("Delete Habit", False, "Non-200 status code", response)
        except Exception as e:
            self.log_result("Delete Habit", False, f"Exception: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run the complete test flow as specified in the review request"""
        print(f"🚀 Starting CoachHabits Backend API Tests")
        print(f"📍 Testing against: {API_BASE}")
        print("=" * 60)
        
        # Follow the test flow from review request
        tests = [
            ("1. Root Endpoint", self.test_1_root_endpoint),
            ("2. Create Habits (2)", self.test_2_create_habits),
            ("3. List Habits", self.test_3_list_habits),
            ("4. Check-in Habit", self.test_4_checkin_habit),
            ("5. Create Mood", self.test_5_create_mood),
            ("6. Get Today Mood", self.test_6_get_today_mood),
            ("7. Get Today Status", self.test_7_get_today_status),
            ("8. Get AI Insight", self.test_8_get_ai_insight),
            ("9. Get Coach Messages", self.test_9_get_coach_messages),
            ("10. Get Profile", self.test_10_get_profile),
            ("11. Update Profile", self.test_11_update_profile),
            ("12. Get Stats", self.test_12_get_stats),
            ("13. Delete Habit", self.test_13_delete_habit),
        ]
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running {test_name}")
            test_func()
        
        # Final summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {(self.results['passed']/(self.results['passed']+self.results['failed'])*100):.1f}%")
        
        if self.results["errors"]:
            print(f"\n🔍 FAILED TESTS:")
            for error in self.results["errors"]:
                print(f"  {error}")
        
        return self.results

if __name__ == "__main__":
    tester = CoachHabitsAPITest()
    results = tester.run_all_tests()
    
    # Exit with non-zero code if there were failures
    sys.exit(1 if results["failed"] > 0 else 0)