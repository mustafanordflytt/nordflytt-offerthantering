'use client'

import { useState } from 'react'
import { Send, Mail, MessageSquare, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/token-helper'

interface TestResult {
  success: boolean
  testType: string
  result: {
    messageId?: string
    cost?: number
    error?: string
    queueId?: string
  }
  message: string
  timestamp: string
}

export function NotificationTester() {
  const [testType, setTestType] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const runTest = async () => {
    if (!testType) {
      toast.error('Välj en testtyp')
      return
    }

    // Validate inputs based on test type
    if (testType.includes('email') && !testEmail) {
      toast.error('E-postadress krävs för e-posttester')
      return
    }

    if (testType.includes('sms') && !testPhone) {
      toast.error('Telefonnummer krävs för SMS-tester')
      return
    }

    try {
      setTesting(true)
      const headers = await getAuthHeaders()

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testType,
          testEmail: testEmail || undefined,
          testPhone: testPhone || undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        setResults(prev => [result, ...prev])
        toast.success(result.message)
      } else {
        toast.error(result.error || 'Test misslyckades')
        setResults(prev => [{ 
          ...result, 
          success: false,
          timestamp: new Date().toISOString()
        }, ...prev])
      }
    } catch (error) {
      console.error('Test error:', error)
      toast.error('Kunde inte köra test')
    } finally {
      setTesting(false)
    }
  }

  const testTypes = [
    { value: 'email_config', label: 'E-post konfiguration', icon: Mail, needsEmail: false },
    { value: 'sms_config', label: 'SMS konfiguration', icon: MessageSquare, needsEmail: false },
    { value: 'booking_confirmation_email', label: 'Bokningsbekräftelse (E-post)', icon: Mail, needsEmail: true },
    { value: 'booking_confirmation_sms', label: 'Bokningsbekräftelse (SMS)', icon: MessageSquare, needsEmail: false },
    { value: 'invoice_email', label: 'Faktura (E-post)', icon: Mail, needsEmail: true },
    { value: 'job_reminder_email', label: 'Jobbpåminnelse (E-post)', icon: Mail, needsEmail: true },
    { value: 'job_reminder_sms', label: 'Jobbpåminnelse (SMS)', icon: MessageSquare, needsEmail: false },
    { value: 'team_arrival_sms', label: 'Team på väg (SMS)', icon: MessageSquare, needsEmail: false },
    { value: 'queue_test', label: 'Test notification queue', icon: Clock, needsEmail: false }
  ]

  const selectedTest = testTypes.find(t => t.value === testType)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Notifikationstester
          </CardTitle>
          <CardDescription>
            Testa e-post och SMS-notifikationer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-type">Testtyp</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger>
                <SelectValue placeholder="Välj en test att köra" />
              </SelectTrigger>
              <SelectContent>
                {testTypes.map(test => {
                  const Icon = test.icon
                  return (
                    <SelectItem key={test.value} value={test.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {test.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedTest?.needsEmail && (
            <div className="space-y-2">
              <Label htmlFor="test-email">Test e-postadress</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
          )}

          {selectedTest && (selectedTest.value.includes('sms') || selectedTest.value.includes('phone')) && (
            <div className="space-y-2">
              <Label htmlFor="test-phone">Test telefonnummer</Label>
              <Input
                id="test-phone"
                type="tel"
                placeholder="+46701234567 eller 0701234567"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Använd ditt eget nummer för att testa SMS
              </p>
            </div>
          )}

          <Button
            onClick={runTest}
            disabled={testing || !testType}
            className="w-full"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Kör test...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Kör test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Testresultat</CardTitle>
            <CardDescription>
              Senaste testresultat visas först
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.slice(0, 5).map((result, index) => (
                <Alert key={index} className={result.success ? 'border-green-500' : 'border-red-500'}>
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {testTypes.find(t => t.value === result.testType)?.label || result.testType}
                          </p>
                          <p className="text-sm">{result.message}</p>
                          
                          {result.result.messageId && (
                            <p className="text-xs text-muted-foreground">
                              Message ID: {result.result.messageId}
                            </p>
                          )}
                          
                          {result.result.queueId && (
                            <p className="text-xs text-muted-foreground">
                              Queue ID: {result.result.queueId}
                            </p>
                          )}
                          
                          {result.result.cost && (
                            <p className="text-xs text-muted-foreground">
                              Kostnad: ${result.result.cost}
                            </p>
                          )}
                          
                          {result.result.error && (
                            <p className="text-xs text-red-600">
                              Fel: {result.result.error}
                            </p>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString('sv-SE')}
                          </p>
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
              
              {results.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ...och {results.length - 5} tidigare resultat
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Obs:</strong> E-posttester kräver att SendGrid är konfigurerat i din .env.development.local fil.
          SMS-tester kräver Twilio-konfiguration. Använd bara ditt eget telefonnummer för SMS-tester.
        </AlertDescription>
      </Alert>
    </div>
  )
}