'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles,
  TrendingUp,
  DollarSign,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  Brain,
  Target,
  ArrowUp,
  Play,
  Pause,
  MessageSquare,
  RefreshCw,
  Info
} from 'lucide-react';

interface AIRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  title: string;
  impact: string;
  timeToComplete: string;
  autoFixAvailable: boolean;
  completed: boolean;
}

interface PerformanceMetric {
  label: string;
  value: string;
  trend: number;
  status: 'good' | 'warning' | 'critical';
}

const SEOStockholmSimplified: React.FC = () => {
  const [aiMode, setAiMode] = useState<'auto' | 'assisted' | 'manual'>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAIAction, setLastAIAction] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Simplified metrics - only what matters
  const keyMetrics: PerformanceMetric[] = [
    {
      label: 'Nya kunder från Google',
      value: '12 st',
      trend: +33,
      status: 'good'
    },
    {
      label: 'Intäkter från SEO',
      value: '248 500 kr',
      trend: +18,
      status: 'good'
    },
    {
      label: 'Din position',
      value: '#3',
      trend: +2,
      status: 'warning'
    }
  ];

  // AI-prioritized recommendations
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([
    {
      id: '1',
      priority: 'critical',
      title: 'Svara på 5 nya recensioner',
      impact: '+35 000 kr/mån',
      timeToComplete: '15 min',
      autoFixAvailable: true,
      completed: false
    },
    {
      id: '2',
      priority: 'high',
      title: 'Ta position #1 för "Flyttfirma Stockholm"',
      impact: '+125 000 kr/mån',
      timeToComplete: '2 dagar',
      autoFixAvailable: true,
      completed: false
    },
    {
      id: '3',
      priority: 'medium',
      title: 'Optimera för vårsäsongen',
      impact: '+85 000 kr',
      timeToComplete: '1 vecka',
      autoFixAvailable: true,
      completed: false
    }
  ]);

  const handleAutoFix = async (id: string) => {
    setIsProcessing(true);
    setLastAIAction(`Fixar: ${recommendations.find(r => r.id === id)?.title}`);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, completed: true } : rec
      )
    );
    setIsProcessing(false);
    setLastAIAction(null);
  };

  const handleFixAll = async () => {
    setIsProcessing(true);
    setLastAIAction('AI optimerar allt automatiskt...');
    
    for (const rec of recommendations.filter(r => !r.completed && r.autoFixAvailable)) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setRecommendations(prev => 
        prev.map(r => 
          r.id === rec.id ? { ...r, completed: true } : r
        )
      );
    }
    
    setIsProcessing(false);
    setLastAIAction(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <Zap className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Target className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* AI Control Center */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>AI SEO Assistent</CardTitle>
                <CardDescription>
                  {aiMode === 'auto' 
                    ? 'AI sköter allt automatiskt' 
                    : aiMode === 'assisted'
                    ? 'AI föreslår, du godkänner'
                    : 'Manuell kontroll'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={aiMode === 'auto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAiMode('auto')}
                className="min-w-[80px]"
              >
                <Play className="h-3 w-3 mr-1" />
                Auto
              </Button>
              <Button
                variant={aiMode === 'assisted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAiMode('assisted')}
                className="min-w-[80px]"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Assist
              </Button>
              <Button
                variant={aiMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAiMode('manual')}
                className="min-w-[80px]"
              >
                <Pause className="h-3 w-3 mr-1" />
                Manuell
              </Button>
            </div>
          </div>
        </CardHeader>
        {isProcessing && (
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
              <RefreshCw className="h-5 w-5 text-purple-600 animate-spin" />
              <span className="text-sm font-medium">{lastAIAction}</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Simplified Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {keyMetrics.map((metric, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              expandedCard === metric.label ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setExpandedCard(expandedCard === metric.label ? null : metric.label)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{metric.label}</span>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.trend > 0 ? '+' : ''}{metric.trend}%
                </Badge>
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
              {metric.trend > 0 && (
                <ArrowUp className="h-4 w-4 text-green-600 mt-2" />
              )}
              
              {expandedCard === metric.label && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    {metric.label === 'Nya kunder från Google' && 
                      'AI har optimerat för lokala sökningar vilket ger fler kvalificerade leads.'}
                    {metric.label === 'Intäkter från SEO' && 
                      'Automatiska optimeringar har ökat konverteringsgraden med 18%.'}
                    {metric.label === 'Din position' && 
                      'Du är nära toppen! AI arbetar på att ta position #1.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Recommendations - Ultra Simple */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                Vad behöver göras?
              </CardTitle>
              <CardDescription>
                AI har prioriterat det viktigaste för maximal intäkt
              </CardDescription>
            </div>
            {aiMode === 'auto' && recommendations.some(r => !r.completed && r.autoFixAvailable) && (
              <Button 
                onClick={handleFixAll}
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <Zap className="h-4 w-4 mr-2" />
                Fixa allt automatiskt
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className={`border rounded-lg p-4 transition-all ${
                  rec.completed 
                    ? 'bg-gray-50 opacity-60' 
                    : 'hover:shadow-md cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {rec.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      getPriorityIcon(rec.priority)
                    )}
                    <div className="flex-1">
                      <h4 className={`font-medium ${rec.completed ? 'line-through' : ''}`}>
                        {rec.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-green-600 font-medium">
                          {rec.impact}
                        </span>
                        <span className="text-sm text-gray-500">
                          {rec.timeToComplete}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!rec.completed && (
                    <div className="ml-4">
                      {aiMode === 'auto' && rec.autoFixAvailable ? (
                        <Badge className="bg-purple-100 text-purple-800">
                          AI fixar detta
                        </Badge>
                      ) : aiMode === 'assisted' && rec.autoFixAvailable ? (
                        <Button 
                          size="sm"
                          onClick={() => handleAutoFix(rec.id)}
                          disabled={isProcessing}
                        >
                          Låt AI fixa
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          Visa hur
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {recommendations.every(r => r.completed) && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Bra jobbat!</strong> Alla kritiska optimeringar är klara. 
                AI övervakar och meddelar när något nytt behöver göras.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Simple Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Månadens framsteg</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Intäktsmål</span>
                <span className="font-medium">72% (1.8M av 2.5M kr)</span>
              </div>
              <Progress value={72} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>SEO-optimeringar</span>
                <span className="font-medium">24 av 30 klara</span>
              </div>
              <Progress value={80} className="h-3" />
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600">
                <strong>AI-prognos:</strong> Med nuvarande takt når vi 2.3M kr denna månad. 
                Aktivera fler automatiseringar för att nå målet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Info */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong>Tips:</strong> I Auto-läge optimerar AI kontinuerligt er synlighet. 
          Du behöver bara granska månadsrapporten. Vill du ha mer kontroll? Växla till Assist-läge.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SEOStockholmSimplified;