#!/usr/bin/env python3
"""
Test script to debug email sending functionality
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv('config.env')

def test_email_configuration():
    """Test email configuration and connection"""
    print("🧪 Testing Email Configuration")
    print("=" * 40)
    
    # Get email configuration
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    print(f"SMTP Server: {smtp_server}")
    print(f"SMTP Port: {smtp_port}")
    print(f"SMTP Username: {smtp_username}")
    print(f"SMTP Password: {'*' * len(smtp_password) if smtp_password else 'NOT SET'}")
    
    # Check if all required fields are present
    if not all([smtp_server, smtp_username, smtp_password]):
        print("\n❌ Email configuration incomplete!")
        missing_fields = []
        if not smtp_server:
            missing_fields.append("SMTP_SERVER")
        if not smtp_username:
            missing_fields.append("SMTP_USERNAME")
        if not smtp_password:
            missing_fields.append("SMTP_PASSWORD")
        print(f"Missing fields: {', '.join(missing_fields)}")
        return False
    
    print("\n✅ Email configuration looks complete")
    return True

def test_smtp_connection():
    """Test SMTP connection and authentication"""
    print("\n🔌 Testing SMTP Connection")
    print("=" * 30)
    
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    try:
        print(f"Connecting to {smtp_server}:{smtp_port}...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        print("✅ SMTP connection established")
        
        print("Starting TLS...")
        server.starttls()
        print("✅ TLS started successfully")
        
        print(f"Attempting login with username: {smtp_username}")
        server.login(smtp_username, smtp_password)
        print("✅ SMTP login successful")
        
        server.quit()
        print("✅ SMTP connection closed")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication failed: {e}")
        print("\n💡 Common solutions:")
        print("1. Check if the app password is correct")
        print("2. Make sure 2-factor authentication is enabled on Gmail")
        print("3. Generate a new app password from Google Account settings")
        return False
        
    except smtplib.SMTPConnectError as e:
        print(f"❌ SMTP Connection failed: {e}")
        print("\n💡 Common solutions:")
        print("1. Check internet connection")
        print("2. Verify SMTP server and port are correct")
        print("3. Check if firewall is blocking the connection")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print(f"Error type: {type(e)}")
        traceback.print_exc()
        return False

def test_email_sending():
    """Test sending an actual email"""
    print("\n📧 Testing Email Sending")
    print("=" * 25)
    
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    # Test email details
    test_email = smtp_username  # Send to yourself for testing
    test_username = "testuser123"
    test_password = "testpass456"
    test_patient_name = "Test Patient"
    
    try:
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = test_email
        msg['Subject'] = "Test Email - Brain Tumor Detection System"
        
        body = f"""
        Dear {test_patient_name},
        
        This is a test email from the Brain Tumor Detection System.
        
        Your test login credentials are:
        Username: {test_username}
        Password: {test_password}
        
        Please keep these credentials safe and do not share them with anyone.
        
        You can access your portal at: http://localhost:3000/patient/login
        
        Best regards,
        Brain Tumor Detection System Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        print(f"Sending test email to: {test_email}")
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        
        text = msg.as_string()
        server.sendmail(smtp_username, test_email, text)
        server.quit()
        
        print("✅ Test email sent successfully!")
        print(f"📧 Check your inbox at: {test_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send test email: {e}")
        print(f"Error type: {type(e)}")
        traceback.print_exc()
        return False

def test_gmail_app_password():
    """Provide instructions for Gmail app password setup"""
    print("\n📋 Gmail App Password Setup Instructions")
    print("=" * 45)
    print("If you're having issues with Gmail authentication:")
    print()
    print("1. Go to your Google Account settings:")
    print("   https://myaccount.google.com/")
    print()
    print("2. Navigate to Security > 2-Step Verification")
    print("   (Make sure 2-Step Verification is enabled)")
    print()
    print("3. Go to Security > App passwords")
    print("   (You'll need to enter your password again)")
    print()
    print("4. Select 'Mail' as the app and 'Other' as the device")
    print("   (You can name it 'Brain Tumor System')")
    print()
    print("5. Click 'Generate'")
    print()
    print("6. Copy the 16-character password (no spaces)")
    print()
    print("7. Update your config.env file:")
    print("   SMTP_PASSWORD=your_16_character_app_password")
    print()
    print("8. Restart your Flask application")
    print()
    print("💡 Note: App passwords are 16 characters without spaces")
    print("   If your password has spaces, remove them")

def main():
    """Run all email tests"""
    print("🚀 Starting Email Debug Tests")
    print("=" * 50)
    
    # Test 1: Configuration
    config_ok = test_email_configuration()
    
    if not config_ok:
        print("\n❌ Configuration test failed. Please check your config.env file.")
        return
    
    # Test 2: SMTP Connection
    connection_ok = test_smtp_connection()
    
    if not connection_ok:
        print("\n❌ SMTP connection test failed.")
        test_gmail_app_password()
        return
    
    # Test 3: Email Sending
    sending_ok = test_email_sending()
    
    if sending_ok:
        print("\n🎉 All email tests passed!")
        print("✅ Email functionality should work correctly")
    else:
        print("\n❌ Email sending test failed.")
        print("💡 Check the error messages above for solutions")
    
    print("\n" + "=" * 50)
    print("📝 Test Summary:")
    print(f"Configuration: {'✅' if config_ok else '❌'}")
    print(f"SMTP Connection: {'✅' if connection_ok else '❌'}")
    print(f"Email Sending: {'✅' if sending_ok else '❌'}")

if __name__ == "__main__":
    main() 