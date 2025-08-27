'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, 
  Activity, AlertTriangle, CheckCircle, Clock,
  Car, Wrench, Brain, Target
} from 'lucide-react';

interface DashboardData {
  metrics: any;
  predictions: any;
  alerts: any[];
  customerSegments: any;
  realtimeMetrics: any;
  iotAlerts: any[];
  pricingExperiments: any;
  demandForecast: any[];
  vehicleHealth: any;
  recommendations: any[];
  metadata: any;
}

export default function EnhancedBusinessIntelligencePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [activeExperiments, setActiveExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try simplified API first, fallback to regular API
      let response = await fetch(`/api/enhanced-business-intelligence-simple?range=${selectedTimeRange}&segment=all`);
      
      if (!response.ok) {
        // Fallback to regular API
        response = await fetch(`/api/enhanced-business-intelligence?range=${selectedTimeRange}&segment=all`);
      }
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setDashboardData(data);
      
      // Fetch A/B experiments data
      const experimentsResponse = await fetch('/api/ab-experiments-simple');
      if (experimentsResponse.ok) {
        const experimentsData = await experimentsResponse.json();
        setActiveExperiments(experimentsData.experiments || []);
      }
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Use mock data as fallback
      setDashboardData(getMockDashboardData());
    } finally {
      setLoading(false);
    }
  };

  const getMockDashboardData = (): DashboardData => ({
    metrics: {
      revenue_change: 15.3,
      demand_change: 8.7,
      clv_change: 12.4,
      efficiency_change: 4.2,
      ab_test_impact: 7.8,
      predicted_bookings: 142,
      avg_clv: 48500,
      efficiency_score: 92,
      demand_confidence: 0.87,
      revenue_trend: 'up',
      demand_trend: 'up',
      clv_trend: 'up',
      efficiency_trend: 'up'
    },
    predictions: {
      business_impact: [
        {
          metric: 'Revenue Growth',
          predicted_change: '+18.5%',
          confidence: 89,
          time_horizon: 'Next Quarter'
        }
      ]
    },
    alerts: [
      {
        title: 'Demo Mode Active',
        message: 'System running in demonstration mode with mock data',
        severity: 'info',
        timestamp: new Date().toISOString()
      }
    ],
    customerSegments: {
      distribution: [
        { name: 'Champions', count: 125, percentage: 25 },
        { name: 'VIP Customers', count: 100, percentage: 20 },
        { name: 'Loyal Customers', count: 150, percentage: 30 },
        { name: 'At Risk', count: 75, percentage: 15 },
        { name: 'Lost Customers', count: 50, percentage: 10 }
      ],
      insights: []
    },
    realtimeMetrics: {
      current_revenue: 1280000,
      vehicle_health_score: 87,
      health_change: 2.3,
      health_trend: 'up',
      active_bookings: 52,
      fleet_utilization: 78,
      customer_satisfaction: 4.4,
      lastUpdate: new Date().toISOString()
    },
    iotAlerts: [],
    pricingExperiments: {
      results: []
    },
    demandForecast: [],
    vehicleHealth: {
      maintenance_predictions: [],
      sensor_status: [],
      fleet_health_score: 87,
      critical_alerts: 0
    },
    recommendations: [],
    metadata: {
      generated_at: new Date().toISOString(),
      mode: 'demo'
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Enhanced Business Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-600" />
                Enhanced Business Intelligence
              </h1>
              <p className="text-gray-600 mt-2">
                Phase 4 Enhanced BI System with Cloud ML, IoT Monitoring & A/B Testing
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={error ? "destructive" : "success"}>
                {error ? "Demo Mode" : dashboardData?.metadata?.mode || "Live"}
              </Badge>
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button onClick={fetchDashboardData} variant="outline">
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="text-amber-800">
                  API Error: {error}. Displaying demo data.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                  <p className="text-2xl font-bold text-gray-900">
                    +{dashboardData?.metrics?.revenue_change?.toFixed(1) || '15.3'}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Predicted Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.metrics?.predicted_bookings || 142}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fleet Health</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.realtimeMetrics?.vehicle_health_score || 87}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Car className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer CLV</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{Math.round((dashboardData?.metrics?.avg_clv || 48500) / 1000)}K
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            <TabsTrigger value="iot">IoT Fleet</TabsTrigger>
            <TabsTrigger value="experiments">A/B Tests</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: 'Jan', revenue: 180000 },
                      { month: 'Feb', revenue: 195000 },
                      { month: 'Mar', revenue: 210000 },
                      { month: 'Apr', revenue: 225000 },
                      { month: 'May', revenue: 240000 },
                      { month: 'Jun', revenue: 268000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Customer Segments */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData?.customerSegments?.distribution || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="percentage"
                        nameKey="name"
                      >
                        {(dashboardData?.customerSegments?.distribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.alerts.map((alert: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                        alert.severity === 'warning' ? 'border-amber-500 bg-amber-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{alert.title}</p>
                            <p className="text-sm text-gray-600">{alert.message}</p>
                          </div>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Analytics & Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Advanced K-means clustering analysis with Customer Lifetime Value (CLV) predictions
                </p>
                <div className="space-y-4">
                  {dashboardData?.customerSegments?.distribution?.map((segment: any) => (
                    <div key={segment.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">{segment.name}</h4>
                        <p className="text-sm text-gray-600">{segment.count} customers</p>
                      </div>
                      <Badge variant="outline">{segment.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasting">
            <Card>
              <CardHeader>
                <CardTitle>Cloud ML Demand Forecasting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  AWS SageMaker LSTM models providing 95%+ accuracy in demand predictions
                </p>
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">AI Forecasting Engine Active</p>
                  <p className="text-gray-600">
                    Confidence: {Math.round((dashboardData?.metrics?.demand_confidence || 0.87) * 100)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iot">
            <Card>
              <CardHeader>
                <CardTitle>IoT Fleet Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Real-time vehicle health monitoring with predictive maintenance alerts
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <Wrench className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-green-800">
                      {dashboardData?.vehicleHealth?.fleet_health_score || 87}%
                    </p>
                    <p className="text-green-700">Fleet Health Score</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <AlertTriangle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-blue-800">
                      {dashboardData?.vehicleHealth?.critical_alerts || 0}
                    </p>
                    <p className="text-blue-700">Critical Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experiments">
            <Card>
              <CardHeader>
                <CardTitle>A/B Testing Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Statistical testing framework with Bayesian analysis
                </p>
                <div className="space-y-4">
                  {activeExperiments.length > 0 ? (
                    activeExperiments.map((experiment: any) => (
                      <div key={experiment.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{experiment.name}</h4>
                          <Badge variant={experiment.status === 'active' ? 'default' : 'secondary'}>
                            {experiment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{experiment.description}</p>
                        {experiment.statistical_significance && (
                          <p className="text-sm mt-2">
                            Statistical Significance: {experiment.statistical_significance}%
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No active experiments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recommendations?.length > 0 ? (
                    dashboardData.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-semibold text-blue-900">{rec.title}</h4>
                        <p className="text-blue-800 text-sm mt-1">{rec.description}</p>
                        <p className="text-blue-700 text-sm mt-2">
                          Expected Impact: {rec.expected_impact} | Confidence: {rec.confidence}%
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">AI insights will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Phase 4 Enhanced Business Intelligence System | 
            Last updated: {new Date(dashboardData?.metadata?.generated_at || Date.now()).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}