const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: any
  field?: string
}

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

export interface DashboardStats {
  total_patients: number
  total_scans: number
  total_reports: number
  scan_stats: {
    total_scans: number
    tumor_count: number
    no_tumor_count: number
  }
}

// Request/Response Types
export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminLoginResponse {
  success: boolean
  token?: string
}

export interface PatientLoginRequest {
  username: string
  password: string
}

export interface PatientLoginResponse {
  success: boolean
  data?: {
    id: number
    name: string
    patient_id: string
    email: string
  }
  error?: string
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

export interface UploadScanResponse {
  success: boolean
  scan_ids: string[]
  report_generated?: boolean
  report_data?: {
    report_id: string
    report_url: string
    scan_count: number
    tumor_count: number
    no_tumor_count: number
  }
  results?: {
    success: boolean
    filename: string
    scan_id: string
    prediction: string
    confidence: number
    probability: number
    original_image: string
    heatmap: string
    overlay: string
    error?: string
  }[]
}

export interface GenerateReportRequest {
  patient_id: number | string;
  scan_ids?: string[];
}

export interface GenerateReportResponse {
  success: boolean
  data?: {
    report_id: string
    report_path: string
  }
  error?: string
}

export interface HealthCheckResponse {
  status: string
  message: string
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Health Check
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.request('/health')
  }

  // Admin Endpoints
  async adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<ApiResponse<DashboardStats>>('/admin/dashboard/stats')
    return response.data || {
      total_patients: 0,
      total_scans: 0,
      total_reports: 0,
      scan_stats: {
        total_scans: 0,
        tumor_count: 0,
        no_tumor_count: 0
      }
    }
  }

  async getPatients(): Promise<Patient[]> {
    const response = await this.request<ApiResponse<Patient[]>>('/admin/patients')
    return response.data || []
  }

  async getAdminPatientById(patientId: number): Promise<Patient> {
    const response = await this.request<ApiResponse<Patient>>(`/admin/patients/${patientId}`)
    return response.data!
  }

  async getAdminPatientScans(patientId: number): Promise<Scan[]> {
    const response = await this.request<ApiResponse<Scan[]>>(`/admin/patients/${patientId}/scans`)
    return response.data || []
  }

  async getAdminPatientReports(patientId: number): Promise<Report[]> {
    const response = await this.request<ApiResponse<Report[]>>(`/admin/patients/${patientId}/reports`)
    return response.data || []
  }

  async addPatient(data: AddPatientRequest): Promise<AddPatientResponse> {
    return this.request('/admin/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getScans(): Promise<Scan[]> {
    const response = await this.request<ApiResponse<Scan[]>>('/admin/scans')
    return response.data || []
  }

  async uploadScans(patientId: number, files: File[]): Promise<UploadScanResponse> {
    const formData = new FormData()
    formData.append('patient_id', patientId.toString())
    
    files.forEach((file) => {
      formData.append('files', file)
    })

    return this.request('/admin/scans/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }

  async getReports(): Promise<Report[]> {
    const response = await this.request<ApiResponse<Report[]>>('/admin/reports')
    return response.data || []
  }

  // Patient Endpoints
  async patientLogin(data: PatientLoginRequest): Promise<PatientLoginResponse> {
    return this.request('/patient/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPatientInfo(patientId: number): Promise<Patient> {
    const response = await this.request<ApiResponse<Patient>>(`/patient/${patientId}`)
    return response.data!
  }

  async getPatientScans(patientId: number): Promise<Scan[]> {
    const response = await this.request<ApiResponse<Scan[]>>(`/patient/${patientId}/scans`)
    return response.data || []
  }

  async getPatientReports(patientId: number): Promise<Report[]> {
    const response = await this.request<ApiResponse<Report[]>>(`/patient/${patientId}/reports`)
    return response.data || []
  }

  // Report Endpoints
  async generateReport(data: GenerateReportRequest): Promise<GenerateReportResponse> {
    return this.request('/report/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async downloadReport(reportId: string): Promise<{ success: boolean; download_url: string }> {
    const response = await this.request<{ success: boolean; download_url: string }>(`/report/download/${reportId}`)
    return response
  }

  // Utility methods for file downloads
  async downloadScanImage(scanId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/scans/${scanId}/image`, {
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.blob()
  }

  // Error handling helper
  handleApiError(error: any): string {
    if (error.message) {
      return error.message
    }
    if (error.error) {
      return error.error
    }
    return 'An unexpected error occurred'
  }
}

export const apiService = new ApiService() 