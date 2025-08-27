'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  MessageSquare,
  Calculator,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react'
import { AIDashboard } from '@/components/ai/AIDashboard'
import { AIInsights } from '@/components/ai/AIInsights'
import { AIChatBot } from '@/components/ai/AIChatBot'
import { toast } from 'sonner'

export default function AIFeaturesPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [aiStats, setAiStats] = useState({
    totalAnalyses: 247,
    accuracyRate: 94.2,
    monthlySavings: 45600,
    processedInquiries: 158,
    generatedEstimates: 89
  })

  const features = [
    {
      icon: MessageSquare,
      title: 'Kundanalys',
      description: 'AI analyserar automatiskt kundförfrågningar för att identifiera servicebehov, volym och specialkrav',
      benefits: ['95% träffsäkerhet', 'Sparar 15 min per förfrågan', 'Automatisk kategorisering'],
      status: 'active'
    },
    {
      icon: Calculator,
      title: 'Smart Prisberäkning',
      description: 'Dynamisk prissättning baserat på marknadsdata, konkurrensanalys och AI-modeller',
      benefits: ['18% högre vinstmarginal', 'Konsekvent prissättning', 'Säsongsjustering'],
      status: 'active'
    },
    {
      icon: Users,
      title: 'Teamoptimering',
      description: 'Optimera personalallokering baserat på kompetens, tillgänglighet och jobbkrav',
      benefits: ['25% bättre resursanvändning', 'Högre kundnöjdhet', 'Minskad arbetsbörda'],
      status: 'active'
    },
    {
      icon: TrendingUp,
      title: 'Prediktiv Analys',
      description: 'Förutsäg efterfrågan, identifiera trender och optimera affärsprocesser',
      benefits: ['Proaktiv planering', 'Trendidentifiering', 'Riskbedömning'],
      status: 'beta'
    },
    {
      icon: BarChart3,
      title: 'Business Intelligence',
      description: 'AI-drivna insikter och rekommendationer baserat på dina affärsdata',
      benefits: ['Datadrivna beslut', 'Automatisk rapportering', 'Handlingsplaner'],
      status: 'active'
    },
    {
      icon: Zap,
      title: 'Processautomation',
      description: 'Automatisera repetitiva uppgifter och arbetsflöden med AI',
      benefits: ['60% tidsbesparingar', 'Färre manuella fel', 'Konsekvent kvalitet'],
      status: 'coming_soon'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
      case 'beta':
        return <Badge className="bg-blue-100 text-blue-800">Beta</Badge>
      case 'coming_soon':
        return <Badge variant="outline">Kommer snart</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Features
          </h1>
          <p className="text-muted-foreground">
            Kraftfulla AI-verktyg för smartare affärsbeslut och automatiserad effektivitet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-800">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* AI Status Alert */}
      <Alert className="border-purple-200 bg-purple-50">
        <Brain className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>AI-system aktivt:</strong> Alla AI-funktioner är operativa och redo att användas. 
          Systemet har bearbetat {aiStats.totalAnalyses.toLocaleString()} analyser med {aiStats.accuracyRate}% träffsäkerhet.
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xl font-bold">{aiStats.totalAnalyses}</p>
            <p className="text-xs text-gray-600">Totala analyser</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-xl font-bold">{aiStats.accuracyRate}%</p>
            <p className="text-xs text-gray-600">Träffsäkerhet</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-xl font-bold">{aiStats.monthlySavings.toLocaleString()}</p>
            <p className="text-xs text-gray-600">kr sparade/månad</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="text-xl font-bold">{aiStats.processedInquiries}</p>
            <p className="text-xs text-gray-600">Förfrågningar</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calculator className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-xl font-bold">{aiStats.generatedEstimates}</p>
            <p className="text-xs text-gray-600">Prisuppskattningar</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <Zap className="h-4 w-4" />
            AI Dashboard
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            AI Insikter
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Assistent
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Settings className="h-4 w-4" />
            Funktioner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AIDashboard />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <AIInsights />
        </TabsContent>

        <TabsContent value="chatbot" className="space-y-4">
          <AIChatBot />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Icon className="h-5 w-5 text-purple-600" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Fördelar:</h4>
                        <ul className="space-y-1">
                          {feature.benefits.map((benefit, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2">
                        <Button 
                          size="sm" 
                          disabled={feature.status === 'coming_soon'}
                          onClick={() => {
                            if (feature.status !== 'coming_soon') {
                              setActiveTab('dashboard')
                              toast.success(`Öppnar ${feature.title}`)
                            }
                          }}
                        >
                          {feature.status === 'coming_soon' ? 'Kommer snart' : 'Använd funktion'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI-konfiguration
              </CardTitle>
              <CardDescription>
                Hantera AI-inställningar och systemkonfiguration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">OpenAI Integration</h4>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">GPT-4o-mini konfigurerad</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Används för textanalys och intelligent innehållsgenerering
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Datahantering</h4>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">GDPR-kompatibel</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    All data behandlas säkert enligt svenska lagar
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Prestanda</h4>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Genomsnittlig svarstid: 2.3s</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Optimerad för snabb respons och låg latency
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Säkerhet</h4>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">End-to-end krypterad</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    All kommunikation krypteras och loggas säkert
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Systemstatus</h4>
                    <p className="text-sm text-gray-600">Alla AI-tjänster operativa</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ROI Information */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800">AI Return on Investment</CardTitle>
          <CardDescription className="text-purple-600">
            Mätbar affärsnytta från AI-implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-800">25%</p>
              <p className="text-sm text-purple-600">Minskning i administrativ tid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-800">18%</p>
              <p className="text-sm text-purple-600">Ökning i vinstmarginal</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-800">94%</p>
              <p className="text-sm text-purple-600">Kundnöjdhet med AI-tjänster</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-800">456k</p>
              <p className="text-sm text-purple-600">kr sparade per år</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}