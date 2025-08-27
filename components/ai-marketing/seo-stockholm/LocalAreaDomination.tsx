'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Target,
  AlertCircle,
  Building,
  Home,
  Briefcase,
  ChevronRight,
  Star,
  Activity
} from 'lucide-react';

interface LocalAreaPerformance {
  area: string;
  visibility: number;
  leads: number;
  revenue: number;
  growthRate: number;
  competitorPresence: 'low' | 'medium' | 'high';
  opportunities: number;
}

interface AreaInsight {
  type: 'opportunity' | 'threat' | 'trend';
  title: string;
  description: string;
  impact: number;
  action: string;
}

interface Props {
  areas: LocalAreaPerformance[];
}

const LocalAreaDomination: React.FC<Props> = ({ areas }) => {
  const [selectedArea, setSelectedArea] = useState<string>('Östermalm');

  const areaInsights: Record<string, AreaInsight[]> = {
    'Östermalm': [
      {
        type: 'opportunity',
        title: 'Luxury apartment boom',
        description: '35% ökning av lyxlägenhetsförsäljningar',
        impact: 125000,
        action: 'Skapa premium-tjänst'
      },
      {
        type: 'threat',
        title: 'Ny konkurrent etablerar sig',
        description: 'Premium Flytt Stockholm öppnar kontor',
        impact: -45000,
        action: 'Förstärk position'
      },
      {
        type: 'trend',
        title: 'Helgflyttar ökar',
        description: '60% fler söker helgtjänster',
        impact: 35000,
        action: 'Marknadsför helgtjänst'
      }
    ],
    'Södermalm': [
      {
        type: 'opportunity',
        title: 'Unga familjer flyttar in',
        description: '25% ökning av barnfamiljer',
        impact: 85000,
        action: 'Familjepaket'
      },
      {
        type: 'trend',
        title: 'Miljömedvetna kunder',
        description: '70% vill ha gröna alternativ',
        impact: 55000,
        action: 'Lansera eko-flytt'
      }
    ],
    'Vasastan': [
      {
        type: 'opportunity',
        title: 'Studentflyttar exploderar',
        description: 'Augusti-september högssäsong',
        impact: 95000,
        action: 'Studentkampanj'
      },
      {
        type: 'trend',
        title: 'Små lägenheter dominerar',
        description: '80% under 50kvm',
        impact: 25000,
        action: 'Mini-flyttpaket'
      }
    ]
  };

  const demographicData = {
    'Östermalm': {
      avgIncome: 850000,
      avgApartmentSize: 95,
      mainCustomerType: 'Företagsledare & Högavlönade',
      peakMonths: ['September', 'Mars'],
      avgJobValue: 18500
    },
    'Södermalm': {
      avgIncome: 520000,
      avgApartmentSize: 65,
      mainCustomerType: 'Unga professionella & Familjer',
      peakMonths: ['Juni', 'Augusti'],
      avgJobValue: 12500
    },
    'Vasastan': {
      avgIncome: 420000,
      avgApartmentSize: 45,
      mainCustomerType: 'Studenter & Unga vuxna',
      peakMonths: ['Augusti', 'Januari'],
      avgJobValue: 8500
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCompetitorColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-4 w-4 text-green-600" />;
      case 'threat': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
  };

  const currentAreaData = areas.find(a => a.area === selectedArea) || areas[0];
  const currentInsights = areaInsights[selectedArea] || [];
  const currentDemographics = demographicData[selectedArea as keyof typeof demographicData];

  return (
    <div className="space-y-6">
      {/* Area Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {areas.map((area) => (
          <Card 
            key={area.area}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedArea === area.area ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedArea(area.area)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {area.area}
                </span>
                <Badge variant="outline" className={getCompetitorColor(area.competitorPresence)}>
                  {area.competitorPresence} konkurrens
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Visibility */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Synlighet</span>
                    <span>{area.visibility}%</span>
                  </div>
                  <Progress value={area.visibility} className="h-2" />
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Leads</p>
                    <p className="text-lg font-bold">{area.leads}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Intäkter</p>
                    <p className="text-lg font-bold">{formatCurrency(area.revenue)}</p>
                  </div>
                </div>

                {/* Growth & Opportunities */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      +{area.growthRate}%
                    </span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {area.opportunities} möjligheter
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Area Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics & Insights */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedArea} - Djupanalys
            </CardTitle>
            <CardDescription>
              Demografi och marknadsinsikter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demographics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3">Områdesdemografi</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Medelinkomst</span>
                  <span className="font-medium">{formatCurrency(currentDemographics.avgIncome)}/år</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Snitt lägenhetsstorlek</span>
                  <span className="font-medium">{currentDemographics.avgApartmentSize} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Huvudkundgrupp</span>
                  <span className="font-medium text-sm">{currentDemographics.mainCustomerType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Högsäsong</span>
                  <span className="font-medium">{currentDemographics.peakMonths.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Snitt jobbvärde</span>
                  <span className="font-medium text-green-600">{formatCurrency(currentDemographics.avgJobValue)}</span>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div>
              <h3 className="font-medium mb-3">Aktuella insikter</h3>
              <div className="space-y-2">
                {currentInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-sm font-medium ${
                            insight.impact > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {insight.impact > 0 ? '+' : ''}{formatCurrency(Math.abs(insight.impact))}
                          </span>
                          <Button size="sm" variant="outline">
                            {insight.action}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Handlingsplan för {selectedArea}</CardTitle>
            <CardDescription>
              Prioriterade åtgärder för områdesdominans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Eye className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Månad synlighet</p>
                  <p className="font-bold">{currentAreaData.visibility}%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Users className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Leads denna månad</p>
                  <p className="font-bold">{currentAreaData.leads}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <DollarSign className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Intäkter</p>
                  <p className="font-bold">{formatCurrency(currentAreaData.revenue)}</p>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                <h3 className="font-medium flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-600" />
                  Rekommenderade åtgärder
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Skapa områdesspecifik landningssida</p>
                      <p className="text-xs text-gray-600">Ökar lokal SEO med 40%</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      +65K/mån
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Partnerskap med lokala mäklare</p>
                      <p className="text-xs text-gray-600">15-20 extra leads/månad</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      +120K/mån
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Google My Business optimering</p>
                      <p className="text-xs text-gray-600">Lokala recensioner & bilder</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      +35K/mån
                    </Badge>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium mb-1">Total potential för {selectedArea}</p>
                  <p className="text-2xl font-bold mb-3">+220 000 kr/mån</p>
                  <Button variant="secondary" className="w-full">
                    Starta områdeskampanj
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocalAreaDomination;