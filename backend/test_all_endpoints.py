#!/usr/bin/env python3
"""
Comprehensive API Test Script
Tests all endpoints of the Brain Tumor Detection System API
"""

import requests
import json
import os
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_EMAIL = f"test_{int(time.time())}@example.com"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, endpoint, method, success, response=None, error=None):
        """Log test results"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "endpoint": endpoint,
            "method": method,
            "success": success,
            "status_code": response.status_code if response else None,
            "error": str(error) if error else None
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {method} {endpoint}")
        if error:
            print(f"   Error: {error}")
        if response and response.status_code != 200:
            print(f"   Response: {response.text[:200]}...")
        print()

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            success = response.status_code == 200
            self.log_test("/health", "GET", success, response)
            return success
        except Exception as e:
            self.log_test("/health", "GET", False, error=e)
            return False

    def test_admin_login(self):
        """Test admin login"""
        try:
            data = {"username": "admin", "password": "admin"}
            response = self.session.post(f"{BASE_URL}/admin/login", json=data)
            success = response.status_code == 200
            self.log_test("/admin/login", "POST", success, response)
            return success
        except Exception as e:
            self.log_test("/admin/login", "POST", False, error=e)
            return False

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/dashboard/stats")
            success = response.status_code == 200
            self.log_test("/admin/dashboard/stats", "GET", success, response)
            return success
        except Exception as e:
            self.log_test("/admin/dashboard/stats", "GET", False, error=e)
            return False

    def test_get_patients(self):
        """Test get all patients"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/patients")
            success = response.status_code == 200
            self.log_test("/admin/patients", "GET", success, response)
            return success
        except Exception as e:
            self.log_test("/admin/patients", "GET", False, error=e)
            return False

    def test_add_patient(self):
        """Test add patient"""
        try:
            data = {
                "name": "Test Patient",
                "email": TEST_EMAIL,
                "age": 30,
                "gender": "Male",
                "phone": "1234567890",
                "address": "Test Address"
            }
            response = self.session.post(f"{BASE_URL}/admin/patients", json=data)
            success = response.status_code == 200
            self.log_test("/admin/patients", "POST", success, response)
            
            if success:
                result = response.json()
                return result.get('data', {}).get('id')
            return None
        except Exception as e:
            self.log_test("/admin/patients", "POST", False, error=e)
            return None

    def test_get_patient_info(self, patient_id):
        """Test get patient info"""
        try:
            response = self.session.get(f"{BASE_URL}/patient/{patient_id}")
            success = response.status_code == 200
            self.log_test(f"/patient/{patient_id}", "GET", success, response)
            return success
        except Exception as e:
            self.log_test(f"/patient/{patient_id}", "GET", False, error=e)
            return False

    def test_patient_login(self, username, password):
        """Test patient login"""
        try:
            data = {"username": username, "password": password}
            response = self.session.post(f"{BASE_URL}/patient/login", json=data)
            success = response.status_code == 200
            self.log_test("/patient/login", "POST", success, response)
            return success
        except Exception as e:
            self.log_test("/patient/login", "POST", False, error=e)
            return False

    def test_get_patient_scans(self, patient_id):
        """Test get patient scans"""
        try:
            response = self.session.get(f"{BASE_URL}/patient/{patient_id}/scans")
            success = response.status_code == 200
            self.log_test(f"/patient/{patient_id}/scans", "GET", success, response)
            return success
        except Exception as e:
            self.log_test(f"/patient/{patient_id}/scans", "GET", False, error=e)
            return False

    def test_get_patient_reports(self, patient_id):
        """Test get patient reports"""
        try:
            response = self.session.get(f"{BASE_URL}/patient/{patient_id}/reports")
            success = response.status_code == 200
            self.log_test(f"/patient/{patient_id}/reports", "GET", success, response)
            return success
        except Exception as e:
            self.log_test(f"/patient/{patient_id}/reports", "GET", False, error=e)
            return False

    def test_get_all_scans(self):
        """Test get all scans"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/scans")
            success = response.status_code == 200
            self.log_test("/admin/scans", "GET", success, response)
            return success
        except Exception as e:
            self.log_test("/admin/scans", "GET", False, error=e)
            return False

    def test_get_all_reports(self):
        """Test get all reports"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/reports")
            success = response.status_code == 200
            self.log_test("/admin/reports", "GET", success, response)
            return success
        except Exception as e:
            self.log_test("/admin/reports", "GET", False, error=e)
            return False

    def test_generate_report(self, patient_id):
        """Test generate report"""
        try:
            data = {"patient_id": patient_id}
            response = self.session.post(f"{BASE_URL}/report/generate", json=data)
            success = response.status_code == 200
            self.log_test("/report/generate", "POST", success, response)
            return success
        except Exception as e:
            self.log_test("/report/generate", "POST", False, error=e)
            return False

    def test_validation_errors(self):
        """Test validation error handling"""
        print("\n🧪 Testing Validation Errors...")
        
        # Test missing required fields
        try:
            data = {"name": "Test"}  # Missing email
            response = self.session.post(f"{BASE_URL}/admin/patients", json=data)
            success = response.status_code == 400
            self.log_test("/admin/patients (validation)", "POST", success, response)
        except Exception as e:
            self.log_test("/admin/patients (validation)", "POST", False, error=e)

        # Test invalid email
        try:
            data = {"name": "Test", "email": "invalid-email"}
            response = self.session.post(f"{BASE_URL}/admin/patients", json=data)
            success = response.status_code == 400
            self.log_test("/admin/patients (invalid email)", "POST", success, response)
        except Exception as e:
            self.log_test("/admin/patients (invalid email)", "POST", False, error=e)

        # Test invalid age
        try:
            data = {"name": "Test", "email": "test@example.com", "age": 200}
            response = self.session.post(f"{BASE_URL}/admin/patients", json=data)
            success = response.status_code == 400
            self.log_test("/admin/patients (invalid age)", "POST", success, response)
        except Exception as e:
            self.log_test("/admin/patients (invalid age)", "POST", False, error=e)

    def test_not_found_errors(self):
        """Test not found error handling"""
        print("\n🧪 Testing Not Found Errors...")
        
        # Test non-existent patient
        try:
            response = self.session.get(f"{BASE_URL}/patient/99999")
            success = response.status_code == 404
            self.log_test("/patient/99999 (not found)", "GET", success, response)
        except Exception as e:
            self.log_test("/patient/99999 (not found)", "GET", False, error=e)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting API Tests...")
        print("=" * 50)
        
        # Basic endpoints
        self.test_health_check()
        self.test_admin_login()
        self.test_dashboard_stats()
        self.test_get_patients()
        
        # Patient management
        patient_id = self.test_add_patient()
        if patient_id:
            self.test_get_patient_info(patient_id)
            
            # Get patient credentials from the add response
            # This would need to be stored from the add_patient response
            # For now, we'll skip patient login test
            
            self.test_get_patient_scans(patient_id)
            self.test_get_patient_reports(patient_id)
            self.test_generate_report(patient_id)
        
        # Admin endpoints
        self.test_get_all_scans()
        self.test_get_all_reports()
        
        # Error handling tests
        self.test_validation_errors()
        self.test_not_found_errors()
        
        # Generate report
        self.generate_test_report()
        
        print("=" * 50)
        print("🏁 API Tests Completed!")
        
    def generate_test_report(self):
        """Generate a test report"""
        print("\n📊 Test Results Summary:")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['method']} {result['endpoint']}: {result['error']}")
        
        # Save results to file
        with open("api_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: api_test_results.json")

def main():
    """Main function"""
    tester = APITester()
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 