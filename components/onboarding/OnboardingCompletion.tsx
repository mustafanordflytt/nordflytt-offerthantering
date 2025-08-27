'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Smartphone, 
  Car, 
  FileText, 
  DollarSign,
  Star,
  CheckCircle2,
  Rocket,
  Award,
  TrendingUp,
  Target,
  Clock
} from 'lucide-react'

interface OnboardingCompletionProps {
  employee: any
  totalProvisionLearned: number
  completedSteps: string[]
  onComplete: () => void
}

interface Achievement {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  value: string | number
  color: string
}

const OnboardingCompletion: React.FC<OnboardingCompletionProps> = ({ 
  employee, 
  totalProvisionLearned, 
  completedSteps,
  onComplete 
}) => {
  const [showStats, setShowStats] = useState(false)

  const achievements: Achievement[] = [
    {
      id: 'provision',
      icon: <DollarSign className="h-8 w-8" />,
      title: `${totalProvisionLearned}kr`,
      description: 'Lärt dig tjäna i provision',
      value: totalProvisionLearned,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      id: 'staff_app',
      icon: <Smartphone className="h-8 w-8" />,
      title: 'Staff App',
      description: 'Redo att använda',
      value: '100%',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      id: 'vehicle',
      icon: <Car className="h-8 w-8" />,
      title: 'Fordonskod',
      description: 'Aktiv och redo',
      value: '✓',
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      id: 'contract',
      icon: <FileText className="h-8 w-8" />,
      title: 'Avtal',
      description: 'Signerat och sparat',
      value: '✓',
      color: 'text-orange-600 bg-orange-50 border-orange-200'
    }
  ]

  const nextSteps = [
    {
      id: 'wait_assignment',
      text: 'Vänta på första uppdrag',
      completed: false,
      priority: 'high'
    },
    {
      id: 'download_app',
      text: 'Ladda ner Staff App på din telefon',
      completed: false,
      priority: 'high'
    },
    {
      id: 'remember_scripts',
      text: 'Kom ihåg dina tillvals-scripts',
      completed: false,
      priority: 'medium'
    },
    {
      id: 'photo_everything',
      text: 'Fota allt - skydda dig mot klagomål',
      completed: false,
      priority: 'high'
    },
    {
      id: 'first_day_goals',
      text: 'Mål första dagen: 500kr i tillval',
      completed: false,
      priority: 'medium'
    }
  ]

  const provisionPotential = {
    daily: {
      conservative: 50,
      average: 150,
      excellent: 300
    },
    monthly: {
      conservative: 1100,
      average: 3300,
      excellent: 6600
    },
    yearly: {
      conservative: 13200,
      average: 39600,
      excellent: 79200
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-0 shadow-lg">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Välkommen till Nordflytt, {employee.name}!
          </h2>
          
          <p className="text-lg text-gray-600 mb-6">
            Du har slutfört onboarding och lärt dig tjäna extra provision
          </p>

          <div className="flex justify-center items-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <span className="text-lg font-semibold text-yellow-700">
              Onboarding Champion
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className={`border-2 ${achievement.color}`}>
            <CardContent className="pt-6 text-center">
              <div className={`mx-auto mb-3 w-16 h-16 rounded-full flex items-center justify-center ${achievement.color}`}>
                {achievement.icon}
              </div>
              <h3 className="text-xl font-bold mb-1">{achievement.title}</h3>
              <p className="text-sm text-gray-600">{achievement.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Provision Potential */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Din Intjäningspotential
          </CardTitle>
          <CardDescription>
            Baserat på din träning kan du tjäna följande extra provision:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-700 mb-1">Försiktig</div>
              <div className="text-2xl font-bold text-yellow-800 mb-1">
                {provisionPotential.monthly.conservative}kr
              </div>
              <div className="text-xs text-yellow-600">per månad</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-1">Genomsnitt</div>
              <div className="text-2xl font-bold text-green-800 mb-1">
                {provisionPotential.monthly.average}kr
              </div>
              <div className="text-xs text-green-600">per månad</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700 mb-1">Stjärnsäljare</div>
              <div className="text-2xl font-bold text-blue-800 mb-1">
                {provisionPotential.monthly.excellent}kr
              </div>
              <div className="text-xs text-blue-600">per månad</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => setShowStats(!showStats)}
              className="text-sm"
            >
              {showStats ? 'Dölj' : 'Visa'} årlig potential
            </Button>
          </div>

          {showStats && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-center">Årlig Intjäning</h4>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-bold text-yellow-700">
                    {provisionPotential.yearly.conservative.toLocaleString()}kr
                  </div>
                  <div className="text-yellow-600">Försiktig</div>
                </div>
                <div>
                  <div className="font-bold text-green-700">
                    {provisionPotential.yearly.average.toLocaleString()}kr
                  </div>
                  <div className="text-green-600">Genomsnitt</div>
                </div>
                <div>
                  <div className="font-bold text-blue-700">
                    {provisionPotential.yearly.excellent.toLocaleString()}kr
                  </div>
                  <div className="text-blue-600">Stjärnsäljare</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-600" />
            Nästa steg
          </CardTitle>
          <CardDescription>
            Följ dessa steg för att komma igång
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nextSteps.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  step.priority === 'high' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.priority === 'high' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <span className={step.priority === 'high' ? 'font-semibold' : ''}>
                    {step.text}
                  </span>
                  {step.priority === 'high' && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Viktigt
                    </Badge>
                  )}
                </div>
                <CheckCircle2 className={`h-5 w-5 ${
                  step.completed ? 'text-green-600' : 'text-gray-300'
                }`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Star className="h-5 w-5" />
            Tips för Framgång
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">💰 Maximera Provision:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Lyssna på kunden problem</li>
                <li>• Föreslå lösningar, inte bara produkter</li>
                <li>• Förklara alltid VARFÖR det kostar extra</li>
                <li>• Använd scripts från träningen</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">📸 Skydda dig själv:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Fota ALLT - före, under, efter</li>
                <li>• Dokumentera skador GENAST</li>
                <li>• Registrera tillval i appen direkt</li>
                <li>• GPS check-in vid exakt starttid</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final CTA */}
      <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
        <CardContent className="pt-8 pb-6 text-center">
          <Award className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">
            Du är redo att börja tjäna pengar!
          </h3>
          <p className="mb-6 opacity-90">
            Med din träning kan du tjäna {totalProvisionLearned}kr+ redan första veckan
          </p>
          <Button 
            onClick={onComplete}
            size="lg"
            className="bg-white text-green-600 hover:bg-gray-100 font-bold text-lg px-8 py-4"
          >
            <Rocket className="h-5 w-5 mr-2" />
            Börja Jobba & Tjäna Pengar! 💪
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default OnboardingCompletion