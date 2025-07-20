# Brain Tumor Detection System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently using placeholder tokens. In production, implement JWT authentication.

## CORS Support
All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`
- `Access-Control-Allow-Credentials: true`

---

## 1. Health Check

### GET `/api/health`
Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "message": "Brain Tumor Detection API is running"
}
```

---

## 2. Admin Endpoints

### POST `/api/admin/login`
Admin authentication.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
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
- `500 Internal Server Error`: Server error

---

### GET `/api/admin/dashboard/stats`
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

**Error Response (500):**
```json
{
  "error": "Failed to retrieve dashboard statistics"
}
```

---

### GET `/api/admin/patients`
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

**Error Response (500):**
```json
{
  "error": "Failed to retrieve patients"
}
```

---

### POST `/api/admin/patients`
Add a new patient.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "age": "number (optional)",
  "gender": "string (optional) - Male/Female/Other",
  "phone": "string (optional)",
  "address": "string (optional)"
}
```

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
  "created_at": "2025-07-19T10:00:00Z",
  "username": "patient1234",
  "password": "generated_password",
  "email_sent": true
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Database error or email sending failure

---

### GET `/api/admin/scans`
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

**Error Response (500):**
```json
{
  "error": "Failed to retrieve scans"
}
```

---

### POST `/api/admin/scans/upload`
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

### GET `/api/admin/reports`
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

**Error Response (500):**
```json
{
  "error": "Failed to retrieve reports"
}
```

---

## 3. Patient Endpoints

### POST `/api/patient/login`
Patient authentication.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
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
- `500 Internal Server Error`: Server error

---

### GET `/api/patient/{patient_id}`
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
- `500 Internal Server Error`: Server error

---

### GET `/api/patient/{patient_id}/scans`
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
- `500 Internal Server Error`: Server error

---

### GET `/api/patient/{patient_id}/reports`
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
- `500 Internal Server Error`: Server error

---

## 4. Report Endpoints

### POST `/api/report/generate`
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

### GET `/api/report/download/{filename}`
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

## 5. CORS Preflight

### OPTIONS `/api/{path}`
Handle CORS preflight requests for all endpoints.

**Response (200):**
```json
{
  "status": "ok"
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

### HTTP Status Codes
- `200 OK`: Request successful
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Common Error Messages
- `"Missing required field: {field_name}"`
- `"Invalid credentials"`
- `"Patient not found"`
- `"No files uploaded"`
- `"Invalid file type"`
- `"Failed to {operation}"`

---

## File Upload Guidelines

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

## Database Schema

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

---

## Testing Examples

### Using curl
```bash
# Health check
curl http://localhost:5000/api/health

# Admin login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# Add patient
curl -X POST http://localhost:5000/api/admin/patients \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 35}'
```

### Using PowerShell
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET

# Admin login
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/login" -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username": "admin", "password": "admin"}'
```

---

## Security Considerations

1. **Authentication**: Implement JWT tokens in production
2. **Input Validation**: All inputs are validated and sanitized
3. **File Upload**: Only allowed file types are accepted
4. **CORS**: Configured for specific origins
5. **Error Handling**: Sensitive information is not exposed in error messages
6. **Database**: Use parameterized queries to prevent SQL injection

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production use.

---

## Logging

Server logs include:
- Request/response information
- Error details
- Database operations
- File upload events

---

## Dependencies

- Flask 2.3.3
- PostgreSQL (psycopg2)
- PyTorch
- OpenCV
- ReportLab
- Other dependencies listed in requirements.txt 