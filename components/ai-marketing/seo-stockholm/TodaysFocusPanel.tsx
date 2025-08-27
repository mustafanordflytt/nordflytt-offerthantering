'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  Star
} from 'lucide-react';

interface TodaysFocus {
  mainGoal: string;
  targetRevenue: number;
  currentProgress: number;
  keyActions: {
    id: string;
    title: string;
    impact: 'high' | 'medium' | 'low';
    completed: boolean;
    estimatedTime: string;
    revenueImpact: number;
  }[];
  opportunities: {
    id: string;
    title: string;
    urgency: 'critical' | 'high' | 'medium';
    potentialValue: number;
  }[];
}

const TodaysFocusPanel: React.FC = () => {
  const todaysFocus: TodaysFocus = {
    mainGoal: 'Öka synlighet i Östermalm med 25%',
    targetRevenue: 150000,
    currentProgress: 68,
    keyActions: [
      {
        id: '1',
        title: 'Svara på 5 Google-recensioner',
        impact: 'high',
        completed: false,
        estimatedTime: '30 min',
        revenueImpact: 25000
      },
      {
        id: '2',
        title: 'Uppdatera hemsidans Östermalm-sida',
        impact: 'high',
        completed: true,
        estimatedTime: '1 timme',
        revenueImpact: 45000
      },
      {
        id: '3',
        title: 'Publicera blogginlägg om vinterflyttning',
        impact: 'medium',
        completed: false,
        estimatedTime: '45 min',
        revenueImpact: 15000
      }
    ],
    opportunities: [
      {
        id: '1',
        title: 'Konkurrent tappar rankningar - agera nu!',
        urgency: 'critical',
        potentialValue: 85000
      },
      {
        id: '2',
        title: '40% ökning av "akut flytt" sökningar',
        urgency: 'high',
        potentialValue: 55000
      }
    ]
  };

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
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedActions = todaysFocus.keyActions.filter(a => a.completed).length;
  const totalActions = todaysFocus.keyActions.length;
  const completionRate = (completedActions / totalActions) * 100;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Dagens fokus
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('sv-SE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Målets intäkt</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(todaysFocus.targetRevenue)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Goal */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-medium text-lg mb-2">{todaysFocus.mainGoal}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Framsteg</span>
              <span className="font-medium">{todaysFocus.currentProgress}%</span>
            </div>
            <Progress value={todaysFocus.currentProgress} className="h-3" />
          </div>
        </div>

        {/* Key Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Viktiga åtgärder ({completedActions}/{totalActions})
            </h3>
            <span className="text-sm text-gray-600">{completionRate.toFixed(0)}% klart</span>
          </div>
          <div className="space-y-2">
            {todaysFocus.keyActions.map((action) => (
              <div 
                key={action.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  action.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {action.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  <div>
                    <p className={`font-medium ${action.completed ? 'line-through text-gray-500' : ''}`}>
                      {action.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className={`text-xs ${getImpactColor(action.impact)}`}>
                        {action.impact} påverkan
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {action.estimatedTime}
                      </span>
                      <span className="text-xs text-green-600 font-medium">
                        +{formatCurrency(action.revenueImpact)}
                      </span>
                    </div>
                  </div>
                </div>
                {!action.completed && (
                  <Button size="sm" variant="outline">
                    Starta
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Critical Opportunities */}
        <div>
          <h3 className="font-medium flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            Kritiska möjligheter
          </h3>
          <div className="space-y-2">
            {todaysFocus.opportunities.map((opp) => (
              <div key={opp.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <p className="font-medium">{opp.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={getUrgencyColor(opp.urgency)}>
                      {opp.urgency}
                    </Badge>
                    <span className="text-sm text-green-600 font-medium">
                      +{formatCurrency(opp.potentialValue)} potential
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700">
                  Agera nu
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Potentiell intäkt idag</p>
            <p className="font-bold text-green-600">
              {formatCurrency(
                todaysFocus.keyActions.reduce((sum, a) => sum + a.revenueImpact, 0) +
                todaysFocus.opportunities.reduce((sum, o) => sum + o.potentialValue, 0)
              )}
            </p>
          </div>
          <div className="text-center">
            <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Förväntade leads</p>
            <p className="font-bold text-blue-600">23</p>
          </div>
          <div className="text-center">
            <Star className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Kvalitetspoäng</p>
            <p className="font-bold text-yellow-600">92%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysFocusPanel;