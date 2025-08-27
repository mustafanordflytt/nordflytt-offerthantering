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
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Activity,
  Target,
  Clock,
  Sparkles,
  Calculator
} from 'lucide-react';

interface OptimizationOpportunity {
  id: string;
  type: 'shift' | 'increase' | 'decrease' | 'pause';
  from: string;
  to: string;
  amount: number;
  currentROAS: number;
  projectedROAS: number;
  confidence: number;
  reason: string;
  impact: {
    revenue: number;
    conversions: number;
    timeframe: string;
  };
  risk: 'low' | 'medium' | 'high';
}

interface RealtimeMetric {
  platform: string;
  metric: string;
  value: number;
  change: number;
  alert?: string;
}

const BudgetOptimizationEngine: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [lastOptimization, setLastOptimization] = useState(new Date());
  
  const [opportunities, setOpportunities] = useState<OptimizationOpportunity[]>([
    {
      id: '1',
      type: 'shift',
      from: 'Meta Ads',
      to: 'Google Ads',
      amount: 15000,
      currentROAS: 2.8,
      projectedROAS: 4.5,
      confidence: 94,
      reason: 'Google visar 60% högre köpintention för "akut flytt" sökningar',
      impact: {
        revenue: 67500,
        conversions: 18,
        timeframe: '7 dagar'
      },
      risk: 'low'
    },
    {
      id: '2',
      type: 'increase',
      from: 'Total Budget',
      to: 'Bing Ads',
      amount: 8000,
      currentROAS: 5.1,
      projectedROAS: 5.8,
      confidence: 87,
      reason: 'Låg konkurrens på Bing för företagsflyttar, hög ROAS',
      impact: {
        revenue: 46400,
        conversions: 12,
        timeframe: '14 dagar'
      },
      risk: 'low'
    },
    {
      id: '3',
      type: 'pause',
      from: 'Facebook Carousel Ads',
      to: 'Budget Pool',
      amount: 5000,
      currentROAS: 1.2,
      projectedROAS: 0,
      confidence: 96,
      reason: 'Underpresterande i 3 veckor, bättre kreativ behövs',
      impact: {
        revenue: -6000,
        conversions: -2,
        timeframe: 'Omedelbart'
      },
      risk: 'medium'
    }
  ]);

  const [realtimeMetrics] = useState<RealtimeMetric[]>([
    {
      platform: 'Google Ads',
      metric: 'CPC',
      value: 12.50,
      change: -8,
      alert: 'Lägre konkurrens detekterad'
    },
    {
      platform: 'Meta Ads',
      metric: 'CTR',
      value: 1.8,
      change: -15,
      alert: 'Creative fatigue varning'
    },
    {
      platform: 'Bing Ads',
      metric: 'Conv. Rate',
      value: 4.2,
      change: 22,
      alert: 'Outperforming benchmark'
    }
  ]);

  const [optimizationHistory] = useState([
    {
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      action: 'Flyttade 20k från Meta till Google',
      result: '+145k revenue',
      status: 'success'
    },
    {
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      action: 'Ökade Bing budget med 10k',
      result: '+89k revenue',
      status: 'success'
    },
    {
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      action: 'Pausade underpresterande kampanjer',
      result: 'Sparade 35k',
      status: 'success'
    }
  ]);

  // Simulate real-time analysis
  useEffect(() => {
    if (autoMode) {
      const interval = setInterval(() => {
        setIsAnalyzing(true);
        setTimeout(() => {
          setIsAnalyzing(false);
          // Generate new opportunities
          generateNewOpportunities();
        }, 2000);
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoMode]);

  const generateNewOpportunities = () => {
    // In production, this would use real ML algorithms
    const newOpportunity: OptimizationOpportunity = {
      id: Date.now().toString(),
      type: Math.random() > 0.5 ? 'shift' : 'increase',
      from: 'Dynamic Source',
      to: 'High Performing Platform',
      amount: Math.floor(Math.random() * 20000) + 5000,
      currentROAS: 2.5 + Math.random() * 2,
      projectedROAS: 4 + Math.random() * 2,
      confidence: 80 + Math.floor(Math.random() * 20),
      reason: 'AI-detekterad möjlighet baserad på realtidsdata',
      impact: {
        revenue: Math.floor(Math.random() * 100000) + 20000,
        conversions: Math.floor(Math.random() * 30) + 5,
        timeframe: '7-14 dagar'
      },
      risk: 'low'
    };

    setOpportunities(prev => [newOpportunity, ...prev.slice(0, 2)]);
  };

  const handleExecuteOptimization = (opportunity: OptimizationOpportunity) => {
    // In production, this would execute real budget changes
    setOpportunities(prev => prev.filter(o => o.id !== opportunity.id));
    setLastOptimization(new Date());
    
    // Show success message
    alert(`Optimering genomförd! Flyttade ${formatCurrency(opportunity.amount)} från ${opportunity.from} till ${opportunity.to}`);
  };

  const handleExecuteAll = () => {
    // Execute all opportunities
    setIsAnalyzing(true);
    setTimeout(() => {
      setOpportunities([]);
      setLastOptimization(new Date());
      setIsAnalyzing(false);
      alert('Alla optimeringar genomförda! Förväntad ökning: +350,000 kr');
    }, 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const totalPotentialRevenue = opportunities.reduce((sum, opp) => 
    sum + (opp.impact.revenue > 0 ? opp.impact.revenue : 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Control Center */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Brain className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Budget Optimization AI</CardTitle>
                <CardDescription>
                  Realtidsanalys av alla plattformar för maximal ROI
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Potential ökning</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {formatCurrency(totalPotentialRevenue)}
                </p>
              </div>
              <Button
                variant={autoMode ? 'default' : 'outline'}
                onClick={() => setAutoMode(!autoMode)}
              >
                {autoMode ? (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-läge PÅ
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Manuellt läge
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Senaste optimering: {lastOptimization.toLocaleTimeString('sv-SE')}
              </span>
            </div>
            {isAnalyzing && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                <span className="text-sm text-indigo-600">Analyserar...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Realtids-signaler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {realtimeMetrics.map((metric, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{metric.platform}</span>
                  <Badge variant="outline" className="text-xs">
                    {metric.metric}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{metric.value}</span>
                  <div className="flex items-center gap-1">
                    {metric.change > 0 ? (
                      <ArrowUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      metric.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>
                {metric.alert && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {metric.alert}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Opportunities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Budget-optimeringsmöjligheter
            </CardTitle>
            {opportunities.length > 0 && (
              <Button onClick={handleExecuteAll}>
                <Zap className="h-4 w-4 mr-2" />
                Kör alla ({opportunities.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Alla budgetar är optimalt fördelade just nu. AI övervakar kontinuerligt.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div key={opp.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getRiskColor(opp.risk)}>
                          {opp.risk} risk
                        </Badge>
                        <Badge variant="outline">
                          {opp.confidence}% säkerhet
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-lg">
                        {opp.type === 'shift' && `Flytta ${formatCurrency(opp.amount)}`}
                        {opp.type === 'increase' && `Öka med ${formatCurrency(opp.amount)}`}
                        {opp.type === 'decrease' && `Minska med ${formatCurrency(opp.amount)}`}
                        {opp.type === 'pause' && `Pausa och spara ${formatCurrency(opp.amount)}`}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {opp.from} → {opp.to}
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleExecuteOptimization(opp)}
                    >
                      Genomför
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{opp.reason}</p>

                  <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded">
                    <div>
                      <p className="text-xs text-gray-600">ROAS förändring</p>
                      <p className="font-semibold">
                        {opp.currentROAS.toFixed(1)}x → {opp.projectedROAS.toFixed(1)}x
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Intäktseffekt</p>
                      <p className="font-semibold text-green-600">
                        {opp.impact.revenue > 0 ? '+' : ''}{formatCurrency(opp.impact.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Tidsram</p>
                      <p className="font-semibold">{opp.impact.timeframe}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Optimeringshistorik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {optimizationHistory.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{item.action}</p>
                    <p className="text-sm text-gray-600">
                      {item.date.toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {item.result}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetOptimizationEngine;