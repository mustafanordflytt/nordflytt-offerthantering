'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Package, FileText, ArrowLeft } from 'lucide-react'

export default function AssetConfirmationPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">NordFlytt</h1>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">
              Tillgångsförteckning Signerad!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-gray-600 mb-4">
                Tack för att du signerat tillgångsförteckningen. 
              </p>
              <p className="text-gray-600">
                Din signatur har registrerats och du har nu officiellt mottagit de tilldelade tillgångarna.
              </p>
            </div>

            {/* Nästa steg */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Vad händer nu?
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">1.</span>
                  <span>Du har nu ansvar för de tilldelade tillgångarna</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">2.</span>
                  <span>Använd tillgångarna varsamt och enligt instruktioner</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">3.</span>
                  <span>Rapportera eventuella skador eller förluster omedelbart</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">4.</span>
                  <span>Återlämna alla tillgångar när anställningen avslutas</span>
                </li>
              </ul>
            </div>

            {/* Kontaktinformation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Frågor eller problem?</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>📞 <strong>Telefon:</strong> 010-555 1289</p>
                <p>📧 <strong>E-post:</strong> hej@nordflytt.se</p>
                <p>👥 <strong>HR-avdelning:</strong> hr@nordflytt.se</p>
              </div>
            </div>

            {/* Åtgärdsknappar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => router.push('/')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till startsidan
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              <p>© 2025 NordFlytt. Din signatur har sparats säkert.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}