'use client'

import { useSearchParams } from 'next/navigation'
import { AlertCircle, Lock, Mail, Phone } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AccessRequiredPage() {
  const searchParams = useSearchParams()
  const resource = searchParams.get('resource')
  const error = searchParams.get('error')
  
  const isOffer = resource?.includes('/offer/')
  const isOrderConfirmation = resource?.includes('/order-confirmation/')
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Åtkomst krävs</CardTitle>
          <CardDescription>
            {isOffer && 'Denna offert kräver en giltig länk för att visas'}
            {isOrderConfirmation && 'Denna bokningsbekräftelse kräver en giltig länk'}
            {!isOffer && !isOrderConfirmation && 'Denna sida kräver behörighet'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error === 'invalid_token' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ogiltig länk</AlertTitle>
              <AlertDescription>
                Länken du försöker använda är ogiltig eller har gått ut.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Vad kan du göra?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Kontrollera att du har den senaste länken från ditt email</li>
              <li>• Be om en ny länk om din har gått ut</li>
              <li>• Kontakta oss om du har problem</li>
            </ul>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-4">Behöver du hjälp?</p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="tel:010-555-12-89">
                  <Phone className="w-4 h-4 mr-2" />
                  010-555 12 89
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="mailto:info@nordflytt.se">
                  <Mail className="w-4 h-4 mr-2" />
                  info@nordflytt.se
                </a>
              </Button>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <Button asChild>
              <a href="/">Tillbaka till startsidan</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}