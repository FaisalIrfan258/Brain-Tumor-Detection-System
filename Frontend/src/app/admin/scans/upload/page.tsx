'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiService, Patient, UploadScanResponse } from '@/services/api'

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
  const router = useRouter()

  useEffect(() => {
    loadPatients()
  }, [])

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
        
        // Check if report was generated
        if (response.report_generated && response.report_data) {
          setReportGenerated(true)
          setReportData(response.report_data)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-500 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-indigo-600">Upload Brain Scans</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!showResults ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload and Analyze Brain Scans</h2>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Patient Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Patient *
                    </label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
                      <div className="bg-gray-50 rounded-md p-4 max-h-48 overflow-y-auto">
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
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={resetForm}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={loading || !selectedPatient || selectedFiles.length === 0}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Analyzing...' : '🔬 Analyze Brain Scans'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Download Section */}
              {reportGenerated && reportData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-green-400 text-2xl">📄</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-green-800">PDF Report Generated!</h3>
                      <p className="text-green-700 mt-1">
                        A comprehensive PDF report has been automatically generated for this patient.
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
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                        >
                          📥 Download PDF Report
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Header */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
                  <button
                    onClick={resetForm}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    🔄 Analyze More Images
                  </button>
                </div>
              </div>

              {/* Results */}
              {results.map((result, index) => (
                <div key={index} className="bg-white shadow rounded-lg overflow-hidden">
                  {result.success ? (
                    <div className="p-6">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{result.filename}</h3>
                        <div className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${
                          result.prediction === 'Tumor' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {result.prediction}
                        </div>
                        <p className="text-gray-600 mt-2">
                          Confidence: {(result.confidence * 100).toFixed(1)}% | 
                          Probability: {(result.probability * 100).toFixed(1)}%
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Original Image */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                            📷 Original Image
                          </h4>
                          {result.original_image && (
                            <img
                              src={result.original_image}
                              alt="Original brain scan"
                              className="w-full h-64 object-contain rounded-lg"
                            />
                          )}
                          <p className="text-sm text-gray-600 mt-2 text-center">
                            The original brain scan image as uploaded.
                          </p>
                        </div>

                        {/* GradCAM Heatmap */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                            🔥 GradCAM Heatmap
                          </h4>
                          {result.heatmap && (
                            <img
                              src={result.heatmap}
                              alt="GradCAM heatmap"
                              className="w-full h-64 object-contain rounded-lg"
                            />
                          )}
                          <p className="text-sm text-gray-600 mt-2 text-center">
                            Areas in red/yellow show regions the AI focused on.
                          </p>
                        </div>

                        {/* Overlay Visualization */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                            🔍 Overlay Visualization
                          </h4>
                          {result.overlay && (
                            <img
                              src={result.overlay}
                              alt="Overlay visualization"
                              className="w-full h-64 object-contain rounded-lg"
                            />
                          )}
                          <p className="text-sm text-gray-600 mt-2 text-center">
                            Combined view showing AI's focus areas.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{result.filename}</h3>
                        <div className="bg-red-100 border border-red-200 rounded-md p-4">
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