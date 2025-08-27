'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Smartphone, 
  MapPin, 
  Camera, 
  DollarSign, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Award,
  Target
} from 'lucide-react'

interface StaffAppMasterclassStepProps {
  employee: any
  onComplete: (step: string) => void
}

interface AppModule {
  id: string
  title: string
  duration: string
  description: string
  completed?: boolean
}

const StaffAppMasterclassStep: React.FC<StaffAppMasterclassStepProps> = ({ employee, onComplete }) => {
  const [currentModule, setCurrentModule] = useState(0)
  const [practiceScore, setPracticeScore] = useState(0)
  const [completedModules, setCompletedModules] = useState<string[]>([])
  const [currentSales, setCurrentSales] = useState(279)
  const [dailyProvision, setDailyProvision] = useState(14)
  const [photosToday, setPhotosToday] = useState(8)

  const modules: AppModule[] = [
    {
      id: 'app_setup',
      title: 'App Setup & Login', 
      duration: '5 min',
      description: 'Grundinställningar och första login'
    },
    {
      id: 'gps_checkin',
      title: 'GPS-Incheckning Master',
      duration: '5 min',
      description: 'Korrekt incheckning = betalning'
    },
    {
      id: 'upsell_registration',
      title: 'Tillval-registrering',
      duration: '15 min', 
      description: 'Registrera försäljning = 5% provision direkt'
    },
    {
      id: 'photo_documentation', 
      title: 'Foto-dokumentation Pro',
      duration: '10 min',
      description: 'Skydda dig från klagomål'
    },
    {
      id: 'practical_test',
      title: 'Praktisk Test',
      duration: '10 min',
      description: 'Genomför komplett uppdrag i appen'
    }
  ]

  const handleModuleComplete = (moduleId: string) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules(prev => [...prev, moduleId])
      setPracticeScore(prev => prev + 20)
    }
  }

  const renderAppModule = (moduleId: string) => {
    switch (moduleId) {
      case 'app_setup':
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold">📱 App Setup</div>
            
            <div className="bg-gray-100 p-3 rounded">
              <div className="text-sm">Användarnamn:</div>
              <div className="font-medium">{employee.email}</div>
            </div>
            
            <div className="bg-gray-100 p-3 rounded">
              <div className="text-sm">Personal-ID:</div>
              <div className="font-medium">{employee.id}</div>
            </div>
            
            <div className="bg-green-100 p-3 rounded">
              <div className="text-sm">✓ Lösenord sparats</div>
              <div className="text-xs">Touch ID aktiverat</div>
            </div>
            
            <Button 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold"
              onClick={() => handleModuleComplete('app_setup')}
            >
              ✓ Setup Klar
            </Button>
            
            <div className="text-xs text-gray-600">
              💡 Tips: App loggar ut automatiskt efter 8 timmar
            </div>
          </div>
        )
        
      case 'gps_checkin':
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold">📍 GPS Check-in</div>
            
            <div className="bg-gray-100 p-3 rounded">
              <div className="text-sm">Uppdrag:</div>
              <div className="font-medium">Flytt - Kvarngatan 6</div>
              <div className="text-xs text-gray-600">Starttid: 08:00</div>
            </div>
            
            <div className="bg-green-100 p-3 rounded">
              <div className="text-sm">📍 Du är på plats!</div>
              <div className="text-xs">Avstånd: 12 meter</div>
            </div>
            
            <div className="bg-yellow-100 p-3 rounded">
              <div className="text-xs text-yellow-700">
                ⚠️ Klockan är 07:58 - för tidigt att checka in
              </div>
            </div>
            
            <Button 
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold"
              onClick={() => handleModuleComplete('gps_checkin')}
            >
              ✓ Checka In (08:00)
            </Button>
            
            <div className="text-xs text-red-600">
              ⚠️ Viktigt: Ingen betalning utan korrekt check-in!
            </div>
          </div>
        )
        
      case 'upsell_registration':
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold">💰 Registrera Tillval</div>
            
            {/* Snabbknappar för vanliga tillval */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button 
                className="bg-green-100 hover:bg-green-200 text-green-800 p-2 rounded h-auto"
                onClick={() => {
                  setCurrentSales(prev => prev + 2000)
                  setDailyProvision(prev => prev + 100)
                }}
              >
                🎹 Tunga lyft<br/>2,000kr
              </Button>
              <Button 
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-2 rounded h-auto"
                onClick={() => {
                  setCurrentSales(prev => prev + 200)
                  setDailyProvision(prev => prev + 10)
                }}
              >
                🛋️ Skydd<br/>200kr
              </Button>
              <Button 
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 p-2 rounded h-auto"
                onClick={() => {
                  setCurrentSales(prev => prev + 79)
                  setDailyProvision(prev => prev + 4)
                }}
              >
                📦 Kartong<br/>79kr
              </Button>
              <Button 
                className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-2 rounded h-auto"
                onClick={() => {
                  setCurrentSales(prev => prev + 1000)
                  setDailyProvision(prev => prev + 50)
                }}
              >
                ♻️ Återvinning<br/>1,000kr
              </Button>
            </div>
            
            <div className="bg-gray-100 p-3 rounded">
              <div className="text-sm font-medium">Dagens försäljning:</div>
              <div className="text-lg font-bold text-green-600">{currentSales}kr</div>
              <div className="text-xs text-green-600">Din provision: {dailyProvision}kr</div>
            </div>
            
            <Button 
              className="w-full bg-green-600 text-white py-2 rounded"
              onClick={() => handleModuleComplete('upsell_registration')}
            >
              ✓ Lär dig tillvals-systemet
            </Button>
            
            <div className="text-xs text-gray-600">
              💡 Tips: Tryck på tjänsten direkt när kunden säger ja!
            </div>
          </div>
        )
        
      case 'photo_documentation':
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold">📸 Foto-skydd</div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-3 rounded text-sm h-auto"
                onClick={() => setPhotosToday(prev => prev + 1)}
              >
                📷 Före-bild<br/>
                <span className="text-xs">Skydda dig</span>
              </Button>
              <Button 
                className="bg-green-100 hover:bg-green-200 text-green-800 p-3 rounded text-sm h-auto"
                onClick={() => setPhotosToday(prev => prev + 1)}
              >
                📷 Efter-bild<br/>
                <span className="text-xs">Bevisa kvalitet</span>
              </Button>
              <Button 
                className="bg-red-100 hover:bg-red-200 text-red-800 p-3 rounded text-sm h-auto"
                onClick={() => setPhotosToday(prev => prev + 1)}
              >
                ⚠️ Skada<br/>
                <span className="text-xs">Ej ditt fel</span>
              </Button>
              <Button 
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 p-3 rounded text-sm h-auto"
                onClick={() => setPhotosToday(prev => prev + 1)}
              >
                📦 Volym<br/>
                <span className="text-xs">Faktisk storlek</span>
              </Button>
            </div>
            
            <div className="bg-gray-100 p-3 rounded">
              <div className="text-sm">📸 Foton idag: {photosToday}st</div>
              <div className="text-xs text-green-600">✓ Bra dokumentation!</div>
            </div>
            
            <Button 
              className="w-full bg-blue-600 text-white py-2 rounded"
              onClick={() => handleModuleComplete('photo_documentation')}
            >
              ✓ Lär dig foto-systemet
            </Button>
            
            <div className="text-xs text-gray-600">
              💡 Fler foton = mindre klagomål = behåll all lön
            </div>
          </div>
        )
        
      case 'practical_test':
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold">🎯 Praktisk Test</div>
            
            <div className="text-sm">
              <strong>Scenario:</strong> Flytt med piano och skydd
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-green-50 rounded border">
                <span>✓ GPS Check-in</span>
                <span>08:00</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded border">
                <span>✓ Före-foto</span>
                <span>08:05</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded border">
                <span>✓ Piano-tillägg</span>
                <span>2,000kr</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded border">
                <span>✓ Skyddsemballering</span>
                <span>200kr</span>
              </div>
              <div className="flex justify-between p-2 bg-yellow-100 rounded border border-yellow-300">
                <span>⏳ Efter-foto</span>
                <span>Väntar...</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-blue-600 text-white py-2 rounded"
              onClick={() => {
                setPhotosToday(prev => prev + 1)
                handleModuleComplete('practical_test')
              }}
            >
              📷 Ta Efter-foto & Slutför
            </Button>
            
            <div className="text-center text-sm">
              <div className="font-bold text-green-600">Potentiell provision: 110kr</div>
              <div className="text-xs text-gray-600">Piano (100kr) + Skydd (10kr)</div>
            </div>
          </div>
        )
        
      default:
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold">📱 Staff App</div>
            <div className="text-center text-gray-500">
              Välj en modul för att börja träna
            </div>
          </div>
        )
    }
  }

  const progress = (completedModules.length / modules.length) * 100
  const isComplete = completedModules.length === modules.length

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2 flex items-center justify-center gap-2">
          <Smartphone className="h-6 w-6 text-blue-600" />
          Staff App Masterclass
        </h2>
        <p className="text-gray-600">Lär dig använda appen som en proffs!</p>
      </div>

      {/* Progress tracker */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Tränings-framsteg</h3>
            </div>
            <div className="text-3xl font-bold text-blue-700 mb-2">
              {practiceScore}/100
            </div>
            <p className="text-sm text-blue-600 mb-4">
              Moduler slutförda ({completedModules.length}/{modules.length})
            </p>
            <Progress value={progress} className="h-3 bg-blue-100" />
            <p className="text-xs text-blue-600 mt-2">{Math.round(progress)}% klart</p>
          </div>
        </CardContent>
      </Card>
      
      {/* App-simulator */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="bg-white rounded-lg aspect-[9/16] max-w-xs mx-auto p-4 shadow-lg">
          <div className="text-center">
            <div className="bg-blue-600 text-white p-2 rounded mb-4">
              <h3 className="font-semibold">Nordflytt Staff</h3>
              <div className="text-xs opacity-75">{employee.name}</div>
            </div>
            
            {renderAppModule(modules[currentModule].id)}
          </div>
        </div>
      </div>

      {/* Modul-navigation */}
      <div className="grid gap-3">
        {modules.map((module, index) => (
          <Card 
            key={module.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentModule === index 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            } ${
              completedModules.includes(module.id) ? 'bg-green-50 border-green-200' : ''
            }`}
            onClick={() => setCurrentModule(index)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    completedModules.includes(module.id) 
                      ? 'bg-green-600 text-white' 
                      : currentModule === index 
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200'
                  }`}>
                    {completedModules.includes(module.id) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{module.title}</h3>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs">
                    {module.duration}
                  </Badge>
                  {completedModules.includes(module.id) && (
                    <div className="text-xs text-green-600 mt-1">✓ Slutförd</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completion */}
      {isComplete && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6 text-center">
            <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              🎉 Staff App Masterclass Slutförd!
            </h3>
            <p className="text-green-700 mb-4">
              Du kan nu använda Staff App som en proffs och tjäna full provision
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="font-bold text-blue-600">{currentSales}kr</div>
                <div className="text-xs text-gray-600">Tränings-försäljning</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-bold text-green-600">{dailyProvision}kr</div>
                <div className="text-xs text-gray-600">Tränings-provision</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-bold text-purple-600">{photosToday}</div>
                <div className="text-xs text-gray-600">Tränings-foton</div>
              </div>
            </div>
            <Button 
              onClick={() => onComplete('systemtillgång')}
              className="bg-green-600 text-white hover:bg-green-700"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Slutför Staff App Masterclass
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StaffAppMasterclassStep