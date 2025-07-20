import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import uuid
import hashlib
import secrets
import string

load_dotenv('config.env')

class Database:
    def __init__(self):
        self.connection = None
        self.connect()
        self.create_tables()
    
    def connect(self):
        try:
            # Check if we're using Neon (SSL required)
            ssl_mode = os.getenv('DB_SSL_MODE')
            
            if ssl_mode:
                # Neon database connection with SSL and connection pooling
                self.connection = psycopg2.connect(
                    host=os.getenv('DB_HOST', 'localhost'),
                    database=os.getenv('DB_NAME', 'brain_tumor_system'),
                    user=os.getenv('DB_USER', 'postgres'),
                    password=os.getenv('DB_PASSWORD', ''),
                    port=os.getenv('DB_PORT', '5432'),
                    sslmode=ssl_mode,
                    # Connection pooling settings for Neon
                    keepalives_idle=30,
                    keepalives_interval=10,
                    keepalives_count=5
                )
            else:
                # Local database connection
                self.connection = psycopg2.connect(
                    host=os.getenv('DB_HOST', 'localhost'),
                    database=os.getenv('DB_NAME', 'brain_tumor_system'),
                    user=os.getenv('DB_USER', 'postgres'),
                    password=os.getenv('DB_PASSWORD', ''),
                    port=os.getenv('DB_PORT', '5432')
                )
            
            print("Database connected successfully!")
        except Exception as e:
            print(f"Database connection error: {e}")
    
    def ensure_connection(self):
        """Ensure database connection is active, reconnect if needed"""
        try:
            if self.connection is None or self.connection.closed:
                print("Reconnecting to database...")
                self.connect()
            else:
                # Test the connection
                cursor = self.connection.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
        except Exception as e:
            print(f"Connection test failed, reconnecting: {e}")
            self.connect()
    
    def create_tables(self):
        try:
            cursor = self.connection.cursor()
            
            # Create patients table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS patients (
                    id SERIAL PRIMARY KEY,
                    patient_id VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    age INTEGER,
                    gender VARCHAR(10),
                    phone VARCHAR(20),
                    address TEXT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create scans table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scans (
                    id SERIAL PRIMARY KEY,
                    patient_id INTEGER REFERENCES patients(id),
                    scan_id VARCHAR(50) UNIQUE NOT NULL,
                    original_filename VARCHAR(255) NOT NULL,
                    original_path VARCHAR(500),
                    heatmap_path VARCHAR(500),
                    overlay_path VARCHAR(500),
                    prediction VARCHAR(20) NOT NULL,
                    confidence DECIMAL(5,3),
                    probability DECIMAL(5,3),
                    report_path VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create reports table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    id SERIAL PRIMARY KEY,
                    patient_id INTEGER REFERENCES patients(id),
                    report_id VARCHAR(50) UNIQUE NOT NULL,
                    report_path VARCHAR(500) NOT NULL,
                    scan_count INTEGER DEFAULT 0,
                    tumor_count INTEGER DEFAULT 0,
                    no_tumor_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create admin table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS admins (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            self.connection.commit()
            cursor.close()
            print("Tables created successfully!")
            
        except Exception as e:
            print(f"Error creating tables: {e}")
    
    def generate_patient_credentials(self):
        """Generate unique username and password for patient"""
        # Generate username: first 3 letters of name + random 4 digits
        username = f"patient{secrets.token_hex(2)}"
        
        # Generate password: 8 characters with letters and numbers
        alphabet = string.ascii_letters + string.digits
        password = ''.join(secrets.choice(alphabet) for i in range(8))
        
        return username, password
    
    def hash_password(self, password):
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def add_patient(self, name, email, age=None, gender=None, phone=None, address=None):
        """Add a new patient to the database"""
        try:
            # Ensure connection is active
            self.ensure_connection()
            
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            # Generate unique patient ID
            patient_id = f"P{str(uuid.uuid4())[:8].upper()}"
            
            # Generate credentials
            username, password = self.generate_patient_credentials()
            password_hash = self.hash_password(password)
            
            cursor.execute("""
                INSERT INTO patients (patient_id, name, email, age, gender, phone, address, username, password_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, patient_id, name, email, age, gender, phone, address, username, password_hash, created_at
            """, (patient_id, name, email, age, gender, phone, address, username, password_hash))
            
            result = cursor.fetchone()
            self.connection.commit()
            cursor.close()
            
            return {
                'id': result['id'],
                'patient_id': result['patient_id'],
                'name': result['name'],
                'email': result['email'],
                'age': result['age'],
                'gender': result['gender'],
                'phone': result['phone'],
                'address': result['address'],
                'username': username,
                'password': password,
                'created_at': result['created_at'].isoformat() if result['created_at'] else None
            }
            
        except Exception as e:
            print(f"Error adding patient: {e}")
            # Try to reconnect and retry once
            try:
                print("Attempting to reconnect and retry...")
                self.connect()
                return self.add_patient(name, email, age, gender, phone, address)
            except Exception as retry_error:
                print(f"Retry failed: {retry_error}")
                return None
    
    def get_patient_by_credentials(self, username, password):
        """Authenticate patient login"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            password_hash = self.hash_password(password)
            
            cursor.execute("""
                SELECT * FROM patients WHERE username = %s AND password_hash = %s
            """, (username, password_hash))
            
            patient = cursor.fetchone()
            cursor.close()
            
            return patient
            
        except Exception as e:
            print(f"Error authenticating patient: {e}")
            return None
    
    def get_patient_by_id(self, patient_id):
        """Get patient by ID"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM patients WHERE id = %s
            """, (patient_id,))
            
            patient = cursor.fetchone()
            cursor.close()
            
            return patient
            
        except Exception as e:
            print(f"Error getting patient: {e}")
            return None
    
    def get_all_patients(self):
        """Get all patients"""
        try:
            # Ensure connection is active
            self.ensure_connection()
            
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM patients ORDER BY created_at DESC
            """)
            
            patients = cursor.fetchall()
            cursor.close()
            
            return patients
            
        except Exception as e:
            print(f"Error getting patients: {e}")
            # Try to reconnect and retry once
            try:
                print("Attempting to reconnect and retry get patients...")
                self.connect()
                return self.get_all_patients()
            except Exception as retry_error:
                print(f"Retry failed: {retry_error}")
                return []
    
    def add_scan(self, patient_id, original_filename, original_path, heatmap_path, overlay_path, 
                 prediction, confidence, probability, report_path=None, original_public_id=None, 
                 heatmap_public_id=None, overlay_public_id=None):
        """Add a new scan record"""
        try:
            # Ensure connection is active
            self.ensure_connection()
            
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            # Generate unique scan ID
            scan_id = f"S{str(uuid.uuid4())[:8].upper()}"
            
            cursor.execute("""
                INSERT INTO scans (patient_id, scan_id, original_filename, original_path, 
                                 heatmap_path, overlay_path, prediction, confidence, probability, report_path)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, scan_id
            """, (patient_id, scan_id, original_filename, original_path, heatmap_path, 
                  overlay_path, prediction, confidence, probability, report_path))
            
            result = cursor.fetchone()
            self.connection.commit()
            cursor.close()
            
            return result
            
        except Exception as e:
            print(f"Error adding scan: {e}")
            # Try to reconnect and retry once
            try:
                print("Attempting to reconnect and retry add scan...")
                self.connect()
                return self.add_scan(patient_id, original_filename, original_path, heatmap_path, 
                                   overlay_path, prediction, confidence, probability, report_path,
                                   original_public_id, heatmap_public_id, overlay_public_id)
            except Exception as retry_error:
                print(f"Retry failed: {retry_error}")
                return None
    
    def get_patient_scans(self, patient_id):
        """Get all scans for a patient"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM scans WHERE patient_id = %s ORDER BY created_at DESC
            """, (patient_id,))
            
            scans = cursor.fetchall()
            cursor.close()
            
            return scans
            
        except Exception as e:
            print(f"Error getting patient scans: {e}")
            return []
    
    def add_report(self, patient_id, report_path, scan_count, tumor_count, no_tumor_count):
        """Add a new report record"""
        try:
            # Ensure connection is active
            self.ensure_connection()
            
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            # Generate unique report ID
            report_id = f"R{str(uuid.uuid4())[:8].upper()}"
            
            cursor.execute("""
                INSERT INTO reports (patient_id, report_id, report_path, scan_count, tumor_count, no_tumor_count)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, report_id
            """, (patient_id, report_id, report_path, scan_count, tumor_count, no_tumor_count))
            
            result = cursor.fetchone()
            self.connection.commit()
            cursor.close()
            
            return result
            
        except Exception as e:
            print(f"Error adding report: {e}")
            # Try to reconnect and retry once
            try:
                print("Attempting to reconnect and retry add report...")
                self.connect()
                return self.add_report(patient_id, report_path, scan_count, tumor_count, no_tumor_count)
            except Exception as retry_error:
                print(f"Retry failed: {retry_error}")
                return None
    
    def get_patient_reports(self, patient_id):
        """Get all reports for a patient"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM reports WHERE patient_id = %s ORDER BY created_at DESC
            """, (patient_id,))
            
            reports = cursor.fetchall()
            cursor.close()
            
            return reports
            
        except Exception as e:
            print(f"Error getting patient reports: {e}")
            return []
    
    def get_dashboard_stats(self):
        """Get dashboard statistics"""
        try:
            # Ensure connection is active
            self.ensure_connection()
            
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            # Total patients
            cursor.execute("SELECT COUNT(*) as total_patients FROM patients")
            total_patients = cursor.fetchone()['total_patients']
            
            # Total scans
            cursor.execute("SELECT COUNT(*) as total_scans FROM scans")
            total_scans = cursor.fetchone()['total_scans']
            
            # Total reports
            cursor.execute("SELECT COUNT(*) as total_reports FROM reports")
            total_reports = cursor.fetchone()['total_reports']
            
            # Tumor detection stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_scans,
                    COALESCE(SUM(CASE WHEN prediction = 'Tumor' THEN 1 ELSE 0 END), 0) as tumor_count,
                    COALESCE(SUM(CASE WHEN prediction = 'No Tumor' THEN 1 ELSE 0 END), 0) as no_tumor_count
                FROM scans
            """)
            scan_stats = cursor.fetchone()
            
            cursor.close()
            
            return {
                'total_patients': total_patients or 0,
                'total_scans': total_scans or 0,
                'total_reports': total_reports or 0,
                'scan_stats': scan_stats or {
                    'total_scans': 0,
                    'tumor_count': 0,
                    'no_tumor_count': 0
                }
            }
            
        except Exception as e:
            print(f"Error getting dashboard stats: {e}")
            # Try to reconnect and retry once
            try:
                print("Attempting to reconnect and retry dashboard stats...")
                self.connect()
                return self.get_dashboard_stats()
            except Exception as retry_error:
                print(f"Retry failed: {retry_error}")
                return {}

    def get_admin_by_credentials(self, username, password):
        """Authenticate admin login"""
        try:
            # Ensure connection is active
            self.ensure_connection()
            
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            password_hash = self.hash_password(password)
            
            print(f"🔍 Database: Checking admin credentials")
            print(f"   Username: {username}")
            print(f"   Password hash: {password_hash}")
            
            cursor.execute("""
                SELECT * FROM admins WHERE username = %s AND password_hash = %s
            """, (username, password_hash))
            
            admin = cursor.fetchone()
            cursor.close()
            
            print(f"🔍 Database: Admin found: {admin is not None}")
            if admin:
                print(f"   Admin ID: {admin['id']}")
            
            return admin
            
        except Exception as e:
            print(f"Error authenticating admin: {e}")
            # Try to reconnect and retry once
            try:
                print("Attempting to reconnect and retry admin auth...")
                self.connect()
                return self.get_admin_by_credentials(username, password)
            except Exception as retry_error:
                print(f"Retry failed: {retry_error}")
                return None

    def get_all_scans(self):
        """Get all scans with patient information"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT s.*, p.name as patient_name, p.patient_id as patient_identifier
                FROM scans s
                JOIN patients p ON s.patient_id = p.id
                ORDER BY s.created_at DESC
            """)
            
            scans = cursor.fetchall()
            cursor.close()
            
            return scans
            
        except Exception as e:
            print(f"Error getting all scans: {e}")
            return []

    def get_all_reports(self):
        """Get all reports with patient information"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT r.*, p.name as patient_name, p.patient_id as patient_identifier
                FROM reports r
                JOIN patients p ON r.patient_id = p.id
                ORDER BY r.created_at DESC
            """)
            
            reports = cursor.fetchall()
            cursor.close()
            
            return reports
            
        except Exception as e:
            print(f"Error getting all reports: {e}")
            return []
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()

# Initialize database
db = Database() 