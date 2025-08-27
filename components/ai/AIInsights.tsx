'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'recommendation' | 'trend'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  actionable: boolean
  category: string
  metrics?: any
  generatedAt: string
}

export function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    generateInsights()
  }, [])

  const generateInsights = async () => {
    setLoading(true)
    
    // Simulate AI-generated insights based on business data
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Ökad efterfrågan på flyttstädning',
        description: 'AI-analys visar 35% ökning i förfrågningar om flyttstädning senaste månaden. Rekommenderar att öka marknadsföringen för RUT-avdragsgilla städtjänster.',
        impact: 'high',
        confidence: 0.92,
        actionable: true,
        category: 'marketing',
        metrics: {
          increase: 35,
          revenue_potential: 120000,
          time_frame: '30 dagar'
        },
        generatedAt: new Date().toISOString()
      },
      {
        id: '2',
        type: 'warning',
        title: 'Team Magnus överbelastat',
        description: 'AI upptäcker att Magnus Anderssons team har 40% högre arbetsbelastning än genomsnittet. Risk för utbrändhet och kvalitetsförsämring.',
        impact: 'high',
        confidence: 0.88,
        actionable: true,
        category: 'operations',
        metrics: {
          overload_percentage: 40,
          avg_hours_per_week: 52,
          quality_score_decline: 0.3
        },
        generatedAt: new Date().toISOString()
      },
      {
        id: '3',
        type: 'recommendation',
        title: 'Optimera rutter för Södermalm',
        description: 'Genom att omfördela jobb i Södermalm kan vi minska transporttid med 25% och öka lönsamheten per uppdrag med 18%.',
        impact: 'medium',
        confidence: 0.84,
        actionable: true,
        category: 'logistics',
        metrics: {
          time_savings: 25,
          profit_increase: 18,
          affected_jobs: 34
        },
        generatedAt: new Date().toISOString()
      },
      {
        id: '4',
        type: 'trend',
        title: 'Stigande efterfrågan på veckodagar',
        description: 'Märkbar trend: 28% fler bokningar på vardagar jämfört med helger. Kunder föredrar att flytta måndag-torsdag.',
        impact: 'medium',
        confidence: 0.79,
        actionable: false,
        category: 'analytics',
        metrics: {
          weekday_increase: 28,
          preferred_days: ['måndag', 'tisdag', 'onsdag', 'torsdag'],
          booking_pattern_change: '+15%'
        },
        generatedAt: new Date().toISOString()
      },
      {
        id: '5',
        type: 'opportunity',
        title: 'Förvaringstjänster underutnyttjade',
        description: 'Endast 12% av flyttkunder erbjuds förvaring, trots att 68% skulle vara intresserade. Potential för 200k kr extra intäkt/månad.',
        impact: 'high',
        confidence: 0.91,
        actionable: true,
        category: 'sales',
        metrics: {
          current_offering_rate: 12,
          interest_rate: 68,
          revenue_potential: 200000
        },
        generatedAt: new Date().toISOString()
      },
      {
        id: '6',
        type: 'warning',
        title: 'Kundnöjdhet sjunker för helgjobb',
        description: 'Betyg för helgjobb har sjunkit från 4.6 till 4.1 senaste kvartalet. Möjlig orsak: trötta medarbetare eller bristande bemanning.',
        impact: 'medium',
        confidence: 0.86,
        actionable: true,
        category: 'quality',
        metrics: {
          rating_decline: 0.5,
          weekend_rating: 4.1,
          weekday_rating: 4.7
        },
        generatedAt: new Date().toISOString()
      }
    ]

    setTimeout(() => {
      setInsights(mockInsights)
      setLoading(false)
      toast.success(`${mockInsights.length} AI-insikter genererade`)
    }, 1500)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-blue-600" />
      case 'trend': return <BarChart3 className="h-5 w-5 text-purple-600" />
      default: return <Brain className="h-5 w-5 text-gray-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      marketing: 'bg-pink-100 text-pink-800',
      operations: 'bg-blue-100 text-blue-800',
      logistics: 'bg-orange-100 text-orange-800',
      analytics: 'bg-purple-100 text-purple-800',
      sales: 'bg-green-100 text-green-800',
      quality: 'bg-yellow-100 text-yellow-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory)

  const categories = ['all', ...Array.from(new Set(insights.map(insight => insight.category)))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            AI Insikter
          </h2>
          <p className="text-muted-foreground">
            Intelligenta rekommendationer baserat på dina affärsdata
          </p>
        </div>
        <Button onClick={generateInsights} disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Genererar...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Uppdatera insikter
            </>
          )}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{insights.filter(i => i.type === 'opportunity').length}</p>
            <p className="text-sm text-gray-600">Möjligheter</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{insights.filter(i => i.type === 'warning').length}</p>
            <p className="text-sm text-gray-600">Varningar</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{insights.filter(i => i.type === 'recommendation').length}</p>
            <p className="text-sm text-gray-600">Rekommendationer</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{insights.filter(i => i.actionable).length}</p>
            <p className="text-sm text-gray-600">Åtgärdbara</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category === 'all' ? 'Alla' : category}
          </Button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategoryColor(insight.category)}>
                        {insight.category}
                      </Badge>
                      <Badge variant="outline" className={getImpactColor(insight.impact)}>
                        {insight.impact} påverkan
                      </Badge>
                      {insight.actionable && (
                        <Badge variant="outline" className="text-green-600 bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Åtgärdbar
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Tillförlitlighet</p>
                  <div className="flex items-center gap-2">
                    <Progress value={insight.confidence * 100} className="w-20" />
                    <span className="text-sm font-medium">{Math.round(insight.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{insight.description}</p>

              {insight.metrics && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm">Nyckeltal</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {Object.entries(insight.metrics).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </p>
                        <p className="font-semibold">
                          {typeof value === 'number' && key.includes('percentage') 
                            ? `${value}%`
                            : typeof value === 'number' && key.includes('revenue') 
                            ? `${value.toLocaleString()} kr`
                            : Array.isArray(value) 
                            ? value.join(', ')
                            : value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insight.actionable && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Skapa uppgift
                  </Button>
                  <Button size="sm" variant="outline">
                    Mer info
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInsights.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Inga insikter tillgängliga</p>
            <p className="text-sm text-gray-500">Generera nya insikter för att se AI-rekommendationer</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}