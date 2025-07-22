'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiService, Patient, Scan, Report } from '../../../services/api'
import PatientNavigation from '../../../components/PatientNavigation'

export default function PatientDashboard() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if patient is logged in
    const patientId = localStorage.getItem('patientId')
    if (!patientId) {
      router.push('/patient/login')
      return
    }

    loadPatientData(parseInt(patientId))
  }, [router, mounted])

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

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-gray-600 text-lg font-medium">Loading your dashboard...</p>
          <p className="mt-2 text-gray-500 text-sm">Fetching your medical data</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load patient information.</p>
          <button
            onClick={() => router.push('/patient/login')}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PatientNavigation patientName={patient.name} />

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Patient Info Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{patient.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Patient ID:</span>
                      <span className="ml-2 font-medium text-gray-900">{patient.patient_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium text-gray-900">{patient.email}</span>
                    </div>
                    {patient.age && (
                      <div>
                        <span className="text-gray-500">Age:</span>
                        <span className="ml-2 font-medium text-gray-900">{patient.age} years</span>
                      </div>
                    )}
                    {patient.gender && (
                      <div>
                        <span className="text-gray-500">Gender:</span>
                        <span className="ml-2 font-medium text-gray-900">{patient.gender}</span>
                      </div>
                    )}
                    {patient.phone && (
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <span className="ml-2 font-medium text-gray-900">{patient.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="border-b border-gray-200/50">
              <div className="flex space-x-8 px-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                    </svg>
                    <span>Overview</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('scans')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'scans'
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Scans ({scans.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'reports'
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Reports ({reports.length})</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Total Scans</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            {scans.length}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Brain MRI scans</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Total Reports</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {reports.length}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PDF reports</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Last Scan</p>
                          <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            {scans.length > 0 
                              ? new Date(scans[0].created_at).toLocaleDateString()
                              : 'No scans yet'
                            }
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Most recent analysis</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
                    {scans.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No scans yet</h3>
                        <p className="text-gray-600 max-w-md mx-auto">Your brain scans will appear here once they are uploaded and analyzed by our AI system.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {scans.slice(0, 5).map((scan) => (
                          <div key={scan.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${getStatusColor(scan.prediction)}`}>
                                {getStatusIcon(scan.prediction)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  Scan {scan.scan_id} - {scan.prediction}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(scan.created_at).toLocaleDateString()} • Confidence: {scan.confidence ? (scan.confidence * 100).toFixed(1) : 'N/A'}%
                                </p>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                              {scan.confidence ? (scan.confidence * 100).toFixed(1) : 'N/A'}% confidence
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'scans' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Your Brain Scans</h2>
                    <p className="text-gray-600">AI-powered analysis results</p>
                  </div>
                  
                  {scans.length === 0 ? (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center border border-gray-200">
                      <div className="mx-auto h-16 w-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No scans yet</h3>
                      <p className="text-gray-600 max-w-md mx-auto">Your brain scans will appear here once they are uploaded and analyzed by our AI system.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {scans.map((scan) => (
                        <div key={scan.id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">Scan {scan.scan_id}</h3>
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(scan.prediction)}`}>
                                {scan.prediction}
                              </div>
                            </div>
                            
                            <div className="space-y-3 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Date:</span>
                                <span className="font-medium text-gray-900">{new Date(scan.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Confidence:</span>
                                <span className="font-medium text-gray-900">{scan.confidence ? (scan.confidence * 100).toFixed(1) : 'N/A'}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Probability:</span>
                                <span className="font-medium text-gray-900">{scan.probability ? scan.probability.toFixed(3) : 'N/A'}</span>
                              </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-200">
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Your Reports</h2>
                    <p className="text-gray-600">Detailed PDF analysis reports</p>
                  </div>
                  
                  {reports.length === 0 ? (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center border border-gray-200">
                      <div className="mx-auto h-16 w-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports yet</h3>
                      <p className="text-gray-600 max-w-md mx-auto">Detailed PDF reports are generated by your healthcare provider after scan analysis.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div key={report.id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Report {report.id}</h3>
                              <p className="text-sm text-gray-500">
                                Generated on {new Date(report.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleReportDownload(report)}
                              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Download PDF</span>
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
        </div>
      </div>
    </div>
  )
} 