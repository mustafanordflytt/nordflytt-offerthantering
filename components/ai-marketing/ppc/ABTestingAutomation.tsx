'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FlaskConical,
  TrendingUp,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Award,
  AlertTriangle,
  Zap,
  Brain,
  Target,
  Users,
  DollarSign,
  Activity,
  ChevronRight
} from 'lucide-react';

interface TestVariant {
  id: string;
  name: string;
  type: 'control' | 'variant';
  changes: string[];
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    conversionRate: number;
    costPerConversion: number;
    roas: number;
  };
  confidence: number;
  status: 'running' | 'paused' | 'winner' | 'loser' | 'inconclusive';
  allocation: number; // Traffic allocation percentage
}

interface ActiveTest {
  id: string;
  name: string;
  platform: string;
  campaign: string;
  hypothesis: string;
  startDate: Date;
  duration: number; // days
  minSampleSize: number;
  currentSampleSize: number;
  variants: TestVariant[];
  status: 'setup' | 'running' | 'complete' | 'paused';
  winner?: string;
  improvement?: number;
  statisticalSignificance?: number;
}

interface TestTemplate {
  id: string;
  name: string;
  description: string;
  avgImprovement: number;
  successRate: number;
  category: string;
}

const ABTestingAutomation: React.FC = () => {
  const [activeTests, setActiveTests] = useState<ActiveTest[]>([
    {
      id: '1',
      name: 'Urgency vs Trust Headlines',
      platform: 'Google Ads',
      campaign: 'Stockholm Vinterflyttar',
      hypothesis: 'Brådskande rubriker ger högre CTR än förtroendebyggande',
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      duration: 14,
      minSampleSize: 1000,
      currentSampleSize: 856,
      status: 'running',
      variants: [
        {
          id: 'control',
          name: 'Förtroende-fokus',
          type: 'control',
          changes: ['Stockholms mest anlitade', 'Försäkrat & tryggt'],
          metrics: {
            impressions: 4280,
            clicks: 145,
            ctr: 3.39,
            conversions: 12,
            conversionRate: 8.28,
            costPerConversion: 125,
            roas: 3.8
          },
          confidence: 0,
          status: 'running',
          allocation: 50
        },
        {
          id: 'variant1',
          name: 'Brådska-fokus',
          type: 'variant',
          changes: ['Ring nu - vi kommer idag', 'Akut flytt inom 2h'],
          metrics: {
            impressions: 4312,
            clicks: 189,
            ctr: 4.38,
            conversions: 18,
            conversionRate: 9.52,
            costPerConversion: 98,
            roas: 4.9
          },
          confidence: 87,
          status: 'running',
          allocation: 50
        }
      ]
    },
    {
      id: '2',
      name: 'RUT-avdrag vs Pris-fokus',
      platform: 'Meta Ads',
      campaign: 'Facebook Carousel',
      hypothesis: 'RUT-avdrag kommunikation ger bättre ROI än rabattfokus',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      duration: 7,
      minSampleSize: 500,
      currentSampleSize: 623,
      status: 'complete',
      winner: 'variant1',
      improvement: 34,
      statisticalSignificance: 95,
      variants: [
        {
          id: 'control',
          name: 'Rabatt-fokus',
          type: 'control',
          changes: ['30% rabatt denna vecka', 'Spara 5000 kr'],
          metrics: {
            impressions: 8920,
            clicks: 234,
            ctr: 2.62,
            conversions: 8,
            conversionRate: 3.42,
            costPerConversion: 312,
            roas: 2.1
          },
          confidence: 0,
          status: 'loser',
          allocation: 50
        },
        {
          id: 'variant1',
          name: 'RUT-fokus',
          type: 'variant',
          changes: ['50% RUT-avdrag direkt', 'Halva priset med RUT'],
          metrics: {
            impressions: 8854,
            clicks: 298,
            ctr: 3.37,
            conversions: 14,
            conversionRate: 4.70,
            costPerConversion: 178,
            roas: 3.6
          },
          confidence: 95,
          status: 'winner',
          allocation: 50
        }
      ]
    }
  ]);

  const [testTemplates] = useState<TestTemplate[]>([
    {
      id: '1',
      name: 'Headline Emotion Test',
      description: 'Testa känslomässiga vs rationella rubriker',
      avgImprovement: 23,
      successRate: 78,
      category: 'Copy'
    },
    {
      id: '2',
      name: 'CTA Button Variations',
      description: 'Optimera call-to-action knappar',
      avgImprovement: 18,
      successRate: 82,
      category: 'Design'
    },
    {
      id: '3',
      name: 'Landing Page Speed',
      description: 'Testa olika sidladdningstider',
      avgImprovement: 31,
      successRate: 91,
      category: 'Technical'
    },
    {
      id: '4',
      name: 'Audience Segmentation',
      description: 'Testa olika målgruppssegment',
      avgImprovement: 28,
      successRate: 85,
      category: 'Targeting'
    }
  ]);

  const [isCreatingTest, setIsCreatingTest] = useState(false);

  // Simulate test progress
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTests(prev => prev.map(test => {
        if (test.status === 'running' && test.currentSampleSize < test.minSampleSize) {
          const newSampleSize = Math.min(
            test.currentSampleSize + Math.floor(Math.random() * 50) + 20,
            test.minSampleSize
          );
          
          // Update variant metrics
          const updatedVariants = test.variants.map(variant => ({
            ...variant,
            metrics: {
              ...variant.metrics,
              impressions: variant.metrics.impressions + Math.floor(Math.random() * 100) + 50,
              clicks: variant.metrics.clicks + Math.floor(Math.random() * 5) + 2
            }
          }));

          // Check if test should complete
          if (newSampleSize >= test.minSampleSize) {
            const winner = updatedVariants.reduce((best, variant) => 
              variant.metrics.roas > best.metrics.roas ? variant : best
            );
            
            return {
              ...test,
              currentSampleSize: newSampleSize,
              variants: updatedVariants,
              status: 'complete',
              winner: winner.id,
              improvement: Math.round(((winner.metrics.roas - updatedVariants[0].metrics.roas) / updatedVariants[0].metrics.roas) * 100),
              statisticalSignificance: 95
            };
          }

          return {
            ...test,
            currentSampleSize: newSampleSize,
            variants: updatedVariants
          };
        }
        return test;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateTest = () => {
    setIsCreatingTest(true);
    setTimeout(() => {
      const newTest: ActiveTest = {
        id: Date.now().toString(),
        name: 'Ny Stockholm-område test',
        platform: 'Google Ads',
        campaign: 'Lokal sökkampanj',
        hypothesis: 'Områdesspecifika annonser ger högre konvertering',
        startDate: new Date(),
        duration: 7,
        minSampleSize: 500,
        currentSampleSize: 0,
        status: 'setup',
        variants: [
          {
            id: 'control',
            name: 'Generisk Stockholm',
            type: 'control',
            changes: ['Flyttfirma Stockholm'],
            metrics: {
              impressions: 0,
              clicks: 0,
              ctr: 0,
              conversions: 0,
              conversionRate: 0,
              costPerConversion: 0,
              roas: 0
            },
            confidence: 0,
            status: 'running',
            allocation: 50
          },
          {
            id: 'variant1',
            name: 'Specifikt område',
            type: 'variant',
            changes: ['Flyttfirma Östermalm'],
            metrics: {
              impressions: 0,
              clicks: 0,
              ctr: 0,
              conversions: 0,
              conversionRate: 0,
              costPerConversion: 0,
              roas: 0
            },
            confidence: 0,
            status: 'running',
            allocation: 50
          }
        ]
      };
      setActiveTests(prev => [newTest, ...prev]);
      setIsCreatingTest(false);
    }, 2000);
  };

  const handlePauseTest = (testId: string) => {
    setActiveTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status: 'paused' } : test
    ));
  };

  const handleResumeTest = (testId: string) => {
    setActiveTests(prev => prev.map(test => 
      test.id === testId ? { ...test, status: 'running' } : test
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <FlaskConical className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">A/B Test Automation</CardTitle>
                <CardDescription>
                  Kontinuerlig testning för optimal prestanda
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleCreateTest} disabled={isCreatingTest}>
              {isCreatingTest ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Skapar test...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Nytt test
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Aktiva tester</p>
              <p className="text-2xl font-bold">
                {activeTests.filter(t => t.status === 'running').length}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Avslutade</p>
              <p className="text-2xl font-bold">
                {activeTests.filter(t => t.status === 'complete').length}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Genomsnitt förbättring</p>
              <p className="text-2xl font-bold text-green-600">+27%</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">Sparad tid/vecka</p>
              <p className="text-2xl font-bold">18h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Tests */}
      <div className="space-y-4">
        {activeTests.map((test) => (
          <Card key={test.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {test.name}
                    {test.status === 'running' && (
                      <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
                    )}
                    {test.status === 'complete' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {test.platform} • {test.campaign}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {test.status === 'complete' && test.improvement && (
                    <Badge className="bg-green-100 text-green-800">
                      +{test.improvement}% förbättring
                    </Badge>
                  )}
                  {test.status === 'running' ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handlePauseTest(test.id)}
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pausa
                    </Button>
                  ) : test.status === 'paused' ? (
                    <Button 
                      size="sm"
                      onClick={() => handleResumeTest(test.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Återuppta
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hypothesis */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Hypotes:</p>
                <p className="text-sm text-gray-700">{test.hypothesis}</p>
              </div>

              {/* Progress */}
              {test.status !== 'complete' && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Test progress</span>
                    <span>{test.currentSampleSize} / {test.minSampleSize} samples</span>
                  </div>
                  <Progress 
                    value={(test.currentSampleSize / test.minSampleSize) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Variants */}
              <div className="space-y-3">
                {test.variants.map((variant) => (
                  <div 
                    key={variant.id}
                    className={`p-4 rounded-lg border ${
                      variant.id === test.winner ? 'border-green-500 bg-green-50' :
                      variant.status === 'loser' ? 'border-gray-300 bg-gray-50' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{variant.name}</h4>
                        {variant.type === 'control' && (
                          <Badge variant="outline">Kontroll</Badge>
                        )}
                        {variant.id === test.winner && (
                          <Badge className="bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Vinnare
                          </Badge>
                        )}
                      </div>
                      <span className="text-2xl font-bold">{variant.metrics.roas}x</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">CTR</p>
                        <p className="font-semibold">{variant.metrics.ctr}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Conv. Rate</p>
                        <p className="font-semibold">{variant.metrics.conversionRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CPA</p>
                        <p className="font-semibold">{formatCurrency(variant.metrics.costPerConversion)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Konf.</p>
                        <p className="font-semibold">{variant.confidence}%</p>
                      </div>
                    </div>

                    {variant.changes.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        Ändringar: {variant.changes.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Statistical Significance */}
              {test.status === 'complete' && test.statisticalSignificance && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Test avslutat!</strong> {test.statisticalSignificance}% statistisk säkerhet. 
                    Vinnaren implementeras automatiskt i alla kampanjer.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Test-mallar
          </CardTitle>
          <CardDescription>
            Förkonfigurerade tester baserade på branschens bästa praxis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testTemplates.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      {template.avgImprovement}% snitt
                    </span>
                    <span>
                      <Target className="h-3 w-3 inline mr-1" />
                      {template.successRate}% framgång
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    Använd
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ABTestingAutomation;