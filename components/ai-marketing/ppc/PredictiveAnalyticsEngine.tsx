'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Target,
  Clock,
  DollarSign,
  Users,
  Zap,
  Eye,
  ArrowUp,
  ArrowDown,
  LineChart,
  PieChart,
  Sparkles,
  Shield,
  Calculator
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface Prediction {
  id: string;
  type: 'revenue' | 'clicks' | 'conversions' | 'budget' | 'competition';
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  factors: string[];
  recommendation: string;
  impact: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
}

interface SeasonalPattern {
  period: string;
  peakMonths: string[];
  lowMonths: string[];
  avgVariance: number;
  recommendations: string[];
}

interface MarketEvent {
  name: string;
  date: Date;
  impact: 'low' | 'medium' | 'high';
  affectedMetrics: string[];
  suggestedActions: string[];
}

interface ChartData {
  date: string;
  actual: number;
  predicted: number;
  upperBound: number;
  lowerBound: number;
}

const PredictiveAnalyticsEngine: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState(true);

  const [predictions] = useState<Prediction[]>([
    {
      id: '1',
      type: 'revenue',
      metric: 'Total intäkter',
      currentValue: 2450000,
      predictedValue: 3120000,
      confidence: 92,
      timeframe: 'Nästa 30 dagar',
      factors: ['Vinterflyttssäsong', 'Ökad RUT-efterfrågan', 'Konkurrensbortfall'],
      recommendation: 'Öka budget med 25% för att fånga efterfrågan',
      impact: 'positive',
      urgency: 'high'
    },
    {
      id: '2',
      type: 'competition',
      metric: 'CPC ökning',
      currentValue: 15.50,
      predictedValue: 21.30,
      confidence: 87,
      timeframe: 'Nästa 14 dagar',
      factors: ['MovingStockholm kampanj', 'Black Friday', 'Säsongstopp'],
      recommendation: 'Aktivera fraud protection och optimera kvalitetspoäng',
      impact: 'negative',
      urgency: 'high'
    },
    {
      id: '3',
      type: 'conversions',
      metric: 'Konverteringar Östermalm',
      currentValue: 89,
      predictedValue: 134,
      confidence: 84,
      timeframe: 'Nästa 21 dagar',
      factors: ['Nybyggnation klar', 'Demografisk shift', 'Premium-trend'],
      recommendation: 'Fokusera på pianoflytt och vithandske-service',
      impact: 'positive',
      urgency: 'medium'
    },
    {
      id: '4',
      type: 'clicks',
      metric: 'Klick från mobil',
      currentValue: 4523,
      predictedValue: 6890,
      confidence: 91,
      timeframe: 'Nästa 7 dagar',
      factors: ['Mobile-first update', 'Lunch-surfning ökar', 'Ny voice search'],
      recommendation: 'Optimera mobila landningssidor och hastighet',
      impact: 'positive',
      urgency: 'medium'
    }
  ]);

  const [seasonalPatterns] = useState<SeasonalPattern[]>([
    {
      period: 'Vinter (Dec-Feb)',
      peakMonths: ['December', 'Januari'],
      lowMonths: ['Februari'],
      avgVariance: 45,
      recommendations: [
        'Öka "varm flytt" messaging',
        'Fokusera på trygghet och försäkring',
        'Julkampanj för sista-minuten flyttar'
      ]
    },
    {
      period: 'Sommar (Jun-Aug)',
      peakMonths: ['Juni', 'Juli', 'Augusti'],
      lowMonths: [],
      avgVariance: 78,
      recommendations: [
        'Studentflyttkampanjer',
        'Familjepaket för semesterflytt',
        'Express-service för snabba beslut'
      ]
    },
    {
      period: 'Månadsskifte',
      peakMonths: ['28-31:a varje månad'],
      lowMonths: ['5-15:e varje månad'],
      avgVariance: 34,
      recommendations: [
        'Intensifiera budget sista veckan',
        'Akut-flytt annonser',
        'Flexibel betalning messaging'
      ]
    }
  ]);

  const [upcomingEvents] = useState<MarketEvent[]>([
    {
      name: 'Black Week 2024',
      date: new Date('2024-11-25'),
      impact: 'high',
      affectedMetrics: ['CPC', 'Competition', 'Budget'],
      suggestedActions: [
        'Pre-emptive budget increase',
        'Lock in current customers',
        'Anti-competitor messaging'
      ]
    },
    {
      name: 'Ny Google Ads Policy',
      date: new Date('2024-12-01'),
      impact: 'medium',
      affectedMetrics: ['Quality Score', 'Ad Approval'],
      suggestedActions: [
        'Review all ad copy',
        'Update insurance verification',
        'Prepare documentation'
      ]
    },
    {
      name: 'Stockholms Bostadsmässa',
      date: new Date('2024-12-15'),
      impact: 'high',
      affectedMetrics: ['Search Volume', 'Conversions'],
      suggestedActions: [
        'Event-specific campaigns',
        'Partner with exhibitors',
        'On-site presence ads'
      ]
    }
  ]);

  const [chartData] = useState<ChartData[]>([
    { date: 'Nov 1', actual: 2100000, predicted: 2150000, upperBound: 2300000, lowerBound: 2000000 },
    { date: 'Nov 8', actual: 2250000, predicted: 2280000, upperBound: 2450000, lowerBound: 2100000 },
    { date: 'Nov 15', actual: 2450000, predicted: 2500000, upperBound: 2700000, lowerBound: 2300000 },
    { date: 'Nov 22', actual: null, predicted: 2780000, upperBound: 3000000, lowerBound: 2560000 },
    { date: 'Nov 29', actual: null, predicted: 3120000, upperBound: 3400000, lowerBound: 2840000 },
    { date: 'Dec 6', actual: null, predicted: 3350000, upperBound: 3700000, lowerBound: 3000000 },
    { date: 'Dec 13', actual: null, predicted: 3200000, upperBound: 3600000, lowerBound: 2800000 }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const totalPredictedRevenue = predictions
    .filter(p => p.type === 'revenue')
    .reduce((sum, p) => sum + p.predictedValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Brain className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Predictive Analytics Engine</CardTitle>
                <CardDescription>
                  ML-driven prognoser för att ligga steget före marknaden
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-pulse" />
                  Analyserar...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Kör analys
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Förutsedd ökning</p>
              <p className="text-2xl font-bold text-green-600">+27.3%</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Konfidenssnitt</p>
              <p className="text-2xl font-bold">88.5%</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Aktiva prediktioner</p>
              <p className="text-2xl font-bold">{predictions.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Nästa event</p>
              <p className="text-sm font-bold">Black Week (5 dagar)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Forecast Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Intäktsprognos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={showConfidenceIntervals ? 'default' : 'outline'}
                onClick={() => setShowConfidenceIntervals(!showConfidenceIntervals)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Konfidensintervall
              </Button>
              <select 
                className="text-sm border rounded px-2 py-1"
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
              >
                <option value="7d">7 dagar</option>
                <option value="30d">30 dagar</option>
                <option value="90d">90 dagar</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                {showConfidenceIntervals && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="upperBound"
                      stroke="none"
                      fill="#e0e7ff"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="lowerBound"
                      stroke="none"
                      fill="#ffffff"
                      fillOpacity={1}
                    />
                  </>
                )}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ fill: '#4f46e5' }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-600 rounded"></div>
              <span className="text-sm">Faktisk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-sm">Förutsedd</span>
            </div>
            {showConfidenceIntervals && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-200 rounded"></div>
                <span className="text-sm">95% konfidensintervall</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {predictions.map((prediction) => (
          <Card key={prediction.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getImpactColor(prediction.impact)}`}>
                    {prediction.impact === 'positive' ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : prediction.impact === 'negative' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Activity className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{prediction.metric}</CardTitle>
                    <p className="text-sm text-gray-600">{prediction.timeframe}</p>
                  </div>
                </div>
                <Badge className={getUrgencyColor(prediction.urgency)}>
                  {prediction.urgency} prio
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prediction Values */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Nuvarande</p>
                  <p className="font-bold">
                    {prediction.type === 'revenue' || prediction.type === 'budget' 
                      ? formatCurrency(prediction.currentValue)
                      : prediction.currentValue.toLocaleString('sv-SE')}
                  </p>
                </div>
                <div className="flex items-center">
                  {prediction.predictedValue > prediction.currentValue ? (
                    <ArrowUp className="h-8 w-8 text-green-600" />
                  ) : (
                    <ArrowDown className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Förutsedd</p>
                  <p className="font-bold text-blue-600">
                    {prediction.type === 'revenue' || prediction.type === 'budget' 
                      ? formatCurrency(prediction.predictedValue)
                      : prediction.predictedValue.toLocaleString('sv-SE')}
                  </p>
                </div>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Konfidens</span>
                  <span className="font-medium">{prediction.confidence}%</span>
                </div>
                <Progress value={prediction.confidence} className="h-2" />
              </div>

              {/* Factors */}
              <div>
                <p className="text-sm font-medium mb-2">Påverkande faktorer:</p>
                <div className="flex flex-wrap gap-1">
                  {prediction.factors.map((factor, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <Alert className="bg-blue-50 border-blue-200">
                <Sparkles className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {prediction.recommendation}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seasonal Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Säsongsmönster & Cykler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {seasonalPatterns.map((pattern, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{pattern.period}</h4>
                  <Badge variant="outline">
                    {pattern.avgVariance}% variation
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Toppmånader:</p>
                    <p className="text-sm">{pattern.peakMonths.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-1">Lågmånader:</p>
                    <p className="text-sm">{pattern.lowMonths.join(', ') || 'Inga'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Rekommendationer:</p>
                  <ul className="space-y-1">
                    {pattern.recommendations.map((rec, recIdx) => (
                      <li key={recIdx} className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Market Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Kommande Marknadshändelser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event, idx) => (
              <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{event.name}</h4>
                    <p className="text-sm text-gray-600">
                      {event.date.toLocaleDateString('sv-SE')} 
                      ({Math.ceil((event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dagar)
                    </p>
                  </div>
                  <Badge className={
                    event.impact === 'high' ? 'bg-red-100 text-red-800' :
                    event.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {event.impact} impact
                  </Badge>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Påverkade mätvärden:</p>
                  <div className="flex flex-wrap gap-1">
                    {event.affectedMetrics.map((metric, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm font-medium text-blue-900 mb-1">Föreslagna åtgärder:</p>
                  <ul className="space-y-1">
                    {event.suggestedActions.map((action, idx) => (
                      <li key={idx} className="text-sm text-blue-800 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Sammanfattning & Nästa Steg
            </h3>
            <Badge className="bg-purple-100 text-purple-800">
              AI Confidence: 91%
            </Badge>
          </div>
          <div className="space-y-3">
            <p className="text-sm">
              <strong>Huvudinsikt:</strong> Nästa 30 dagar förväntas ge 27% högre intäkter 
              drivet av vintersäsong och ökad RUT-medvetenhet.
            </p>
            <p className="text-sm">
              <strong>Största risk:</strong> CPC-ökning på 37% under Black Week kräver 
              proaktiv budgetallokering och kvalitetsoptimering.
            </p>
            <p className="text-sm">
              <strong>Bästa möjlighet:</strong> Östermalm visar tecken på 50% konverteringsökning - 
              fokusera på premium-tjänster och pianoflytt.
            </p>
            <div className="pt-3">
              <Button className="w-full">
                <Brain className="h-4 w-4 mr-2" />
                Implementera AI-rekommendationer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveAnalyticsEngine;