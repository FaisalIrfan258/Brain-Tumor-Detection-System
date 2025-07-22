'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiService, Patient, UploadScanResponse } from '@/services/api'
import AdminNavigation from '@/components/AdminNavigation'

interface ScanResult {
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
}

export default function UploadScansPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<number | string>('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<ScanResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      window.location.href = '/admin/login'
      return
    }

    loadPatients()
  }, [mounted])

  const loadPatients = async () => {
    try {
      const data = await apiService.getPatients()
      setPatients(data)
    } catch (err: any) {
      setError(apiService.handleApiError(err))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
    }
  }

  const handleUpload = async () => {
    if (!selectedPatient || selectedFiles.length === 0) {
      setError('Please select a patient and files')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response: UploadScanResponse = await apiService.uploadScans(Number(selectedPatient), selectedFiles)
      
      if (response.success && response.results) {
        setResults(response.results)
        setShowResults(true)
        
        // If report was generated in upload response, use it
        if (response.report_generated && response.report_data) {
          setReportGenerated(true)
          setReportData(response.report_data)
        } else {
          // Otherwise, trigger report generation now
          setGeneratingReport(true)
          const reportResp = await apiService.generateReport({ patient_id: selectedPatient, scan_ids: response.scan_ids })
          setGeneratingReport(false)
          if (reportResp.success && reportResp.data) {
            setReportGenerated(true)
            setReportData({
              report_id: reportResp.data.report_id,
              report_url: reportResp.data.report_path,
            })
          } else {
            setReportGenerated(false)
            setReportData(null)
            setError('Failed to generate report after scan upload.')
          }
        }
      } else {
        setError('Upload failed')
      }
    } catch (err: any) {
      setError(apiService.handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedPatient('')
    setSelectedFiles([])
    setResults([])
    setShowResults(false)
    setReportGenerated(false)
    setReportData(null)
    setError('')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const constructApiUrl = (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    
    // Special handling for report URLs to avoid double /api/
    if (endpoint.startsWith('/api/')) {
      // If base URL ends with /api, remove it to avoid double /api/api/
      if (baseUrl.endsWith('/api')) {
        const cleanBaseUrl = baseUrl.slice(0, -4) // Remove '/api'
        return `${cleanBaseUrl}${endpoint}`
      } else if (baseUrl.endsWith('/api/')) {
        const cleanBaseUrl = baseUrl.slice(0, -5) // Remove '/api/'
        return `${cleanBaseUrl}${endpoint}`
      }
    }
    
    // Regular URL construction
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return `${cleanBaseUrl}${cleanEndpoint}`
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-gray-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Upload Brain Scans</h2>
                <p className="text-gray-600 mt-1">Upload and analyze brain MRI scans with advanced AI</p>
              </div>
            </div>
          </div>

          {!showResults ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Upload and Analyze Brain Scans</h3>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
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
                )}

                <div className="space-y-8">
                  {/* Patient Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Patient *
                    </label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      required
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} ({patient.patient_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Brain Scan Images *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors duration-200">
                      <input
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="fileInput"
                      />
                      <label htmlFor="fileInput" className="cursor-pointer">
                        <div className="text-6xl mb-4">📁</div>
                        <p className="text-lg text-gray-600 mb-2">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports PNG, JPG, JPEG files (max 16MB) - Multiple files allowed
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Files:</h3>
                      <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto border border-gray-200">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <span className="text-sm text-gray-900">{file.name}</span>
                            <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={resetForm}
                      className="inline-flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-200"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={loading || !selectedPatient || selectedFiles.length === 0}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span>🔬 Analyze Brain Scans</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Download Section */}
              {generatingReport && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                  <div className="text-yellow-400 text-2xl mb-2">⏳</div>
                  <div className="text-yellow-800">Generating PDF report...</div>
                </div>
              )}
              {reportGenerated && reportData && !generatingReport && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-green-400 text-2xl">📄</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-green-800">PDF Report Generated!</h3>
                      <p className="text-green-700 mt-1">
                        A comprehensive PDF report has been generated and attached to this patient.
                        <br />
                        <span className="text-sm">
                          Scans: {reportData.scan_count} | 
                          Tumors: {reportData.tumor_count} | 
                          No Tumors: {reportData.no_tumor_count}
                        </span>
                      </p>
                      <div className="mt-3">
                        <a
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                            if (baseUrl.endsWith('/api/')) baseUrl = baseUrl.slice(0, -4);
                            else if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -3);
                            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
                            const filename = reportData.report_url.split('/').pop();
                            const apiUrl = `${baseUrl}/api/report/download-by-filename/${filename}`;
                            const response = await fetch(apiUrl);
                            const data = await response.json();
                            if (data.success && data.download_url) {
                              if (data.download_url.startsWith('http')) {
                                const a = document.createElement('a');
                                a.href = data.download_url;
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              } else {
                                let fileUrl = `${baseUrl}${data.download_url}`;
                                fileUrl = fileUrl.replace(/([^:]\/)\/+/, '$1');
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
                          }}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 text-sm transition-all duration-200"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>📥 Download PDF Report</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Header */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
                  <button
                    onClick={resetForm}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>🔄 Analyze More Images</span>
                  </button>
                </div>
              </div>

              {/* Results */}
              {results.map((result, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
                  {result.success ? (
                    <div className="p-8">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{result.filename}</h3>
                        <div className={`inline-block px-8 py-4 rounded-full text-xl font-bold ${
                          result.prediction === 'Tumor' 
                            ? 'bg-red-100 text-red-800 border-2 border-red-200' 
                            : 'bg-green-100 text-green-800 border-2 border-green-200'
                        }`}>
                          {result.prediction}
                        </div>
                        <p className="text-gray-600 mt-3 text-lg">
                          Confidence: <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span> | 
                          Probability: <span className="font-semibold">{(result.probability * 100).toFixed(1)}%</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Original Image */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                            📷 Original Image
                          </h4>
                          {result.original_image && (
                            <img
                              src={result.original_image}
                              alt="Original brain scan"
                              className="w-full h-64 object-contain rounded-lg shadow-md"
                            />
                          )}
                          <p className="text-sm text-gray-600 mt-3 text-center">
                            The original brain scan image as uploaded.
                          </p>
                        </div>

                        {/* GradCAM Heatmap */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                            🔥 GradCAM Heatmap
                          </h4>
                          {result.heatmap && (
                            <img
                              src={result.heatmap}
                              alt="GradCAM heatmap"
                              className="w-full h-64 object-contain rounded-lg shadow-md"
                            />
                          )}
                          <p className="text-sm text-gray-600 mt-3 text-center">
                            Areas in red/yellow show regions the AI focused on.
                          </p>
                        </div>

                        {/* Overlay Visualization */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                            🔍 Overlay Visualization
                          </h4>
                          {result.overlay && (
                            <img
                              src={result.overlay}
                              alt="Overlay visualization"
                              className="w-full h-64 object-contain rounded-lg shadow-md"
                            />
                          )}
                          <p className="text-sm text-gray-600 mt-3 text-center">
                            Combined view showing AI's focus areas.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{result.filename}</h3>
                        <div className="bg-red-100 border border-red-200 rounded-xl p-4">
                          <p className="text-red-700">Error: {result.error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 