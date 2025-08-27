'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SimpleNewStaffPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
      department: formData.get('department') as string,
      hireDate: new Date().toISOString()
    }

    console.log('Skickar data:', data)

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(`✅ Anställd skapad: ${result.data.staff_id}`)
        setTimeout(() => {
          router.push('/crm/anstallda')
        }, 1500)
      } else {
        setError(`❌ Fel: ${result.error}`)
      }
    } catch (err: any) {
      setError(`❌ Fel: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/crm/anstallda">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ny Anställd (Förenklad)</CardTitle>
          <CardDescription>Fyll i grundläggande information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Namn *</Label>
              <Input id="name" name="name" required />
            </div>

            <div>
              <Label htmlFor="email">E-post *</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div>
              <Label htmlFor="phone">Telefon *</Label>
              <Input id="phone" name="phone" required />
            </div>

            <div>
              <Label htmlFor="role">Roll *</Label>
              <select 
                id="role" 
                name="role" 
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="">Välj roll</option>
                <option value="mover">Flyttare</option>
                <option value="driver">Chaufför</option>
                <option value="admin">Administratör</option>
                <option value="manager">Chef</option>
              </select>
            </div>

            <div>
              <Label htmlFor="department">Avdelning *</Label>
              <Input id="department" name="department" defaultValue="Operations" required />
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-100 text-green-700 rounded-md">
                {success}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Skapar...' : 'Skapa Anställd'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}