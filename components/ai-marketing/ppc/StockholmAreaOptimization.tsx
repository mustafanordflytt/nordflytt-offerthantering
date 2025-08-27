'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  Home,
  Building,
  Calendar,
  Target,
  BarChart3,
  Activity,
  Clock,
  Zap,
  Brain,
  Navigation,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Trophy,
  Heart
} from 'lucide-react';

interface AreaData {
  id: string;
  name: string;
  type: 'premium' | 'standard' | 'budget';
  demographics: {
    avgIncome: number;
    avgAge: number;
    familySize: number;
    homeOwnership: number;
  };
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    avgOrderValue: number;
    roas: number;
  };
  trends: {
    seasonality: string;
    peakMonths: string[];
    growthRate: number;
  };
  competitors: number;
  marketShare: number;
  opportunities: string[];
  recommendedBudget: number;
  currentBudget: number;
}

interface TimeSlotData {
  area: string;
  dayOfWeek: string;
  hour: number;
  conversionRate: number;
  avgCPC: number;
  competition: 'low' | 'medium' | 'high';
}

interface ServiceDemand {
  service: string;
  areas: {
    name: string;
    demand: number;
    growth: number;
  }[];
}

interface LocalCompetitor {
  name: string;
  areas: string[];
  estimatedBudget: number;
  strengths: string[];
  weaknesses: string[];
}

const StockholmAreaOptimization: React.FC = () => {
  const [activeTab, setActiveTab] = useState('areas');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [areaData] = useState<AreaData[]>([
    {
      id: 'ostermalm',
      name: 'Östermalm',
      type: 'premium',
      demographics: {
        avgIncome: 680000,
        avgAge: 42,
        familySize: 2.1,
        homeOwnership: 35
      },
      performance: {
        impressions: 45320,
        clicks: 2134,
        ctr: 4.7,
        conversions: 89,
        avgOrderValue: 35000,
        roas: 5.8
      },
      trends: {
        seasonality: 'Stable year-round',
        peakMonths: ['September', 'October', 'April'],
        growthRate: 12
      },
      competitors: 8,
      marketShare: 22,
      opportunities: [
        'Pianoflytt & konsthantering',
        'Premium helgservice',
        'Concierge-tjänster'
      ],
      recommendedBudget: 45000,
      currentBudget: 28000
    },
    {
      id: 'sodermalm',
      name: 'Södermalm',
      type: 'standard',
      demographics: {
        avgIncome: 420000,
        avgAge: 34,
        familySize: 1.8,
        homeOwnership: 28
      },
      performance: {
        impressions: 67890,
        clicks: 2987,
        ctr: 4.4,
        conversions: 134,
        avgOrderValue: 18000,
        roas: 4.2
      },
      trends: {
        seasonality: 'Summer peak',
        peakMonths: ['June', 'July', 'August'],
        growthRate: 18
      },
      competitors: 12,
      marketShare: 18,
      opportunities: [
        'Studentflyttar',
        'Små lägenheter express',
        'Miljövänlig flytt'
      ],
      recommendedBudget: 35000,
      currentBudget: 32000
    },
    {
      id: 'rinkeby-tensta',
      name: 'Rinkeby-Tensta',
      type: 'budget',
      demographics: {
        avgIncome: 220000,
        avgAge: 32,
        familySize: 3.2,
        homeOwnership: 15
      },
      performance: {
        impressions: 23450,
        clicks: 876,
        ctr: 3.7,
        conversions: 45,
        avgOrderValue: 12000,
        roas: 3.1
      },
      trends: {
        seasonality: 'End of month spike',
        peakMonths: ['January', 'August'],
        growthRate: 25
      },
      competitors: 4,
      marketShare: 12,
      opportunities: [
        'Flexibel betalning',
        'Familjepaketerbjudanden',
        'Flerspråkig service'
      ],
      recommendedBudget: 15000,
      currentBudget: 8000
    },
    {
      id: 'bromma',
      name: 'Bromma',
      type: 'premium',
      demographics: {
        avgIncome: 580000,
        avgAge: 45,
        familySize: 3.1,
        homeOwnership: 78
      },
      performance: {
        impressions: 34560,
        clicks: 1456,
        ctr: 4.2,
        conversions: 67,
        avgOrderValue: 42000,
        roas: 6.2
      },
      trends: {
        seasonality: 'Spring/Fall peaks',
        peakMonths: ['March', 'April', 'September'],
        growthRate: 8
      },
      competitors: 6,
      marketShare: 25,
      opportunities: [
        'Villaflytt specialisering',
        'Trädgårdsmöbler & uterum',
        'Garage & förråd'
      ],
      recommendedBudget: 30000,
      currentBudget: 25000
    }
  ]);

  const [timeSlotData] = useState<TimeSlotData[]>([
    {
      area: 'Östermalm',
      dayOfWeek: 'Måndag',
      hour: 9,
      conversionRate: 8.2,
      avgCPC: 18.50,
      competition: 'medium'
    },
    {
      area: 'Östermalm',
      dayOfWeek: 'Lördag',
      hour: 10,
      conversionRate: 12.5,
      avgCPC: 22.30,
      competition: 'high'
    },
    {
      area: 'Södermalm',
      dayOfWeek: 'Söndag',
      hour: 14,
      conversionRate: 9.8,
      avgCPC: 15.20,
      competition: 'low'
    },
    {
      area: 'Bromma',
      dayOfWeek: 'Fredag',
      hour: 16,
      conversionRate: 11.2,
      avgCPC: 19.80,
      competition: 'medium'
    }
  ]);

  const [serviceDemand] = useState<ServiceDemand[]>([
    {
      service: 'Pianoflytt',
      areas: [
        { name: 'Östermalm', demand: 89, growth: 23 },
        { name: 'Bromma', demand: 67, growth: 15 },
        { name: 'Vasastan', demand: 45, growth: 8 }
      ]
    },
    {
      service: 'Kontorsflytt',
      areas: [
        { name: 'Kista', demand: 94, growth: 34 },
        { name: 'City', demand: 87, growth: 12 },
        { name: 'Solna', demand: 76, growth: 28 }
      ]
    },
    {
      service: 'Studentflytt',
      areas: [
        { name: 'Lappis', demand: 98, growth: 45 },
        { name: 'Södermalm', demand: 82, growth: 32 },
        { name: 'Huddinge', demand: 71, growth: 38 }
      ]
    }
  ]);

  const [localCompetitors] = useState<LocalCompetitor[]>([
    {
      name: 'Östermalms Flyttbyrå',
      areas: ['Östermalm', 'Djurgården', 'Gärdet'],
      estimatedBudget: 85000,
      strengths: ['Lokal närvaro', 'Premium image'],
      weaknesses: ['Höga priser', 'Liten kapacitet']
    },
    {
      name: 'Söder Express',
      areas: ['Södermalm', 'Gamla Stan', 'Hammarby'],
      estimatedBudget: 65000,
      strengths: ['Snabb service', 'Bra reviews'],
      weaknesses: ['Ingen försäkring', 'Dålig RUT-info']
    }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'budget': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleOptimizeArea = (areaId: string) => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      alert(`Optimering för ${areaId} genomförd! Budget justerad och nya annonser skapade.`);
    }, 2000);
  };

  const totalBudget = areaData.reduce((sum, area) => sum + area.currentBudget, 0);
  const totalRecommended = areaData.reduce((sum, area) => sum + area.recommendedBudget, 0);
  const totalConversions = areaData.reduce((sum, area) => sum + area.performance.conversions, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Stockholm Area Intelligence</CardTitle>
                <CardDescription>
                  Hyperlokal optimering för varje stadsdel med demografisk precision
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => areaData.forEach(area => handleOptimizeArea(area.id))}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-pulse" />
                  Optimerar...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Optimera alla områden
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Total budget</p>
              <p className="text-xl font-bold">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Rekommenderad</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totalRecommended)}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Konverteringar</p>
              <p className="text-xl font-bold">{totalConversions}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Avg ROAS</p>
              <p className="text-xl font-bold text-green-600">4.8x</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="areas">Områdesanalys</TabsTrigger>
          <TabsTrigger value="heatmap">Tidszoner</TabsTrigger>
          <TabsTrigger value="services">Tjänsteefterfrågan</TabsTrigger>
          <TabsTrigger value="competitors">Lokal konkurrens</TabsTrigger>
        </TabsList>

        {/* Areas Tab */}
        <TabsContent value="areas" className="space-y-4">
          {areaData.map((area) => (
            <Card key={area.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      {area.type === 'premium' ? <Home className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      <Badge className={getTypeColor(area.type)}>{area.type}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{area.performance.roas}x</p>
                    <p className="text-sm text-gray-600">ROAS</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Demographics */}
                <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Medelinkomst</p>
                    <p className="font-bold">{formatCurrency(area.demographics.avgIncome)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Medelålder</p>
                    <p className="font-bold">{area.demographics.avgAge} år</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Familj</p>
                    <p className="font-bold">{area.demographics.familySize} pers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Äger bostad</p>
                    <p className="font-bold">{area.demographics.homeOwnership}%</p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white border rounded">
                    <p className="text-sm text-gray-600">CTR</p>
                    <p className="text-xl font-bold">{area.performance.ctr}%</p>
                  </div>
                  <div className="p-3 bg-white border rounded">
                    <p className="text-sm text-gray-600">Konv.</p>
                    <p className="text-xl font-bold">{area.performance.conversions}</p>
                  </div>
                  <div className="p-3 bg-white border rounded">
                    <p className="text-sm text-gray-600">AOV</p>
                    <p className="text-xl font-bold">{formatCurrency(area.performance.avgOrderValue)}</p>
                  </div>
                </div>

                {/* Budget Optimization */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Budget optimering</span>
                    {area.recommendedBudget > area.currentBudget ? (
                      <ArrowUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Nuvarande: {formatCurrency(area.currentBudget)}</span>
                        <span className="text-blue-600 font-medium">
                          Rekommenderad: {formatCurrency(area.recommendedBudget)}
                        </span>
                      </div>
                      <Progress 
                        value={(area.currentBudget / area.recommendedBudget) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Opportunities */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Möjligheter
                  </h4>
                  <div className="space-y-1">
                    {area.opportunities.map((opp, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{opp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Market Position */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <Trophy className="h-3 w-3 inline mr-1" />
                      {area.marketShare}% marknadsandel
                    </span>
                    <span>
                      <Users className="h-3 w-3 inline mr-1" />
                      {area.competitors} konkurrenter
                    </span>
                    <span>
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      {area.trends.growthRate}% tillväxt
                    </span>
                  </div>
                  <Button size="sm" onClick={() => handleOptimizeArea(area.id)}>
                    Optimera område
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Tidszonsoptimering:</strong> AI identifierar de mest lönsamma tiderna 
              för varje område baserat på historisk data och realtidstrender.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timeSlotData.map((slot, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{slot.area}</h4>
                      <p className="text-sm text-gray-600">
                        {slot.dayOfWeek} kl {slot.hour}:00
                      </p>
                    </div>
                    <Badge className={getCompetitionColor(slot.competition)}>
                      {slot.competition} konkurrens
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Konv. rate</p>
                      <p className="font-bold text-green-600">{slot.conversionRate}%</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Avg CPC</p>
                      <p className="font-bold">{formatCurrency(slot.avgCPC)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Rekommendationer
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  • <strong>Östermalm:</strong> Öka budget lördag förmiddag (+45% konvertering)
                </p>
                <p className="text-sm">
                  • <strong>Södermalm:</strong> Sänk CPC söndag eftermiddag (låg konkurrens)
                </p>
                <p className="text-sm">
                  • <strong>Bromma:</strong> Fokusera på fredagar 16-18 (familjer planerar helgflytt)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Demand Tab */}
        <TabsContent value="services" className="space-y-4">
          {serviceDemand.map((service, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {service.service}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {service.areas.map((area, areaIdx) => (
                    <div key={areaIdx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{area.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Efterfrågan</p>
                          <Progress value={area.demand} className="h-2 w-20" />
                          <p className="text-xs font-bold mt-1">{area.demand}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Tillväxt</p>
                          <p className="font-bold text-green-600">+{area.growth}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          {localCompetitors.map((competitor, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{competitor.name}</CardTitle>
                  <Badge variant="outline">
                    Budget: {formatCurrency(competitor.estimatedBudget)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Aktiva områden:</p>
                    <div className="flex flex-wrap gap-2">
                      {competitor.areas.map((area, areaIdx) => (
                        <Badge key={areaIdx} variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">Styrkor:</p>
                      <ul className="space-y-1">
                        {competitor.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-1">Svagheter:</p>
                      <ul className="space-y-1">
                        {competitor.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="w-full">
                    <Brain className="h-3 w-3 mr-1" />
                    Generera motstrategier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Alert className="bg-green-50 border-green-200">
            <Heart className="h-4 w-4" />
            <AlertDescription>
              <strong>Konkurrensfördel:</strong> Vi är den enda flyttfirman som erbjuder 
              hyperlokal annonsering med AI-optimering för varje stadsdel i Stockholm.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockholmAreaOptimization;