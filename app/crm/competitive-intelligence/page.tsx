'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Target, Brain, DollarSign, Users, 
  Zap, AlertCircle, CheckCircle, Search, Globe,
  Instagram, Facebook, Sparkles, ChartBar
} from 'lucide-react';

export default function CompetitiveIntelligencePage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');

  useEffect(() => {
    fetchCompetitiveData();
  }, []);

  const fetchCompetitiveData = async () => {
    try {
      const response = await fetch('/api/competitive-intelligence');
      const data = await response.json();
      if (data.success) {
        setReport(data.report);
        setSelectedCompetitor(data.report.competitorAnalysis[0]?.competitor || '');
      }
    } catch (error) {
      console.error('Error fetching competitive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const marketShareData = [
    { name: 'MovingStockholm', value: 22, fill: '#8884d8' },
    { name: 'Flyttfabriken', value: 18, fill: '#82ca9d' },
    { name: 'Grabbarna Flytt', value: 15, fill: '#ffc658' },
    { name: 'Others', value: 45, fill: '#ff8042' }
  ];

  const aiAdoptionData = [
    { feature: 'Instant Pricing', nordflytt: 100, competitors: 0 },
    { feature: 'Route Optimization', nordflytt: 100, competitors: 15 },
    { feature: 'Predictive Analytics', nordflytt: 100, competitors: 0 },
    { feature: 'Automated Scheduling', nordflytt: 85, competitors: 20 },
    { feature: 'Damage Prevention AI', nordflytt: 75, competitors: 0 },
    { feature: 'Customer Service AI', nordflytt: 90, competitors: 10 }
  ];

  const conversionRateData = [
    { month: 'Current', traditional: 3.2, aiPowered: 8.2 },
    { month: 'Month 1', traditional: 3.3, aiPowered: 9.5 },
    { month: 'Month 3', traditional: 3.4, aiPowered: 11.2 },
    { month: 'Month 6', traditional: 3.5, aiPowered: 12.8 }
  ];

  const budgetAllocationData = [
    { channel: 'Google Ads', amount: 50000, percentage: 33 },
    { channel: 'Meta Ads', amount: 30000, percentage: 20 },
    { channel: 'LinkedIn', amount: 15000, percentage: 10 },
    { channel: 'Content/SEO', amount: 20000, percentage: 13 },
    { channel: 'PR/Influencer', amount: 25000, percentage: 17 },
    { channel: 'CRO', amount: 10000, percentage: 7 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing competitive landscape...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Competitive Intelligence</h1>
          <p className="text-muted-foreground">Stockholm Moving Market Analysis & AI Opportunities</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Brain className="mr-2 h-4 w-4" />
          Generate New Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Opportunity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€45M</div>
            <p className="text-xs text-muted-foreground">+8.5% YoY growth</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Advantage</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Pricing accuracy vs 45% industry avg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Market Share</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12-15%</div>
            <p className="text-xs text-muted-foreground">Within 12 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Projection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,250%</div>
            <p className="text-xs text-muted-foreground">Year 1 on 200K investment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="ai-opportunities">AI Opportunities</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Strategy</TabsTrigger>
          <TabsTrigger value="budget">Budget & ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Market Share Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Current Market Share</CardTitle>
                <CardDescription>Stockholm moving companies market distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={marketShareData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {marketShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Market Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Key Market Trends</CardTitle>
                <CardDescription>Opportunities for AI disruption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { trend: 'Instant gratification culture', impact: 95 },
                  { trend: 'Price transparency demand', impact: 88 },
                  { trend: 'Mobile-first behavior', impact: 92 },
                  { trend: 'Sustainability focus', impact: 75 },
                  { trend: 'Labor shortage', impact: 85 }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{item.trend}</span>
                      <span className="text-muted-foreground">{item.impact}%</span>
                    </div>
                    <Progress value={item.impact} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* AI Adoption Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>AI Technology Adoption</CardTitle>
              <CardDescription>Nordflytt vs Industry Average</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aiAdoptionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="nordflytt" fill="#8b5cf6" name="Nordflytt" />
                  <Bar dataKey="competitors" fill="#e5e7eb" name="Competitors" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <div className="flex gap-4 mb-4">
            {report?.competitorAnalysis?.map((comp: any) => (
              <Button
                key={comp.competitor}
                variant={selectedCompetitor === comp.competitor ? 'default' : 'outline'}
                onClick={() => setSelectedCompetitor(comp.competitor)}
                size="sm"
              >
                {comp.competitor}
              </Button>
            ))}
          </div>

          {selectedCompetitor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedCompetitor} Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Market Position</h4>
                    <p className="text-sm text-muted-foreground">
                      {report?.competitorAnalysis?.find((c: any) => c.competitor === selectedCompetitor)?.overview}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Monthly Ad Spend</h4>
                    <div className="text-2xl font-bold">
                      {report?.competitorAnalysis?.find((c: any) => c.competitor === selectedCompetitor)?.adStrategy.monthlySpend?.toLocaleString()} SEK
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Key Platforms</h4>
                    <div className="flex gap-2">
                      <Badge variant="secondary"><Search className="w-3 h-3 mr-1" />Google</Badge>
                      <Badge variant="secondary"><Facebook className="w-3 h-3 mr-1" />Meta</Badge>
                      <Badge variant="secondary"><Instagram className="w-3 h-3 mr-1" />Instagram</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Strengths & Weaknesses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Strengths</h4>
                    <ul className="space-y-1">
                      {report?.competitorAnalysis?.find((c: any) => c.competitor === selectedCompetitor)?.strengths.map((strength: string, index: number) => (
                        <li key={index} className="text-sm flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Weaknesses</h4>
                    <ul className="space-y-1">
                      {report?.competitorAnalysis?.find((c: any) => c.competitor === selectedCompetitor)?.weaknesses.map((weakness: string, index: number) => (
                        <li key={index} className="text-sm flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report?.aiOpportunityAnalysis?.map((opp: any, index: number) => (
              <Card key={index} className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 ${
                  opp.impact === 'high' ? 'bg-green-500' : 
                  opp.impact === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                } opacity-10 rounded-bl-full`} />
                
                <CardHeader>
                  <CardTitle className="text-lg flex items-start justify-between">
                    <span>{opp.opportunity}</span>
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Implementation</span>
                    <p className="text-sm font-medium">{opp.implementation}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Expected ROI</span>
                    <p className="text-sm font-medium">{opp.expectedROI}</p>
                  </div>
                  <Badge variant={opp.impact === 'high' ? 'default' : opp.impact === 'medium' ? 'secondary' : 'outline'}>
                    {opp.impact} impact
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Conversion Rate Projection */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Projection</CardTitle>
              <CardDescription>Traditional vs AI-Powered Performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={conversionRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="traditional" stroke="#e5e7eb" name="Industry Average" strokeWidth={2} />
                  <Line type="monotone" dataKey="aiPowered" stroke="#8b5cf6" name="AI-Powered" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Ads Strategy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  Google Ads Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Key Campaigns</h4>
                  <ul className="space-y-2">
                    <li className="text-sm p-2 bg-muted rounded">AI Instant Quote - High Intent</li>
                    <li className="text-sm p-2 bg-muted rounded">Competitor Conquesting - Tech Angle</li>
                    <li className="text-sm p-2 bg-muted rounded">Stockholm Local - AI Pioneer</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Top Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>"ai flyttfirma stockholm"</Badge>
                    <Badge>"instant flyttoffert"</Badge>
                    <Badge>"smart flytt app"</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Budget Allocation</h4>
                  <div className="text-2xl font-bold">50,000 SEK/month</div>
                </div>
              </CardContent>
            </Card>

            {/* Meta Ads Strategy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Facebook className="mr-2 h-5 w-5" />
                  Meta Ads Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Creative Themes</h4>
                  <ul className="space-y-2">
                    <li className="text-sm p-2 bg-muted rounded">AI Demo Videos - Show instant pricing</li>
                    <li className="text-sm p-2 bg-muted rounded">Customer Stories - Accuracy testimonials</li>
                    <li className="text-sm p-2 bg-muted rounded">Tech Innovation - Behind the scenes</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Target Audiences</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Tech Employees</Badge>
                    <Badge variant="secondary">25-45 Homeowners</Badge>
                    <Badge variant="secondary">Startup Community</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Budget Allocation</h4>
                  <div className="text-2xl font-bold">30,000 SEK/month</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sample Ad Copy */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Differentiated Ad Copy Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <Badge className="mb-2">Google Search Ad</Badge>
                  <h4 className="font-semibold text-blue-600">AI-Driven Flyttfirma - 87% Träffsäker Prissättning</h4>
                  <p className="text-sm mt-1">Få exakt offert på 30 sekunder. Ingen gissning, inga överraskningar. Machine Learning optimerar din flytt.</p>
                  <p className="text-sm text-green-600 mt-2">www.nordflytt.se/ai-offert</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <Badge className="mb-2">Facebook Ad</Badge>
                  <h4 className="font-semibold">Trött på att vänta på flyttoffert? 🤖</h4>
                  <p className="text-sm mt-1">Vår AI ger dig exakt pris på 30 sekunder! Ta en bild, få din offert. Stockholms första AI-drivna flyttfirma.</p>
                  <Button size="sm" className="mt-2">Testa Nu</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          {/* Budget Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Budget Allocation</CardTitle>
              <CardDescription>Total monthly budget: 150,000 SEK</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetAllocationData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="channel" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#8b5cf6">
                    {budgetAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ROI Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>3 Month Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">450K SEK</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Market Share</p>
                    <p className="text-xl font-semibold">3%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="text-xl font-semibold text-green-600">+125%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6 Month Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">1.2M SEK</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Market Share</p>
                    <p className="text-xl font-semibold">7%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="text-xl font-semibold text-green-600">+450%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>12 Month Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">2.5M SEK</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Market Share</p>
                    <p className="text-xl font-semibold">12%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="text-xl font-semibold text-green-600">+2,250%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Roadmap */}
          <Card>
            <CardHeader>
              <CardTitle>Implementation Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report?.recommendations?.immediate?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.action}</h4>
                      <p className="text-sm text-muted-foreground">{item.expectedImpact}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.priority === 'critical' ? 'destructive' : 'default'}>
                        {item.priority}
                      </Badge>
                      <p className="text-sm mt-1">{item.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}