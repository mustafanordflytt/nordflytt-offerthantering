'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

interface Props {
  redirectTo?: string
}

export default function CRMLoginForm({ redirectTo = '/crm/dashboard' }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signIn(email, password)
      // If signIn succeeds, AuthProvider will handle the redirect
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Inloggning misslyckades')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[#002A5C] rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Logga in till CRM
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Nordflytt CRM-system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inloggning</CardTitle>
            <CardDescription>
              Ange dina inloggningsuppgifter för att komma åt CRM-systemet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.se"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ditt lösenord"
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
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

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">Testinloggning för demo:</h4>
                <div className="bg-gray-50 p-3 rounded space-y-1 text-xs">
                  <div><strong>Admin:</strong> mustafa@nordflytt.se / mustafa123</div>
                  <div><strong>Admin:</strong> admin@nordflytt.se / admin123</div>
                  <div><strong>Manager:</strong> manager@nordflytt.se / manager123</div>
                  <div><strong>Employee:</strong> employee@nordflytt.se / employee123</div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  I produktion skulle dessa tas bort och ersättas med riktiga användarkonton.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Problem med inloggning? Kontakta systemadministratör</p>
        </div>
      </div>
    </div>
  )
}

// Quick login buttons for development/demo
export function QuickLoginButtons() {
  const [isLoading, setIsLoading] = useState('')
  const router = useRouter()
  const { signIn } = useAuth()

  const quickLogin = async (email: string, password: string, role: string) => {
    setIsLoading(role)
    try {
      await signIn(email, password)
      // If signIn succeeds, AuthProvider will handle the redirect
    } catch (error) {
      console.error('Quick login error:', error)
    } finally {
      setIsLoading('')
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="text-xs text-gray-500 text-center">Snabbinloggning (endast utveckling):</div>
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => quickLogin('mustafa@nordflytt.se', 'mustafa123', 'mustafa')}
          disabled={!!isLoading}
          className="flex-1"
        >
          {isLoading === 'mustafa' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mustafa'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => quickLogin('admin@nordflytt.se', 'admin123', 'admin')}
          disabled={!!isLoading}
          className="flex-1"
        >
          {isLoading === 'admin' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Admin'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => quickLogin('manager@nordflytt.se', 'manager123', 'manager')}
          disabled={!!isLoading}
          className="flex-1"
        >
          {isLoading === 'manager' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Manager'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => quickLogin('employee@nordflytt.se', 'employee123', 'employee')}
          disabled={!!isLoading}
          className="flex-1"
        >
          {isLoading === 'employee' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Employee'}
        </Button>
      </div>
    </div>
  )
}