'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Brain,
  Target,
  Activity,
  Globe,
  Mail,
  Phone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsData {
  realtime: {
    activeUsers: number;
    pageViews: number;
    events: Array<{
      name: string;
      count: number;
      value?: number;
    }>;
  };
  today: {
    users: number;
    sessions: number;
    conversions: number;
    revenue: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  sources: Array<{
    source: string;
    users: number;
    conversions: number;
    revenue: number;
  }>;
  mlMetrics: {
    predictionsToday: number;
    avgConfidence: number;
    enhancedQuotes: number;
    timeSaved: number;
  };
}

export function RealTimeAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { trackEvent } = useAnalytics();

  // Fetch real analytics data
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/realtime');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const analyticsData = await response.json();
      setData(analyticsData);
      setError(null);
    } catch (err) {
      setError('Unable to load real-time data. Please check your analytics configuration.');
      // For demo purposes, show sample data
      setData(getSampleData());
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchAnalytics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Sample data for when real API isn't available
  const getSampleData = (): AnalyticsData => ({
    realtime: {
      activeUsers: 42,
      pageViews: 156,
      events: [
        { name: 'quote_generated', count: 8, value: 120000 },
        { name: 'ml_prediction', count: 12 },
        { name: 'booking_started', count: 3 },
        { name: 'form_submitted', count: 15 }
      ]
    },
    today: {
      users: 523,
      sessions: 687,
      conversions: 24,
      revenue: 285000,
      avgSessionDuration: 245,
      bounceRate: 38.5
    },
    sources: [
      { source: 'Google Organic', users: 234, conversions: 12, revenue: 145000 },
      { source: 'Direct', users: 156, conversions: 8, revenue: 95000 },
      { source: 'Google Ads', users: 89, conversions: 3, revenue: 35000 },
      { source: 'Facebook', users: 44, conversions: 1, revenue: 10000 }
    ],
    mlMetrics: {
      predictionsToday: 87,
      avgConfidence: 0.865,
      enhancedQuotes: 52,
      timeSaved: 134
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Analytics Dashboard</h2>
          <p className="text-gray-600">Live data from your actual website performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={fetchAnalytics} size="sm">
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800">{error}</p>
            <p className="text-xs text-yellow-600 mt-1">
              Follow the setup guide to configure real analytics tracking.
            </p>
          </div>
        </div>
      )}

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-purple-600">
                  {data.realtime.activeUsers}
                </p>
                <p className="text-xs text-gray-500">Right now</p>
              </div>
              <Activity className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  {(data.today.revenue / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-500">SEK</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ML Predictions</p>
                <p className="text-3xl font-bold text-blue-600">
                  {data.mlMetrics.predictionsToday}
                </p>
                <p className="text-xs text-gray-500">
                  {(data.mlMetrics.avgConfidence * 100).toFixed(0)}% avg confidence
                </p>
              </div>
              <Brain className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-3xl font-bold text-orange-600">
                  {data.today.conversions}
                </p>
                <p className="text-xs text-gray-500">
                  {((data.today.conversions / data.today.sessions) * 100).toFixed(1)}% rate
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="ml">ML Performance</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.sources.map((source, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{source.source}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{source.users} users</span>
                        <Badge variant="outline">{source.conversions} conv</Badge>
                        <span className="font-medium text-green-600">
                          {(source.revenue / 1000).toFixed(0)}k SEK
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={(source.users / data.sources[0].users) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Real-Time Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.realtime.events.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{event.name.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-600">
                        {event.count} occurrences
                      </p>
                    </div>
                    {event.value && (
                      <Badge className="bg-green-100 text-green-800">
                        {(event.value / 1000).toFixed(0)}k SEK
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ML System Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Enhanced Quotes</p>
                  <p className="text-2xl font-bold">{data.mlMetrics.enhancedQuotes}</p>
                  <p className="text-xs text-green-600">
                    {((data.mlMetrics.enhancedQuotes / data.mlMetrics.predictionsToday) * 100).toFixed(0)}% 
                    of total
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Time Saved</p>
                  <p className="text-2xl font-bold">{data.mlMetrics.timeSaved}h</p>
                  <p className="text-xs text-blue-600">
                    Customer hours saved today
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Average ML Confidence</span>
                  <span className="font-medium">
                    {(data.mlMetrics.avgConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={data.mlMetrics.avgConfidence * 100} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-purple-600">
                      {data.today.conversions}
                    </p>
                    <p className="text-sm text-gray-600">Total Conversions</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600">
                      {(data.today.revenue / data.today.conversions / 1000).toFixed(1)}k
                    </p>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-600">
                      {((data.today.conversions / data.today.sessions) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Bounce Rate</span>
                    <span className={`font-medium ${data.today.bounceRate < 40 ? 'text-green-600' : 'text-orange-600'}`}>
                      {data.today.bounceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Avg Session Duration</span>
                    <span className="font-medium">
                      {Math.floor(data.today.avgSessionDuration / 60)}:{(data.today.avgSessionDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Setup Instructions */}
      {error && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">📊 Set Up Real Analytics</h3>
            <p className="text-sm text-gray-700 mb-3">
              To see real data instead of sample data, follow these steps:
            </p>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Create a Google Analytics 4 property</li>
              <li>Set up Google Tag Manager</li>
              <li>Configure Facebook Pixel (optional)</li>
              <li>Add your tracking IDs to .env.local</li>
              <li>Deploy and start collecting real data!</li>
            </ol>
            <Button 
              className="mt-3" 
              size="sm"
              onClick={() => window.open('/ANALYTICS-SETUP-GUIDE.md', '_blank')}
            >
              View Setup Guide
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}