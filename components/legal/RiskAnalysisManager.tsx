'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Activity, 
  BarChart3,
  Users,
  Truck,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface RiskFactor {
  category: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
}

interface RiskPrediction {
  period: string;
  predictedScore: number;
  confidence: number;
  keyRisks: string[];
}

export function RiskAnalysisManager() {
  const [riskData, setRiskData] = useState<any>({
    currentScore: 42,
    previousScore: 48,
    trend: 'down',
    highRiskJobs: 3,
    totalAssessments: 156
  });

  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([
    {
      category: 'Kundrisker',
      score: 35,
      trend: 'down',
      factors: ['Betalningshistorik', 'Tidigare tvister', 'Kundbetyg']
    },
    {
      category: 'Operativa risker',
      score: 55,
      trend: 'up',
      factors: ['Personalkapacitet', 'Fordonsstatus', 'Säsongsvariationer']
    },
    {
      category: 'Juridiska risker',
      score: 28,
      trend: 'stable',
      factors: ['Avtalskvalitet', 'Försäkringstäckning', 'Regelefterlevnad']
    },
    {
      category: 'Ekonomiska risker',
      score: 45,
      trend: 'down',
      factors: ['Likviditet', 'Kundfordringar', 'Marginalpress']
    }
  ]);

  const [predictions, setPredictions] = useState<RiskPrediction[]>([
    {
      period: 'Nästa vecka',
      predictedScore: 44,
      confidence: 85,
      keyRisks: ['Hög arbetsbelastning', 'Semesterperiod']
    },
    {
      period: 'Nästa månad',
      predictedScore: 38,
      confidence: 72,
      keyRisks: ['Säsongsvariation', 'Nya medarbetare']
    },
    {
      period: 'Nästa kvartal',
      predictedScore: 40,
      confidence: 65,
      keyRisks: ['Marknadsförändringar', 'Konkurrens']
    }
  ]);

  const riskTrendData = [
    { month: 'Jan', score: 52, incidents: 8 },
    { month: 'Feb', score: 48, incidents: 6 },
    { month: 'Mar', score: 45, incidents: 5 },
    { month: 'Apr', score: 50, incidents: 7 },
    { month: 'Maj', score: 46, incidents: 4 },
    { month: 'Jun', score: 42, incidents: 3 }
  ];

  const riskDistribution = [
    { name: 'Låg risk', value: 45, color: '#10b981' },
    { name: 'Medel risk', value: 35, color: '#f59e0b' },
    { name: 'Hög risk', value: 15, color: '#ef4444' },
    { name: 'Kritisk risk', value: 5, color: '#7c3aed' }
  ];

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 50) return 'text-amber-600';
    if (score < 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'Låg';
    if (score < 50) return 'Medel';
    if (score < 70) return 'Hög';
    return 'Kritisk';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Riskanalys & Prediktioner
        </h2>
        <p className="text-muted-foreground">AI-driven riskbedömning och förutsägelser</p>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Övergripande Riskpoäng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getRiskColor(riskData.currentScore)}`}>
                {riskData.currentScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="mt-2">
              <Badge variant={riskData.trend === 'down' ? 'success' : 'destructive'}>
                {riskData.trend === 'down' ? '↓' : '↑'} {Math.abs(riskData.currentScore - riskData.previousScore)} från förra månaden
              </Badge>
            </div>
            <div className="mt-4">
              <Progress value={riskData.currentScore} className="h-2" />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Låg</span>
                <span>{getRiskLevel(riskData.currentScore)}</span>
                <span>Kritisk</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Risktrend (6 månader)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Riskkategorier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {riskFactors.map((factor) => (
            <div key={factor.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{factor.category}</span>
                  <Badge variant="outline" className="text-xs">
                    {factor.trend === 'up' && '↑'}
                    {factor.trend === 'down' && '↓'}
                    {factor.trend === 'stable' && '→'}
                  </Badge>
                </div>
                <span className={`font-bold ${getRiskColor(factor.score)}`}>
                  {factor.score}
                </span>
              </div>
              <Progress value={factor.score} className="h-2" />
              <div className="flex flex-wrap gap-1">
                {factor.factors.map((f, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Risk Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictions.map((prediction) => (
          <Card key={prediction.period}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {prediction.period}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className={`text-2xl font-bold ${getRiskColor(prediction.predictedScore)}`}>
                      {prediction.predictedScore}
                    </span>
                    <Badge variant="outline">
                      {prediction.confidence}% säkerhet
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Huvudrisker:</p>
                  <div className="space-y-1">
                    {prediction.keyRisks.map((risk, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Riskfördelning</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekommenderade Åtgärder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Förstärk försäkringsskydd</p>
                  <p className="text-xs text-muted-foreground">
                    Överväg utökad ansvarsförsäkring för högriskuppdrag
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Personalutbildning</p>
                  <p className="text-xs text-muted-foreground">
                    Fokusera på säkerhetsrutiner och kundkommunikation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Fordonsunderhåll</p>
                  <p className="text-xs text-muted-foreground">
                    Schemalägg förebyggande service för äldre fordon
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Övervaka KPI:er</p>
                  <p className="text-xs text-muted-foreground">
                    Sätt upp varningar för avvikande riskindikatorer
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button>
          Generera Riskrapport
        </Button>
        <Button variant="outline">
          Exportera Data
        </Button>
        <Button variant="outline">
          Konfigurera Varningar
        </Button>
      </div>
    </div>
  );
}