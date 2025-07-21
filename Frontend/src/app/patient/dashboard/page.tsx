'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiService, Patient, Scan, Report } from '../../../services/api'

export default function PatientDashboard() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if patient is logged in
    const patientId = localStorage.getItem('patientId')
    if (!patientId) {
      router.push('/patient/login')
      return
    }

    loadPatientData(parseInt(patientId))
  }, [router])

  const loadPatientData = async (patientId: number) => {
    try {
      setLoading(true)
      setError('')

      // Load patient info, scans, and reports in parallel
      const [patientData, scansData, reportsData] = await Promise.all([
        apiService.getPatientInfo(patientId),
        apiService.getPatientScans(patientId),
        apiService.getPatientReports(patientId)
      ])

      setPatient(patientData)
      setScans(scansData)
      setReports(reportsData)
    } catch (error) {
      console.error('Error loading patient data:', error)
      setError('Failed to load patient data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('patientId')
    localStorage.removeItem('patientToken')
    router.push('/patient/login')
  }

  const getStatusColor = (prediction: string) => {
    return prediction === 'Tumor' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
  }

  const getStatusIcon = (prediction: string) => {
    return prediction === 'Tumor' ? (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ) : (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const handleReportDownload = async (report: any) => {
    try {
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Remove trailing /api or /api/ if present
      if (baseUrl.endsWith('/api/')) baseUrl = baseUrl.slice(0, -4);
      else if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -3);
      // Remove trailing slash if present
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
      const filename = report.report_path.split('/').pop();
      // Always ensure exactly one slash between baseUrl and endpoint
      const apiUrl = `${baseUrl}/api/report/download-by-filename/${filename}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.success && data.download_url) {
        if (data.download_url.startsWith('http')) {
          // S3 pre-signed URL: open directly
          const a = document.createElement('a');
          a.href = data.download_url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          // Local file fallback
          let fileUrl = `${baseUrl}${data.download_url}`;
          fileUrl = fileUrl.replace(/([^:]\/)\/+/, '$1'); // Remove double slashes except after http(s):
          const fileResponse = await fetch(fileUrl);
          if (fileResponse.ok) {
            const blob = await fileResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } else {
            alert('Failed to download report file');
          }
        }
      } else {
        alert('Report not found');
      }
    } catch (error) {
      alert('Error downloading report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load patient information.</p>
          <button
            onClick={() => router.push('/patient/login')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Login
          </button>
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
              <h1 className="text-2xl font-bold text-indigo-600">🧠 Patient Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {patient.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 h-16 w-16">
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xl font-medium text-indigo-600">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
              <p className="text-gray-600">Patient ID: {patient.patient_id}</p>
              <p className="text-gray-600">{patient.email}</p>
              {patient.age && <p className="text-gray-600">Age: {patient.age} years</p>}
              {patient.gender && <p className="text-gray-600">Gender: {patient.gender}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
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
              Scans ({scans.length})
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="px-4 py-6 sm:px-0">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Scans</dt>
                        <dd className="text-lg font-medium text-gray-900">{scans.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Reports</dt>
                        <dd className="text-lg font-medium text-gray-900">{reports.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Last Scan</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {scans.length > 0 
                            ? new Date(scans[0].created_at).toLocaleDateString()
                            : 'No scans yet'
                          }
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                {scans.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No scans yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Your brain scans will appear here once they are uploaded and analyzed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scans.slice(0, 5).map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${getStatusColor(scan.prediction)}`}>
                            {getStatusIcon(scan.prediction)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Scan {scan.scan_id} - {scan.prediction}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(scan.created_at).toLocaleDateString()} • Confidence: {scan.confidence ? (scan.confidence * 100).toFixed(1) : 'N/A'}%
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {scan.confidence ? (scan.confidence * 100).toFixed(1) : 'N/A'}% confidence
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scans' && (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Brain Scans</h2>
            
            {scans.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No scans yet</h3>
                <p className="mt-1 text-sm text-gray-500">Your brain scans will appear here once they are uploaded and analyzed by our AI system.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {scans.map((scan) => (
                  <div key={scan.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Scan {scan.scan_id}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scan.prediction)}`}>
                          {scan.prediction}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Date:</span>
                          <span className="text-gray-900">{new Date(scan.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Confidence:</span>
                          <span className="text-gray-900">{scan.confidence ? (scan.confidence * 100).toFixed(1) : 'N/A'}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Probability:</span>
                          <span className="text-gray-900">{scan.probability ? scan.probability.toFixed(3) : 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          This scan was analyzed using our advanced AI model with GradCAM visualization for explainable results.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Reports</h2>
            
            {reports.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
                <p className="mt-1 text-sm text-gray-500">Detailed PDF reports are generated by your healthcare provider after scan analysis.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Report {report.id}</h3>
                        <p className="text-sm text-gray-500">
                          Generated on {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleReportDownload(report)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 