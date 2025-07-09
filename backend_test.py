import requests
import sys
import time
import random
import string
from datetime import datetime
import json

class PastoAPITester:
    def __init__(self, base_url="https://8c0b897f-9481-473a-aee0-612b83ee3b64.preview.emergentagent.com"):
        self.base_url = base_url
        self.client_token = None
        self.gardener_token = None
        self.admin_token = None
        self.client_user = None
        self.gardener_user = None
        self.admin_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.service_id = None
        self.notification_id = None
        self.test_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        return success, response.json()
                    except:
                        return success, response.text
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    try:
                        print(f"Response: {response.json()}")
                    except:
                        print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def generate_random_email(self):
        """Generate a random email for testing"""
        random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return f"test_{random_str}@example.com"

    def test_health_check(self):
        """Test the health check endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_client_registration(self):
        """Test client registration"""
        email = self.generate_random_email()
        data = {
            "email": email,
            "password": "TestPassword123!",
            "full_name": "Test Client",
            "role": "client",
            "phone": "+1234567890"
        }
        success, response = self.run_test("Client Registration", "POST", "auth/register", 200, data=data)
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            self.client_user = response['user']
            print(f"Client registered with email: {email}")
            return True
        return False

    def test_gardener_registration(self):
        """Test gardener registration"""
        email = self.generate_random_email()
        data = {
            "email": email,
            "password": "TestPassword123!",
            "full_name": "Test Gardener",
            "role": "gardener",
            "phone": "+1987654321"
        }
        success, response = self.run_test("Gardener Registration", "POST", "auth/register", 200, data=data)
        if success and 'access_token' in response:
            self.gardener_token = response['access_token']
            self.gardener_user = response['user']
            print(f"Gardener registered with email: {email}")
            return True
        return False

    def test_client_login(self, email="admin@pasto.com", password="admin123"):
        """Test client login"""
        data = {
            "email": email,
            "password": password
        }
        success, response = self.run_test("Client Login", "POST", "auth/login", 200, data=data)
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            self.client_user = response['user']
            return True
        return False

    def test_gardener_login(self, email, password):
        """Test gardener login"""
        data = {
            "email": email,
            "password": password
        }
        success, response = self.run_test("Gardener Login", "POST", "auth/login", 200, data=data)
        if success and 'access_token' in response:
            self.gardener_token = response['access_token']
            self.gardener_user = response['user']
            return True
        return False
        
    def test_admin_login(self):
        """Test admin login"""
        data = {
            "email": "admin@pasto.com",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "auth/login", 200, data=data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user = response['user']
            return True
        return False
        
    def test_get_user_profile(self):
        """Test getting user profile"""
        success, response = self.run_test("Get User Profile", "GET", "auth/me", 200, token=self.client_token)
        if success:
            print(f"Retrieved user profile for: {response.get('email')}")
            return True
        return False
        
    def test_google_oauth_complete(self):
        """Test Google OAuth completion (simplified)"""
        data = {
            "code": "test_auth_code",
            "role": "client"
        }
        success, response = self.run_test("Google OAuth Complete", "POST", "auth/google/complete", 200, data=data)
        if success and 'access_token' in response:
            print(f"Google OAuth completed for: {response.get('user', {}).get('email')}")
            return True
        return False

    def test_service_estimation(self):
        """Test service price estimation"""
        params = {
            "service_type": "grass_cutting",
            "terrain_width": 10,
            "terrain_length": 10
        }
        success, response = self.run_test(
            "Service Estimation", 
            "POST", 
            "services/estimate", 
            200, 
            token=self.client_token,
            params=params
        )
        if success:
            print(f"Estimated price: ${response.get('estimated_price')}")
            print(f"Estimated duration: {response.get('estimated_duration')} minutes")
            return True
        return False

    def test_service_request(self):
        """Test service request creation"""
        data = {
            "client_id": self.client_user["user_id"],
            "service_type": "grass_cutting",
            "address": "123 Test Street, Test City",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "terrain_width": 10,
            "terrain_length": 10,
            "images": [],
            "is_immediate": True,
            "notes": "This is a test service request"
        }
        success, response = self.run_test(
            "Service Request Creation", 
            "POST", 
            "services/request", 
            200, 
            data=data,
            token=self.client_token
        )
        if success and 'service_id' in response:
            self.service_id = response['service_id']
            print(f"Created service request with ID: {self.service_id}")
            return True
        return False

    def test_get_available_services(self):
        """Test getting available services for gardeners"""
        success, response = self.run_test(
            "Get Available Services", 
            "GET", 
            "services/available", 
            200, 
            token=self.gardener_token
        )
        if success and isinstance(response, list):
            print(f"Found {len(response)} available services")
            return True
        return False

    def test_get_client_requests(self):
        """Test getting client's service requests"""
        success, response = self.run_test(
            "Get Client Requests", 
            "GET", 
            "services/my-requests", 
            200, 
            token=self.client_token
        )
        if success and isinstance(response, list):
            print(f"Found {len(response)} client requests")
            return True
        return False

    def test_accept_service(self):
        """Test accepting a service by a gardener"""
        if not self.service_id:
            print("❌ No service ID available to accept")
            return False
            
        success, response = self.run_test(
            "Accept Service", 
            "POST", 
            f"services/{self.service_id}/accept", 
            200, 
            token=self.gardener_token
        )
        if success:
            print(f"Service {self.service_id} accepted by gardener")
            return True
        return False

    def test_get_gardener_jobs(self):
        """Test getting gardener's jobs"""
        success, response = self.run_test(
            "Get Gardener Jobs", 
            "GET", 
            "services/my-jobs", 
            200, 
            token=self.gardener_token
        )
        if success and isinstance(response, list):
            print(f"Found {len(response)} gardener jobs")
            return True
        return False

    def test_update_service_status(self, status):
        """Test updating service status"""
        if not self.service_id:
            print("❌ No service ID available to update status")
            return False
            
        data = {
            "status": status,
            "notes": f"Updating status to {status}"
        }
        success, response = self.run_test(
            f"Update Service Status to {status}", 
            "POST", 
            f"services/{self.service_id}/update-status", 
            200, 
            data=data,
            token=self.gardener_token
        )
        if success:
            print(f"Service status updated to {status}")
            return True
        return False

    def test_get_notifications(self):
        """Test getting notifications"""
        success, response = self.run_test(
            "Get Client Notifications", 
            "GET", 
            "notifications", 
            200, 
            token=self.client_token
        )
        if success and isinstance(response, list):
            print(f"Found {len(response)} client notifications")
            if len(response) > 0:
                self.notification_id = response[0].get('notification_id')
            return True
        return False
        
    def test_mark_notification_read(self):
        """Test marking notification as read"""
        if not self.notification_id:
            print("❌ No notification ID available to mark as read")
            return False
            
        success, response = self.run_test(
            "Mark Notification as Read", 
            "POST", 
            f"notifications/{self.notification_id}/read", 
            200, 
            token=self.client_token
        )
        if success:
            print(f"Notification {self.notification_id} marked as read")
            return True
        return False

    def test_admin_get_users(self):
        """Test admin getting all users"""
        success, response = self.run_test(
            "Admin Get All Users", 
            "GET", 
            "admin/users", 
            200, 
            token=self.admin_token
        )
        if success and isinstance(response, list):
            print(f"Admin retrieved {len(response)} users")
            if len(response) > 0:
                # Save a user ID for deletion test
                for user in response:
                    if user.get('email') != "admin@pasto.com":
                        self.test_user_id = user.get('user_id')
                        break
            return True
        return False
        
    def test_admin_get_services(self):
        """Test admin getting all services"""
        success, response = self.run_test(
            "Admin Get All Services", 
            "GET", 
            "admin/services", 
            200, 
            token=self.admin_token
        )
        if success and isinstance(response, list):
            print(f"Admin retrieved {len(response)} services")
            return True
        return False
        
    def test_admin_delete_user(self):
        """Test admin deleting a user"""
        if not self.test_user_id:
            print("❌ No user ID available for deletion test")
            return False
            
        success, response = self.run_test(
            "Admin Delete User", 
            "DELETE", 
            f"admin/users/{self.test_user_id}", 
            200, 
            token=self.admin_token
        )
        if success:
            print(f"Admin deleted user with ID: {self.test_user_id}")
            return True
        return False
        
    def test_create_admin_user(self):
        """Test creating admin user"""
        success, response = self.run_test(
            "Create Admin User", 
            "POST", 
            "admin/create-admin", 
            200
        )
        if success:
            print("Admin user created or already exists")
            return True
        return False

    def test_rate_service(self):
        """Test rating a service"""
        if not self.service_id:
            print("❌ No service ID available to rate")
            return False
            
        data = {
            "service_id": self.service_id,
            "rating": 5,
            "review": "Great service!"
        }
        success, response = self.run_test(
            "Rate Service", 
            "POST", 
            f"services/{self.service_id}/rate", 
            200, 
            data=data,
            token=self.client_token
        )
        if success:
            print(f"Service rated with 5 stars")
            return True
        return False

def main():
    # Setup
    tester = PastoAPITester()
    
    # Test health check
    tester.test_health_check()
    
    # Create admin user if needed
    tester.test_create_admin_user()
    
    # Test authentication endpoints
    print("\n\n🔐 Testing Authentication Endpoints...")
    client_registered = tester.test_client_registration()
    gardener_registered = tester.test_gardener_registration()
    admin_logged_in = tester.test_admin_login()
    tester.test_get_user_profile()
    tester.test_google_oauth_complete()
    
    if not client_registered or not gardener_registered:
        print("❌ Registration failed, stopping tests")
        return 1
        
    if not admin_logged_in:
        print("❌ Admin login failed, some tests may not work")
    
    # Test service endpoints
    print("\n\n🌿 Testing Service Endpoints...")
    tester.test_service_estimation()
    service_created = tester.test_service_request()
    
    if not service_created:
        print("❌ Service creation failed, stopping service flow tests")
    else:
        tester.test_get_client_requests()
        tester.test_get_available_services()
        tester.test_accept_service()
        tester.test_get_gardener_jobs()
        
        # Test service status updates
        print("\n\n📊 Testing Service Status Updates...")
        tester.test_update_service_status("on_way")
        tester.test_update_service_status("in_progress")
        tester.test_update_service_status("completed")
    
    # Test notifications
    print("\n\n🔔 Testing Notification Endpoints...")
    tester.test_get_notifications()
    tester.test_mark_notification_read()
    
    # Test admin endpoints
    if admin_logged_in:
        print("\n\n👑 Testing Admin Endpoints...")
        tester.test_admin_get_users()
        tester.test_admin_get_services()
        tester.test_admin_delete_user()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Pass rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())