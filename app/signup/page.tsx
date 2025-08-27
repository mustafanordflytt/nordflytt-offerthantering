'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

export default function SignUpPage() {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate inputs
    if (!name.trim()) {
      setError('Namn krävs')
      return
    }

    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte')
      return
    }

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, name)
    } catch (err: any) {
      setError(err.message || 'Registrering misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            className="mx-auto h-12 w-auto"
            src="/nordflytt-logo.svg"
            alt="Nordflytt"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Skapa nytt konto
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Eller{' '}
            <Link href="/login" className="font-medium text-[#002A5C] hover:text-[#001a42]">
              logga in med befintligt konto
            </Link>
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Registrering</CardTitle>
              <CardDescription>
                Fyll i dina uppgifter för att skapa ett nytt CRM-konto
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Namn</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="För- och efternamn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="namn@foretag.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minst 6 tecken"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Samma som ovan"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-[#002A5C] hover:bg-[#001a42]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Skapar konto...
                  </>
                ) : (
                  'Skapa konto'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>
            Genom att skapa ett konto godkänner du våra{' '}
            <Link href="/terms" className="text-[#002A5C] hover:text-[#001a42]">
              användarvillkor
            </Link>{' '}
            och{' '}
            <Link href="/privacy" className="text-[#002A5C] hover:text-[#001a42]">
              integritetspolicy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}