# Brain Tumor Detection System - API Documentation

## 🚀 Overview

This API provides endpoints for a brain tumor detection system with admin and patient portals. The system uses AI models to analyze brain scan images and generate reports.

## 📋 Table of Contents

- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Testing Examples](#testing-examples)
- [Deployment](#deployment)

---

## 🔧 Base Configuration

### Base URL
```
http://localhost:5000/api
```

### CORS Support
All endpoints support CORS with the following configuration:
- **Origins**: `http://localhost:3000`, `http://127.0.0.1:3000`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With
- **Credentials**: Supported

---

## 🔐 Authentication

Currently using placeholder tokens. In production, implement JWT authentication.

### Admin Authentication
- **Username**: `admin`
- **Password**: `admin`

### Patient Authentication
- Credentials are auto-generated when patients are added
- Sent via email (if configured)

---

## ⚠️ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)",
  "field": "Field name (for validation errors)"
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Invalid credentials
- `NOT_FOUND_ERROR` - Resource not found
- `DATABASE_ERROR` - Database operation failed
- `FILE_UPLOAD_ERROR` - File upload failed
- `MODEL_PREDICTION_ERROR` - AI model prediction failed

---

## 📡 API Endpoints

### 1. Health Check

#### GET `/api/health`
Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "message": "Brain Tumor Detection API is running"
}
```

---

### 2. Admin Endpoints

#### POST `/api/admin/login`
Admin authentication.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "admin_token_placeholder"
}
```

**Error Responses:**
- `400 Bad Request`: Missing username or password
- `401 Unauthorized`: Invalid credentials

---

#### GET `/api/admin/dashboard/stats`
Get dashboard statistics.

**Success Response (200):**
```json
{
  "total_patients": 10,
  "total_scans": 25,
  "total_reports": 8,
  "scan_stats": {
    "total_scans": 25,
    "tumor_count": 12,
    "no_tumor_count": 13
  }
}
```

---

#### GET `/api/admin/patients`
Get all patients.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "patient_id": "P12345678",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 35,
    "gender": "Male",
    "phone": "1234567890",
    "address": "123 Main St",
    "username": "patient1234",
    "password_hash": "hashed_password",
    "created_at": "2025-07-19T10:00:00Z",
    "updated_at": "2025-07-19T10:00:00Z"
  }
]
```

---

#### POST `/api/admin/patients`
Add a new patient.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "age": "number (optional, 0-150)",
  "gender": "string (optional) - Male/Female/Other",
  "phone": "string (optional)",
  "address": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "patient_id": "P12345678",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 35,
    "gender": "Male",
    "phone": "1234567890",
    "address": "123 Main St",
    "created_at": "2025-07-19T10:00:00Z",
    "username": "patient1234",
    "password": "generated_password",
    "email_sent": true
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields, invalid email, age, or gender
- `500 Internal Server Error`: Database error or email sending failure

---

#### GET `/api/admin/scans`
Get all scans.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "scan_id": "S12345678",
    "original_filename": "scan1.jpg",
    "original_path": "/uploads/scan1.jpg",
    "heatmap_path": "/uploads/heatmap1.jpg",
    "overlay_path": "/uploads/overlay1.jpg",
    "prediction": "Tumor",
    "confidence": 0.95,
    "probability": 0.95,
    "report_path": "/reports/report1.pdf",
    "created_at": "2025-07-19T10:00:00Z"
  }
]
```

---

#### POST `/api/admin/scans/upload`
Upload and analyze brain scan images.

**Request Body (multipart/form-data):**
```
patient_id: number (required)
files: array of image files (required) - PNG, JPG, JPEG
```

**Success Response (200):**
```json
{
  "success": true,
  "scan_ids": ["S12345678", "S87654321"]
}
```

**Error Responses:**
- `400 Bad Request`: No files uploaded, missing patient_id, or invalid file type
- `500 Internal Server Error`: Analysis failure or database error

---

#### GET `/api/admin/reports`
Get all reports.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "report_id": "R12345678",
    "report_path": "/reports/report1.pdf",
    "scan_count": 3,
    "tumor_count": 1,
    "no_tumor_count": 2,
    "created_at": "2025-07-19T10:00:00Z"
  }
]
```

---

### 3. Patient Endpoints

#### POST `/api/patient/login`
Patient authentication.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "patient_id": "P12345678",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing username or password
- `401 Unauthorized`: Invalid credentials

---

#### GET `/api/patient/{patient_id}`
Get patient information.

**Path Parameters:**
- `patient_id`: number (required)

**Success Response (200):**
```json
{
  "id": 1,
  "patient_id": "P12345678",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 35,
  "gender": "Male",
  "phone": "1234567890",
  "address": "123 Main St",
  "username": "patient1234",
  "password_hash": "hashed_password",
  "created_at": "2025-07-19T10:00:00Z",
  "updated_at": "2025-07-19T10:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Patient not found

---

#### GET `/api/patient/{patient_id}/scans`
Get all scans for a patient.

**Path Parameters:**
- `patient_id`: number (required)

**Success Response (200):**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "scan_id": "S12345678",
    "original_filename": "scan1.jpg",
    "original_path": "/uploads/scan1.jpg",
    "heatmap_path": "/uploads/heatmap1.jpg",
    "overlay_path": "/uploads/overlay1.jpg",
    "prediction": "Tumor",
    "confidence": 0.95,
    "probability": 0.95,
    "report_path": "/reports/report1.pdf",
    "created_at": "2025-07-19T10:00:00Z"
  }
]
```

**Error Responses:**
- `404 Not Found`: Patient not found

---

#### GET `/api/patient/{patient_id}/reports`
Get all reports for a patient.

**Path Parameters:**
- `patient_id`: number (required)

**Success Response (200):**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "report_id": "R12345678",
    "report_path": "/reports/report1.pdf",
    "scan_count": 3,
    "tumor_count": 1,
    "no_tumor_count": 2,
    "created_at": "2025-07-19T10:00:00Z"
  }
]
```

**Error Responses:**
- `404 Not Found`: Patient not found

---

### 4. Report Endpoints

#### POST `/api/report/generate`
Generate PDF report for a patient.

**Request Body:**
```json
{
  "patient_id": "number (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "report_id": "R12345678",
    "report_path": "/reports/report1.pdf"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing patient_id
- `404 Not Found`: Patient not found or no scans available
- `500 Internal Server Error`: Report generation failure

---

#### GET `/api/report/download/{filename}`
Download a report file.

**Path Parameters:**
- `filename`: string (required) - Report filename

**Success Response (200):**
- File download (PDF)

**Error Response (404):**
```json
{
  "success": false,
  "error": "Report not found"
}
```

---

### 5. CORS Preflight

#### OPTIONS `/api/{path}`
Handle CORS preflight requests for all endpoints.

**Response (200):**
```json
{
  "status": "ok"
}
```

---

## 🗄️ Database Schema

### Patients Table
```sql
CREATE TABLE patients (
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
);
```

### Scans Table
```sql
CREATE TABLE scans (
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
);
```

### Reports Table
```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    report_id VARCHAR(50) UNIQUE NOT NULL,
    report_path VARCHAR(500) NOT NULL,
    scan_count INTEGER DEFAULT 0,
    tumor_count INTEGER DEFAULT 0,
    no_tumor_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Admins Table
```sql
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧪 Testing Examples

### Using curl

#### Health Check
```bash
curl http://localhost:5000/api/health
```

#### Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

#### Add Patient
```bash
curl -X POST http://localhost:5000/api/admin/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 35,
    "gender": "Male",
    "phone": "1234567890",
    "address": "123 Main St"
  }'
```

#### Upload Scan
```bash
curl -X POST http://localhost:5000/api/admin/scans/upload \
  -F "patient_id=1" \
  -F "files=@scan1.jpg" \
  -F "files=@scan2.jpg"
```

### Using PowerShell

#### Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET
```

#### Admin Login
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/login" -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username": "admin", "password": "admin"}'
```

#### Add Patient
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/patients" -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 35,
    "gender": "Male",
    "phone": "1234567890",
    "address": "123 Main St"
  }'
```

---

## 📁 File Upload Guidelines

### Supported File Types
- PNG
- JPG/JPEG

### File Size Limits
- Maximum file size: 10MB per file
- Maximum files per request: 10 files

### File Naming
- Files are automatically renamed with UUID prefix
- Original filename is preserved in database

---

## 🔒 Security Considerations

1. **Authentication**: Implement JWT tokens in production
2. **Input Validation**: All inputs are validated and sanitized
3. **File Upload**: Only allowed file types are accepted
4. **CORS**: Configured for specific origins
5. **Error Handling**: Sensitive information is not exposed in error messages
6. **Database**: Use parameterized queries to prevent SQL injection

---

## 📊 Environment Variables

Create a `config.env` file with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=brain_tumor_system
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432

# File Upload Configuration
UPLOAD_FOLDER=uploads
REPORT_FOLDER=reports
MAX_CONTENT_LENGTH=16777216

# Email Configuration (Optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

---

## 🚀 Deployment

### Prerequisites
- Python 3.8+
- PostgreSQL
- Required Python packages (see requirements.txt)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp config.env.example config.env
# Edit config.env with your settings

# Set up database
python setup_database.py

# Run the application
python app.py
```

### Production Deployment
1. Use a production WSGI server (Gunicorn, uWSGI)
2. Set up reverse proxy (Nginx)
3. Configure SSL/TLS certificates
4. Set up proper logging
5. Implement rate limiting
6. Use environment variables for sensitive data

---

## 📝 Dependencies

### Core Dependencies
- Flask 2.3.3
- Flask-CORS
- psycopg2-binary
- python-dotenv

### AI/ML Dependencies
- PyTorch
- torchvision
- OpenCV
- NumPy
- PIL (Pillow)
- matplotlib

### Report Generation
- ReportLab

### Email
- smtplib (built-in)

---

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check database credentials in config.env
   - Ensure PostgreSQL is running
   - Verify database exists

2. **Model Loading Error**
   - Ensure model file exists in models/ directory
   - Check file permissions

3. **File Upload Error**
   - Verify upload directory exists and is writable
   - Check file size limits
   - Ensure file type is supported

4. **CORS Error**
   - Verify frontend URL is in CORS origins
   - Check browser console for specific errors

### Logs
Check application logs for detailed error information:
```bash
python app.py 2>&1 | tee app.log
```

---

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment configuration
4. Test with provided examples

---

## 📄 License

This project is licensed under the MIT License. 