'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestFormPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult('')
    
    try {
      const formData = {
        name: 'Test Anställd',
        email: `test.${Date.now()}@nordflytt.se`,
        phone: '+46701234567',
        role: 'mover',
        department: 'Operations',
        hireDate: new Date().toISOString(),
        skills: ['Packning av kundens bohag', 'B-körkort'],
        employmentType: 'full_time'
      }
      
      setResult('Skickar data...\n')
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(prev => prev + `✅ Anställd skapad: ${data.data.staff_id}\n`)
        setResult(prev => prev + `Namn: ${data.data.name}\n`)
        setResult(prev => prev + `\nGå till: /crm/anstallda/${data.data.staff_id}`)
      } else {
        setResult(prev => prev + `❌ Fel: ${data.error}\n`)
      }
      
    } catch (error: any) {
      setResult(prev => prev + `❌ Fel: ${error.message}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Test Formulär</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              type="text" 
              placeholder="Detta är bara ett test-formulär"
              disabled
            />
            
            <Button 
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Skapar anställd...' : 'Skapa Test Anställd'}
            </Button>
          </form>
          
          {result && (
            <pre className="mt-4 p-4 bg-gray-100 rounded-md text-sm overflow-x-auto">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}