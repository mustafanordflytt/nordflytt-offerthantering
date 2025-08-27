'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MousePointer,
  Target,
  Zap,
  Eye,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  Filter,
  ArrowDown,
  BarChart3,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  Phone,
  MessageSquare,
  AlertCircle,
  Activity,
  ShoppingCart,
  CreditCard,
  FileCheck,
  Lightbulb
} from 'lucide-react';

interface DetailedConversionMetric {
  id: string;
  title: string;
  currentRate: number;
  potentialRate: number;
  improvementActions: string[];
  estimatedRevenue: number;
  priority: 'high' | 'medium' | 'low';
  timeToImplement: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ConversionFunnelStage {
  stage: string;
  icon: React.ReactNode;
  visitors: number;
  dropoffRate: number;
  issues: string[];
  opportunities: string[];
}

interface HeatmapData {
  element: string;
  clicks: number;
  conversionRate: number;
  issue?: string;
}

const ConversionOpportunitiesExtended: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const conversionMetrics: DetailedConversionMetric[] = [
    {
      id: '1',
      title: 'Formulär - Hem till kontakt',
      currentRate: 3.2,
      potentialRate: 5.8,
      improvementActions: [
        'Förkorta formuläret från 12 till 6 fält',
        'Lägg till trust badges och säkerhetsikoner',
        'Tydligare CTA-knappar med urgency-text',
        'Progressbar för flerstegsformulär'
      ],
      estimatedRevenue: 125000,
      priority: 'high',
      timeToImplement: '2 dagar',
      difficulty: 'easy'
    },
    {
      id: '2',
      title: 'Prissida till bokning',
      currentRate: 8.5,
      potentialRate: 12.0,
      improvementActions: [
        'Visa interaktiv priskalkylator direkt',
        'Lägg till kundrecensioner vid varje tjänst',
        'Erbjud direktchatt med säljare',
        'Visa "Mest populär" badge på rekommenderad tjänst'
      ],
      estimatedRevenue: 185000,
      priority: 'high',
      timeToImplement: '1 vecka',
      difficulty: 'medium'
    },
    {
      id: '3',
      title: 'Mobilbesökare konvertering',
      currentRate: 1.8,
      potentialRate: 4.2,
      improvementActions: [
        'Optimera för tumnavigering (44px touch targets)',
        'Reducera laddtider under 2 sekunder',
        'Klickbar telefonnummer med "Ring nu" CTA',
        'Sticky CTA-bar i botten av skärmen'
      ],
      estimatedRevenue: 95000,
      priority: 'medium',
      timeToImplement: '3 dagar',
      difficulty: 'medium'
    },
    {
      id: '4',
      title: 'Lead till bokad visning',
      currentRate: 22.0,
      potentialRate: 35.0,
      improvementActions: [
        'Automatisk kalenderbokning online',
        'SMS-påminnelser 24h innan',
        'Videosamtal som alternativ till fysisk visning',
        'Garanterad svarstid inom 15 minuter'
      ],
      estimatedRevenue: 145000,
      priority: 'high',
      timeToImplement: '2 veckor',
      difficulty: 'hard'
    }
  ];

  const conversionFunnel: ConversionFunnelStage[] = [
    {
      stage: 'Hemsida',
      icon: <Eye className="h-5 w-5" />,
      visitors: 12500,
      dropoffRate: 65,
      issues: ['Otydlig värdeproposition', 'För många val', 'Långsam laddtid'],
      opportunities: ['Hero-sektion A/B test', 'Förenklad navigation']
    },
    {
      stage: 'Tjänstsidor',
      icon: <ShoppingCart className="h-5 w-5" />,
      visitors: 4375,
      dropoffRate: 40,
      issues: ['Saknar priser', 'Komplicerad information', 'Inga recensioner'],
      opportunities: ['Visa startpriser', 'Lägg till videos']
    },
    {
      stage: 'Kontaktformulär',
      icon: <FileCheck className="h-5 w-5" />,
      visitors: 2625,
      dropoffRate: 70,
      issues: ['För många fält', 'Ingen förhandsvisning', 'Validering unclear'],
      opportunities: ['Multi-step form', 'Autofyll med BankID']
    },
    {
      stage: 'Lead kvalificering',
      icon: <Phone className="h-5 w-5" />,
      visitors: 788,
      dropoffRate: 43,
      issues: ['Långsam respons', 'Ingen självbetjäning'],
      opportunities: ['AI-chatbot', 'Instant callback']
    },
    {
      stage: 'Konvertering',
      icon: <CreditCard className="h-5 w-5" />,
      visitors: 450,
      dropoffRate: 0,
      issues: [],
      opportunities: ['Upsell extra tjänster', 'Referral program']
    }
  ];

  const heatmapData: HeatmapData[] = [
    {
      element: 'Hero CTA-knapp',
      clicks: 2340,
      conversionRate: 4.2,
      issue: 'För liten på mobil'
    },
    {
      element: 'Prisknapp i menyn',
      clicks: 1876,
      conversionRate: 8.5
    },
    {
      element: 'Telefonnummer header',
      clicks: 892,
      conversionRate: 15.3
    },
    {
      element: 'Chat-widget',
      clicks: 567,
      conversionRate: 11.2
    },
    {
      element: 'Formulär submit',
      clicks: 234,
      conversionRate: 45.6,
      issue: 'Många abandonments'
    }
  ];

  const abTestIdeas = [
    {
      test: 'Hero: "Gratis värdering" vs "Se priser direkt"',
      hypothesis: 'Gratis värdering ökar leads med 40%',
      confidence: 85,
      revenue: 125000,
      duration: '2 veckor'
    },
    {
      test: 'CTA färg: Grön vs Orange',
      hypothesis: 'Orange ökar klick med 15%',
      confidence: 72,
      revenue: 45000,
      duration: '1 vecka'
    },
    {
      test: 'Chat vs Formulär för mobil',
      hypothesis: 'Chat konverterar 25% bättre',
      confidence: 78,
      revenue: 85000,
      duration: '2 veckor'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateImprovement = (current: number, potential: number) => {
    return ((potential - current) / current * 100).toFixed(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalRevenuePotential = conversionMetrics.reduce((sum, metric) => sum + metric.estimatedRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">Live</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">3.6%</p>
            <p className="text-sm text-gray-600">Total konvertering</p>
            <p className="text-xs text-green-600 mt-1">+0.4% denna vecka</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold mt-2">{formatCurrency(totalRevenuePotential)}</p>
            <p className="text-sm text-gray-600">Potential/år</p>
            <p className="text-xs text-green-600 mt-1">4 snabba vinster</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-purple-600" />
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold mt-2">788</p>
            <p className="text-sm text-gray-600">Leads denna månad</p>
            <p className="text-xs text-red-600 mt-1">-12% från mobil</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Lightbulb className="h-8 w-8 text-yellow-600" />
              <Badge className="bg-yellow-100 text-yellow-800">3 nya</Badge>
            </div>
            <p className="text-2xl font-bold mt-2">12</p>
            <p className="text-sm text-gray-600">Förbättringsförslag</p>
            <Button size="sm" variant="link" className="p-0 h-auto mt-1">
              Se alla →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5 text-green-600" />
            Konverteringsmöjligheter
          </CardTitle>
          <CardDescription>
            Prioriterade förbättringar baserat på data från 12,500 besökare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conversionMetrics.map((metric) => (
              <div 
                key={metric.id} 
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedMetric === metric.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{metric.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={
                          metric.priority === 'high' ? 'text-red-600 border-red-300' :
                          metric.priority === 'medium' ? 'text-yellow-600 border-yellow-300' :
                          'text-gray-600 border-gray-300'
                        }
                      >
                        {metric.priority === 'high' ? 'Hög prioritet' :
                         metric.priority === 'medium' ? 'Medel prioritet' :
                         'Låg prioritet'}
                      </Badge>
                      <Badge className={getDifficultyColor(metric.difficulty)}>
                        {metric.difficulty === 'easy' ? 'Enkel' :
                         metric.difficulty === 'medium' ? 'Medel' :
                         'Komplex'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Nu:</span>
                        <span className="font-semibold text-lg">{metric.currentRate}%</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Mål:</span>
                        <span className="font-semibold text-lg text-green-600">{metric.potentialRate}%</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        +{calculateImprovement(metric.currentRate, metric.potentialRate)}% förbättring
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm text-gray-600">
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        Värde: <strong className="text-green-600">+{formatCurrency(metric.estimatedRevenue)}/år</strong>
                      </span>
                      <span className="text-sm text-gray-600">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Tid: <strong>{metric.timeToImplement}</strong>
                      </span>
                    </div>
                  </div>
                  
                  <Button size="sm" className="ml-4">
                    Starta
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                {selectedMetric === metric.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium text-sm mb-3">Detaljerad handlingsplan:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {metric.improvementActions.map((action, index) => (
                        <div key={index} className="flex items-start gap-2 bg-white rounded p-2">
                          <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                    <Alert className="mt-3 bg-green-50 border-green-200">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <strong>AI-rekommendation:</strong> Börja med åtgärd #1 och #2 för snabbast resultat. 
                        Förväntat resultat inom 2 veckor.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Conversion Funnel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Konverteringstratt - Detaljanalys
              </CardTitle>
              <CardDescription>
                Realtidsdata från senaste 30 dagarna
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowHeatmap(!showHeatmap)}>
              {showHeatmap ? 'Dölj heatmap' : 'Visa heatmap'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionFunnel.map((stage, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {stage.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{stage.stage}</h4>
                      <p className="text-sm text-gray-600">
                        {stage.visitors.toLocaleString()} besökare
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {stage.dropoffRate > 0 && (
                      <>
                        <p className="text-sm text-gray-600">Avhopp</p>
                        <p className="font-bold text-xl text-red-600">-{stage.dropoffRate}%</p>
                      </>
                    )}
                    {stage.dropoffRate === 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Slutmål
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Issues and Opportunities */}
                {(stage.issues.length > 0 || stage.opportunities.length > 0) && (
                  <div className="ml-16 mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stage.issues.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs font-medium text-red-800 mb-2">Problem:</p>
                        <ul className="space-y-1">
                          {stage.issues.map((issue, i) => (
                            <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                              <AlertCircle className="h-3 w-3 mt-0.5" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {stage.opportunities.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs font-medium text-green-800 mb-2">Möjligheter:</p>
                        <ul className="space-y-1">
                          {stage.opportunities.map((opp, i) => (
                            <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                              <Lightbulb className="h-3 w-3 mt-0.5" />
                              {opp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {index < conversionFunnel.length - 1 && (
                  <div className="flex justify-center my-3">
                    <ArrowDown className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Funnel Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total konverteringsgrad</p>
                <p className="text-2xl font-bold">3.6%</p>
                <p className="text-xs text-green-600">Branschsnitt: 2.8%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Största läckaget</p>
                <p className="text-2xl font-bold text-red-600">-70%</p>
                <p className="text-xs">Vid kontaktformulär</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Om vi når 5%</p>
                <p className="text-2xl font-bold text-green-600">+{formatCurrency(380000)}</p>
                <p className="text-xs">Extra intäkter/år</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap Data (if enabled) */}
      {showHeatmap && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Heatmap-data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {heatmapData.map((data, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{data.element}</h4>
                    {data.issue && (
                      <Badge className="bg-red-100 text-red-800 text-xs">Problem</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600">Klick</p>
                      <p className="font-semibold">{data.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Konvertering</p>
                      <p className="font-semibold text-green-600">{data.conversionRate}%</p>
                    </div>
                  </div>
                  {data.issue && (
                    <p className="text-xs text-red-600 mt-2">{data.issue}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* A/B Testing Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Rekommenderade A/B-tester
          </CardTitle>
          <CardDescription>
            AI-förslag baserat på största potentialen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {abTestIdeas.map((test, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{test.test}</h4>
                    <p className="text-sm text-gray-600 mt-1">{test.hypothesis}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">
                        <Activity className="h-3 w-3 inline mr-1" />
                        Sannolikhet: <strong className="text-blue-600">{test.confidence}%</strong>
                      </span>
                      <span className="text-sm">
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        Potential: <strong className="text-green-600">+{formatCurrency(test.revenue)}</strong>
                      </span>
                      <span className="text-sm">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Testtid: <strong>{test.duration}</strong>
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Starta test
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Alert className="mt-4 bg-purple-50 border-purple-200">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <AlertDescription>
              <strong>Pro-tips:</strong> Kör max 2 tester samtidigt för tydliga resultat. 
              Vänta minst 2 veckor innan utvärdering för statistisk säkerhet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionOpportunitiesExtended;