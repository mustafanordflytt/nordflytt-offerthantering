'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  CheckCircle,
  TrendingUp,
  Shield,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Clock,
  ChevronRight
} from 'lucide-react';

interface Suggestion {
  id: number;
  text: string;
  impact: string;
  confidence: string;
  action: string;
  platform?: string;
  type: 'revenue' | 'protection' | 'optimization';
  processing?: boolean;
  completed?: boolean;
}

const AIStrategySuggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: 1,
      text: 'Öka Google budget +15k för +28k profit',
      impact: '+28k profit',
      confidence: '94%',
      action: 'budget_increase',
      platform: 'google',
      type: 'revenue',
      processing: false,
      completed: false
    },
    {
      id: 2,
      text: 'Blockera MovingStockholm IP (sparar 2k/dag)',
      impact: '2k/dag sparat',
      confidence: '99%',
      action: 'fraud_protection',
      type: 'protection',
      processing: false,
      completed: false
    }
  ]);

  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleApprove = async (suggestion: Suggestion) => {
    setProcessingId(suggestion.id);
    setSuggestions(prev => 
      prev.map(s => s.id === suggestion.id ? { ...s, processing: true } : s)
    );

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSuggestions(prev => 
      prev.map(s => s.id === suggestion.id 
        ? { ...s, processing: false, completed: true } 
        : s
      )
    );
    setProcessingId(null);

    // Generate new suggestion after 3 seconds
    setTimeout(() => {
      generateNewSuggestion(suggestion.id);
    }, 3000);
  };

  const generateNewSuggestion = (replacedId: number) => {
    const newSuggestions = [
      {
        id: Date.now(),
        text: 'Aktivera helgboost för Östermalm (+18k)',
        impact: '+18k helgprofit',
        confidence: '87%',
        action: 'weekend_boost',
        platform: 'meta',
        type: 'revenue' as const,
        processing: false,
        completed: false
      },
      {
        id: Date.now(),
        text: 'Pausa underpresterande Facebook-annonser',
        impact: '5k/dag besparing',
        confidence: '92%',
        action: 'pause_ads',
        platform: 'meta',
        type: 'optimization' as const,
        processing: false,
        completed: false
      },
      {
        id: Date.now(),
        text: 'Ny konkurrent detekterad - aktivera försvar',
        impact: 'Skydda 45k/mån',
        confidence: '96%',
        action: 'competitor_defense',
        type: 'protection' as const,
        processing: false,
        completed: false
      }
    ];

    const randomSuggestion = newSuggestions[Math.floor(Math.random() * newSuggestions.length)];
    
    setSuggestions(prev => 
      prev.map(s => s.id === replacedId ? randomSuggestion : s)
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'protection': return <Shield className="h-5 w-5 text-blue-600" />;
      case 'optimization': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default: return <Brain className="h-5 w-5 text-purple-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'revenue': return 'bg-green-100 text-green-800 border-green-300';
      case 'protection': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'optimization': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Brain className="h-6 w-6 text-purple-600" />
          AI Rekommenderar
        </CardTitle>
        <CardDescription>
          Maximal profit med minimal ansträngning - bara godkänn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              className={`suggestion-item border-2 rounded-lg p-4 transition-all ${
                suggestion.completed 
                  ? 'bg-gray-50 border-gray-200 opacity-60' 
                  : `bg-white ${getTypeColor(suggestion.type)} hover:shadow-md`
              }`}
            >
              {suggestion.completed ? (
                // Completed State
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-600 line-through">{suggestion.text}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Genomfört ✓
                  </Badge>
                </div>
              ) : suggestion.processing ? (
                // Processing State
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{suggestion.text}</span>
                    <Badge variant="outline" className="animate-pulse">
                      Implementerar...
                    </Badge>
                  </div>
                  <Progress value={66} className="h-2" />
                  <p className="text-sm text-gray-600">AI optimerar kampanjer...</p>
                </div>
              ) : (
                // Normal State
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getTypeIcon(suggestion.type)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">
                        {suggestion.text}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-600">{suggestion.impact}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-purple-600" />
                          <span className="text-gray-600">Säkerhet: {suggestion.confidence}</span>
                        </div>
                        {suggestion.platform && (
                          <Badge variant="outline" className="text-xs">
                            {suggestion.platform}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleApprove(suggestion)}
                    className="ml-4 bg-green-600 hover:bg-green-700 text-white font-bold"
                    size="default"
                  >
                    ✅ GODKÄNN
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Learning Note */}
        <div className="mt-6 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-purple-900 font-medium">AI lär sig kontinuerligt</p>
              <p className="text-xs text-purple-700 mt-1">
                Analyserar 1000+ datapunkter per minut från Google, Meta och konkurrenter
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIStrategySuggestions;