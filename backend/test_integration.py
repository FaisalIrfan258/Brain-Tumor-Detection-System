import requests
import json

BASE_URL = "http://localhost:3000"

def test_api_endpoints():
    """Test the main API endpoints"""
    
    print("🧪 Testing Backend API Integration...")
    print("=" * 50)
    
    # Test 1: Admin Login
    print("\n1. Testing Admin Login...")
    try:
        response = requests.post(f"{BASE_URL}/admin/login", json={
            "username": "admin",
            "password": "admin"
        })
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Admin login successful")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ❌ Admin login failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Get Dashboard Stats
    print("\n2. Testing Dashboard Stats...")
    try:
        response = requests.get(f"{BASE_URL}/admin/dashboard/stats")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Dashboard stats retrieved")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ❌ Failed to get stats: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Get Patients
    print("\n3. Testing Get Patients...")
    try:
        response = requests.get(f"{BASE_URL}/admin/patients")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Patients retrieved")
            patients = response.json()
            print(f"   Found {len(patients)} patients")
        else:
            print(f"   ❌ Failed to get patients: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Add Patient
    print("\n4. Testing Add Patient...")
    try:
        patient_data = {
            "name": "Test Patient",
            "email": "test@example.com",
            "age": 30,
            "gender": "Male",
            "phone": "1234567890",
            "address": "Test Address"
        }
        response = requests.post(f"{BASE_URL}/admin/patients", json=patient_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Patient added successfully")
            result = response.json()
            print(f"   Patient ID: {result.get('patient_id')}")
            print(f"   Username: {result.get('username')}")
            print(f"   Password: {result.get('password')}")
        else:
            print(f"   ❌ Failed to add patient: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Integration Test Complete!")

if __name__ == "__main__":
    test_api_endpoints() 