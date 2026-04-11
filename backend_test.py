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

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

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
    print("🚀 Starting QSO API Tests...")
    print("=" * 50)
    
    tester = QSOAPITester()
    
    # Test 1: Root endpoint
    tester.test_root_endpoint()
    
    # Test 2: Get initial stats
    tester.test_get_stats()
    
    # Test 3: Get all QSOs (should be empty initially)
    tester.test_get_all_qsos()
    
    # Test 4: Create test QSOs
    today = date.today().isoformat()
    qso1_id = tester.test_create_qso("F4ABC", today, 145.500, "Jean")
    qso2_id = tester.test_create_qso("ON4XYZ", today, 14.205, "Pierre")
    qso3_id = tester.test_create_qso("DL1TEST", today, 28.400, "Hans")
    
    # Test 5: Get QSOs after creation
    tester.test_get_all_qsos()
    
    # Test 6: Get specific QSO by ID
    if qso1_id:
        tester.test_get_qso_by_id(qso1_id)
    
    # Test 7: Search functionality
    tester.test_search_qsos("F4ABC")  # Search by callsign
    tester.test_search_qsos("Jean")   # Search by name
    tester.test_search_qsos("DL1")    # Partial callsign search
    
    # Test 8: Update QSO
    if qso1_id:
        update_data = {"name": "Jean-Claude", "frequency": 145.525}
        tester.test_update_qso(qso1_id, update_data)
        tester.test_get_qso_by_id(qso1_id)  # Verify update
    
    # Test 9: Get updated stats
    tester.test_get_stats()
    
    # Test 10: Error handling tests
    tester.test_invalid_qso_creation()
    tester.test_nonexistent_qso()
    
    # Test 11: Delete QSO
    if qso2_id:
        tester.test_delete_qso(qso2_id)
        tester.test_get_qso_by_id(qso2_id)  # Should return 404
    
    # Test 12: Final stats check
    tester.test_get_stats()
    
    # Cleanup remaining QSOs
    print(f"\n🧹 Cleaning up {len(tester.created_qso_ids)} created QSOs...")
    for qso_id in tester.created_qso_ids:
        if qso_id != qso2_id:  # Skip already deleted
            tester.test_delete_qso(qso_id)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())