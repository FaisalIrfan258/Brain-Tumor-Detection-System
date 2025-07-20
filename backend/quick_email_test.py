#!/usr/bin/env python3
"""
Quick test to verify email sending works with a new patient
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

def test_patient_creation_with_email():
    """Test creating a patient and verify email is sent"""
    print("🧪 Testing Patient Creation with Email")
    print("=" * 45)
    
    # Create test patient data
    patient_data = {
        "name": "Email Test Patient",
        "email": f"email_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
        "age": 30,
        "gender": "Female",
        "phone": "9876543210",
        "address": "Test Address for Email Verification"
    }
    
    print(f"Creating patient: {patient_data['name']}")
    print(f"Email: {patient_data['email']}")
    
    try:
        response = requests.post(f"{BASE_URL}/admin/patients", json=patient_data)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success') and result.get('data'):
                patient = result['data']
                print(f"\n✅ Patient created successfully!")
                print(f"   Patient ID: {patient['patient_id']}")
                print(f"   Username: {patient['username']}")
                print(f"   Password: {patient['password']}")
                print(f"   Email Sent: {'✅ Yes' if patient['email_sent'] else '❌ No'}")
                
                if patient['email_sent']:
                    print(f"\n📧 Email should have been sent to: {patient['email']}")
                    print("   Check your email inbox (and spam folder)")
                    print("   The email contains the login credentials")
                else:
                    print(f"\n❌ Email was not sent successfully")
                    print("   Check the backend logs for email errors")
                    print("   Verify your SMTP configuration in config.env")
                
                return True
            else:
                print(f"❌ Failed to create patient: {result.get('error')}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Quick Email Test")
    print("=" * 25)
    print("Make sure your Flask backend is running on http://localhost:5000")
    print("And you have updated the SMTP_PASSWORD in config.env")
    print()
    
    test_patient_creation_with_email()
    
    print("\n" + "=" * 25)
    print("📝 Next Steps:")
    print("1. Check your email inbox for the credentials")
    print("2. Try logging in with the patient credentials")
    print("3. If email didn't work, check the backend logs") 