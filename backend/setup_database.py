import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

load_dotenv('config.env')

def setup_database():
    """Setup PostgreSQL database"""
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', ''),
            port=os.getenv('DB_PORT', '5432')
        )
        
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        db_name = os.getenv('DB_NAME', 'brain_tumor_system')
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f'CREATE DATABASE {db_name}')
            print(f"Database '{db_name}' created successfully!")
        else:
            print(f"Database '{db_name}' already exists!")
        
        cursor.close()
        conn.close()
        
        print("Database setup completed successfully!")
        
    except Exception as e:
        print(f"Error setting up database: {e}")
        print("\nPlease make sure:")
        print("1. PostgreSQL is installed and running")
        print("2. Your database credentials are correct in config.env")
        print("3. The postgres user has permission to create databases")

if __name__ == "__main__":
    setup_database() 