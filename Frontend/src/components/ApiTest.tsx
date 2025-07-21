'use client'

import { useState } from 'react'
import { apiService } from '../services/api'

export default function ApiTest() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, success: boolean, data?: any, error?: string) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    }])
  }

  const runTests = async () => {
    setLoading(true)
    setResults([])

    try {
      // Test 1: Health Check
      try {
        const health = await apiService.healthCheck()
        addResult('Health Check', true, health)
      } catch (error: any) {
        addResult('Health Check', false, null, apiService.handleApiError(error))
      }

      // Test 2: Admin Login
      try {
        const login = await apiService.adminLogin({ username: 'admin', password: 'admin' })
        addResult('Admin Login', login.success, login)
      } catch (error: any) {
        addResult('Admin Login', false, null, apiService.handleApiError(error))
      }

      // Test 3: Dashboard Stats
      try {
        const stats = await apiService.getDashboardStats()
        addResult('Dashboard Stats', true, stats)
      } catch (error: any) {
        addResult('Dashboard Stats', false, null, apiService.handleApiError(error))
      }

      // Test 4: Get Patients
      try {
        const patients = await apiService.getPatients()
        addResult('Get Patients', true, { count: patients.length, patients })
      } catch (error: any) {
        addResult('Get Patients', false, null, apiService.handleApiError(error))
      }

      // Test 5: Add Patient
      try {
        const testEmail = `test_${Date.now()}@example.com`
        const patient = await apiService.addPatient({
          name: 'Test Patient',
          email: testEmail,
          age: 30,
          gender: 'Male',
          phone: '1234567890',
          address: 'Test Address'
        })
        addResult('Add Patient', patient.success, patient.data)
      } catch (error: any) {
        addResult('Add Patient', false, null, apiService.handleApiError(error))
      }

      // Test 6: Get Scans
      try {
        const scans = await apiService.getScans()
        addResult('Get Scans', true, { count: scans.length, scans })
      } catch (error: any) {
        addResult('Get Scans', false, null, apiService.handleApiError(error))
      }

      // Test 7: Get Reports
      try {
        const reports = await apiService.getReports()
        addResult('Get Reports', true, { count: reports.length, reports })
      } catch (error: any) {
        addResult('Get Reports', false, null, apiService.handleApiError(error))
      }

    } catch (error: any) {
      addResult('Test Suite', false, null, 'Test suite failed to run')
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  const successCount = results.filter(r => r.success).length
  const totalCount = results.length

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">API Integration Test</h2>
        
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={runTests}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </button>
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
          
          {totalCount > 0 && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                Results: {successCount}/{totalCount} tests passed 
                ({((successCount / totalCount) * 100).toFixed(1)}%)
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-md border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.test}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  result.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? 'PASS' : 'FAIL'}
                </span>
              </div>
              
              {result.error && (
                <p className="text-sm text-red-600 mt-2">
                  Error: {result.error}
                </p>
              )}
              
              {result.data && (
                <details className="mt-2">
                  <summary className="text-sm text-gray-600 cursor-pointer">
                    View Response Data
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                {new Date(result.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>

        {results.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            <p>No test results yet. Click "Run All Tests" to start testing the API integration.</p>
          </div>
        )}
      </div>
    </div>
  )
} 