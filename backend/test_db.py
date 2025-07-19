import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv('config.env')

def test_database_connection():
    """Test database connection"""
    try:
        # Connect to database
        connection = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'brain_tumor_system'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', ''),
            port=os.getenv('DB_PORT', '5432')
        )
        
        print("✅ Database connected successfully!")
        
        # Test cursor
        cursor = connection.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ PostgreSQL version: {version['version']}")
        
        # Test creating a simple table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS test_table (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        connection.commit()
        print("✅ Test table created successfully!")
        
        # Insert test data
        cursor.execute("INSERT INTO test_table (name) VALUES (%s)", ("Test Entry",))
        connection.commit()
        print("✅ Test data inserted successfully!")
        
        # Query test data
        cursor.execute("SELECT * FROM test_table")
        result = cursor.fetchone()
        print(f"✅ Test query successful: {result}")
        
        # Clean up
        cursor.execute("DROP TABLE test_table")
        connection.commit()
        print("✅ Test table cleaned up!")
        
        cursor.close()
        connection.close()
        print("✅ Database connection closed successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

if __name__ == "__main__":
    test_database_connection() 