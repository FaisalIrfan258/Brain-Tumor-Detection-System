import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import secrets

# Load environment variables
load_dotenv('config.env')

def add_admin_user():
    """Add admin user to the database"""
    
    # Database connection parameters
    db_params = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'brain_tumor_system'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'admin123')
    }
    
    try:
        # Connect to database
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if admin already exists
        cursor.execute("SELECT * FROM admins WHERE username = %s", ('admin',))
        existing_admin = cursor.fetchone()
        
        if existing_admin:
            print("✅ Admin user already exists!")
            return
        
        # Create admin user
        username = 'admin'
        password = 'admin'  # Plain text for demo
        
        # Hash the password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        cursor.execute("""
            INSERT INTO admins (username, password_hash, email, created_at)
            VALUES (%s, %s, %s, NOW())
        """, (username, password_hash, 'admin@braintumor.com'))
        
        conn.commit()
        print("✅ Admin user created successfully!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        
    except Exception as e:
        print(f"❌ Error adding admin user: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_admin_user() 