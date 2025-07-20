#!/usr/bin/env python3
"""
Test script to verify all fixes are working correctly
"""

import requests
import json
import os
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

def test_health_check():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_admin_login():
    """Test admin login"""
    print("🔍 Testing admin login...")
    try:
        data = {"username": "admin", "password": "admin"}
        response = requests.post(f"{BASE_URL}/admin/login", json=data)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Admin login passed")
                return True
            else:
                print(f"❌ Admin login failed: {result.get('error')}")
                return False
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        return False

def test_add_patient():
    """Test adding a patient"""
    print("🔍 Testing add patient...")
    try:
        # Generate unique email
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        email = f"test_patient_{timestamp}@example.com"
        
        data = {
            "name": "Test Patient",
            "email": email,
            "age": 30,
            "gender": "Male",
            "phone": "1234567890",
            "address": "Test Address"
        }
        
        response = requests.post(f"{BASE_URL}/admin/patients", json=data)
        if response.status_code == 200:
            result = response.json()
            if result.get('success') and result.get('data'):
                patient_data = result['data']
                print(f"✅ Patient added successfully")
                print(f"   Patient ID: {patient_data['patient_id']}")
                print(f"   Username: {patient_data['username']}")
                print(f"   Password: {patient_data['password']}")
                print(f"   Email sent: {patient_data['email_sent']}")
                return patient_data['id']
            else:
                print(f"❌ Add patient failed: {result.get('error')}")
                return None
        else:
            print(f"❌ Add patient failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Add patient error: {e}")
        return None

def test_get_patients():
    """Test getting all patients"""
    print("🔍 Testing get patients...")
    try:
        response = requests.get(f"{BASE_URL}/admin/patients")
        if response.status_code == 200:
            patients = response.json()
            print(f"✅ Get patients passed - Found {len(patients)} patients")
            return True
        else:
            print(f"❌ Get patients failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get patients error: {e}")
        return False

def test_get_patient_by_id(patient_id):
    """Test getting specific patient"""
    print(f"🔍 Testing get patient by ID {patient_id}...")
    try:
        response = requests.get(f"{BASE_URL}/admin/patients/{patient_id}")
        if response.status_code == 200:
            patient = response.json()
            print(f"✅ Get patient by ID passed - {patient['name']}")
            return True
        else:
            print(f"❌ Get patient by ID failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get patient by ID error: {e}")
        return False

def test_get_patient_scans(patient_id):
    """Test getting patient scans"""
    print(f"🔍 Testing get patient scans for ID {patient_id}...")
    try:
        response = requests.get(f"{BASE_URL}/admin/patients/{patient_id}/scans")
        if response.status_code == 200:
            scans = response.json()
            print(f"✅ Get patient scans passed - Found {len(scans)} scans")
            return True
        else:
            print(f"❌ Get patient scans failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get patient scans error: {e}")
        return False

def test_dashboard_stats():
    """Test dashboard stats"""
    print("🔍 Testing dashboard stats...")
    try:
        response = requests.get(f"{BASE_URL}/admin/dashboard/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Dashboard stats passed")
            print(f"   Total patients: {stats['total_patients']}")
            print(f"   Total scans: {stats['total_scans']}")
            print(f"   Total reports: {stats['total_reports']}")
            return True
        else:
            print(f"❌ Dashboard stats failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Dashboard stats error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting comprehensive test suite...")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("Admin Login", test_admin_login),
        ("Add Patient", test_add_patient),
        ("Get Patients", test_get_patients),
        ("Dashboard Stats", test_dashboard_stats),
    ]
    
    results = {}
    patient_id = None
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 30)
        
        if test_name == "Add Patient":
            patient_id = test_func()
            results[test_name] = patient_id is not None
        else:
            results[test_name] = test_func()
    
    # Additional tests that depend on patient_id
    if patient_id:
        print(f"\n📋 Running: Get Patient by ID")
        print("-" * 30)
        results["Get Patient by ID"] = test_get_patient_by_id(patient_id)
        
        print(f"\n📋 Running: Get Patient Scans")
        print("-" * 30)
        results["Get Patient Scans"] = test_get_patient_scans(patient_id)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The fixes are working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main() 