'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/crm-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        setError(data.error || 'Inloggning misslyckades')
        return
      }
      
      // Spara i localStorage
      localStorage.setItem('crm-user', JSON.stringify(data.user))
      if (data.token) {
        localStorage.setItem('crm-token', data.token)
      }
      
      // Redirect - use window.location for hard navigation to bypass Next.js issues
      window.location.href = '/crm/dashboard'
    } catch (error: any) {
      setError('Ett fel uppstod vid inloggning')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick login för Mustafa
  const quickLoginMustafa = () => {
    setEmail('mustafa@nordflytt.se')
    setPassword('mustafa123')
    // Auto-submit
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true }))
      }
    }, 100)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#002A5C]">Logga in till CRM</h1>
            <p className="text-gray-600 mt-2">Nordflytt CRM-system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="email">E-postadress</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.se"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#002A5C] hover:bg-[#001a42]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loggar in...
                </>
              ) : (
                'Logga in'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-3">Snabbinloggning:</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={quickLoginMustafa}
              className="w-full"
            >
              Logga in som Mustafa (Admin)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}