'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Zap,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface PerformanceMetrics {
  automation_rate: number;
  ai_accuracy: number;
  roi_percent: number;
  efficiency_gain: number;
  timestamp: string;
}

export function AIPerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch('/api/ai/performance-metrics');
        if (!response.ok) throw new Error('Failed to load metrics');
        
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load AI metrics:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadMetrics();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricBgColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'bg-green-50';
    if (value >= threshold * 0.7) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            AI System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Activity className="h-8 w-8 text-purple-600 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-30" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            AI System Performance
          </CardTitle>
          <Badge variant="outline" className="bg-white">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Automation Rate */}
          <div className={`p-4 rounded-lg ${getMetricBgColor(metrics.automation_rate, 90)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Automatisering</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Mål: 92%
              </Badge>
            </div>
            <div className={`text-3xl font-bold ${getMetricColor(metrics.automation_rate, 90)}`}>
              {metrics.automation_rate}%
            </div>
            <Progress value={metrics.automation_rate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              av alla processer automatiserade
            </p>
          </div>

          {/* AI Accuracy */}
          <div className={`p-4 rounded-lg ${getMetricBgColor(metrics.ai_accuracy, 95)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">AI Precision</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Mål: 96%
              </Badge>
            </div>
            <div className={`text-3xl font-bold ${getMetricColor(metrics.ai_accuracy, 95)}`}>
              {metrics.ai_accuracy}%
            </div>
            <Progress value={metrics.ai_accuracy} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              träffsäkerhet i beslut
            </p>
          </div>

          {/* ROI */}
          <div className={`p-4 rounded-lg ${getMetricBgColor(metrics.roi_percent, 100)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">ROI</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Mål: 2385%
              </Badge>
            </div>
            <div className={`text-3xl font-bold ${getMetricColor(metrics.roi_percent, 100)}`}>
              {metrics.roi_percent}%
            </div>
            <Progress value={Math.min(metrics.roi_percent / 25, 100)} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              avkastning på AI-investering
            </p>
          </div>

          {/* Efficiency Gain */}
          <div className={`p-4 rounded-lg ${getMetricBgColor(metrics.efficiency_gain, 40)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Effektivitet</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Mål: 41%
              </Badge>
            </div>
            <div className={`text-3xl font-bold ${getMetricColor(metrics.efficiency_gain, 40)}`}>
              +{metrics.efficiency_gain}%
            </div>
            <Progress value={Math.min(metrics.efficiency_gain * 2.5, 100)} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              förbättrad produktivitet
            </p>
          </div>
        </div>

        {/* AI System Status */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="h-10 w-10 text-purple-600" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold">AI System Status</h4>
                <p className="text-sm text-muted-foreground">Aktivt & Lärande</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Beslut idag</p>
              <p className="text-2xl font-bold text-purple-600">847</p>
            </div>
          </div>
        </div>

        {/* Key Achievements */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dagens höjdpunkter
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>312 jobb automatiskt schemalagda</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>€12,450 i optimerade priser</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>45 minuter → 3.5 minuter processtid</span>
            </div>
          </div>
        </div>

        {/* Update Status */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-purple-600" />
            <span className="text-xs text-muted-foreground">
              Realtidsövervakning aktiv
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Uppdateras var 30:e sekund
          </span>
        </div>
      </CardContent>
    </Card>
  );
}