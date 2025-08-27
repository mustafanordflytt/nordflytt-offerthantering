'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MousePointer,
  Eye,
  Phone,
  MessageSquare,
  Clock,
  TrendingUp,
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface ConversionMetric {
  id: string;
  name: string;
  currentRate: number;
  industryAverage: number;
  potential: number;
  impact: 'high' | 'medium' | 'low';
  improvementActions: string[];
}

interface ConversionFunnel {
  stage: string;
  visitors: number;
  conversionRate: number;
  dropOffRate: number;
  issues: string[];
}

const ConversionOpportunities: React.FC = () => {
  const conversionMetrics: ConversionMetric[] = [
    {
      id: '1',
      name: 'Besökare → Lead',
      currentRate: 3.2,
      industryAverage: 4.5,
      potential: 40,
      impact: 'high',
      improvementActions: [
        'Lägg till trust badges på förstasidan',
        'Förbättra CTA-knapparnas synlighet',
        'Visa kundrecensioner direkt'
      ]
    },
    {
      id: '2',
      name: 'Lead → Bokad visning',
      currentRate: 28,
      industryAverage: 35,
      potential: 25,
      impact: 'medium',
      improvementActions: [
        'Snabbare svarstid (inom 5 min)',
        'Lägg till kalenderbokning online',
        'SMS-påminnelser'
      ]
    },
    {
      id: '3',
      name: 'Visning → Kund',
      currentRate: 65,
      industryAverage: 60,
      potential: 10,
      impact: 'low',
      improvementActions: [
        'Digitalt avtal för snabbare signering',
        'Tydligare prispresentation',
        'Follow-up inom 24h'
      ]
    }
  ];

  const funnelData: ConversionFunnel[] = [
    {
      stage: 'Hemsidebesök',
      visitors: 1250,
      conversionRate: 100,
      dropOffRate: 0,
      issues: []
    },
    {
      stage: 'Kontaktformulär',
      visitors: 156,
      conversionRate: 12.5,
      dropOffRate: 87.5,
      issues: ['Formuläret för långt', 'Ingen mobilanpassning']
    },
    {
      stage: 'Leadkvalificering',
      visitors: 98,
      conversionRate: 62.8,
      dropOffRate: 37.2,
      issues: ['Långsam responstid']
    },
    {
      stage: 'Bokad visning',
      visitors: 45,
      conversionRate: 45.9,
      dropOffRate: 54.1,
      issues: ['Saknar online-bokning']
    },
    {
      stage: 'Genomförd flytt',
      visitors: 29,
      conversionRate: 64.4,
      dropOffRate: 35.6,
      issues: ['Konkurrenters priser']
    }
  ];

  const quickWins = [
    {
      action: 'Lägg till "Ring nu" knapp',
      effort: 'low',
      impact: 25000,
      time: '30 min'
    },
    {
      action: 'A/B-testa rubrikerna',
      effort: 'medium',
      impact: 45000,
      time: '2 dagar'
    },
    {
      action: 'Lägg till live-chat',
      effort: 'medium',
      impact: 65000,
      time: '1 vecka'
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Konverteringsmöjligheter
        </CardTitle>
        <CardDescription>
          Identifierade förbättringar för ökad konvertering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversion Metrics */}
        <div className="space-y-3">
          {conversionMetrics.map((metric) => (
            <div key={metric.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{metric.name}</h3>
                <Badge className={getImpactColor(metric.impact)}>
                  {metric.impact} påverkan
                </Badge>
              </div>
              
              {/* Current vs Industry */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-600">Din konvertering</p>
                  <p className="text-lg font-bold">{metric.currentRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Branschsnitt</p>
                  <p className="text-lg font-medium text-gray-500">{metric.industryAverage}%</p>
                </div>
              </div>

              {/* Potential Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Förbättringspotential</span>
                  <span className="text-green-600 font-medium">+{metric.potential}%</span>
                </div>
                <Progress value={metric.currentRate / metric.industryAverage * 100} className="h-2" />
              </div>

              {/* Top Actions */}
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs font-medium mb-1">Rekommenderade åtgärder:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {metric.improvementActions.slice(0, 2).map((action, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Wins Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <h3 className="font-medium flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-green-600" />
            Snabba vinster
          </h3>
          <div className="space-y-2">
            {quickWins.map((win, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                <div className="flex items-center gap-3">
                  <MousePointer className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{win.action}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-xs ${getEffortColor(win.effort)}`}>
                        {win.effort} insats
                      </span>
                      <span className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {win.time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">
                    +{formatCurrency(win.impact)}
                  </p>
                  <Button size="sm" variant="ghost" className="h-6 text-xs">
                    Start
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel Alert */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-sm">Största läckaget</span>
          </div>
          <p className="text-sm text-gray-700">
            87.5% tappar vid kontaktformuläret. Förenkling kan ge 15+ extra leads/månad.
          </p>
          <Button size="sm" variant="outline" className="mt-2 w-full">
            Analysera formuläret
          </Button>
        </div>

        {/* CTA */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium mb-1">Total förbättringspotential</p>
            <p className="text-2xl font-bold text-blue-900">+195 000 kr/mån</p>
            <Button className="mt-3 w-full">
              Starta optimering nu
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ConversionOpportunities;