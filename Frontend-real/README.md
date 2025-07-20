# Brain Tumor Detection System - Frontend Documentation

## 🚀 Overview

This is the frontend application for the Brain Tumor Detection System, built with Next.js 14, TypeScript, and Tailwind CSS. It provides user interfaces for both admin and patient portals.

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Components](#components)
- [Pages](#pages)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Styling](#styling)
- [Development](#development)
- [Deployment](#deployment)

---

## 🛠️ Technology Stack

### Core Technologies
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React 18** - UI library

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Node.js** - Runtime environment

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin portal pages
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   ├── login/         # Admin login
│   │   │   ├── patients/      # Patient management
│   │   │   └── scans/         # Scan management
│   │   ├── patient/           # Patient portal pages
│   │   │   ├── dashboard/     # Patient dashboard
│   │   │   └── login/         # Patient login
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── services/              # API services
│   │   └── api.ts            # API client
│   └── components/            # Reusable components
├── public/                    # Static assets
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind config
└── next.config.ts            # Next.js config
```

---

## 🔌 API Integration

### API Service (`src/services/api.ts`)

The frontend uses a centralized API service that matches the backend documentation:

#### Base Configuration
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
```

#### Type Definitions
```typescript
// Database Schema Interfaces
export interface Patient {
  id: number
  patient_id: string
  name: string
  email: string
  age?: number
  gender?: string
  phone?: string
  address?: string
  username?: string
  password_hash?: string
  created_at: string
  updated_at?: string
}

export interface Scan {
  id: number
  patient_id: number
  scan_id: string
  original_filename: string
  original_path?: string
  heatmap_path?: string
  overlay_path?: string
  prediction: string
  confidence?: number
  probability?: number
  report_path?: string
  created_at: string
}

export interface Report {
  id: number
  patient_id: number
  report_id: string
  report_path: string
  scan_count: number
  tumor_count: number
  no_tumor_count: number
  created_at: string
}
```

#### Request/Response Types
```typescript
export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminLoginResponse {
  success: boolean
  token?: string
}

export interface AddPatientRequest {
  name: string
  email: string
  age?: number
  gender?: string
  phone?: string
  address?: string
}

export interface AddPatientResponse {
  success: boolean
  data?: {
    id: number
    patient_id: string
    name: string
    email: string
    age?: number
    gender?: string
    phone?: string
    address?: string
    created_at: string
    username: string
    password: string
    email_sent: boolean
  }
  error?: string
}
```

#### API Methods
```typescript
class ApiService {
  // Health Check
  async healthCheck(): Promise<HealthCheckResponse>

  // Admin Endpoints
  async adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse>
  async getDashboardStats(): Promise<DashboardStats>
  async getPatients(): Promise<Patient[]>
  async addPatient(data: AddPatientRequest): Promise<AddPatientResponse>
  async getScans(): Promise<Scan[]>
  async uploadScans(patientId: number, files: File[]): Promise<UploadScanResponse>
  async getReports(): Promise<Report[]>

  // Patient Endpoints
  async patientLogin(data: PatientLoginRequest): Promise<PatientLoginResponse>
  async getPatientInfo(patientId: number): Promise<Patient>
  async getPatientScans(patientId: number): Promise<Scan[]>
  async getPatientReports(patientId: number): Promise<Report[]>

  // Report Endpoints
  async generateReport(data: GenerateReportRequest): Promise<GenerateReportResponse>
  async downloadReport(filename: string): Promise<Blob>

  // Error Handling
  handleApiError(error: any): string
}
```

---

## 🔐 Authentication

### Admin Authentication
- **Route**: `/admin/login`
- **Credentials**: Username: `admin`, Password: `admin`
- **Storage**: LocalStorage with `adminLoggedIn` and `adminToken` keys
- **Redirect**: `/admin/dashboard` on success

### Patient Authentication
- **Route**: `/patient/login`
- **Credentials**: Auto-generated when patient is added
- **Storage**: LocalStorage with `patientId`, `patientName`, `patientEmail`
- **Redirect**: `/patient/dashboard` on success

### Session Management
```typescript
// Admin session
localStorage.setItem('adminLoggedIn', 'true')
localStorage.setItem('adminToken', result.token || '')

// Patient session
localStorage.setItem('patientId', result.data.id.toString())
localStorage.setItem('patientName', result.data.name)
localStorage.setItem('patientEmail', result.data.email)
```

---

## 📄 Pages

### Public Pages

#### Home Page (`/`)
- Landing page with system overview
- Navigation to admin and patient portals
- Feature highlights

### Admin Pages

#### Admin Login (`/admin/login`)
- **Purpose**: Admin authentication
- **Features**: Form validation, error handling, demo credentials
- **API**: `POST /api/admin/login`

#### Admin Dashboard (`/admin/dashboard`)
- **Purpose**: System overview and navigation
- **Features**: Statistics cards, quick actions, navigation menu
- **API**: `GET /api/admin/dashboard/stats`

#### Add Patient (`/admin/patients/add`)
- **Purpose**: Register new patients
- **Features**: Form validation, auto-generated credentials, email notification
- **API**: `POST /api/admin/patients`

#### Patient Management (`/admin/patients`)
- **Purpose**: View and manage all patients
- **Features**: Patient list, search, filter, actions
- **API**: `GET /api/admin/patients`

#### Scan Upload (`/admin/scans/upload`)
- **Purpose**: Upload and analyze brain scans
- **Features**: Multi-file upload, patient selection, progress tracking
- **API**: `POST /api/admin/scans/upload`

#### Scan Management (`/admin/scans`)
- **Purpose**: View all scans and results
- **Features**: Scan list, filters, download options
- **API**: `GET /api/admin/scans`

#### Report Management (`/admin/reports`)
- **Purpose**: Generate and manage reports
- **Features**: Report generation, download, statistics
- **API**: `GET /api/admin/reports`, `POST /api/report/generate`

### Patient Pages

#### Patient Login (`/patient/login`)
- **Purpose**: Patient authentication
- **Features**: Form validation, error handling
- **API**: `POST /api/patient/login`

#### Patient Dashboard (`/patient/dashboard`)
- **Purpose**: Patient overview and navigation
- **Features**: Personal info, scan history, report access
- **API**: `GET /api/patient/{id}`, `GET /api/patient/{id}/scans`, `GET /api/patient/{id}/reports`

---

## 🎨 Components

### Form Components
- **Input Fields**: Text, email, number, select, textarea
- **Validation**: Real-time validation with error messages
- **Loading States**: Disabled states during API calls

### Navigation Components
- **Header**: Logo, navigation menu, user info
- **Sidebar**: Admin/patient specific navigation
- **Breadcrumbs**: Page navigation context

### Data Display Components
- **Cards**: Statistics, patient info, scan results
- **Tables**: Patient list, scan history, reports
- **Charts**: Dashboard statistics visualization

### Feedback Components
- **Alerts**: Success, error, warning messages
- **Loading Spinners**: API call indicators
- **Progress Bars**: File upload progress

---

## 🔄 State Management

### Local State
- **React Hooks**: `useState`, `useEffect` for component state
- **Form State**: Controlled components with validation
- **Loading States**: API call status management

### Session Storage
- **LocalStorage**: Authentication tokens and user data
- **Session Data**: Current user context and permissions

### Error Handling
- **API Errors**: Centralized error handling with user-friendly messages
- **Validation Errors**: Form field-specific error display
- **Network Errors**: Connection and timeout handling

---

## ⚠️ Error Handling

### API Error Handling
```typescript
try {
  const result = await apiService.adminLogin(formData)
  if (result.success) {
    // Handle success
  } else {
    setError(result.error || 'Operation failed')
  }
} catch (err: any) {
  setError(apiService.handleApiError(err))
}
```

### Form Validation
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  setFormData({
    ...formData,
    [name]: value === '' ? undefined : value
  })
}
```

### Error Display
```typescript
{error && (
  <div className="rounded-md bg-red-50 p-4">
    <div className="text-sm text-red-700">{error}</div>
  </div>
)}
```

---

## 🎨 Styling

### Tailwind CSS
- **Utility Classes**: Rapid UI development
- **Responsive Design**: Mobile-first approach
- **Custom Components**: Reusable styled components

### Color Scheme
- **Primary**: Indigo (Admin portal)
- **Secondary**: Green (Patient portal)
- **Neutral**: Gray (Common elements)
- **Status**: Red (Errors), Green (Success), Yellow (Warnings)

### Typography
- **Headings**: Inter font family
- **Body Text**: System font stack
- **Code**: Monospace for credentials and technical data

---

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:5000`

### Installation
```bash
# Clone repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Available Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

### Development Workflow
1. **API First**: Ensure backend API is running
2. **Type Safety**: Use TypeScript interfaces for API calls
3. **Error Handling**: Implement proper error boundaries
4. **Testing**: Test all user flows and edge cases
5. **Responsive**: Test on mobile and desktop

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- **Touch-friendly**: Large touch targets
- **Swipe Navigation**: Mobile-optimized navigation
- **Responsive Tables**: Scrollable data tables
- **Optimized Forms**: Mobile-friendly input fields

---

## 🔒 Security

### Frontend Security
- **Input Validation**: Client-side validation
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: CORS configuration
- **Secure Storage**: LocalStorage for non-sensitive data

### Best Practices
- **HTTPS**: Use HTTPS in production
- **Environment Variables**: Secure API keys and URLs
- **Error Messages**: Don't expose sensitive information
- **Input Sanitization**: Validate all user inputs

---

## 🚀 Deployment

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Deployment Options
1. **Vercel**: Recommended for Next.js
2. **Netlify**: Static site hosting
3. **AWS Amplify**: Full-stack deployment
4. **Docker**: Containerized deployment

### Environment Configuration
```env
# Production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### Performance Optimization
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: Static generation where possible
- **Bundle Analysis**: Monitor bundle size

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Admin login/logout
- [ ] Patient login/logout
- [ ] Add new patient
- [ ] Upload scans
- [ ] Generate reports
- [ ] Download files
- [ ] Error handling
- [ ] Responsive design
- [ ] Form validation

### Browser Testing
- **Chrome**: Primary browser
- **Firefox**: Secondary browser
- **Safari**: iOS compatibility
- **Edge**: Windows compatibility

---

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Check backend server is running
   - Verify API URL in environment variables
   - Check CORS configuration

2. **Authentication Issues**
   - Clear localStorage
   - Check credentials
   - Verify API endpoints

3. **File Upload Problems**
   - Check file size limits
   - Verify file types
   - Check network connection

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify Next.js version

### Debug Tools
- **Browser DevTools**: Network, Console, Application
- **React DevTools**: Component inspection
- **Next.js Debug**: `NODE_ENV=development`

---

## 📞 Support

### Getting Help
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Verify environment configuration

### Contributing
1. Follow TypeScript best practices
2. Use consistent code formatting
3. Add proper error handling
4. Test all user flows

---

## 📄 License

This project is licensed under the MIT License.
