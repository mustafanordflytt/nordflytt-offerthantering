'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAuthHeaders } from '@/lib/token-helper'

export default function TestCalendarAPI() {
  const [results, setResults] = useState<Record<string, any>>({})
  
  const testEndpoint = async (name: string, url: string) => {
    try {
      const headers = await getAuthHeaders()
      console.log('Headers:', headers)
      
      const response = await fetch(url, { headers })
      const data = await response.json()
      
      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          ok: response.ok,
          data: data
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  }
  
  const runTests = () => {
    // Set token if missing - check for browser environment
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('crm-token')) {
        localStorage.setItem('crm-token', 'crm-token-123')
      }
    }
    
    testEndpoint('events', '/api/crm/calendar/events')
    testEndpoint('resources', '/api/crm/calendar/resources')
    testEndpoint('availability', '/api/crm/calendar/availability')
  }
  
  useEffect(() => {
    // Only run tests in browser environment
    if (typeof window !== 'undefined') {
      runTests()
    }
  }, [])
  
  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Calendar API Test</h1>
      
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">
          Token: {localStorage.getItem('crm-token') || 'Not set'}
        </p>
        <Button onClick={runTests}>Re-run Tests</Button>
      </div>
      
      {Object.entries(results).map(([name, result]) => (
        <Card key={name}>
          <CardHeader>
            <CardTitle className="text-lg">
              {name} - Status: {result.status} {result.ok ? '✅' : '❌'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto bg-gray-100 p-2 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}