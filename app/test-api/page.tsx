'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAPIPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    setResult('')
    
    try {
      // Test 1: Hämta anställda
      const getResponse = await fetch('/api/employees')
      const getData = await getResponse.json()
      
      setResult(prev => prev + `GET /api/employees - Status: ${getResponse.status}\n`)
      setResult(prev => prev + `Antal anställda: ${getData.data?.length || 0}\n\n`)
      
      // Test 2: Skapa anställd
      const testEmployee = {
        name: 'Test Person',
        email: `test.${Date.now()}@nordflytt.se`,
        phone: '+46701234567',
        role: 'mover',
        department: 'Operations',
        hireDate: new Date().toISOString()
      }
      
      const postResponse = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEmployee)
      })
      
      const postData = await postResponse.json()
      
      setResult(prev => prev + `POST /api/employees - Status: ${postResponse.status}\n`)
      if (postResponse.ok) {
        setResult(prev => prev + `✅ Skapad: ${postData.data.staff_id}\n`)
      } else {
        setResult(prev => prev + `❌ Fel: ${postData.error}\n`)
      }
      
    } catch (error: any) {
      setResult(prev => prev + `\n❌ Fel: ${error.message}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testAPI}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testar...' : 'Testa API'}
          </Button>
          
          {result && (
            <pre className="p-4 bg-gray-100 rounded-md text-sm overflow-x-auto">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}