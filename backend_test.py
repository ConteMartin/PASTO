import requests
import sys
import time
import random
import string
from datetime import datetime

class PastoAPITester:
    def __init__(self, base_url="https://a191cd3d-a014-49cb-98b6-e7c2a4d86dfe.preview.emergentagent.com"):
        self.base_url = base_url
        self.client_token = None
        self.gardener_token = None
        self.client_user = None
        self.gardener_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.service_id = None

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

    def test_client_login(self, email, password):
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

    def test_gardener_profile(self):
        """Test getting gardener profile"""
        success, response = self.run_test(
            "Get Gardener Profile", 
            "GET", 
            "gardener/profile", 
            200, 
            token=self.gardener_token
        )
        if success:
            print(f"Retrieved gardener profile")
            return True
        return False

def main():
    # Setup
    tester = PastoAPITester()
    
    # Test health check
    tester.test_health_check()
    
    # Test authentication
    client_registered = tester.test_client_registration()
    gardener_registered = tester.test_gardener_registration()
    
    if not client_registered or not gardener_registered:
        print("❌ Registration failed, stopping tests")
        return 1
    
    # Test client flow
    tester.test_service_estimation()
    service_created = tester.test_service_request()
    
    if not service_created:
        print("❌ Service creation failed, stopping tests")
        return 1
    
    tester.test_get_client_requests()
    
    # Test gardener flow
    tester.test_get_available_services()
    tester.test_accept_service()
    tester.test_get_gardener_jobs()
    
    # Test service status updates
    tester.test_update_service_status("on_way")
    tester.test_update_service_status("in_progress")
    tester.test_update_service_status("completed")
    
    # Test notifications and ratings
    tester.test_get_notifications()
    tester.test_rate_service()
    tester.test_gardener_profile()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())