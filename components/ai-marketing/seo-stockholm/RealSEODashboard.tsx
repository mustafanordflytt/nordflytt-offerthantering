'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Target, 
  DollarSign,
  Users,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Brain,
  Trophy,
  Activity,
  Link,
  FileText,
  Settings,
  Download,
  Plus,
  Eye,
  ChevronRight,
  Loader2,
  BarChart3,
  MapPin,
  Zap
} from 'lucide-react';

// Real-time data hooks
const useRankingData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/seo/rankings?ai_only=false');
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch ranking data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};

const useOpportunityData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/seo/opportunities?min_score=70');
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch opportunities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading };
};

const useCompetitorData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/seo/competitors');
        const result = await response.json();
        
        if (result.success) {
          setData(result.analysis);
        }
      } catch (err) {
        console.error('Failed to fetch competitor data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading };
};

export default function RealSEODashboard() {
  const { data: rankingData, loading: rankingLoading, error: rankingError } = useRankingData();
  const { data: opportunityData, loading: opportunityLoading } = useOpportunityData();
  const { data: competitorData, loading: competitorLoading } = useCompetitorData();
  
  const [syncing, setSyncing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Sync with Google Search Console
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/seo/search-console/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30, syncType: 'all' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Add new keyword tracking
  const handleAddKeyword = async (keyword: string) => {
    try {
      const response = await fetch('/api/seo/tracking/add-keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword, 
          trackImmediately: true,
          aiAdvantage: keyword.toLowerCase().includes('ai') 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to add keyword:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (rankingLoading || opportunityLoading || competitorLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate AI advantage metrics
  const aiKeywords = rankingData?.filter((r: any) => r.ai_advantage) || [];
  const aiRankingTop10 = aiKeywords.filter((k: any) => k.position && k.position <= 10).length;
  const aiOpportunities = opportunityData?.filter((o: any) => o.ai_advantage_potential) || [];

  return (
    <div className="space-y-6">
      {/* Header with sync status */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SEO Stockholm - Real Data</h2>
          <p className="text-gray-600">Live tracking of {rankingData?.length || 0} keywords</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync GSC
              </>
            )}
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* AI Advantage Alert */}
      {aiOpportunities.length > 0 && (
        <Alert className="border-2 border-blue-500 bg-blue-50">
          <Brain className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold">AI Keyword Advantage!</span>
              <p className="text-sm mt-1">
                {aiOpportunities.length} AI-focused keywords with no competition. 
                Potential: {formatCurrency(aiOpportunities.reduce((sum: number, o: any) => sum + (o.estimated_revenue_potential || 0), 0))}
              </p>
            </div>
            <Button size="sm" variant="default">
              Capture AI Market
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Keywords Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{rankingData?.length || 0}</p>
              <Badge variant="outline" className="text-xs">
                {aiKeywords.length} AI
              </Badge>
            </div>
            <Progress value={65} className="mt-2 h-1" />
            <p className="text-xs text-gray-600 mt-1">Target: 100 keywords</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Top 10 Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{rankingData?.summary?.top10 || 0}</p>
              <span className="text-sm text-green-600 flex items-center">
                <ArrowUp className="h-3 w-3" />
                {aiRankingTop10} AI
              </span>
            </div>
            <Progress value={(rankingData?.summary?.top10 || 0) / (rankingData?.length || 1) * 100} className="mt-2 h-1" />
            <p className="text-xs text-gray-600 mt-1">
              Top 3: {rankingData?.summary?.top3 || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">AI Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{competitorData?.competitorsUsingAI || 0}</p>
              <span className="text-sm text-gray-600">of {competitorData?.totalCompetitors || 0}</span>
            </div>
            <Progress value={competitorData?.competitorsUsingAI ? (competitorData.competitorsUsingAI / competitorData.totalCompetitors) * 100 : 0} className="mt-2 h-1" />
            <p className="text-xs text-green-600 mt-1">First mover advantage!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {formatCurrency(opportunityData?.reduce((sum: number, o: any) => sum + (o.estimated_revenue_potential || 0), 0) || 0)}
              </p>
            </div>
            <Progress value={80} className="mt-2 h-1" />
            <p className="text-xs text-gray-600 mt-1">From {opportunityData?.length || 0} opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-keywords">AI Keywords</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Rankings */}
          <Card>
            <CardHeader>
              <CardTitle>Current Keyword Rankings</CardTitle>
              <CardDescription>
                Real-time positions from Google Search Console
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankingData?.slice(0, 10).map((ranking: any) => (
                  <div key={ranking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {ranking.ai_advantage && (
                        <Brain className="h-4 w-4 text-blue-600" />
                      )}
                      <div>
                        <p className="font-medium">{ranking.keyword}</p>
                        <p className="text-sm text-gray-600">
                          Volume: {ranking.search_volume || 'N/A'} • 
                          CPC: {ranking.cpc_estimate ? formatCurrency(ranking.cpc_estimate) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {ranking.position ? (
                        <>
                          <Badge variant={ranking.position <= 3 ? 'default' : ranking.position <= 10 ? 'secondary' : 'outline'}>
                            #{ranking.position}
                          </Badge>
                          {ranking.previous_position && (
                            <span className={`text-sm flex items-center ${
                              ranking.position < ranking.previous_position ? 'text-green-600' : 
                              ranking.position > ranking.previous_position ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {ranking.position < ranking.previous_position ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : ranking.position > ranking.previous_position ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : null}
                              {Math.abs(ranking.position - ranking.previous_position)}
                            </span>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline">Not ranking</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI Keyword Domination Strategy
              </CardTitle>
              <CardDescription>
                Zero competition keywords where Nordflytt can rank #1
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiKeywords.map((keyword: any) => (
                  <div key={keyword.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {keyword.keyword}
                          {keyword.position && keyword.position <= 3 && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Search volume: {keyword.search_volume || 'Low'} • 
                          Competition: None • 
                          CPC: {keyword.cpc_estimate ? formatCurrency(keyword.cpc_estimate) : 'N/A'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            87% accuracy advantage
                          </Badge>
                          <Badge className="bg-green-100 text-green-800">
                            First mover
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        {keyword.position ? (
                          <p className="text-2xl font-bold">#{keyword.position}</p>
                        ) : (
                          <Button size="sm">
                            Start Tracking
                            <Plus className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new AI keyword */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Track New AI Keyword</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., 'ai moving optimization stockholm'"
                      className="flex-1 px-3 py-2 border rounded-md"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddKeyword((e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                    <Button>Add Keyword</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High-Value SEO Opportunities</CardTitle>
              <CardDescription>
                Keywords with high revenue potential and low competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {opportunityData?.slice(0, 10).map((opp: any) => (
                  <div key={opp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center gap-2">
                          {opp.keyword}
                          {opp.ai_advantage_potential && (
                            <Badge className="bg-blue-100 text-blue-800">AI</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Volume: {opp.search_volume} • 
                          Competition: {Math.round(opp.competition_score * 100)}% • 
                          CPC: {formatCurrency(opp.cpc_estimate || 0)}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-green-600 font-medium">
                            +{formatCurrency(opp.estimated_revenue_potential || 0)} potential
                          </span>
                          <Badge variant="outline">
                            {opp.implementation_effort} effort
                          </Badge>
                          <Badge 
                            variant={
                              opp.status === 'monitoring' ? 'default' : 
                              opp.status === 'in_progress' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {opp.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-center mb-2">
                          <p className="text-2xl font-bold text-blue-600">
                            {opp.opportunity_score}
                          </p>
                          <p className="text-xs text-gray-600">Score</p>
                        </div>
                        <Button size="sm">
                          Optimize
                          <Zap className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor AI Analysis</CardTitle>
              <CardDescription>
                Track which competitors are adopting AI positioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* AI Adoption Status */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      {competitorData?.aiAdoption?.neither || 0}
                    </p>
                    <p className="text-sm text-gray-600">No AI mentions</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">
                      {competitorData?.aiAdoption?.mentioningAI || 0}
                    </p>
                    <p className="text-sm text-gray-600">Mention AI</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">
                      {competitorData?.aiAdoption?.mentioningML || 0}
                    </p>
                    <p className="text-sm text-gray-600">Mention ML</p>
                  </div>
                </div>

                {/* Top Competitors */}
                <div>
                  <h4 className="font-medium mb-3">Top Competitors by Visibility</h4>
                  <div className="space-y-2">
                    {competitorData?.topCompetitors?.map((comp: any, index: number) => (
                      <div key={comp.domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          <div>
                            <p className="font-medium">{comp.domain}</p>
                            <p className="text-xs text-gray-600">
                              Visibility score: {comp.visibilityScore}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Analyze
                          <Eye className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical SEO Status</CardTitle>
              <CardDescription>
                Site health and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Run a technical audit to identify and fix SEO issues
                  </AlertDescription>
                </Alert>
                
                <Button className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  Run Technical Audit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}