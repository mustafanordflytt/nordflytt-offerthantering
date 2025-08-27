'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Phone,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
  Trophy,
  Clock,
  MapPin,
  BarChart3,
  Activity,
  Sparkles,
  X
} from 'lucide-react';

interface QuickMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  impact: string;
}

interface ActionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  title: string;
  timeEstimate: string;
  revenueImpact: number;
  action: string;
}

const MobileCEOMode: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'actions' | 'opportunities'>('overview');

  const quickMetrics: QuickMetric[] = [
    {
      label: 'Intäkter idag',
      value: '124 500 kr',
      change: 18,
      trend: 'up',
      impact: '+22 500 kr från SEO'
    },
    {
      label: 'Nya leads',
      value: '12',
      change: 33,
      trend: 'up',
      impact: '4 från Google'
    },
    {
      label: 'Position "Flyttfirma Stockholm"',
      value: '#3',
      change: 2,
      trend: 'up',
      impact: 'Upp 2 platser'
    }
  ];

  const criticalActions: ActionItem[] = [
    {
      id: '1',
      priority: 'critical',
      title: '5 obesvarade recensioner',
      timeEstimate: '15 min',
      revenueImpact: 35000,
      action: 'Svara nu'
    },
    {
      id: '2',
      priority: 'high',
      title: 'Konkurrent tappar position',
      timeEstimate: '30 min',
      revenueImpact: 85000,
      action: 'Ta position'
    },
    {
      id: '3',
      priority: 'medium',
      title: 'Uppdatera Google My Business',
      timeEstimate: '5 min',
      revenueImpact: 15000,
      action: 'Uppdatera'
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Zap className="h-4 w-4" />;
      case 'medium': return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Auto-suggestions based on time and context
  const getSmartSuggestion = () => {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    if (hour < 10) {
      return {
        title: 'Morgonboost rekommenderas',
        description: 'Optimera för "akut flytt" - hög efterfrågan på morgonen',
        action: 'Aktivera boost',
        impact: '+25 000 kr'
      };
    } else if (day === 4 || day === 5) {
      return {
        title: 'Helgförberedelse',
        description: 'Förstärk synlighet för helgflyttar',
        action: 'Kör helgkampanj',
        impact: '+45 000 kr'
      };
    } else {
      return {
        title: 'Konkurrentkoll',
        description: '2 konkurrenter har ökat aktivitet',
        action: 'Se åtgärder',
        impact: 'Försvara 125 000 kr'
      };
    }
  };

  const smartSuggestion = getSmartSuggestion();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">SEO Stockholm</h1>
              <p className="text-sm text-gray-600">CEO-vy • Realtidsdata</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className="relative"
            >
              <Sparkles className="h-4 w-4" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-4 w-4 p-0 flex items-center justify-center text-xs">
                1
              </Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* AI Smart Suggestion */}
      <div className="p-4">
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{smartSuggestion.title}</h3>
                <p className="text-sm text-white/90 mt-1">{smartSuggestion.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-medium">{smartSuggestion.impact}</span>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="text-purple-600"
                  >
                    {smartSuggestion.action}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Revenue Impact - Simplified */}
      <div className="px-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium">Dagens intäkter</span>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <ArrowUp className="h-3 w-3 mr-1" />
                18%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-green-900">+178 500 kr</p>
            <Progress value={72} className="h-2 mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Metrics */}
      <div className="px-4 mb-4">
        <div className="space-y-3">
          {quickMetrics.map((metric, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">{metric.label}</p>
                    <p className="text-lg font-bold">{metric.value}</p>
                    <Badge variant="outline" className={`text-xs mt-1 ${
                      metric.trend === 'up' ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'
                    }`}>
                      {metric.trend === 'up' ? '+' : ''}{metric.change}%
                    </Badge>
                  </div>
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
          <Button
            variant={activeSection === 'overview' ? 'default' : 'ghost'}
            className="flex-1 h-9"
            onClick={() => setActiveSection('overview')}
          >
            Översikt
          </Button>
          <Button
            variant={activeSection === 'actions' ? 'default' : 'ghost'}
            className="flex-1 h-9"
            onClick={() => setActiveSection('actions')}
          >
            Åtgärder
          </Button>
          <Button
            variant={activeSection === 'opportunities' ? 'default' : 'ghost'}
            className="flex-1 h-9"
            onClick={() => setActiveSection('opportunities')}
          >
            Möjligheter
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      {activeSection === 'overview' && (
        <div className="px-4 space-y-4">
          {/* Top Performing Areas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Bästa områdena idag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['Östermalm', 'Södermalm', 'Vasastan'].map((area, index) => (
                <div key={area} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{area}</p>
                    <p className="text-sm text-gray-600">{12 - index * 2} leads idag</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency((95 - index * 10) * 1000)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1} ranking
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Competitor Alert */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Konkurrentvarning</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Stockholm Flyttar AB har ökat sin annonsering med 40%
                  </p>
                  <Button size="sm" className="mt-3 w-full">
                    Se motåtgärder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'actions' && (
        <div className="px-4 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Prioriterade åtgärder</CardTitle>
              <CardDescription className="text-xs">
                Genomför dessa för maximal intäkt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalActions.map((action) => (
                <div key={action.id} className={`p-3 rounded-lg border ${getPriorityColor(action.priority)}`}>
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(action.priority)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{action.title}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {action.timeEstimate}
                        </span>
                        <span className="text-xs font-medium text-green-600">
                          +{formatCurrency(action.revenueImpact)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="w-full mt-3">
                    {action.action}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Call CTA */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium mb-1">Behöver hjälp?</p>
                <p className="text-sm text-gray-600 mb-3">
                  Ring din SEO-expert direkt
                </p>
                <Button className="w-full" variant="default">
                  <Phone className="h-4 w-4 mr-2" />
                  Ring Marcus (SEO)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'opportunities' && (
        <div className="px-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-600" />
                Upptäckta möjligheter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">Hög potential</Badge>
                </div>
                <p className="font-medium text-sm">Position #1 inom räckhåll</p>
                <p className="text-xs text-gray-600 mt-1">
                  "Flyttfirma Östermalm" - bara 15 poäng från toppen
                </p>
                <p className="text-sm font-bold text-green-600 mt-2">
                  +125 000 kr/månad
                </p>
              </div>

              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <Badge className="bg-green-100 text-green-800 text-xs">Snabb vinst</Badge>
                </div>
                <p className="font-medium text-sm">40% fler "akut flytt" sökningar</p>
                <p className="text-xs text-gray-600 mt-1">
                  Skapa landningssida för akutflyttar
                </p>
                <p className="text-sm font-bold text-green-600 mt-2">
                  +55 000 kr/månad
                </p>
              </div>

              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-800 text-xs">Strategisk</Badge>
                </div>
                <p className="font-medium text-sm">Företagsflyttar underskattat</p>
                <p className="text-xs text-gray-600 mt-1">
                  Låg konkurrens, höga kontraktsvärden
                </p>
                <p className="text-sm font-bold text-green-600 mt-2">
                  +200 000 kr/månad
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="font-medium mb-1">Total möjlighet</p>
              <p className="text-2xl font-bold text-purple-900">+380 000 kr/mån</p>
              <p className="text-xs text-gray-600 mt-1">från identifierade möjligheter</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button variant="ghost" className="flex-col h-auto py-2">
            <BarChart3 className="h-5 w-5 mb-1" />
            <span className="text-xs">Hem</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex-col h-auto py-2 relative"
            onClick={() => setActiveSection('actions')}
          >
            <Zap className="h-5 w-5 mb-1" />
            <span className="text-xs">Åtgärder</span>
            <Badge className="absolute top-1 right-1 bg-red-500 text-white h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              3
            </Badge>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2">
            <Activity className="h-5 w-5 mb-1" />
            <span className="text-xs">Live</span>
          </Button>
          <Button variant="ghost" className="flex-col h-auto py-2">
            <Phone className="h-5 w-5 mb-1" />
            <span className="text-xs">Hjälp</span>
          </Button>
        </div>
      </div>
      
      {/* AI Assistant Floating Button */}
      {showAIAssistant && (
        <div className="fixed bottom-20 right-4 z-40">
          <Card className="w-80 shadow-2xl">
            <CardHeader className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Assistent
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIAssistant(false)}
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <p className="text-sm">Jag ser att du har 3 kritiska åtgärder värda 245,000 kr. Ska jag fixa dem?</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1">
                  Ja, fixa allt
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Visa detaljer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MobileCEOMode;