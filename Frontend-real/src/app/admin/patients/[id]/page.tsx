'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiService, Patient, Scan, Report } from '@/services/api'

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = Number(params.id)
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'scans' | 'reports'>('overview')

  useEffect(() => {
    if (patientId) {
      loadPatientData()
    }
  }, [patientId])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      const [patientData, scansData, reportsData] = await Promise.all([
        apiService.getAdminPatientById(patientId),
        apiService.getAdminPatientScans(patientId),
        apiService.getAdminPatientReports(patientId)
      ])
      setPatient(patientData)
      setScans(scansData)
      setReports(reportsData)
    } catch (err: any) {
      setError(apiService.handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getPredictionColor = (prediction: string) => {
    return prediction === 'Tumor' 
      ? 'bg-red-100 text-red-800' 
      : 'bg-green-100 text-green-800'
  }

  const generateReport = async () => {
    try {
      const response = await apiService.generateReport({ patient_id: patientId })
      if (response.success) {
        alert('Report generated successfully!')
        loadPatientData() // Reload to get updated reports
      } else {
        alert('Failed to generate report: ' + response.error)
      }
    } catch (err: any) {
      alert('Error generating report: ' + apiService.handleApiError(err))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Patient</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/admin/patients"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Patients
          </Link>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Not Found</h3>
          <p className="text-gray-600 mb-6">The patient you're looking for doesn't exist.</p>
          <Link
            href="/admin/patients"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Patients
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/patients" className="text-indigo-600 hover:text-indigo-500 mr-4">
                ← Back to Patients
              </Link>
              <h1 className="text-2xl font-bold text-indigo-600">
                Patient: {patient.name}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/scans/upload"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Upload Scans
              </Link>
              <button
                onClick={generateReport}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Patient Info Card */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                  <p className="text-sm text-gray-900 font-mono">{patient.patient_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="text-sm text-gray-900">{patient.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{patient.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <p className="text-sm text-gray-900">{patient.age || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <p className="text-sm text-gray-900">{patient.gender || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{patient.phone || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="text-sm text-gray-900">{patient.address || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="text-sm text-gray-900 font-mono">{patient.username || 'Not generated'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(patient.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900">{patient.updated_at ? formatDate(patient.updated_at) : 'Never'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">🧠</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Scans</p>
                  <p className="text-2xl font-semibold text-gray-900">{scans.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📊</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tumor Detected</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {scans.filter(s => s.prediction === 'Tumor').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📄</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Reports</p>
                  <p className="text-2xl font-semibold text-gray-900">{reports.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('scans')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'scans'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Brain Scans ({scans.length})
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reports'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Reports ({reports.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Summary</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      This patient has undergone <strong>{scans.length}</strong> brain scan{scans.length !== 1 ? 's' : ''} 
                      with <strong>{scans.filter(s => s.prediction === 'Tumor').length}</strong> scan{scans.filter(s => s.prediction === 'Tumor').length !== 1 ? 's' : ''} 
                      showing tumor detection.
                    </p>
                    
                    {scans.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recent Scan Results</h4>
                        <div className="space-y-2">
                          {scans.slice(0, 3).map((scan) => (
                            <div key={scan.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                              <span className="text-sm text-gray-900">{scan.original_filename}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPredictionColor(scan.prediction)}`}>
                                {scan.prediction}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {reports.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Available Reports</h4>
                        <div className="space-y-2">
                          {reports.map((report) => (
                            <div key={report.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                              <span className="text-sm text-gray-900">Report {report.report_id}</span>
                              <span className="text-sm text-gray-500">{formatDate(report.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scans Tab */}
              {activeTab === 'scans' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Brain Scan History</h3>
                    <Link
                      href="/admin/scans/upload"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                    >
                      Upload New Scan
                    </Link>
                  </div>
                  
                  {scans.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🧠</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No scans found</h3>
                      <p className="text-gray-600 mb-6">This patient hasn't had any brain scans uploaded yet.</p>
                      <Link
                        href="/admin/scans/upload"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        Upload First Scan
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scans.map((scan) => (
                        <div key={scan.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{scan.original_filename}</h4>
                              <p className="text-sm text-gray-500">
                                Scan ID: {scan.scan_id} | Uploaded: {formatDate(scan.created_at)}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPredictionColor(scan.prediction)}`}>
                              {scan.prediction}
                            </span>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Confidence:</span>
                              <span className="ml-2 text-gray-900">
                                {scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Probability:</span>
                              <span className="ml-2 text-gray-900">
                                {scan.probability ? `${(scan.probability * 100).toFixed(1)}%` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Patient Reports</h3>
                    <button
                      onClick={generateReport}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                    >
                      Generate New Report
                    </button>
                  </div>
                  
                  {reports.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📄</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                      <p className="text-gray-600 mb-6">No PDF reports have been generated for this patient yet.</p>
                      <button
                        onClick={generateReport}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Generate First Report
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">Report {report.report_id}</h4>
                              <p className="text-sm text-gray-500">Generated: {formatDate(report.created_at)}</p>
                            </div>
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL}/report/download/${report.report_path.split('/').pop()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
                            >
                              Download PDF
                            </a>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Scans Analyzed:</span>
                              <span className="ml-2 text-gray-900">{report.scan_count}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Tumors Detected:</span>
                              <span className="ml-2 text-red-600">{report.tumor_count}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">No Tumor:</span>
                              <span className="ml-2 text-green-600">{report.no_tumor_count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 