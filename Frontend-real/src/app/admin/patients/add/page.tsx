'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiService, AddPatientRequest, AddPatientResponse } from '../../../../services/api'

export default function AddPatient() {
  const [formData, setFormData] = useState<AddPatientRequest>({
    name: '',
    email: '',
    age: undefined,
    gender: undefined,
    phone: undefined,
    address: undefined
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [patientCredentials, setPatientCredentials] = useState<{
    username: string;
    password: string;
    email: string;
    email_sent: boolean;
  } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Prepare patient data with proper type conversion
      const patientData: AddPatientRequest = {
        name: formData.name,
        email: formData.email,
        age: formData.age ? parseInt(formData.age.toString()) : undefined,
        gender: formData.gender || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined
      }

      // Add patient via API
      const result: AddPatientResponse = await apiService.addPatient(patientData)
      
      if (result.success && result.data) {
        setPatientCredentials({
          username: result.data.username,
          password: result.data.password,
          email: result.data.email,
          email_sent: result.data.email_sent
        })
        setSuccess(true)
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 5000)
      } else {
        setError(result.error || 'Failed to add patient. Please try again.')
      }
    } catch (err: any) {
      console.error('Error adding patient:', err)
      setError(apiService.handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value === '' ? undefined : value
    })
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
              <h1 className="text-2xl font-bold text-indigo-600">Add New Patient</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {success && patientCredentials ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-green-800">Patient Added Successfully!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p className="mb-4">The patient has been registered and login credentials have been generated.</p>
                    
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">Patient Credentials:</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Username:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{patientCredentials.username}</code></div>
                        <div><strong>Password:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{patientCredentials.password}</code></div>
                        <div><strong>Email:</strong> {patientCredentials.email}</div>
                      </div>
                    </div>
                    
                    <p className="mt-4 text-xs text-gray-600">
                      {patientCredentials?.email_sent 
                        ? "These credentials have been sent to the patient's email address."
                        : "Note: Email notification could not be sent. Please provide credentials manually."
                      }
                      Redirecting to dashboard in 5 seconds...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        id="age"
                        min="1"
                        max="150"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.age || ''}
                        onChange={handleChange}
                        placeholder="Enter age (optional)"
                      />
                    </div>

                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                        Gender
                      </label>
                      <select
                        name="gender"
                        id="gender"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.gender || ''}
                        onChange={handleChange}
                      >
                        <option value="">Select Gender (optional)</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        placeholder="Enter phone number (optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      name="address"
                      id="address"
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.address || ''}
                      onChange={handleChange}
                      placeholder="Enter address (optional)"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Important Note</h3>
                        <p className="mt-1 text-sm text-blue-700">
                          When you add a patient, the system will automatically generate login credentials 
                          and send them to the patient's email address. The patient can then access their 
                          portal to view their scan results and reports.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Link
                      href="/admin/dashboard"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Adding Patient...' : 'Add Patient'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 