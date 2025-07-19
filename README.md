# Brain Tumor Detection System

A comprehensive AI-powered brain tumor detection system with patient management, admin dashboard, and automated reporting.

## Features

- **AI-Powered Detection**: Uses ResNet18 with GradCAM visualization
- **Patient Management**: Add patients, manage their scans and reports
- **Admin Dashboard**: View all patients, scans, and generate reports
- **Patient Portal**: Patients can view their own reports and scan history
- **Automated Reporting**: Generate detailed PDF reports with visualizations
- **Email Notifications**: Automatic credential delivery to patients

## System Architecture

```
fyp-demo/
├── backend/                 # Flask API
│   ├── app.py              # Main API application
│   ├── database.py         # Database models and operations
│   ├── setup_database.py   # Database setup script
│   ├── config.env          # Environment configuration
│   ├── requirements.txt    # Python dependencies
│   ├── fyp/               # Virtual environment
│   ├── models/            # AI model files
│   ├── uploads/           # Uploaded scan files
│   ├── reports/           # Generated PDF reports
│   └── templates/         # Old HTML templates
├── frontend/               # Next.js frontend (to be created)
└── README.md              # This file
```

## Prerequisites

1. **Python 3.8+**
2. **PostgreSQL** (installed and running)
3. **Node.js 16+** (for frontend)
4. **Git**

## Database Setup

### 1. PostgreSQL Configuration

1. Make sure PostgreSQL is installed and running
2. Create a database user (if not using default postgres user)
3. Update the database credentials in `backend/config.env`

### 2. Environment Configuration

Edit `backend/config.env` with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=brain_tumor_system
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_PORT=5432

# Flask Configuration
FLASK_SECRET_KEY=your_secret_key_here
FLASK_ENV=development

# Email Configuration (for sending credentials)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# File Upload Configuration
UPLOAD_FOLDER=uploads
REPORT_FOLDER=reports
MAX_CONTENT_LENGTH=16777216
```

### 3. Setup Database

```bash
cd backend
python setup_database.py
```

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the API

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## Frontend Setup (Next.js)

### 1. Create Next.js Project

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --eslint
```

### 2. Install Additional Dependencies

```bash
npm install @headlessui/react @heroicons/react axios react-hook-form
```

### 3. Run the Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Admin Endpoints

- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/patients` - Get all patients
- `POST /api/admin/patients` - Add new patient

### Patient Endpoints

- `POST /api/patient/login` - Patient login
- `GET /api/patient/{id}/scans` - Get patient scans
- `GET /api/patient/{id}/reports` - Get patient reports

### Scan Endpoints

- `POST /api/scan/upload` - Upload and analyze brain scan

### Report Endpoints

- `POST /api/report/generate` - Generate PDF report
- `GET /api/report/download/{filename}` - Download report

## Usage

### Admin Workflow

1. **Add Patient**: Use admin dashboard to add new patients
2. **Upload Scans**: Upload brain scan images for analysis
3. **Generate Reports**: Create comprehensive PDF reports
4. **Monitor**: View all patients and their analysis results

### Patient Workflow

1. **Receive Credentials**: Patients receive login credentials via email
2. **Login**: Access patient portal with provided credentials
3. **View Results**: See their scan analysis and reports
4. **Download Reports**: Download PDF reports for medical records

## File Structure

### Backend Structure

```
backend/
├── app.py              # Main Flask application
├── database.py         # Database models and operations
├── setup_database.py   # Database setup script
├── config.env          # Environment variables
├── requirements.txt    # Python dependencies
├── fyp/               # Virtual environment
├── models/            # AI model files
├── uploads/           # Temporary scan files
├── reports/           # Generated PDF reports
└── templates/         # Old HTML templates
```

### Frontend Structure (to be created)

```
frontend/
├── pages/             # Next.js pages
│   ├── index.js       # Landing page
│   ├── admin/         # Admin dashboard
│   └── patient/       # Patient portal
├── components/        # React components
├── styles/           # CSS styles
└── package.json      # Node.js dependencies
```

## Security Features

- Password hashing using SHA-256
- Secure file upload validation
- CORS configuration
- Environment variable protection

## Email Configuration

To enable email notifications for patient credentials:

1. Use Gmail SMTP (recommended for development)
2. Enable 2-factor authentication on your Gmail account
3. Generate an App Password
4. Update the email configuration in `config.env`

## Development

### Running in Development Mode

```bash
# Backend
cd backend
python app.py

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Production Deployment

1. Set up a production PostgreSQL database
2. Configure environment variables for production
3. Use a production WSGI server (Gunicorn)
4. Set up reverse proxy (Nginx)
5. Configure SSL certificates

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check database credentials in `config.env`
3. Ensure database exists: `python setup_database.py`

### Model Loading Issues

1. Verify the model file exists in `models/` directory
2. Check file permissions
3. Ensure PyTorch is properly installed

### Email Issues

1. Verify SMTP configuration in `config.env`
2. Check Gmail App Password is correct
3. Ensure 2-factor authentication is enabled

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes as a Final Year Project.

## Support

For support and questions, please contact the development team.
