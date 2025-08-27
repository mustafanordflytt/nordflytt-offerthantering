'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Star,
  Trophy
} from 'lucide-react'

// Nordflytts faktiska priser och provisioner
const NORDFLYTT_SERVICES = {
  tunga_lyft_100: { price: 1000, provision: 50, name: "Tunga lyft upp till 100kg" },
  tunga_lyft_over_100: { price: 2000, provision: 100, name: "Tunga lyft över 100kg" },
  proffspackning: { price: 200, provision: 10, name: "Proffspackning per låda" },
  specialemballering: { price: 250, provision: 12.5, name: "Specialemballering" },
  skyddsemballering: { price: 200, provision: 10, name: "Skyddsemballering" },
  atervinning: { price: 1000, provision: 50, name: "Återvinningsvända" },
  mobelbortforsling: { price: 250, provision: 12.5, name: "Möbelbortforsling per möbel" },
  extra_stadning: { price: 500, provision: 25, name: "Extra städning per timme" },
  parkering: { price: 99, provision: 5, name: "Extra parkering per meter" },
  kartong: { price: 79, provision: 4, name: "Flyttkartong" },
  packtejp: { price: 99, provision: 5, name: "Packtejp" },
  plastpase: { price: 20, provision: 1, name: "Plastpåse" },
  strackfilm: { price: 5, provision: 0.25, name: "Sträckfilm per meter" },
  etikett: { price: 5, provision: 0.25, name: "Flyttetikett" }
}

interface ProvisionMasterclassStepProps {
  employee: any
  onComplete: (step: string) => void
}

interface Scenario {
  id: string
  title: string
  situation: string
  image: string
  customerDialog: string
  options: Array<{
    id: string
    text: string
    correct: boolean
    feedback: string
  }>
  service: typeof NORDFLYTT_SERVICES[keyof typeof NORDFLYTT_SERVICES]
  provision: number
  tips: string[]
}

interface Module {
  id: string
  title: string
  duration: string
  description: string
  scenarios: string[]
  icon: string
}

const ProvisionMasterclassStep: React.FC<ProvisionMasterclassStepProps> = ({ employee, onComplete }) => {
  const [currentModule, setCurrentModule] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})

  const modules: Module[] = [
    {
      id: 'high_value_scenarios',
      title: 'Höga Provisions-möjligheter',
      duration: '20 min',
      description: '50-100kr provision per försäljning!',
      scenarios: ['piano_scenario', 'sofa_scenario', 'atervinning_scenario'],
      icon: '🔥'
    },
    {
      id: 'medium_value_scenarios', 
      title: 'Medel Provisions-möjligheter',
      duration: '15 min',
      description: '10-25kr provision per försäljning',
      scenarios: ['packing_scenario', 'protection_scenario', 'cleaning_scenario'],
      icon: '⚡'
    },
    {
      id: 'frequent_sales',
      title: 'Frekventa Försäljnings-möjligheter',
      duration: '10 min', 
      description: '1-5kr provision men lätta att sälja',
      scenarios: ['material_scenario', 'box_scenario', 'tape_scenario'],
      icon: '💫'
    }
  ]

  const highValueScenarios: Scenario[] = [
    {
      id: 'piano_scenario',
      title: '🎹 Kund har ett gammalt piano',
      situation: 'Du kommer till lägenheten och ser ett stort piano som väger cirka 120kg. Kunden har inte nämnt det i bokningen.',
      image: '🎹',
      customerDialog: '"Åh, jag glömde nämna pianot... kan ni flytta det?"',
      options: [
        { 
          id: 'a', 
          text: 'Säg "Det blir extra kostnad"', 
          correct: false,
          feedback: 'För vagt - kunden förstår inte värdet'
        },
        { 
          id: 'b', 
          text: 'Försök bara lyfta det med teamet', 
          correct: false,
          feedback: 'Farligt! Riskerar skador på både personal och piano'
        },
        { 
          id: 'c', 
          text: '"Ett piano över 100kg kräver specialhantering med extra utrustning. Det kostar 2,000kr för säker transport"', 
          correct: true,
          feedback: 'PERFEKT! Förklarar VARFÖR det kostar extra'
        }
      ],
      service: NORDFLYTT_SERVICES.tunga_lyft_over_100,
      provision: NORDFLYTT_SERVICES.tunga_lyft_over_100.provision,
      tips: [
        'Förklara alltid VARFÖR något kostar extra',
        'Sätt säkerhet först - både för personal och föremål',
        'Piano över 100kg = automatiskt 2,000kr tillägg'
      ]
    },
    {
      id: 'sofa_scenario', 
      title: '🛋️ Dyr lädersoffa i trappuppgång',
      situation: 'En vit lädersoffa värd 25,000kr ska bäras ner 3 trappor. Smala väggar och vita väggar.',
      image: '🛋️',
      customerDialog: '"Det är en väldigt dyr soffa, ni är försiktiga va?"',
      options: [
        { 
          id: 'a', 
          text: 'Säg "Vi är alltid försiktiga"', 
          correct: false,
          feedback: 'Missar försäljningsmöjlighet helt'
        },
        { 
          id: 'b', 
          text: 'Bara börja bära försiktigt', 
          correct: false,
          feedback: 'Riskerar 25,000kr skada för att spara 200kr'
        },
        { 
          id: 'c', 
          text: '"Absolut! För att garantera 100% skydd i trappuppgången rekommenderar jag skyddsemballering för 200kr"', 
          correct: true,
          feedback: 'SMART! Skapar trygghet och tjänar provision'
        }
      ],
      service: NORDFLYTT_SERVICES.skyddsemballering,
      provision: NORDFLYTT_SERVICES.skyddsemballering.provision,
      tips: [
        'Dyra möbler = stora försäljningsmöjligheter',
        'Använd ordet "garantera" för trygghet',
        'Trappor + vita väggar = perfekt för skyddsförsäljning'
      ]
    },
    {
      id: 'atervinning_scenario',
      title: '♻️ Massa gamla möbler att slänga',
      situation: 'Kunden har en massa gamla möbler och säger "Jag vet inte vad jag ska göra med allt detta"',
      image: '♻️',
      customerDialog: '"Kan ni inte bara slänga det någonstans?"',
      options: [
        { 
          id: 'a', 
          text: 'Säg "Det ingår inte i flytten"', 
          correct: false,
          feedback: 'Hjälper inte kunden och missar stor provision'
        },
        { 
          id: 'b', 
          text: 'Säg "Ring återvinningscentralen själv"', 
          correct: false,
          feedback: 'Kunden vill ha service, inte mer arbete'
        },
        { 
          id: 'c', 
          text: '"Vi kan ordna professionell återvinning för 1,000kr. Då hämtar vi allt och ser till att det återvinns korrekt"', 
          correct: true,
          feedback: 'EXCELLENT! Löser kundens problem och stor provision'
        }
      ],
      service: NORDFLYTT_SERVICES.atervinning,
      provision: NORDFLYTT_SERVICES.atervinning.provision,
      tips: [
        'Återvinning = stort problem för kunder = stor möjlighet',
        'Betona att det blir "professionellt hanterat"',
        '1,000kr = 50kr provision = större än dagslön många!'
      ]
    }
  ]

  const handleScenarioComplete = (scenarioId: string, provision: number) => {
    if (!completedScenarios.includes(scenarioId)) {
      setCompletedScenarios(prev => [...prev, scenarioId])
      setTotalEarnings(prev => prev + provision)
    }
  }

  const handleAnswerSelect = (scenarioId: string, answerId: string, scenario: Scenario) => {
    setSelectedAnswers(prev => ({ ...prev, [scenarioId]: answerId }))
    
    const selectedOption = scenario.options.find(opt => opt.id === answerId)
    if (selectedOption?.correct) {
      handleScenarioComplete(scenarioId, scenario.provision)
    }
  }

  const ScenarioPlayer: React.FC<{ scenario: Scenario }> = ({ scenario }) => {
    const selectedAnswer = selectedAnswers[scenario.id]
    const isCompleted = completedScenarios.includes(scenario.id)
    
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{scenario.image}</span>
            {scenario.title}
            {isCompleted && <Badge className="bg-green-100 text-green-800">+{scenario.provision}kr</Badge>}
          </CardTitle>
          <CardDescription>{scenario.situation}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="italic">Kunden säger: {scenario.customerDialog}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Vad säger du?</h4>
            {scenario.options.map((option) => (
              <Button
                key={option.id}
                variant={selectedAnswer === option.id ? 
                  (option.correct ? "default" : "destructive") : "outline"}
                className={`w-full justify-start text-left h-auto p-4 ${
                  selectedAnswer === option.id && option.correct ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
                onClick={() => handleAnswerSelect(scenario.id, option.id, scenario)}
              >
                <span className="font-semibold mr-2">{option.id.toUpperCase()})</span>
                {option.text}
              </Button>
            ))}
          </div>

          {selectedAnswer && (
            <div className={`p-4 rounded-lg ${
              scenario.options.find(opt => opt.id === selectedAnswer)?.correct
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className="font-semibold mb-2">
                {scenario.options.find(opt => opt.id === selectedAnswer)?.correct 
                  ? '✅ Rätt svar!' 
                  : '❌ Fel svar'}
              </p>
              <p>{scenario.options.find(opt => opt.id === selectedAnswer)?.feedback}</p>
              
              {scenario.options.find(opt => opt.id === selectedAnswer)?.correct && (
                <div className="mt-3 p-3 bg-green-100 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Tjänst: {scenario.service.name}</span>
                    <span className="text-green-700 font-bold">+{scenario.provision}kr provision</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isCompleted && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-semibold text-yellow-800 mb-2">💡 Profi-tips:</h5>
              <ul className="space-y-1 text-sm text-yellow-700">
                {scenario.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const progress = (completedScenarios.length / 9) * 100

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2 flex items-center justify-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          Provision Masterclass
        </h2>
        <p className="text-gray-600">Lär dig tjäna riktiga pengar från dag 1!</p>
      </div>
      
      {/* Intjäningsräknare */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-green-600" />
              <h3 className="font-semibold text-green-800">Din Tränings-intjäning</h3>
            </div>
            <div className="text-4xl font-bold text-green-700 mb-2">
              {totalEarnings}kr
            </div>
            <p className="text-sm text-green-600 mb-4">
              Provision från genomförda scenarios ({completedScenarios.length}/9)
            </p>
            <Progress value={progress} className="h-3 bg-green-100" />
            <p className="text-xs text-green-600 mt-2">{Math.round(progress)}% klart</p>
          </div>
        </CardContent>
      </Card>

      {/* Modul-navigation */}
      <div className="grid gap-4 md:grid-cols-3">
        {modules.map((module, index) => (
          <Card 
            key={module.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentModule === index 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setCurrentModule(index)}
          >
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl mb-2">{module.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{module.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{module.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {module.duration}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aktuell modul innehåll */}
      {currentModule === 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-600 mb-2">
              🔥 Höga Provisions-möjligheter (50-100kr per försäljning)
            </h3>
            <p className="text-gray-600">Lär dig identifiera och sälja de mest lönsamma tillvalen</p>
          </div>
          
          {highValueScenarios.map((scenario) => (
            <ScenarioPlayer key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}

      {/* Slutför när alla höga värde-scenarios är klara */}
      {completedScenarios.length >= 3 && currentModule === 0 && (
        <Card className="bg-gradient-to-r from-gold-50 to-yellow-50 border-yellow-200">
          <CardContent className="pt-6 text-center">
            <Award className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              🏆 Grattis! Du har lärt dig tjäna {totalEarnings}kr extra!
            </h3>
            <p className="text-yellow-700 mb-4">
              Du behärskar nu de mest lönsamma försäljningsteknikerna
            </p>
            <Button 
              onClick={() => onComplete('säkerhetsutbildning')}
              className="bg-green-600 text-white hover:bg-green-700"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Slutför Provision Masterclass
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProvisionMasterclassStep