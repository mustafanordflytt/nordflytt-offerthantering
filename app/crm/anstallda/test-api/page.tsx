'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestStaffAPI() {
  const [getResult, setGetResult] = useState<any>(null)
  const [postResult, setPostResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testGET = async () => {
    try {
      setError(null)
      const token = localStorage.getItem('crm_token') || 'dev-token'
      console.log('Testing GET with token:', token)
      
      const response = await fetch('/api/crm/staff', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      console.log('GET Response:', response.status, data)
      setGetResult({ status: response.status, data })
    } catch (err: any) {
      console.error('GET Error:', err)
      setError(err.message)
    }
  }

  const testPOST = async () => {
    try {
      setError(null)
      const token = localStorage.getItem('crm_token') || 'dev-token'
      console.log('Testing POST with token:', token)
      
      const testData = {
        name: 'Test Anställd',
        email: `test${Date.now()}@nordflytt.se`,
        phone: '+46 70 123 45 67',
        role: 'mover',
        department: 'Flyttteam',
        hireDate: new Date().toISOString(),
        employmentType: 'full_time',
        personalNumber: '900101-1234',
        address: 'Testgatan 1',
        postalCode: '12345',
        city: 'Stockholm',
        skills: ['Packning', 'Tunga lyft'],
        languages: ['Svenska', 'Engelska']
      }
      
      const response = await fetch('/api/crm/staff', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })
      
      const data = await response.json()
      console.log('POST Response:', response.status, data)
      setPostResult({ status: response.status, data })
    } catch (err: any) {
      console.error('POST Error:', err)
      setError(err.message)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Test Staff API</h1>
      
      <div className="flex gap-4">
        <Button onClick={testGET}>Test GET /api/crm/staff</Button>
        <Button onClick={testPOST}>Test POST /api/crm/staff</Button>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm">{error}</pre>
          </CardContent>
        </Card>
      )}

      {getResult && (
        <Card>
          <CardHeader>
            <CardTitle>GET Result (Status: {getResult.status})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(getResult.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {postResult && (
        <Card>
          <CardHeader>
            <CardTitle>POST Result (Status: {postResult.status})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(postResult.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}