'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap,
  Rocket,
  Shield,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Sparkles,
  PlayCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  impact: string;
  duration: string;
  status: 'ready' | 'processing' | 'completed' | 'scheduled';
  automationLevel: 'full' | 'partial' | 'manual';
  category: 'revenue' | 'defense' | 'growth' | 'maintenance';
}

const OneClickActions: React.FC = () => {
  const [actions, setActions] = useState<QuickAction[]>([
    {
      id: '1',
      title: 'Boost för helgen',
      description: 'Öka synlighet för "akut flytt" och "helgflytt" inför helgen',
      icon: <Rocket className="h-5 w-5" />,
      impact: '+45 000 kr',
      duration: '5 min',
      status: 'ready',
      automationLevel: 'full',
      category: 'revenue'
    },
    {
      id: '2',
      title: 'Försvara position #3',
      description: 'Konkurrent närmar sig. Stärk position för "flyttfirma stockholm"',
      icon: <Shield className="h-5 w-5" />,
      impact: 'Behåll 125 000 kr/mån',
      duration: '15 min',
      status: 'ready',
      automationLevel: 'full',
      category: 'defense'
    },
    {
      id: '3',
      title: 'Svara på recensioner',
      description: '5 nya recensioner väntar. AI genererar personliga svar',
      icon: <TrendingUp className="h-5 w-5" />,
      impact: '+35 000 kr/mån',
      duration: '10 min',
      status: 'ready',
      automationLevel: 'partial',
      category: 'growth'
    },
    {
      id: '4',
      title: 'Veckounderhåll',
      description: 'Uppdatera priser, kontrollera länkar, optimera hastighet',
      icon: <RefreshCw className="h-5 w-5" />,
      impact: 'Förebyggande',
      duration: '20 min',
      status: 'scheduled',
      automationLevel: 'full',
      category: 'maintenance'
    }
  ]);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (actionId: string) => {
    setProcessingId(actionId);
    
    // Update status to processing
    setActions(prev => 
      prev.map(action => 
        action.id === actionId 
          ? { ...action, status: 'processing' as const }
          : action
      )
    );

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update status to completed
    setActions(prev => 
      prev.map(action => 
        action.id === actionId 
          ? { ...action, status: 'completed' as const }
          : action
      )
    );

    setProcessingId(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue': return 'bg-green-100 text-green-800 border-green-300';
      case 'defense': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'growth': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'maintenance': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusButton = (action: QuickAction) => {
    switch (action.status) {
      case 'completed':
        return (
          <Button size="sm" variant="outline" disabled>
            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            Klart
          </Button>
        );
      case 'processing':
        return (
          <Button size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            Kör...
          </Button>
        );
      case 'scheduled':
        return (
          <Button size="sm" variant="outline">
            <Clock className="h-4 w-4 mr-1" />
            Schemalagd
          </Button>
        );
      default:
        return (
          <Button 
            size="sm"
            onClick={() => handleAction(action.id)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <PlayCircle className="h-4 w-4 mr-1" />
            Kör nu
          </Button>
        );
    }
  };

  const completedCount = actions.filter(a => a.status === 'completed').length;
  const totalImpact = actions
    .filter(a => a.status === 'completed' && a.impact.includes('kr'))
    .reduce((sum, action) => {
      const amount = parseInt(action.impact.replace(/[^\d]/g, '')) || 0;
      return sum + amount;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-600" />
                Ett-klicks-åtgärder
              </CardTitle>
              <CardDescription>
                Kraftfulla optimeringar med ett enda klick
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-900">
                {formatCurrency(totalImpact)}
              </p>
              <p className="text-sm text-indigo-700">påverkan idag</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Progress value={(completedCount / actions.length) * 100} className="w-32" />
              <span className="text-sm text-gray-600">
                {completedCount} av {actions.length} klara
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => actions.filter(a => a.status === 'ready').forEach(a => handleAction(a.id))}
              disabled={processingId !== null || actions.every(a => a.status !== 'ready')}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Kör alla
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => (
          <Card 
            key={action.id}
            className={`transition-all hover:shadow-lg ${
              action.status === 'completed' ? 'opacity-75' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(action.category)}`}>
                    {action.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {action.impact}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {action.duration}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {action.automationLevel === 'full' ? '100% Auto' : 
                   action.automationLevel === 'partial' ? 'Semi-auto' : 'Manuell'}
                </Badge>
              </div>
              
              {getStatusButton(action)}
              
              {action.status === 'processing' && (
                <div className="mt-3">
                  <Progress value={33} className="h-1" />
                  <p className="text-xs text-gray-600 mt-1">Optimerar...</p>
                </div>
              )}
              
              {action.status === 'completed' && (
                <Alert className="mt-3 bg-green-50 border-green-200">
                  <CheckCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    Klart! Effekten syns inom 24-48 timmar.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Alert */}
      <Alert className="bg-purple-50 border-purple-200">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <AlertDescription>
          <strong>AI-tips:</strong> Kör "Boost för helgen" på torsdagar för bäst effekt. 
          Veckounderhåll körs automatiskt varje måndag om du inte gör det manuellt.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Helper function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default OneClickActions;