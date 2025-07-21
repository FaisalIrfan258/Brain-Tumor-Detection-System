# 🧠 Brain Tumor Detection System - Backend API

## 🚀 Overview

A comprehensive brain tumor detection system with AI-powered analysis, cloud storage integration, and automated report generation. The system provides both admin and patient portals with secure authentication and real-time scan analysis.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Setup & Installation](#-setup--installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Storage Strategy](#-storage-strategy)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 🔬 AI-Powered Analysis
- **ResNet18-based** brain tumor detection model
- **GradCAM visualization** for explainable AI
- **Real-time prediction** with confidence scores
- **Multi-image batch processing**

### ☁️ Cloud Integration
- **Cloudinary CDN** for image storage and delivery (scans only)
- **Amazon S3** for PDF report storage and secure delivery
- **Automatic image optimization** and transformation
- **Global edge locations** for fast loading
- **Secure file access** with permissions

## 📊 Report Generation
- **Automated PDF reports** with patient information
- **Visual analysis results** with heatmaps
- **Statistical summaries** of scan results
- **Professional formatting** with branding
- **Stored in Amazon S3 for secure, scalable access**

### 🔐 Security & Authentication
- **Admin portal** with secure login
- **Patient portal** with auto-generated credentials
- **Email notifications** for new accounts
- **CORS protection** and input validation

---

## 🏗️ Architecture

### Tech Stack
- **Backend**: Flask (Python)
- **Database**: PostgreSQL (Neon)
- **AI Model**: PyTorch + ResNet18
- **Cloud Storage**: Cloudinary
- **Email**: SMTP (Gmail/Outlook)
- **Frontend**: Next.js (React)

### System Components
```
Backend/
├── app.py                 # Main Flask application
├── database.py            # Database operations
├── cloudinary_service.py  # Cloud storage service
├── models/                # AI model files
├── reports/               # PDF report storage
├── temp_uploads/          # Temporary file processing
└── config.env            # Environment configuration
```

---

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.8+
- PostgreSQL database
- Cloudinary account (for scans)
- **AWS S3 bucket and credentials (for reports)**
- SMTP email service

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd fyp-demo/backend
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
# requirements.txt now includes boto3 for S3 integration
```

3. **Configure environment**
```bash
cp config.env.example config.env
# Edit config.env with your credentials
```

4. **Setup database**
```bash
python add_admin.py
```

5. **Run the application**
```bash
python app.py
```

---

## ⚙️ Configuration

### Environment Variables (`config.env`)

```env
# Database Configuration
DB_HOST=your-neon-host
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application Settings
REPORT_FOLDER=reports
MAX_CONTENT_LENGTH=16777216

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Base URL
```
http://localhost:5000/api
```

### CORS Support
- **Origins**: `http://localhost:3000`, `http://127.0.0.1:3000`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With
- **Credentials**: Supported

---

## 📡 API Documentation

### Authentication

#### Admin Authentication
- **Username**: `admin`
- **Password**: `admin`

#### Patient Authentication
- Credentials auto-generated when patients are added
- Sent via email (if configured)

### Error Handling

#### Standard Error Response
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)"
}
```

#### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

### Core Endpoints

#### 1. Health Check
```http
GET /api/health
```

#### 2. Admin Endpoints

**Login**
```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}
```

**Dashboard Stats**
```http
GET /api/admin/dashboard/stats
```

**Patient Management**
```http
GET /api/admin/patients
POST /api/admin/patients
GET /api/admin/patients/{id}
GET /api/admin/patients/{id}/scans
GET /api/admin/patients/{id}/reports
```

**Scan Upload & Analysis**
```http
POST /api/admin/scans/upload
Content-Type: multipart/form-data

patient_id: number
files: array of image files (PNG, JPG, JPEG)
```

**Reports**
```http
GET /api/admin/reports
POST /api/report/generate
GET /api/report/download/{report_id}
GET /api/report/file/{filename}
```

#### 3. Patient Endpoints

**Login**
```http
POST /api/patient/login
Content-Type: application/json

{
  "username": "patient_username",
  "password": "patient_password"
}
```

**Patient Data**
```http
GET /api/patient/{id}
GET /api/patient/{id}/scans
GET /api/patient/{id}/reports
```

#### 4. Public Endpoints

**Scan Upload**
```http
POST /api/scan/upload
Content-Type: multipart/form-data

patient_id: number
file: image file (PNG, JPG, JPEG)
```

### New/Updated Endpoints

#### Download Report by Filename (S3-aware)
```http
GET /api/report/download-by-filename/{filename}
```
- Returns `{ success: true, download_url: <pre-signed S3 URL> }` if report is in S3.
- Returns `{ success: true, download_url: <local path> }` for legacy local files.
- Returns error if not found.

---

## 🔒 Security Note
- **Never commit AWS credentials to version control.**
- Use IAM users with minimal permissions for production.
- Pre-signed URLs are time-limited and secure for downloads.

---

## 🛠️ Migration
- Old reports can be migrated to S3 if needed. Contact your developer for a migration script.

---

## 📁 Storage Strategy

### Cloudinary (Images)
```
brain_tumor_scans/
├── original/     # Original scan images
├── heatmap/      # GradCAM heatmap images  
└── overlay/      # Overlay visualization images
```

### Amazon S3 (PDF Reports)
```
reports/
└── PDF reports (served via pre-signed S3 URLs)
```

### Benefits
- **Images**: Fast CDN delivery, automatic optimization (Cloudinary)
- **PDFs**: Reliable, scalable, secure storage and delivery (S3)
- **Hybrid approach**: Best of both worlds

---

## 🗄️ Database Schema

### Tables

#### `patients`
- `id` (Primary Key)
- `patient_id` (Unique identifier)
- `name`, `email`, `age`, `gender`
- `phone`, `address`
- `username`, `password_hash`
- `created_at`, `updated_at`

#### `scans`
- `id` (Primary Key)
- `patient_id` (Foreign Key)
- `scan_id` (Unique identifier)
- `original_filename`, `original_path`
- `heatmap_path`, `overlay_path`
- `prediction`, `confidence`, `probability`
- `created_at`

#### `reports`
- `id` (Primary Key)
- `patient_id` (Foreign Key)
- `report_id` (Unique identifier)
- `report_path` (**S3 key** or legacy local path)
- `scan_count`, `tumor_count`, `no_tumor_count`
- `created_at`

#### `admins`
- `id` (Primary Key)
- `username`, `password_hash`
- `created_at`

---

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test all endpoints

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "app.py"]
```

### Environment Variables for Production
```env
FLASK_ENV=production
FLASK_DEBUG=0
DATABASE_URL=your-production-db-url
CLOUDINARY_URL=your-cloudinary-url
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check database connectivity
python -c "from database import db; print(db.test_connection())"
```

#### 2. Cloudinary Upload Failures
```bash
# Verify Cloudinary credentials
python -c "import os; from dotenv import load_dotenv; load_dotenv('config.env'); print('Cloudinary configured:', bool(os.getenv('CLOUDINARY_CLOUD_NAME')))"
```

#### 3. PDF Generation Errors
```bash
# Check report serving
curl http://localhost:5000/api/report/file/[filename].pdf
```

#### 4. Email Configuration
```bash
# Test email functionality
python -c "from app import send_credentials_email; print(send_credentials_email('test@example.com', 'test', 'password', 'Test User'))"
```

### Debug Commands
```bash
# Check all environment variables
python -c "import os; from dotenv import load_dotenv; load_dotenv('config.env'); [print(f'{k}: {v}') for k, v in os.environ.items() if 'DB_' in k or 'CLOUDINARY_' in k or 'SMTP_' in k]"

# Test API health
curl http://localhost:5000/api/health

# Check file permissions
ls -la reports/
ls -la temp_uploads/
```

### Performance Optimization
- **Image caching**: Cloudinary CDN handles this automatically
- **Database pooling**: Already configured in database.py
- **File cleanup**: Temporary files are automatically removed
- **Memory management**: Images are processed in batches

---

## 📊 Monitoring & Logs

### Application Logs
- Upload success/failure logs
- URL generation tracking
- Error handling for failed operations
- Database connection status

### Cloudinary Dashboard
- Monitor upload usage
- Track bandwidth consumption
- View storage statistics
- Manage transformations

### Database Monitoring
- Connection pool status
- Query performance
- Error rates
- Storage usage

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Test with the provided examples

---

**Last Updated**: July 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready 