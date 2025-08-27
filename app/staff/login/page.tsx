'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Phone, ArrowRight, Shield, Loader2 } from 'lucide-react'
// Remove unused import

export default function StaffLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Auto-format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Remove non-digits
    let formatted = value

    if (value.startsWith('0')) {
      // Swedish format: 070-123 45 67
      if (value.length > 3) formatted = value.slice(0, 3) + '-' + value.slice(3)
      if (value.length > 6) formatted = formatted.slice(0, 7) + ' ' + formatted.slice(7)
      if (value.length > 8) formatted = formatted.slice(0, 10) + ' ' + formatted.slice(10)
    } else if (value.startsWith('46')) {
      // International format: +46 70 123 45 67
      formatted = '+' + value.slice(0, 2) + ' ' + value.slice(2)
      if (value.length > 4) formatted = formatted.slice(0, 6) + ' ' + formatted.slice(6)
      if (value.length > 7) formatted = formatted.slice(0, 10) + ' ' + formatted.slice(10)
      if (value.length > 9) formatted = formatted.slice(0, 13) + ' ' + formatted.slice(13)
    }

    setPhoneNumber(formatted)
  }

  // Send OTP
  const handleSendOTP = async () => {
    setError('')
    setLoading(true)

    try {
      // Normalize phone number to E.164 format
      const normalizedPhone = phoneNumber
        .replace(/\D/g, '')
        .replace(/^0/, '+46')
        .replace(/^46/, '+46')

      if (!normalizedPhone.startsWith('+46') || normalizedPhone.length !== 13) {
        throw new Error('Ange ett giltigt svenskt mobilnummer')
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte skicka kod')
      }

      setStep('otp')
      
      // Start resend timer (60 seconds)
      setResendTimer(60)
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async () => {
    setError('')
    setLoading(true)

    try {
      const normalizedPhone = phoneNumber
        .replace(/\D/g, '')
        .replace(/^0/, '+46')
        .replace(/^46/, '+46')

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: normalizedPhone,
          code: otp 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fel kod')
      }

      // Store auth data
      localStorage.setItem('staff_auth', JSON.stringify({
        id: data.employee.id,
        email: data.employee.email,
        name: data.employee.name,
        role: data.employee.role,
        phone: data.employee.phone,
        loginTime: new Date().toISOString(),
        token: data.token
      }))

      // Redirect to dashboard
      router.push('/staff/dashboard')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fel kod')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 bg-[#002A5C] rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Logga in</CardTitle>
          <CardDescription>
            Nordflytt Staff App - För anställda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobilnummer</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="070-123 45 67"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    className="pl-10"
                    autoFocus
                    maxLength={14}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Ange det mobilnummer som din chef registrerat
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                onClick={handleSendOTP}
                disabled={loading || phoneNumber.length < 10}
                className="w-full h-12"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Få engångskod
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  SMS skickat till: <strong>{phoneNumber}</strong>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Ange 6-siffrig kod</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && handleVerifyOTP()}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoFocus
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Logga in'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Button
                    variant="ghost"
                    className="h-11"
                    onClick={() => {
                      setStep('phone')
                      setOtp('')
                      setError('')
                    }}
                  >
                    Ändra nummer
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="h-11"
                    onClick={handleSendOTP}
                    disabled={resendTimer > 0}
                  >
                    {resendTimer > 0 
                      ? `Skicka igen (${resendTimer}s)` 
                      : 'Skicka ny kod'
                    }
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>Har du problem att logga in?</p>
            <p className="font-medium">Kontakta din chef</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}