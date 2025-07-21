'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiService, Patient, Scan } from '@/services/api'

export default function PatientScansPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = Number(params.id)
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (patientId) {
      loadPatientData()
    }
  }, [patientId])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      const [patientData, scansData] = await Promise.all([
        apiService.getAdminPatientById(patientId),
        apiService.getAdminPatientScans(patientId)
      ])
      setPatient(patientData)
      setScans(scansData)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient scans...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
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
                {patient?.name} - Brain Scans
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/scans/upload"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Upload New Scans
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Patient Info */}
          {patient && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                    <p className="text-sm text-gray-900">{patient.patient_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
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
                    <label className="block text-sm font-medium text-gray-700">Total Scans</label>
                    <p className="text-sm text-gray-900">{scans.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scans List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Brain Scan Results ({scans.length})
                </h2>
                <button
                  onClick={loadPatientData}
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Refresh
                </button>
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
                <div className="space-y-6">
                  {scans.map((scan) => (
                    <div key={scan.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {scan.original_filename}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Scan ID: {scan.scan_id} | Uploaded: {formatDate(scan.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPredictionColor(scan.prediction)}`}>
                            {scan.prediction}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Confidence</label>
                          <p className="text-sm text-gray-900">
                            {scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Probability</label>
                          <p className="text-sm text-gray-900">
                            {scan.probability ? `${(scan.probability * 100).toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <p className="text-sm text-gray-900">
                            {scan.report_path ? 'Report Generated' : 'No Report'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        {scan.original_path && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${scan.original_path.split('/').pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            View Original
                          </a>
                        )}
                        {scan.heatmap_path && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${scan.heatmap_path.split('/').pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            View Heatmap
                          </a>
                        )}
                        {scan.overlay_path && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${scan.overlay_path.split('/').pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            View Overlay
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 