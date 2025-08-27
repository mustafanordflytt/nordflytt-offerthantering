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
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Rocket,
  Target,
  Activity,
  Clock,
  ChevronRight,
  Sparkles,
  BarChart3,
  Eye,
  Users,
  Building,
  Sun,
  Cloud,
  Zap,
  Trophy,
  MessageSquare,
  Timer
} from 'lucide-react';

interface Prediction {
  id: string;
  type: 'opportunity' | 'threat' | 'trend' | 'seasonal';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: {
    revenue: number;
    traffic: number;
    leads: number;
  };
  recommendation: string;
  actionDeadline: Date;
  relatedKeywords?: string[];
}

interface AIInsight {
  id: string;
  category: 'content' | 'technical' | 'competitive' | 'market';
  insight: string;
  evidence: string[];
  suggestedAction: string;
  automationAvailable: boolean;
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

interface SeasonalTrend {
  month: string;
  expectedTraffic: number;
  expectedLeads: number;
  keyEvents: string[];
  preparation: string;
}

const PredictiveInsights: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [autoActionsEnabled, setAutoActionsEnabled] = useState(true);

  const predictions: Prediction[] = [
    {
      id: '1',
      type: 'opportunity',
      title: 'Vårrensning-boom kommer om 3 veckor',
      description: 'Baserat på 5 års data ser vi alltid en 280% ökning i "storstädning flytt" sökningar i april',
      confidence: 94,
      timeframe: '3 veckor',
      impact: {
        revenue: 450000,
        traffic: 3200,
        leads: 85
      },
      recommendation: 'Skapa kampanjsida för vårstädning + flytt-paket',
      actionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      relatedKeywords: ['vårstädning stockholm', 'storstädning flytt', 'rensa innan flytt']
    },
    {
      id: '2',
      type: 'threat',
      title: 'Konkurrent förbereder priskrig',
      description: 'Stockholm Flyttbyrå har registrerat domäner relaterade till "billigast" och uppdaterat prissidor',
      confidence: 78,
      timeframe: '1-2 veckor',
      impact: {
        revenue: -125000,
        traffic: -800,
        leads: -22
      },
      recommendation: 'Förbered värdebaserad motkampanj - fokusera på kvalitet',
      actionDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      type: 'seasonal',
      title: 'Studentflytt-säsong närmar sig',
      description: 'Augusti-september är högssäsong för studentflyttar. 65% av årets studentflyttar sker då',
      confidence: 99,
      timeframe: '3 månader',
      impact: {
        revenue: 780000,
        traffic: 5400,
        leads: 145
      },
      recommendation: 'Starta studentkampanj i juni för att bygga synlighet',
      actionDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      relatedKeywords: ['studentflytt', 'flytta hemifrån', 'första lägenheten']
    },
    {
      id: '4',
      type: 'trend',
      title: 'Miljövänlig flytt ökar explosivt',
      description: 'Sökningar på "miljövänlig flytt" har ökat 340% senaste 6 månaderna',
      confidence: 86,
      timeframe: 'Pågående',
      impact: {
        revenue: 320000,
        traffic: 2100,
        leads: 56
      },
      recommendation: 'Lansera grön flytt-tjänst med återvinning och elbilar',
      actionDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  ];

  const aiInsights: AIInsight[] = [
    {
      id: '1',
      category: 'content',
      insight: 'Era konkurrenter saknar innehåll om "kontor flytt helg". Ni kan dominera denna nisch.',
      evidence: [
        'Månadsvolym: 890 sökningar',
        'Konkurrens: Mycket låg',
        'Köpintention: 82% hög'
      ],
      suggestedAction: 'Skapa dedikerad sida för helgflyttar av kontor',
      automationAvailable: true,
      priority: 'high'
    },
    {
      id: '2',
      category: 'technical',
      insight: '47% av era besökare studsar från mobilsidan på "Priser". Laddtid är 4.2s.',
      evidence: [
        'Mobilhastighet: 4.2s (bör vara <2s)',
        'Bounce rate: 47% (branschsnitt 25%)',
        'Förlorade leads: ~15/månad'
      ],
      suggestedAction: 'Optimera bilder och lazy-load på prissidan',
      automationAvailable: true,
      priority: 'urgent'
    },
    {
      id: '3',
      category: 'competitive',
      insight: 'Flytt & Transport AB tappar rankningar på 8 nyckelord ni kan ta över',
      evidence: [
        'Deras innehåll uppdaterades senast 2019',
        'De har tappat 3-5 positioner senaste månaden',
        'Total sökvolym: 2,340/månad'
      ],
      suggestedAction: 'Skapa uppdaterat innehåll för dessa 8 keywords',
      automationAvailable: false,
      priority: 'medium'
    }
  ];

  const seasonalTrends: SeasonalTrend[] = [
    {
      month: 'April',
      expectedTraffic: 8500,
      expectedLeads: 145,
      keyEvents: ['Vårstädning', 'Semesterplanering börjar'],
      preparation: 'Lansera vårkampanj senast 15 mars'
    },
    {
      month: 'Juni',
      expectedTraffic: 12000,
      expectedLeads: 210,
      keyEvents: ['Semesterflytt', 'Studenter flyttar'],
      preparation: 'Öka bemanning, sommarebjudanden'
    },
    {
      month: 'Augusti',
      expectedTraffic: 15000,
      expectedLeads: 285,
      keyEvents: ['Studentflytt topp', 'Familjer återvänder'],
      preparation: 'All hands on deck, extra bilar'
    },
    {
      month: 'December',
      expectedTraffic: 4500,
      expectedLeads: 65,
      keyEvents: ['Julflytt', 'Kontorsflyttar före årsskifte'],
      preparation: 'Julkampanj för sista-minuten-flytt'
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPredictionIcon = (type: Prediction['type']) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="h-5 w-5 text-green-600" />;
      case 'threat': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'seasonal': return <Calendar className="h-5 w-5 text-purple-600" />;
    }
  };

  const getCategoryIcon = (category: AIInsight['category']) => {
    switch (category) {
      case 'content': return <MessageSquare className="h-4 w-4" />;
      case 'technical': return <Zap className="h-4 w-4" />;
      case 'competitive': return <Trophy className="h-4 w-4" />;
      case 'market': return <Building className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Status Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Predictive Intelligence
              </CardTitle>
              <CardDescription>
                Maskininlärning analyserar 50,000+ datapunkter för att förutse framtiden
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${aiProcessing ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                {aiProcessing ? (
                  <>
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Analyserar...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uppdaterad
                  </>
                )}
              </Badge>
              <Button 
                variant={autoActionsEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoActionsEnabled(!autoActionsEnabled)}
              >
                {autoActionsEnabled ? 'Auto-åtgärder PÅ' : 'Auto-åtgärder AV'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {predictions.map((prediction) => (
          <Card key={prediction.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getPredictionIcon(prediction.type)}
                  <div>
                    <CardTitle className="text-lg">{prediction.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {prediction.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={getConfidenceColor(prediction.confidence)}>
                  {prediction.confidence}% säker
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Impact Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <DollarSign className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Intäkt</p>
                    <p className={`font-semibold text-sm ${
                      prediction.impact.revenue > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {prediction.impact.revenue > 0 ? '+' : ''}{formatCurrency(Math.abs(prediction.impact.revenue))}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <Eye className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Trafik</p>
                    <p className={`font-semibold text-sm ${
                      prediction.impact.traffic > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {prediction.impact.traffic > 0 ? '+' : ''}{prediction.impact.traffic.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <Users className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Leads</p>
                    <p className={`font-semibold text-sm ${
                      prediction.impact.leads > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {prediction.impact.leads > 0 ? '+' : ''}{prediction.impact.leads}
                    </p>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Rekommendation:</p>
                  <p className="text-sm text-blue-800 mt-1">{prediction.recommendation}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-blue-600">
                      <Timer className="h-3 w-3 inline mr-1" />
                      Agera inom {Math.ceil((prediction.actionDeadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} dagar
                    </span>
                    <Button size="sm" className="h-7">
                      Starta nu
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Related Keywords */}
                {prediction.relatedKeywords && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Relaterade sökord:</p>
                    <div className="flex flex-wrap gap-1">
                      {prediction.relatedKeywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            AI-upptäckter denna vecka
          </CardTitle>
          <CardDescription>
            Automatiskt identifierade möjligheter från djupanalys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <div key={insight.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.priority === 'urgent' ? 'bg-red-100' :
                    insight.priority === 'high' ? 'bg-yellow-100' :
                    'bg-gray-100'
                  }`}>
                    {getCategoryIcon(insight.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {insight.category === 'content' ? 'Innehåll' :
                         insight.category === 'technical' ? 'Teknisk' :
                         insight.category === 'competitive' ? 'Konkurrens' :
                         'Marknad'}
                      </Badge>
                      {insight.priority === 'urgent' && (
                        <Badge className="bg-red-100 text-red-800 text-xs">Brådskande</Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm">{insight.insight}</p>
                    
                    {/* Evidence */}
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <p className="text-xs font-medium text-gray-700 mb-1">Bevis:</p>
                      <ul className="space-y-0.5">
                        {insight.evidence.map((evidence, index) => (
                          <li key={index} className="text-xs text-gray-600">• {evidence}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-blue-600 font-medium">
                        → {insight.suggestedAction}
                      </p>
                      <div className="flex items-center gap-2">
                        {insight.automationAvailable && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Auto-fix tillgänglig
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          Åtgärda
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Säsongskalender & Förberedelser
          </CardTitle>
          <CardDescription>
            Planera proaktivt för kommande toppar och dalar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {seasonalTrends.map((trend, index) => (
              <Card key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    {trend.month}
                    {trend.expectedTraffic > 10000 && <Sun className="h-4 w-4 text-yellow-500" />}
                    {trend.expectedTraffic < 6000 && <Cloud className="h-4 w-4 text-gray-500" />}
                  </h3>
                  
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Förväntad trafik</p>
                      <p className="font-semibold">{trend.expectedTraffic.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Förväntade leads</p>
                      <p className="font-semibold text-green-600">{trend.expectedLeads}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700">Nyckelhändelser:</p>
                    <ul className="mt-1 space-y-0.5">
                      {trend.keyEvents.map((event, i) => (
                        <li key={i} className="text-xs text-gray-600">• {event}</li>
                      ))}
                    </ul>
                  </div>

                  <Alert className="mt-3 p-2 bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-xs">
                      {trend.preparation}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Learning Progress */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI-modellen blir smartare
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Tränad på 145,000 datapunkter • 94.2% träffsäkerhet
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">+12%</p>
              <p className="text-xs text-gray-600">förbättring denna månad</p>
            </div>
          </div>
          <Progress value={94.2} className="mt-4" />
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveInsights;