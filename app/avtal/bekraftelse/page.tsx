'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, FileText, Home, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ContractConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Anställningsavtal signerat!
              </h1>
              <p className="text-lg text-gray-600">
                Ditt anställningsavtal hos Nordflytt har signerats framgångsrikt
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-left">
                  <h3 className="font-semibold text-green-800 mb-2">Vad händer nu?</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• HR kommer att kontakta dig inom 24 timmar</li>
                    <li>• Du kommer att få en kopia av det signerade avtalet via e-post</li>
                    <li>• Onboarding-processen startar automatiskt i systemet</li>
                    <li>• Arbetskläder och utrustning kommer att bokas för utdelning</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-blue-800 mb-1">Kontakt</h4>
                <p className="text-sm text-blue-700">
                  Frågor? Kontakta HR på<br />
                  010-555 12 89
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <Home className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold text-purple-800 mb-1">Personalportal</h4>
                <p className="text-sm text-purple-700">
                  Åtkomst till personalappen<br />
                  kommer inom kort
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link href="/">
                <Button className="bg-[#002A5C] hover:bg-[#001A3D]">
                  <Home className="h-4 w-4 mr-2" />
                  Tillbaka till startsidan
                </Button>
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Detta avtal är juridiskt bindande och gäller enligt svensk arbetsrätt.<br />
                Avtalet har signerats digitalt med säker kryptering.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}