'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Brain,
  Target,
  Clock,
  Shield,
  Zap,
  DollarSign,
  Users,
  BarChart3,
  Search,
  Facebook,
  ChevronRight
} from 'lucide-react';

interface Competitor {
  name: string;
  marketShare: number;
  adSpend: number;
  avgQuoteTime: string;
  pricingAccuracy: number;
  hasAI: boolean;
  weaknesses: string[];
  keywords: string[];
  channels: {
    google: boolean;
    facebook: boolean;
    instagram: boolean;
    seo: boolean;
  };
}

const competitors: Competitor[] = [
  {
    name: 'MovingStockholm',
    marketShare: 22,
    adSpend: 100000,
    avgQuoteTime: '48-72h',
    pricingAccuracy: 45,
    hasAI: false,
    weaknesses: [
      'No instant pricing',
      'Manual quote process',
      'Poor mobile experience',
      'No tech messaging'
    ],
    keywords: ['flyttfirma stockholm', 'billig flytt stockholm'],
    channels: { google: true, facebook: true, instagram: false, seo: true }
  },
  {
    name: 'Grabbarna Flytt',
    marketShare: 15,
    adSpend: 40000,
    avgQuoteTime: '24-48h',
    pricingAccuracy: 40,
    hasAI: false,
    weaknesses: [
      'Budget positioning only',
      'No quality guarantees',
      'Limited services',
      'Student focus only'
    ],
    keywords: ['billigaste flytt', 'studentflytt stockholm'],
    channels: { google: true, facebook: true, instagram: true, seo: false }
  },
  {
    name: 'Flyttfabriken',
    marketShare: 18,
    adSpend: 80000,
    avgQuoteTime: '48h',
    pricingAccuracy: 50,
    hasAI: false,
    weaknesses: [
      'B2B only focus',
      'Complex quotes',
      'No consumer appeal',
      'Slow response'
    ],
    keywords: ['kontorsflytt stockholm', 'företagsflytt'],
    channels: { google: true, facebook: false, instagram: false, seo: true }
  },
  {
    name: 'Jordgubbsprinsen',
    marketShare: 5,
    adSpend: 30000,
    avgQuoteTime: '24h',
    pricingAccuracy: 55,
    hasAI: false,
    weaknesses: [
      'Too expensive',
      'Limited market',
      'No tech appeal',
      'Premium only'
    ],
    keywords: ['premium flyttfirma', 'white glove moving'],
    channels: { google: true, facebook: false, instagram: true, seo: true }
  }
];

const nordflytt = {
  name: 'Nordflytt AI',
  marketShare: 3, // Current
  targetShare: 12, // Year 1 target
  adSpend: 150000,
  avgQuoteTime: '30 seconds',
  pricingAccuracy: 87,
  hasAI: true,
  strengths: [
    '87% ML accuracy',
    'Instant pricing',
    'Same-day booking',
    'Route optimization',
    'Damage prevention AI'
  ]
};

export function CompetitorAnalysisDashboard() {
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);

  const totalMarketShare = competitors.reduce((sum, c) => sum + c.marketShare, 0);
  const avgAccuracy = competitors.reduce((sum, c) => sum + c.pricingAccuracy, 0) / competitors.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Competitive Intelligence Dashboard</h2>
          <p className="text-gray-600">Stockholm Moving Market Analysis</p>
        </div>
        <Badge className="bg-green-600 text-white">
          <Brain className="w-4 h-4 mr-1" />
          AI Advantage Active
        </Badge>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Market</p>
                <p className="text-3xl font-bold">2.5B SEK</p>
                <p className="text-xs text-gray-500">Annual revenue</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Adoption</p>
                <p className="text-3xl font-bold text-red-600">0%</p>
                <p className="text-xs text-gray-500">Competitors with AI</p>
              </div>
              <Brain className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Quote Time</p>
                <p className="text-3xl font-bold">36h</p>
                <p className="text-xs text-green-600">vs Nordflytt: 30s</p>
              </div>
              <Clock className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Accuracy</p>
                <p className="text-3xl font-bold">{avgAccuracy}%</p>
                <p className="text-xs text-green-600">vs Nordflytt: 87%</p>
              </div>
              <Target className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="market-share" className="space-y-4">
        <TabsList>
          <TabsTrigger value="market-share">Market Share</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="ad-analysis">Ad Analysis</TabsTrigger>
          <TabsTrigger value="opportunities">AI Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="market-share">
          <Card>
            <CardHeader>
              <CardTitle>Market Share Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Market Share Visualization */}
              <div className="space-y-3">
                {competitors.map((competitor) => (
                  <div key={competitor.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{competitor.name}</span>
                        {!competitor.hasAI && (
                          <Badge variant="outline" className="text-xs">No AI</Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium">{competitor.marketShare}%</span>
                    </div>
                    <Progress value={competitor.marketShare} className="h-2" />
                  </div>
                ))}
                
                {/* Nordflytt Current vs Target */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-purple-600">Nordflytt (Current)</span>
                      <Badge className="bg-purple-600 text-white text-xs">AI-Powered</Badge>
                    </div>
                    <span className="text-sm font-medium">{nordflytt.marketShare}%</span>
                  </div>
                  <Progress value={nordflytt.marketShare} className="h-2 bg-purple-100" />
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Nordflytt (Year 1 Target)</span>
                    <span className="text-sm font-medium text-green-600">{nordflytt.targetShare}%</span>
                  </div>
                  <Progress value={nordflytt.targetShare} className="h-2 bg-green-100" />
                </div>
              </div>

              {/* Growth Opportunity */}
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-2">🚀 Growth Opportunity</h4>
                <p className="text-sm text-gray-700">
                  With AI capabilities, Nordflytt can capture {nordflytt.targetShare - nordflytt.marketShare}% 
                  additional market share in Year 1, representing {((nordflytt.targetShare - nordflytt.marketShare) * 25).toFixed(0)}M SEK 
                  in additional revenue.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Capabilities Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Feature</th>
                      <th className="text-center py-2">Nordflytt</th>
                      {competitors.slice(0, 3).map(c => (
                        <th key={c.name} className="text-center py-2 text-sm">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3">AI/ML Pricing</td>
                      <td className="text-center">✅</td>
                      <td className="text-center">❌</td>
                      <td className="text-center">❌</td>
                      <td className="text-center">❌</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Instant Quote</td>
                      <td className="text-center">✅ (30s)</td>
                      <td className="text-center">❌ (48h)</td>
                      <td className="text-center">❌ (24h)</td>
                      <td className="text-center">❌ (48h)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Accuracy Guarantee</td>
                      <td className="text-center">✅ (87%)</td>
                      <td className="text-center">❌</td>
                      <td className="text-center">❌</td>
                      <td className="text-center">❌</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Route Optimization</td>
                      <td className="text-center">✅ (ML)</td>
                      <td className="text-center">⚠️ (Manual)</td>
                      <td className="text-center">❌</td>
                      <td className="text-center">⚠️ (Manual)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">Same-Day Booking</td>
                      <td className="text-center">✅</td>
                      <td className="text-center">❌</td>
                      <td className="text-center">❌</td>
                      <td className="text-center">❌</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ad-analysis">
          <div className="grid gap-4">
            {/* Channel Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Advertising Channel Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitors.map((competitor) => (
                    <div key={competitor.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{competitor.name}</h4>
                        <p className="text-sm text-gray-600">Monthly spend: {(competitor.adSpend / 1000).toFixed(0)}k SEK</p>
                      </div>
                      <div className="flex gap-2">
                        {competitor.channels.google && <Badge variant="outline"><Search className="w-3 h-3 mr-1" />Google</Badge>}
                        {competitor.channels.facebook && <Badge variant="outline"><Facebook className="w-3 h-3 mr-1" />Meta</Badge>}
                        {competitor.channels.seo && <Badge variant="outline">SEO</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Keyword Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>AI Keyword Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-3">Low Competition AI Keywords</h4>
                    <div className="space-y-2">
                      {[
                        { keyword: 'ai flyttfirma stockholm', cpc: '10 SEK' },
                        { keyword: 'flyttkalkylator online', cpc: '15 SEK' },
                        { keyword: 'instant flyttpris', cpc: '12 SEK' },
                        { keyword: 'smart flyttfirma', cpc: '18 SEK' }
                      ].map((kw) => (
                        <div key={kw.keyword} className="flex justify-between text-sm">
                          <span>{kw.keyword}</span>
                          <Badge variant="outline" className="text-green-600">{kw.cpc}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Competitor Keywords (High CPC)</h4>
                    <div className="space-y-2">
                      {[
                        { keyword: 'flyttfirma stockholm', cpc: '50 SEK' },
                        { keyword: 'billig flytt', cpc: '45 SEK' },
                        { keyword: 'flytthjälp stockholm', cpc: '48 SEK' },
                        { keyword: 'flyttfirma pris', cpc: '52 SEK' }
                      ].map((kw) => (
                        <div key={kw.keyword} className="flex justify-between text-sm">
                          <span>{kw.keyword}</span>
                          <Badge variant="outline" className="text-red-600">{kw.cpc}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="opportunities">
          <div className="grid gap-4">
            {/* AI Differentiation Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>AI Differentiation Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    icon: <Zap className="w-5 h-5 text-purple-600" />,
                    title: 'Instant AI Pricing',
                    description: 'No competitor offers instant pricing. Average wait: 24-72h',
                    impact: 'High',
                    campaign: 'Get Your Price in 30 Seconds'
                  },
                  {
                    icon: <Target className="w-5 h-5 text-green-600" />,
                    title: '87% Accuracy Guarantee',
                    description: 'Industry average: 45%. First to offer accuracy guarantee',
                    impact: 'High',
                    campaign: 'No More Moving Day Surprises'
                  },
                  {
                    icon: <Brain className="w-5 h-5 text-blue-600" />,
                    title: 'ML Route Optimization',
                    description: '40% faster moves through AI optimization',
                    impact: 'Medium',
                    campaign: 'AI Makes Your Move 40% Faster'
                  },
                  {
                    icon: <Shield className="w-5 h-5 text-orange-600" />,
                    title: 'Damage Prevention AI',
                    description: '73% fewer damages through predictive analytics',
                    impact: 'High',
                    campaign: 'AI Protects Your Belongings'
                  }
                ].map((opp, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50">
                    {opp.icon}
                    <div className="flex-1">
                      <h4 className="font-semibold">{opp.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{opp.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline">{opp.impact} Impact</Badge>
                        <span className="text-sm text-purple-600">{opp.campaign}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ROI Projection */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">AI Campaign ROI Projection</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-purple-600">200%</p>
                    <p className="text-sm text-gray-600">Month 1-3 ROI</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600">7%</p>
                    <p className="text-sm text-gray-600">Market Share by Month 6</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-600">2.5M</p>
                    <p className="text-sm text-gray-600">Year 1 Revenue (SEK)</p>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                  Launch AI Marketing Campaign
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}