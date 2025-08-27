'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe,
  Facebook,
  Linkedin,
  Search,
  TrendingUp,
  DollarSign,
  Users,
  Zap,
  RefreshCw,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Settings,
  BarChart3,
  Target,
  Brain,
  Sparkles
} from 'lucide-react';

interface PlatformData {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'active' | 'paused' | 'optimizing' | 'setup';
  budget: number;
  spent: number;
  roas: number;
  clicks: number;
  conversions: number;
  cpc: number;
  campaigns: number;
  optimization: {
    status: 'idle' | 'running' | 'complete';
    improvements: string[];
    potentialGain: number;
  };
}

interface BudgetOptimization {
  platform: string;
  currentBudget: number;
  suggestedBudget: number;
  reason: string;
  expectedROAS: number;
  confidence: number;
}

const MultiPlatformManager: React.FC = () => {
  const [platforms, setPlatforms] = useState<PlatformData[]>([
    {
      id: 'google',
      name: 'Google Ads',
      icon: <Search className="h-5 w-5" />,
      status: 'active',
      budget: 50000,
      spent: 42350,
      roas: 4.2,
      clicks: 2847,
      conversions: 89,
      cpc: 14.87,
      campaigns: 12,
      optimization: {
        status: 'idle',
        improvements: ['Keyword expansion', 'Bid optimization', 'Ad copy refresh'],
        potentialGain: 15
      }
    },
    {
      id: 'meta',
      name: 'Meta (Facebook & Instagram)',
      icon: <Facebook className="h-5 w-5" />,
      status: 'active',
      budget: 35000,
      spent: 28900,
      roas: 2.8,
      clicks: 4521,
      conversions: 67,
      cpc: 6.39,
      campaigns: 8,
      optimization: {
        status: 'idle',
        improvements: ['Audience refinement', 'Creative testing', 'Placement optimization'],
        potentialGain: 22
      }
    },
    {
      id: 'bing',
      name: 'Microsoft Advertising',
      icon: <Globe className="h-5 w-5" />,
      status: 'active',
      budget: 15000,
      spent: 11200,
      roas: 5.1,
      clicks: 987,
      conversions: 34,
      cpc: 11.35,
      campaigns: 5,
      optimization: {
        status: 'idle',
        improvements: ['Import Google campaigns', 'LinkedIn targeting'],
        potentialGain: 18
      }
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Ads',
      icon: <Linkedin className="h-5 w-5" />,
      status: 'setup',
      budget: 10000,
      spent: 0,
      roas: 0,
      clicks: 0,
      conversions: 0,
      cpc: 0,
      campaigns: 0,
      optimization: {
        status: 'idle',
        improvements: ['B2B targeting ready', 'Company moves focus'],
        potentialGain: 45
      }
    }
  ]);

  const [budgetOptimizations, setBudgetOptimizations] = useState<BudgetOptimization[]>([
    {
      platform: 'Google Ads',
      currentBudget: 50000,
      suggestedBudget: 65000,
      reason: 'High ROAS + untapped keywords',
      expectedROAS: 4.8,
      confidence: 92
    },
    {
      platform: 'Meta',
      currentBudget: 35000,
      suggestedBudget: 28000,
      reason: 'Lower performance, shift to Google',
      expectedROAS: 3.2,
      confidence: 87
    },
    {
      platform: 'LinkedIn',
      currentBudget: 10000,
      suggestedBudget: 17000,
      reason: 'Untapped B2B opportunity',
      expectedROAS: 3.4,
      confidence: 78
    }
  ]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [totalBudget] = useState(110000);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'optimizing': return 'bg-blue-100 text-blue-800';
      case 'setup': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOptimizePlatform = (platformId: string) => {
    setPlatforms(prev => 
      prev.map(p => 
        p.id === platformId 
          ? { ...p, optimization: { ...p.optimization, status: 'running' } }
          : p
      )
    );

    // Simulate optimization
    setTimeout(() => {
      setPlatforms(prev => 
        prev.map(p => 
          p.id === platformId 
            ? { 
                ...p, 
                roas: p.roas * 1.15,
                optimization: { ...p.optimization, status: 'complete' } 
              }
            : p
        )
      );
    }, 3000);
  };

  const handleApplyBudgetOptimization = () => {
    setIsOptimizing(true);
    
    // Simulate applying optimizations
    setTimeout(() => {
      setPlatforms(prev => {
        const optimizationMap = new Map(
          budgetOptimizations.map(opt => [
            opt.platform.toLowerCase().includes('google') ? 'google' : 
            opt.platform.toLowerCase().includes('meta') ? 'meta' :
            opt.platform.toLowerCase().includes('linkedin') ? 'linkedin' : '',
            opt.suggestedBudget
          ])
        );

        return prev.map(p => ({
          ...p,
          budget: optimizationMap.get(p.id) || p.budget
        }));
      });
      setIsOptimizing(false);
    }, 2000);
  };

  const totalSpent = platforms.reduce((sum, p) => sum + p.spent, 0);
  const totalRevenue = platforms.reduce((sum, p) => sum + (p.spent * p.roas), 0);
  const overallROAS = totalRevenue / totalSpent;

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Multi-Platform Command Center</CardTitle>
              <CardDescription>
                Centraliserad kontroll över alla annonsplattformar
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total ROAS</p>
              <p className="text-3xl font-bold text-purple-900">{overallROAS.toFixed(2)}x</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-600">Total budget</p>
              <p className="text-xl font-bold">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-600">Spenderat</p>
              <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-600">Intäkter</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-600">Konverteringar</p>
              <p className="text-xl font-bold">{platforms.reduce((sum, p) => sum + p.conversions, 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <Card key={platform.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {platform.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(platform.status)}>
                        {platform.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {platform.campaigns} kampanjer
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{platform.roas}x</p>
                  <p className="text-sm text-gray-600">ROAS</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Budget Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Budget utnyttjande</span>
                  <span>{formatCurrency(platform.spent)} / {formatCurrency(platform.budget)}</span>
                </div>
                <Progress value={(platform.spent / platform.budget) * 100} className="h-2" />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Klick</p>
                  <p className="font-bold">{platform.clicks.toLocaleString('sv-SE')}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Conv.</p>
                  <p className="font-bold">{platform.conversions}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">CPC</p>
                  <p className="font-bold">{formatCurrency(platform.cpc)}</p>
                </div>
              </div>

              {/* Optimization Status */}
              {platform.optimization.status === 'idle' && platform.status === 'active' && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    AI-förbättringar tillgängliga
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1 mb-3">
                    {platform.optimization.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {imp}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-700">
                      +{platform.optimization.potentialGain}% potential
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleOptimizePlatform(platform.id)}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Optimera nu
                    </Button>
                  </div>
                </div>
              )}

              {platform.optimization.status === 'running' && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
                    <span className="text-sm font-medium text-yellow-900">
                      AI optimerar kampanjer...
                    </span>
                  </div>
                </div>
              )}

              {platform.optimization.status === 'complete' && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Optimering klar! ROAS förbättrad.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-3 w-3 mr-1" />
                  Inställningar
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Detaljerad analys
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Optimization Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Budget-optimering
              </CardTitle>
              <CardDescription>
                Omfördela budget för maximal avkastning
              </CardDescription>
            </div>
            <Button 
              onClick={handleApplyBudgetOptimization}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Optimerar...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Tillämpa alla
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetOptimizations.map((opt, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{opt.platform}</h4>
                  <Badge variant="outline" className="text-xs">
                    {opt.confidence}% säkerhet
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nuvarande budget</p>
                    <p className="font-bold">{formatCurrency(opt.currentBudget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Föreslagen budget</p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{formatCurrency(opt.suggestedBudget)}</p>
                      {opt.suggestedBudget > opt.currentBudget ? (
                        <ArrowUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Förväntad ROAS</p>
                    <p className="font-bold text-green-600">{opt.expectedROAS}x</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Anledning:</strong> {opt.reason}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiPlatformManager;