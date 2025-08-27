'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, Sparkles, DollarSign, Target } from 'lucide-react';

interface CustomerIntelligenceProps {
  customerId: string;
}

interface AIInsights {
  leadScore: number;
  leadConfidence: number;
  lifetimeValue: number;
  churnRisk: number;
  nextLikelyService: string;
  recommendations: string[];
  segment: string;
  priority: string;
}

export function CustomerIntelligence({ customerId }: CustomerIntelligenceProps) {
  const [intelligence, setIntelligence] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIntelligence() {
      if (!customerId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/ai/customer-intelligence/${customerId}`);
        if (!response.ok) {
          throw new Error('Failed to load AI intelligence');
        }
        
        const data = await response.json();
        setIntelligence(data);
      } catch (error) {
        console.error('Failed to load AI intelligence:', error);
        setError('Kunde inte ladda AI-analys');
      } finally {
        setLoading(false);
      }
    }
    
    loadIntelligence();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadIntelligence, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [customerId]);

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
            AI Kundanalys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Brain className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">AI analyserar kunden...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !intelligence) {
    return (
      <Card className="relative overflow-hidden border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-red-600" />
            AI Kundanalys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error || 'Ingen AI-data tillgänglig'}</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 20) return 'text-green-600';
    if (risk <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    };
    return variants[priority] || 'default';
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Kundanalys
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityBadge(intelligence.priority)}>
              {intelligence.priority === 'high' ? 'Hög prioritet' : 
               intelligence.priority === 'medium' ? 'Medium prioritet' : 'Låg prioritet'}
            </Badge>
            <Badge variant="outline">{intelligence.segment}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Lead Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Lead Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getScoreColor(intelligence.leadScore)}`}>
                {intelligence.leadScore}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
          </div>
          <Progress value={intelligence.leadScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {intelligence.leadConfidence}% säkerhet i bedömningen
          </p>
        </div>

        {/* Lifetime Value */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Livstidsvärde</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(intelligence.lifetimeValue)}
            </p>
          </div>

          {/* Churn Risk */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Churn-risk</span>
            </div>
            <p className={`text-2xl font-bold ${getRiskColor(intelligence.churnRisk)}`}>
              {intelligence.churnRisk}%
            </p>
          </div>
        </div>

        {/* Next Service Prediction */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Nästa troliga tjänst</span>
          </div>
          <Badge variant="secondary" className="text-sm">
            {intelligence.nextLikelyService}
          </Badge>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium">AI Rekommendationer</span>
          </div>
          <div className="space-y-2">
            {intelligence.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Status */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">AI-system aktivt</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Uppdaterad {new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}