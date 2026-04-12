import requests
import sys
import json
from datetime import datetime, date

class QSOAPITester:
    def __init__(self, base_url="https://radio-memory.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_qso_ids = []
        self.session = requests.Session()  # Use session to maintain cookies

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_register(self, email, password, callsign):
        """Test user registration"""
        data = {"email": email, "password": password, "callsign": callsign}
        return self.run_test("Register User", "POST", "auth/register", 200, data=data)

    def test_login(self, email, password):
        """Test user login"""
        data = {"email": email, "password": password}
        return self.run_test("Login User", "POST", "auth/login", 200, data=data)

    def test_logout(self):
        """Test user logout"""
        return self.run_test("Logout User", "POST", "auth/logout", 200)

    def test_get_me(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_refresh_token(self):
        """Test token refresh"""
        return self.run_test("Refresh Token", "POST", "auth/refresh", 200)

    def test_duplicate_registration(self, email, password, callsign):
        """Test duplicate registration should fail"""
        data = {"email": email, "password": password, "callsign": callsign}
        return self.run_test("Duplicate Registration", "POST", "auth/register", 400, data=data)

    def test_invalid_login(self, email, password):
        """Test login with invalid credentials"""
        data = {"email": email, "password": password}
        return self.run_test("Invalid Login", "POST", "auth/login", 401, data=data)

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without auth"""
        # Create new session without cookies
        temp_session = requests.Session()
        url = f"{self.api_url}/qso"
        response = temp_session.get(url)
        
        self.tests_run += 1
        print(f"\n🔍 Testing Unauthorized Access...")
        print(f"   URL: {url}")
        
        if response.status_code == 401:
            self.tests_passed += 1
            print(f"✅ Passed - Status: {response.status_code}")
            return True, {}
        else:
            print(f"❌ Failed - Expected 401, got {response.status_code}")
            return False, {}

    def test_duplicate_qso(self, callsign, date_str, frequency, name):
        """Test creating duplicate QSO should fail with 409"""
        qso_data = {
            "callsign": callsign,
            "date": date_str,
            "frequency": frequency,
            "name": name
        }
        return self.run_test("Create Duplicate QSO", "POST", "qso", 409, data=qso_data)
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_create_qso(self, callsign, date_str, frequency, name):
        """Test creating a QSO"""
        qso_data = {
            "callsign": callsign,
            "date": date_str,
            "frequency": frequency,
            "name": name
        }
        success, response = self.run_test("Create QSO", "POST", "qso", 200, data=qso_data)
        if success and 'id' in response:
            self.created_qso_ids.append(response['id'])
            return response['id']
        return None

    def test_get_all_qsos(self):
        """Test getting all QSOs"""
        return self.run_test("Get All QSOs", "GET", "qso", 200)

    def test_get_qso_by_id(self, qso_id):
        """Test getting a specific QSO by ID"""
        return self.run_test(f"Get QSO {qso_id}", "GET", f"qso/{qso_id}", 200)

    def test_search_qsos(self, search_term):
        """Test searching QSOs"""
        return self.run_test(f"Search QSOs '{search_term}'", "GET", "qso", 200, params={"search": search_term})

    def test_update_qso(self, qso_id, update_data):
        """Test updating a QSO"""
        return self.run_test(f"Update QSO {qso_id}", "PUT", f"qso/{qso_id}", 200, data=update_data)

    def test_delete_qso(self, qso_id):
        """Test deleting a QSO"""
        return self.run_test(f"Delete QSO {qso_id}", "DELETE", f"qso/{qso_id}", 200)

    def test_get_stats(self):
        """Test getting QSO statistics"""
        return self.run_test("Get QSO Stats", "GET", "qso/stats/total", 200)
    
    def test_get_grouped_qsos(self):
        """Test getting grouped QSOs (one entry per callsign)"""
        return self.run_test("Get Grouped QSOs", "GET", "qso/grouped", 200)
    
    def test_search_grouped_qsos(self, search_term):
        """Test searching grouped QSOs"""
        return self.run_test(f"Search Grouped QSOs '{search_term}'", "GET", "qso/grouped", 200, params={"search": search_term})
    
    def test_get_qso_history(self, callsign):
        """Test getting QSO history for a specific callsign"""
        return self.run_test(f"Get QSO History for {callsign}", "GET", f"qso/history/{callsign}", 200)

    def test_invalid_qso_creation(self):
        """Test creating QSO with invalid data"""
        invalid_data = {
            "callsign": "",  # Empty callsign should fail
            "date": "2024-01-01",
            "frequency": -1,  # Negative frequency should fail
            "name": ""  # Empty name should fail
        }
        return self.run_test("Create Invalid QSO", "POST", "qso", 422, data=invalid_data)

    def test_nonexistent_qso(self):
        """Test getting non-existent QSO"""
        fake_id = "nonexistent-id-12345"
        return self.run_test("Get Non-existent QSO", "GET", f"qso/{fake_id}", 404)

def main():
    print("🚀 Starting QSO API Tests with Authentication...")
    print("=" * 60)
    
    tester = QSOAPITester()
    
    # Test 1: Root endpoint (no auth required)
    tester.test_root_endpoint()
    
    # Test 2: Test unauthorized access
    tester.test_unauthorized_access()
    
    # Test 3: Try to login with admin first, if that fails, register test user
    admin_success, admin_data = tester.test_login("admin@example.com", "admin123")
    if admin_success:
        print("✅ Using admin account for testing")
        test_email = "admin@example.com"
        test_password = "admin123"
        test_callsign = "F0ADMIN"
    else:
        # Test 3: Register test user with unique timestamp
        import time
        timestamp = str(int(time.time()))
        test_email = f"test{timestamp}@qso.com"
        test_password = "testpwd123"
        test_callsign = f"F4T{timestamp[-4:]}"
        
        success, user_data = tester.test_register(test_email, test_password, test_callsign)
        if not success:
            print("❌ Registration failed, stopping tests")
            return 1
    
    # Test 4: Test duplicate registration (only if we registered a new user)
    if not admin_success:
        tester.test_duplicate_registration(test_email, test_password, test_callsign)
    
    # Test 5: Test logout
    tester.test_logout()
    
    # Test 6: Test login
    success, login_data = tester.test_login(test_email, test_password)
    if not success:
        print("❌ Login failed, stopping tests")
        return 1
    
    # Test 7: Test invalid login
    tester.test_invalid_login("wrong@email.com", "wrongpass")
    
    # Test 8: Test get current user
    tester.test_get_me()
    
    # Test 9: Get initial stats
    tester.test_get_stats()
    
    # Test 10: Get all QSOs (should be empty initially)
    tester.test_get_all_qsos()
    
    # Test 11: Create test QSOs for grouping test
    today = date.today().isoformat()
    qso1_id = tester.test_create_qso("F4ABC", today, 145.500, "Jean")
    qso2_id = tester.test_create_qso("ON4XYZ", today, 14.205, "Pierre")
    qso3_id = tester.test_create_qso("DL1TEST", today, 28.400, "Hans")
    # Add second QSO for F4ABC to test grouping
    qso4_id = tester.test_create_qso("F4ABC", "2024-01-15", 28.200, "Jean")
    
    # Test 12: Test grouped QSOs functionality
    success, grouped_data = tester.test_get_grouped_qsos()
    if success:
        print(f"📊 Grouped QSOs: {len(grouped_data)} unique callsigns")
        for entry in grouped_data:
            print(f"   - {entry.get('callsign')}: {entry.get('total_contacts')} contacts, first: {entry.get('first_contact')}")
    
    # Test 13: Test QSO history for specific callsign
    if qso1_id:
        success, history_data = tester.test_get_qso_history("F4ABC")
        if success:
            print(f"📊 F4ABC History: {history_data.get('total_contacts')} contacts")
            print(f"   First: {history_data.get('first_contact')}, Last: {history_data.get('last_contact')}")
    
    # Test 14: Test search in grouped QSOs
    tester.test_search_grouped_qsos("F4ABC")  # Search by callsign
    tester.test_search_grouped_qsos("Jean")   # Search by name
    tester.test_search_grouped_qsos("DL1")    # Partial callsign search
    
    # Test 15: Test duplicate QSO (same callsign + date)
    if qso1_id:
        tester.test_duplicate_qso("F4ABC", today, 145.500, "Jean")
    
    # Test 16: Get QSOs after creation
    tester.test_get_all_qsos()
    
    # Test 17: Get specific QSO by ID
    if qso1_id:
        tester.test_get_qso_by_id(qso1_id)
    
    # Test 18: Search functionality
    tester.test_search_qsos("F4ABC")  # Search by callsign
    tester.test_search_qsos("Jean")   # Search by name
    tester.test_search_qsos("DL1")    # Partial callsign search
    
    # Test 19: Update QSO
    if qso1_id:
        update_data = {"name": "Jean-Claude", "frequency": 145.525}
        tester.test_update_qso(qso1_id, update_data)
        tester.test_get_qso_by_id(qso1_id)  # Verify update
    
    # Test 20: Get updated stats
    tester.test_get_stats()
    
    # Test 21: Error handling tests
    tester.test_invalid_qso_creation()
    tester.test_nonexistent_qso()
    
    # Test 22: Delete QSO
    if qso2_id:
        tester.test_delete_qso(qso2_id)
        tester.test_get_qso_by_id(qso2_id)  # Should return 404
    
    # Test 23: Final stats check
    tester.test_get_stats()
    
    # Test 24: Test user isolation - login as admin
    print(f"\n🔄 Testing user isolation - switching to admin user...")
    tester.test_logout()  # Logout test user
    
    admin_success, admin_data = tester.test_login("admin@example.com", "admin123")
    if admin_success:
        print("✅ Admin login successful")
        # Admin should not see test user's QSOs
        success, admin_qsos = tester.test_get_all_qsos()
        if success:
            print(f"📊 Admin sees {len(admin_qsos)} QSOs (should be 0 if isolation works)")
        
        # Test admin's grouped QSOs
        success, admin_grouped = tester.test_get_grouped_qsos()
        if success:
            print(f"📊 Admin grouped QSOs: {len(admin_grouped)} unique callsigns")
    
    # Test 25: Test refresh token
    tester.test_refresh_token()
    
    # Cleanup: Login back as test user and clean up QSOs
    print(f"\n🧹 Cleaning up - logging back as test user...")
    tester.test_logout()
    tester.test_login(test_email, test_password)
    
    print(f"🧹 Cleaning up {len(tester.created_qso_ids)} created QSOs...")
    for qso_id in tester.created_qso_ids:
        if qso_id != qso2_id:  # Skip already deleted
            tester.test_delete_qso(qso_id)
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())