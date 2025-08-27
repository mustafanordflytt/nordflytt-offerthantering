'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crosshair,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  Shield,
  Zap,
  Target,
  Activity,
  Users,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Sword,
  Trophy,
  Flag,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart3,
  MapPin,
  Building
} from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  domain: string;
  threat_level: 'high' | 'medium' | 'low';
  market_share: number;
  monthly_traffic: number;
  ranking_keywords: number;
  revenue_estimate: number;
  strengths: string[];
  weaknesses: string[];
  recent_activity: CompetitorActivity[];
  vulnerability_score: number;
}

interface CompetitorActivity {
  id: string;
  type: 'content' | 'campaign' | 'price_change' | 'new_service' | 'partnership';
  description: string;
  impact: 'high' | 'medium' | 'low';
  detected: Date;
  our_response?: string;
}

interface BattlefieldMetric {
  area: string;
  our_position: number;
  leader: string;
  gap_to_leader: number;
  opportunity_size: number;
  action_required: string;
}

const CompetitiveWarfareMap: React.FC = () => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [showAttackPlan, setShowAttackPlan] = useState(false);
  const [autoMonitor, setAutoMonitor] = useState(true);

  const competitors: Competitor[] = [
    {
      id: '1',
      name: 'Stockholm Flyttbyrå',
      domain: 'stockholmflyttbyra.se',
      threat_level: 'high',
      market_share: 28,
      monthly_traffic: 45000,
      ranking_keywords: 892,
      revenue_estimate: 3200000,
      strengths: ['Stark lokal närvaro', 'Många recensioner', 'God prissättning'],
      weaknesses: ['Långsam hemsida', 'Dålig mobilupplevelse', 'Få tjänster'],
      recent_activity: [
        {
          id: '1',
          type: 'campaign',
          description: 'Lanserat Google Ads kampanj för "billig flytt Stockholm"',
          impact: 'high',
          detected: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          our_response: 'Motattack med bättre erbjudande lanserad'
        },
        {
          id: '2',
          type: 'price_change',
          description: 'Sänkt timpris med 15% för privatflyttar',
          impact: 'medium',
          detected: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      ],
      vulnerability_score: 72
    },
    {
      id: '2',
      name: 'Flytt & Transport AB',
      domain: 'flyttochtransport.se',
      threat_level: 'medium',
      market_share: 18,
      monthly_traffic: 28000,
      ranking_keywords: 567,
      revenue_estimate: 2100000,
      strengths: ['Brett tjänsteutbud', 'B2B-fokus', 'ISO-certifierad'],
      weaknesses: ['Svag SEO', 'Lite innehåll', 'Få lokala sidor'],
      recent_activity: [
        {
          id: '3',
          type: 'new_service',
          description: 'Lanserat miljövänlig flyttjänst',
          impact: 'low',
          detected: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ],
      vulnerability_score: 85
    },
    {
      id: '3',
      name: 'QuickMove Nordic',
      domain: 'quickmove.se',
      threat_level: 'low',
      market_share: 8,
      monthly_traffic: 12000,
      ranking_keywords: 234,
      revenue_estimate: 850000,
      strengths: ['Modern teknologi', 'App-bokning', 'Snabb service'],
      weaknesses: ['Ny aktör', 'Litet team', 'Begränsad räckvidd', 'Höga priser'],
      recent_activity: [
        {
          id: '4',
          type: 'partnership',
          description: 'Samarbete med Hemnet för flyttannonser',
          impact: 'medium',
          detected: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ],
      vulnerability_score: 91
    }
  ];

  const battlefieldMetrics: BattlefieldMetric[] = [
    {
      area: 'Flyttfirma Stockholm',
      our_position: 3,
      leader: 'Stockholm Flyttbyrå',
      gap_to_leader: 2,
      opportunity_size: 185000,
      action_required: 'Skapa områdesspecifikt innehåll'
    },
    {
      area: 'Kontorsflytt Stockholm',
      our_position: 2,
      leader: 'Flytt & Transport AB',
      gap_to_leader: 1,
      opportunity_size: 125000,
      action_required: 'Optimera B2B-landningssida'
    },
    {
      area: 'Billig flytt',
      our_position: 5,
      leader: 'Stockholm Flyttbyrå',
      gap_to_leader: 4,
      opportunity_size: 95000,
      action_required: 'Lansera priskampanj'
    },
    {
      area: 'Flytthjälp helg',
      our_position: 1,
      leader: 'Nordflytt (oss!)',
      gap_to_leader: 0,
      opportunity_size: 65000,
      action_required: 'Försvara position'
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

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (type: CompetitorActivity['type']) => {
    switch (type) {
      case 'content': return <BarChart3 className="h-4 w-4" />;
      case 'campaign': return <Target className="h-4 w-4" />;
      case 'price_change': return <DollarSign className="h-4 w-4" />;
      case 'new_service': return <Sparkles className="h-4 w-4" />;
      case 'partnership': return <Users className="h-4 w-4" />;
    }
  };

  const selectedComp = competitors.find(c => c.id === selectedCompetitor);

  return (
    <div className="space-y-6">
      {/* War Room Overview */}
      <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-red-600" />
                Competitive Warfare Map
              </CardTitle>
              <CardDescription>
                Realtidsövervakning av konkurrentaktivitet och marknadsposition
              </CardDescription>
            </div>
            <Badge className={`${autoMonitor ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {autoMonitor ? 'Auto-övervakning aktiv' : 'Manuell övervakning'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-gray-600">Vår position</span>
              </div>
              <p className="text-2xl font-bold">#2</p>
              <p className="text-sm text-gray-600">i Stockholm</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <span className="text-xs text-gray-600">Övervakade</span>
              </div>
              <p className="text-2xl font-bold">{competitors.length}</p>
              <p className="text-sm text-gray-600">konkurrenter</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-xs text-gray-600">Hot upptäckta</span>
              </div>
              <p className="text-2xl font-bold">7</p>
              <p className="text-sm text-red-600">3 kritiska</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="text-xs text-gray-600">Möjligheter</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(470000)}</p>
              <p className="text-sm text-green-600">att erövra</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {competitors.map((competitor) => (
          <Card 
            key={competitor.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedCompetitor === competitor.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedCompetitor(competitor.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{competitor.name}</CardTitle>
                <Badge className={getThreatColor(competitor.threat_level)}>
                  {competitor.threat_level === 'high' ? 'Högt hot' :
                   competitor.threat_level === 'medium' ? 'Medelhot' : 'Lågt hot'}
                </Badge>
              </div>
              <CardDescription>{competitor.domain}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Market Share */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Marknadsandel</span>
                    <span>{competitor.market_share}%</span>
                  </div>
                  <Progress value={competitor.market_share} className="h-2" />
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Trafik/mån</p>
                    <p className="font-semibold">{competitor.monthly_traffic.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Keywords</p>
                    <p className="font-semibold">{competitor.ranking_keywords}</p>
                  </div>
                </div>

                {/* Vulnerability Score */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sårbarhet</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-4 rounded-sm ${
                              i < Math.floor(competitor.vulnerability_score / 20)
                                ? 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {competitor.vulnerability_score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Latest Activity */}
                {competitor.recent_activity.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      <span className="text-xs text-gray-600">
                        Senaste: {competitor.recent_activity[0].description.substring(0, 30)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analysis */}
      {selectedComp && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths & Weaknesses */}
          <Card>
            <CardHeader>
              <CardTitle>Analys: {selectedComp.name}</CardTitle>
              <CardDescription>
                Styrkor, svagheter och attackvektorer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Strengths */}
                <div>
                  <h3 className="font-medium flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-green-600" />
                    Deras styrkor
                  </h3>
                  <div className="space-y-2">
                    {selectedComp.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-green-600 rounded-full" />
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div>
                  <h3 className="font-medium flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-red-600" />
                    Svagheter att utnyttja
                  </h3>
                  <div className="space-y-2">
                    {selectedComp.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-red-600 rounded-full" />
                        <span className="text-sm">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attack Plan */}
                <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                  <CardContent className="p-4">
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                      <Sword className="h-4 w-4 text-red-600" />
                      Rekommenderad attackplan
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge className="bg-red-100 text-red-800 text-xs">1</Badge>
                        <p className="text-sm">Utnyttja deras svaga mobilupplevelse med mobiloptimerad kampanj</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge className="bg-red-100 text-red-800 text-xs">2</Badge>
                        <p className="text-sm">Skapa innehåll för keywords där de rankar 4-10</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge className="bg-red-100 text-red-800 text-xs">3</Badge>
                        <p className="text-sm">Lansera riktad Google Ads för deras varumärkessökningar</p>
                      </div>
                    </div>
                    <Button className="w-full mt-4" onClick={() => setShowAttackPlan(true)}>
                      Starta attack
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitetslogg</CardTitle>
              <CardDescription>
                Spåra alla konkurrentrörelser i realtid
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedComp.recent_activity.map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.impact === 'high' ? 'bg-red-100' :
                        activity.impact === 'medium' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-600">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(activity.detected).toLocaleDateString('sv-SE')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.impact === 'high' ? 'Hög påverkan' :
                             activity.impact === 'medium' ? 'Medel påverkan' :
                             'Låg påverkan'}
                          </Badge>
                        </div>
                        {activity.our_response && (
                          <div className="mt-2 p-2 bg-green-50 rounded">
                            <p className="text-xs text-green-800">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Vår respons: {activity.our_response}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Battlefield Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-blue-600" />
            Slagfält - Nyckelområden
          </CardTitle>
          <CardDescription>
            Var står vi i kampen om varje sökning?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {battlefieldMetrics.map((metric, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{metric.area}</h4>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">
                          Position: <strong>#{metric.our_position}</strong>
                        </span>
                      </div>
                      {metric.gap_to_leader > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">
                            {metric.gap_to_leader} steg från toppen
                          </span>
                        </div>
                      )}
                      {metric.gap_to_leader === 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          <Trophy className="h-3 w-3 mr-1" />
                          Vi leder!
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Potential</p>
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(metric.opportunity_size)}
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      {metric.action_required}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitiveWarfareMap;