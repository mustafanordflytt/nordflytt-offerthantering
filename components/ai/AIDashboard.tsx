'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Brain,
  Zap,
  TrendingUp,
  Users,
  MessageSquare,
  Calculator,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/token-helper'

interface AIAnalysisResult {
  success: boolean
  analysis?: any
  estimate?: any
  optimization?: any
  confidence?: number
  usage?: any
  message?: string
  error?: string
}

export function AIDashboard() {
  const [activeTab, setActiveTab] = useState('inquiry')
  const [aiStatus, setAiStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>({})

  // Inquiry Analysis State
  const [inquiry, setInquiry] = useState('')
  const [inquiryResult, setInquiryResult] = useState<any>(null)

  // Price Estimation State
  const [priceData, setPriceData] = useState({
    serviceType: '',
    volume: '',
    distance: '',
    urgency: 'medium',
    specialRequirements: ''
  })
  const [priceResult, setPriceResult] = useState<any>(null)

  // Team Optimization State
  const [optimizationData, setOptimizationData] = useState({
    jobData: '',
    availableStaff: ''
  })
  const [optimizationResult, setOptimizationResult] = useState<any>(null)

  useEffect(() => {
    loadAIStatus()
  }, [])

  const loadAIStatus = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/ai/analyze-inquiry', {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setAiStatus(data.aiService)
      } else {
        setAiStatus({ configured: false, status: 'unhealthy' })
      }
    } catch (error) {
      console.error('Failed to load AI status:', error)
      setAiStatus({ configured: false, status: 'unhealthy' })
    }
  }

  const analyzeInquiry = async () => {
    if (!inquiry.trim()) {
      toast.error('Ange en kundförfrågan för analys')
      return
    }

    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/ai/analyze-inquiry', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          inquiry: inquiry.trim(),
          metadata: {
            source: 'ai_dashboard',
            timestamp: new Date().toISOString()
          }
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setInquiryResult(data.analysis)
        setResults(prev => ({ ...prev, inquiry: data }))
        toast.success('Kundförfrågan analyserad!')
      } else {
        toast.error(data.error || 'Analys misslyckades')
      }

    } catch (error) {
      console.error('Inquiry analysis error:', error)
      toast.error('Kunde inte analysera förfrågan')
    } finally {
      setLoading(false)
    }
  }

  const generatePriceEstimate = async () => {
    if (!priceData.serviceType || !priceData.volume || !priceData.distance) {
      toast.error('Fyll i alla obligatoriska fält')
      return
    }

    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const specialRequirements = priceData.specialRequirements
        .split(',')
        .map(req => req.trim())
        .filter(req => req.length > 0)

      const response = await fetch('/api/ai/price-estimate', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...priceData,
          volume: parseFloat(priceData.volume),
          distance: parseFloat(priceData.distance),
          specialRequirements
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPriceResult(data.estimate)
        setResults(prev => ({ ...prev, price: data }))
        toast.success('Prisuppskattning genererad!')
      } else {
        toast.error(data.error || 'Prisberäkning misslyckades')
      }

    } catch (error) {
      console.error('Price estimation error:', error)
      toast.error('Kunde inte beräkna pris')
    } finally {
      setLoading(false)
    }
  }

  const optimizeTeam = async () => {
    if (!optimizationData.jobData || !optimizationData.availableStaff) {
      toast.error('Fyll i jobdata och tillgänglig personal')
      return
    }

    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      
      // Parse JSON data
      const jobData = JSON.parse(optimizationData.jobData)
      const availableStaff = JSON.parse(optimizationData.availableStaff)

      const response = await fetch('/api/ai/optimize-team', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobData,
          availableStaff
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setOptimizationResult(data.optimization)
        setResults(prev => ({ ...prev, team: data }))
        toast.success('Teamoptimering slutförd!')
      } else {
        toast.error(data.error || 'Teamoptimering misslyckades')
      }

    } catch (error) {
      console.error('Team optimization error:', error)
      toast.error('Kunde inte optimera team')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'unhealthy': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge className="bg-green-500">Hög tillförlitlighet</Badge>
    if (confidence >= 0.7) return <Badge className="bg-yellow-500">Medel tillförlitlighet</Badge>
    return <Badge className="bg-red-500">Låg tillförlitlighet</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Dashboard
          </h1>
          <p className="text-muted-foreground">
            Artificiell intelligens för smartare affärsbeslut
          </p>
        </div>
        <div className="flex items-center gap-2">
          {aiStatus && (
            <>
              {getStatusIcon(aiStatus.status)}
              <Badge variant={aiStatus.configured ? 'default' : 'destructive'}>
                {aiStatus.configured ? 'Aktiverad' : 'Inte konfigurerad'}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {aiStatus && !aiStatus.configured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            AI-tjänsterna är inte konfigurerade. Kontakta administratör för att aktivera OpenAI-integration.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inquiry" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Kundanalys
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <Calculator className="h-4 w-4" />
            Prisberäkning
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-2">
            <Users className="h-4 w-4" />
            Teamoptimering
          </TabsTrigger>
        </TabsList>

        {/* Customer Inquiry Analysis */}
        <TabsContent value="inquiry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Analysera Kundförfrågan
              </CardTitle>
              <CardDescription>
                AI analyserar kundförfrågan för att identifiera servicebehov, volym och specialkrav
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="inquiry">Kundförfrågan</Label>
                <Textarea
                  id="inquiry"
                  placeholder="Klistra in kundens förfrågan här... Exempel: 'Hej! Vi ska flytta från en 3a på 85 kvm i Södermalm till en villa i Nacka. Vi behöver hjälp med packning och har ett piano som behöver transporteras försiktigt.'"
                  value={inquiry}
                  onChange={(e) => setInquiry(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                onClick={analyzeInquiry}
                disabled={loading || !aiStatus?.configured}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyserar...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analysera förfrågan
                  </>
                )}
              </Button>

              {inquiryResult && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Analysresultat</h3>
                    {inquiryResult.confidence && getConfidenceBadge(inquiryResult.confidence)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Servicetyp</Label>
                          <Badge className="bg-blue-100 text-blue-800">
                            {inquiryResult.serviceType}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Uppskatttad volym</Label>
                          <p className="text-xl font-bold">{inquiryResult.estimatedVolume} m³</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Urgency</Label>
                          <Badge className={
                            inquiryResult.urgency === 'high' ? 'bg-red-100 text-red-800' :
                            inquiryResult.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {inquiryResult.urgency}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Rekommenderat pris</Label>
                          <p className="text-xl font-bold">{inquiryResult.recommendedPrice?.toLocaleString()} kr</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {inquiryResult.specialRequirements?.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <Label className="text-sm font-medium">Specialkrav</Label>
                        <div className="mt-2 space-y-1">
                          {inquiryResult.specialRequirements.map((req: string, index: number) => (
                            <Badge key={index} variant="outline">{req}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {inquiryResult.summary && (
                    <Card>
                      <CardContent className="p-4">
                        <Label className="text-sm font-medium">Sammanfattning</Label>
                        <p className="mt-2 text-sm text-gray-600">{inquiryResult.summary}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Estimation */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                AI Prisberäkning
              </CardTitle>
              <CardDescription>
                Generera intelligent prisuppskattning baserat på marknadsdata och AI-analys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceType">Servicetyp *</Label>
                  <Select value={priceData.serviceType} onValueChange={(value) => 
                    setPriceData(prev => ({ ...prev, serviceType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj servicetyp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moving">Flytt</SelectItem>
                      <SelectItem value="cleaning">Städning</SelectItem>
                      <SelectItem value="packing">Packning</SelectItem>
                      <SelectItem value="storage">Förvaring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="volume">Volym (m³) *</Label>
                  <Input
                    id="volume"
                    type="number"
                    placeholder="t.ex. 25"
                    value={priceData.volume}
                    onChange={(e) => setPriceData(prev => ({ ...prev, volume: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="distance">Avstånd (km) *</Label>
                  <Input
                    id="distance"
                    type="number"
                    placeholder="t.ex. 15"
                    value={priceData.distance}
                    onChange={(e) => setPriceData(prev => ({ ...prev, distance: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={priceData.urgency} onValueChange={(value) => 
                    setPriceData(prev => ({ ...prev, urgency: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Låg</SelectItem>
                      <SelectItem value="medium">Medel</SelectItem>
                      <SelectItem value="high">Hög</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="specialRequirements">Specialkrav (kommaseparerade)</Label>
                  <Input
                    id="specialRequirements"
                    placeholder="piano, konst, trappor, lång bärsträcka"
                    value={priceData.specialRequirements}
                    onChange={(e) => setPriceData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={generatePriceEstimate}
                disabled={loading || !aiStatus?.configured}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Beräknar pris...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Generera prisuppskattning
                  </>
                )}
              </Button>

              {priceResult && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Prisuppskattning</h3>
                    {results.price?.confidence && getConfidenceBadge(results.price.confidence)}
                  </div>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-green-700">Slutligt pris</p>
                      <p className="text-4xl font-bold text-green-800">
                        {priceResult.finalPrice?.toLocaleString()} kr
                      </p>
                    </CardContent>
                  </Card>

                  {priceResult.rutDiscount && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-blue-800">RUT-avdrag</h4>
                        <p className="text-sm text-blue-700">{priceResult.rutDiscount.description}</p>
                        <div className="mt-2 flex justify-between">
                          <span>Rabatt:</span>
                          <span className="font-semibold">-{priceResult.rutDiscount.discountAmount?.toLocaleString()} kr</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kunden betalar:</span>
                          <span className="font-bold text-lg">{priceResult.rutDiscount.customerPayment?.toLocaleString()} kr</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {priceResult.adjustments?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Prisjusteringar</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Grundpris:</span>
                            <span>{priceResult.basePrice?.toLocaleString()} kr</span>
                          </div>
                          {priceResult.adjustments.map((adj: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{adj.factor}:</span>
                              <span className={adj.amount > 0 ? 'text-red-600' : 'text-green-600'}>
                                {adj.amount > 0 ? '+' : ''}{adj.amount?.toLocaleString()} kr ({adj.percentage}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {priceResult.breakdown && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Prisförklaring</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{priceResult.breakdown}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Optimization */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                AI Teamoptimering
              </CardTitle>
              <CardDescription>
                Optimera personalallokering baserat på kompetens, tillgänglighet och jobbkrav
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jobData">Jobbdata (JSON format)</Label>
                  <Textarea
                    id="jobData"
                    placeholder={`{
  "id": "job123",
  "serviceType": "moving",
  "volume": 35,
  "distance": 25,
  "scheduledDate": "2025-01-15T09:00:00Z",
  "estimatedHours": 6,
  "specialRequirements": ["piano"],
  "address": "Stockholm centrum"
}`}
                    value={optimizationData.jobData}
                    onChange={(e) => setOptimizationData(prev => ({ ...prev, jobData: e.target.value }))}
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="availableStaff">Tillgänglig personal (JSON format)</Label>
                  <Textarea
                    id="availableStaff"
                    placeholder={`[
  {
    "id": "staff1",
    "name": "Erik Andersson",
    "yearsExperience": 5,
    "skills": ["heavy_lifting", "piano_moving"],
    "averageRating": 4.8,
    "hourlyRate": 450,
    "availability": [1, 2, 3, 4, 5]
  }
]`}
                    value={optimizationData.availableStaff}
                    onChange={(e) => setOptimizationData(prev => ({ ...prev, availableStaff: e.target.value }))}
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>
              </div>

              <Button 
                onClick={optimizeTeam}
                disabled={loading || !aiStatus?.configured}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Optimerar team...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Optimera teamsammansättning
                  </>
                )}
              </Button>

              {optimizationResult && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Teamoptimering</h3>
                    {results.team?.confidence && getConfidenceBadge(results.team.confidence)}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Rekommenderat team</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {optimizationResult.recommendedTeam?.map((member: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-gray-600">{member.role}</p>
                              <p className="text-xs text-gray-500">{member.reason}</p>
                            </div>
                            <Badge>{member.role === 'team_leader' ? 'Ledare' : 'Medlem'}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {optimizationResult.businessMetrics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-gray-600">Uppskattat pris</p>
                          <p className="text-xl font-bold">{optimizationResult.businessMetrics.estimatedCost?.toLocaleString()} kr</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-gray-600">Förväntad kvalitet</p>
                          <p className="text-xl font-bold">{optimizationResult.businessMetrics.expectedQualityScore?.toFixed(1)}/5</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {optimizationResult.reasoning && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">AI-motivering</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{optimizationResult.reasoning}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Statistics */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI-användning denna session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {Object.entries(results).map(([key, result]: [string, any]) => (
                <div key={key} className="text-center">
                  <p className="font-medium capitalize">{key}</p>
                  <p className="text-gray-600">Tokens: {result.usage?.totalTokens || 0}</p>
                  <p className="text-gray-600">Tillförlitlighet: {((result.confidence || 0) * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}