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
  Car, Wrench, Brain, Target, RefreshCw
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

export default function AIOptimeringPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [activeExperiments, setActiveExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New state variables for Central Command features
  const [aiMode, setAIMode] = useState('suggest'); // suggest, auto, full
  const [realtimeDecisions, setRealtimeDecisions] = useState<any[]>([]);
  const [aiDecisions, setAiDecisions] = useState({ today: 0, total: 0 });
  const [timeSaved, setTimeSaved] = useState({ hours: 0, tasks: 0 });
  const [aiAccuracy, setAiAccuracy] = useState({ percentage: 0 });
  const [learningMetrics, setLearningMetrics] = useState({ 
    improvements: 0,
    accuracyImprovement: 0,
    newPatterns: 0,
    modelUpdates: 0
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  // Helper functions for Central Command features
  const executeAIAction = async (actionType: string) => {
    try {
      const response = await fetch(`/api/ai-actions/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: aiMode })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update decision stream
        setRealtimeDecisions(prev => [result.decision, ...prev.slice(0, 49)]);
      }
    } catch (error) {
      console.error('AI Action Error:', error);
    }
  };

  const approveDecision = async (decisionId: string) => {
    try {
      await fetch(`/api/ai-decisions/${decisionId}/approve`, { method: 'POST' });
      setRealtimeDecisions(prev => 
        prev.map(d => d.id === decisionId ? {...d, status: 'approved'} : d)
      );
    } catch (error) {
      console.error('Approval Error:', error);
    }
  };

  const rejectDecision = async (decisionId: string) => {
    try {
      await fetch(`/api/ai-decisions/${decisionId}/reject`, { method: 'POST' });
      setRealtimeDecisions(prev => 
        prev.map(d => d.id === decisionId ? {...d, status: 'rejected'} : d)
      );
    } catch (error) {
      console.error('Rejection Error:', error);
    }
  };

  const overrideDecision = async (decisionId: string) => {
    try {
      await fetch(`/api/ai-decisions/${decisionId}/override`, { method: 'POST' });
      setRealtimeDecisions(prev => 
        prev.map(d => d.id === decisionId ? {...d, status: 'overridden'} : d)
      );
    } catch (error) {
      console.error('Override Error:', error);
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const calculateTimeSaved = (decisions: any[]) => {
    // Estimate 5 minutes saved per automated decision
    return decisions.length * 5 / 60; // Convert to hours
  };

  const calculateAccuracy = (decisions: any[]) => {
    const completed = decisions.filter(d => d.status === 'completed' || d.status === 'approved');
    const total = decisions.length;
    return total > 0 ? (completed.length / total) * 100 : 0;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Force mock data if API fails
      const FORCE_MOCK_DATA = false;
      
      // Fetch existing data + new central command data
      const [
        phase4Response,
        autonomousStatusResponse,
        aiDecisionsResponse,
        learningMetricsResponse,
        aiModeResponse
      ] = await Promise.all([
        fetch(`/api/enhanced-business-intelligence-simple?range=${selectedTimeRange}`).catch(() => null),
        fetch('/api/autonomous/status?detailed=true&metrics=true').catch(() => null),
        fetch('/api/ai-decisions/stream').catch(() => null),
        fetch('/api/ai-learning/metrics').catch(() => null),
        fetch('/api/ai-mode/current').catch(() => null)
      ]);
      
      if (!phase4Response || !phase4Response.ok) {
        throw new Error('Failed to fetch Enhanced BI data');
      }
      
      const phase4Data = await phase4Response.json();
      const autonomousData = autonomousStatusResponse?.ok ? await autonomousStatusResponse.json() : null;
      const decisionsData = aiDecisionsResponse?.ok ? await aiDecisionsResponse.json() : [];
      const learningData = learningMetricsResponse?.ok ? await learningMetricsResponse.json() : [];
      const modeData = aiModeResponse?.ok ? await aiModeResponse.json() : { mode: 'suggest' };
      
      // Combine all data
      const combinedData = {
        ...phase4Data,
        autonomous: autonomousData?.status || null,
        autonomousMetrics: autonomousData?.status?.detailedMetrics || null,
        realtimeDecisions: decisionsData || [],
        learningMetrics: learningData || [],
        currentMode: modeData.mode || 'suggest'
      };
      
      setDashboardData(combinedData);
      setRealtimeDecisions(decisionsData || []);
      setAIMode(modeData.mode || 'suggest');
      
      // Update AI metrics
      setAiDecisions({
        today: decisionsData.filter((d: any) => isToday(d.created_at)).length,
        total: decisionsData.length
      });
      
      const timeSavedToday = calculateTimeSaved(decisionsData.filter((d: any) => isToday(d.created_at)));
      setTimeSaved({ hours: timeSavedToday, tasks: decisionsData.filter((d: any) => isToday(d.created_at)).length });
      
      const accuracy = calculateAccuracy(decisionsData);
      setAiAccuracy({ percentage: accuracy });
      
      setLearningMetrics({
        improvements: learningData.length,
        accuracyImprovement: learningData.find((m: any) => m.metric_type === 'accuracy')?.average_improvement || 0,
        newPatterns: learningData.filter((m: any) => m.metric_type === 'pattern_recognition').length,
        modelUpdates: learningData.filter((m: any) => m.metric_type === 'model_update').length
      });
      
      // Fetch A/B experiments data
      const experimentsResponse = await fetch('/api/ab-experiments-simple');
      if (experimentsResponse.ok) {
        const experimentsData = await experimentsResponse.json();
        setActiveExperiments(experimentsData.experiments || []);
      }
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Enhanced mock data with central command features
      const mockData = getMockDashboardData();
      setDashboardData(mockData);
      
      // Set mock decisions
      const mockDecisions = [
        {
          id: '1',
          type: 'Route Optimization',
          module: 'staff',
          description: 'Optimera rutt för 3 flyttuppdrag i Södermalm',
          confidence: 92,
          impact: 'high',
          status: 'pending',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          type: 'Price Adjustment',
          module: 'pricing',
          description: 'Justera pris för återkommande kund baserat på historik',
          confidence: 87,
          impact: 'medium',
          status: 'executed',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
        }
      ];
      setRealtimeDecisions(mockDecisions);
      setAiDecisions({ today: 47, total: 847 });
      setTimeSaved({ hours: 3.9, tasks: 47 });
      setAiAccuracy({ percentage: 94.5 });
      setLearningMetrics({
        improvements: 12,
        accuracyImprovement: 8.5,
        newPatterns: 23,
        modelUpdates: 4
      });
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Add missing functions for automation rules and system actions
  const toggleAutomationRule = async (ruleIndex: number) => {
    try {
      const response = await fetch('/api/automation-rules/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleIndex })
      });
      
      if (response.ok) {
        // Update local state or refetch data
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to toggle automation rule:', error);
    }
  };

  const executeSystemAction = async (action: string) => {
    try {
      const response = await fetch(`/api/system-actions/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        // Show success message or update UI
        console.log(`System action ${action} executed successfully:`, result);
        fetchDashboardData();
      }
    } catch (error) {
      console.error(`Failed to execute system action ${action}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002A5C] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar AI-analyser...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#002A5C', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            AI-Optimering & Business Intelligence
          </h1>
          <p className="text-gray-600 mt-1">
            Phase 4 Enhanced BI System med Cloud ML, IoT & A/B-testning
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={error ? "destructive" : "success"}>
            {error ? "Demo Mode" : dashboardData?.metadata?.mode || "Live"}
          </Badge>
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Senaste 7 dagarna</option>
            <option value="30d">Senaste 30 dagarna</option>
            <option value="90d">Senaste 90 dagarna</option>
          </select>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800">
                API-fel: {error}. Visar demodata.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Intäktsökning</p>
                <p className="text-2xl font-bold text-gray-900">
                  +{dashboardData?.metrics?.revenue_change?.toFixed(1) || '15.3'}%
                </p>
                <p className="text-xs text-gray-500 mt-1">vs föregående period</p>
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
                <p className="text-sm font-medium text-gray-600">Förväntat antal bokningar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.metrics?.predicted_bookings || 142}
                </p>
                <p className="text-xs text-gray-500 mt-1">nästa vecka</p>
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
                <p className="text-sm font-medium text-gray-600">Fordonshälsa</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.realtimeMetrics?.vehicle_health_score || 87}%
                </p>
                <p className="text-xs text-gray-500 mt-1">flottans hälsopoäng</p>
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
                <p className="text-sm font-medium text-gray-600">Genomsnittlig CLV</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.metrics?.avg_clv || 48500)}
                </p>
                <p className="text-xs text-gray-500 mt-1">kundlivsvärde</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="command" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="command">Command Center</TabsTrigger>
          <TabsTrigger value="decisions">Decision Stream</TabsTrigger>
          <TabsTrigger value="overview">Performance Analytics</TabsTrigger>
          <TabsTrigger value="autonomous">Autonoma Beslut</TabsTrigger>
          <TabsTrigger value="insights">Learning Insights</TabsTrigger>
          <TabsTrigger value="customers">Kunder</TabsTrigger>
          <TabsTrigger value="forecasting">Prognoser</TabsTrigger>
          <TabsTrigger value="iot">IoT Flotta</TabsTrigger>
          <TabsTrigger value="experiments">A/B-tester</TabsTrigger>
          <TabsTrigger value="config">System Configuration</TabsTrigger>
        </TabsList>

        {/* Command Center Tab */}
        <TabsContent value="command" className="space-y-6">
          {/* Glassmorphism Header with Mode Switcher */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
            <div className="relative flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  🧠 AI Command Center
                </h2>
                <p className="text-white/70 mt-2">Central AI Brain - Koordinerar alla intelligenta beslut</p>
              </div>
              
              {/* Mode Switcher */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4">
                <h3 className="text-white text-sm mb-3">AI Mode</h3>
                <div className="flex space-x-2">
                  {['suggest', 'auto', 'full'].map((modeOption) => (
                    <button
                      key={modeOption}
                      onClick={() => setAIMode(modeOption)}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        aiMode === modeOption
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {modeOption === 'suggest' && '💡 Suggest'}
                      {modeOption === 'auto' && '⚡ Auto'}
                      {modeOption === 'full' && '🚀 Full'}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs text-white/60">
                  {aiMode === 'suggest' && 'AI föreslår - du godkänner'}
                  {aiMode === 'auto' && 'AI agerar automatiskt - du kan override'}
                  {aiMode === 'full' && 'Fullständig autonomi - minimal input'}
                </div>
              </div>
            </div>
          </div>

          {/* Central Command Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="backdrop-blur-xl bg-white/90 border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Decisions Today</p>
                    <p className="text-2xl font-bold text-gray-900">{aiDecisions.today || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">automated decisions</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/90 border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Time Saved</p>
                    <p className="text-2xl font-bold text-gray-900">{timeSaved.hours.toFixed(1) || 0}h</p>
                    <p className="text-xs text-gray-500 mt-1">admin time saved today</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/90 border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900">{aiAccuracy.percentage.toFixed(1) || 0}%</p>
                    <p className="text-xs text-gray-500 mt-1">decision accuracy</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/90 border border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Learning</p>
                    <p className="text-2xl font-bold text-gray-900">{learningMetrics.improvements || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">improvements made</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Module Status */}
          <Card>
            <CardHeader>
              <CardTitle>🤖 AI Module Status & Coordination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'AI Kundtjänst', status: 'active', performance: 95, decisions: 45 },
                  { name: 'AI Marknadsföring', status: 'active', performance: 88, decisions: 23 },
                  { name: 'Staff Optimization', status: 'active', performance: 92, decisions: 67 },
                  { name: 'Route Planning', status: 'learning', performance: 78, decisions: 34 }
                ].map((module, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{module.name}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        module.status === 'active' ? 'bg-green-400' :
                        module.status === 'learning' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Performance: {module.performance}%</div>
                      <div>Decisions: {module.decisions}/day</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                          style={{width: `${module.performance}%`}}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ Quick AI Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '🎯', label: 'Optimize Routes', action: 'optimizeRoutes' },
                  { icon: '💰', label: 'Update Pricing', action: 'updatePricing' },
                  { icon: '👥', label: 'Assign Staff', action: 'assignStaff' },
                  { icon: '📧', label: 'Send Updates', action: 'sendUpdates' }
                ].map((action, index) => (
                  <button
                    key={index}
                    onClick={() => executeAIAction(action.action)}
                    className="backdrop-blur-xl bg-white/50 border border-white/20 rounded-xl p-4 hover:bg-white/70 transition-all duration-300 text-center"
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <div className="text-gray-700 text-sm">{action.label}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decision Stream Tab */}
        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>🔄 Real-time AI Decision Stream</CardTitle>
                <Badge variant={aiMode === 'full' ? 'default' : 'secondary'}>
                  {aiMode === 'suggest' && '💡 Suggestion Mode'}
                  {aiMode === 'auto' && '⚡ Auto Mode'} 
                  {aiMode === 'full' && '🚀 Full Autonomy'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {realtimeDecisions.map((decision, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4 border-l-4 border-purple-400">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{decision.type}</h4>
                          <Badge variant="outline" className="text-xs">
                            {decision.module}
                          </Badge>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{decision.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Confidence: {decision.confidence}%</span>
                          <span>Impact: {decision.impact}</span>
                          <span>{new Date(decision.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        {aiMode === 'suggest' && decision.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => approveDecision(decision.id)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button 
                              onClick={() => rejectDecision(decision.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                        {aiMode === 'auto' && decision.status === 'executed' && (
                          <button 
                            onClick={() => overrideDecision(decision.id)}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200 transition-colors"
                          >
                            ↶ Override
                          </button>
                        )}
                        {decision.status === 'completed' && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Decision Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Pending Approval</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {realtimeDecisions.filter(d => d.status === 'pending').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Auto Executed</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {realtimeDecisions.filter(d => d.status === 'executed').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Completed</h3>
                <p className="text-3xl font-bold text-green-600">
                  {realtimeDecisions.filter(d => d.status === 'completed').length}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Intäktstrend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', revenue: 1800000 },
                    { month: 'Feb', revenue: 1950000 },
                    { month: 'Mar', revenue: 2100000 },
                    { month: 'Apr', revenue: 2250000 },
                    { month: 'Maj', revenue: 2400000 },
                    { month: 'Jun', revenue: 2680000 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value/1000}k`} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="revenue" stroke="#002A5C" strokeWidth={3} name="Intäkter" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Kundsegment</CardTitle>
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <CardTitle>Systemvarningar</CardTitle>
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

        <TabsContent value="autonomous" className="space-y-4">
          {/* Autonomous System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Autonominivå</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {((dashboardData?.autonomous?.autonomyLevel || 0.99) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">av alla beslut</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Totala Beslut</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.autonomous?.totalDecisions || '847'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">senaste 24h</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Systemhälsa</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(((dashboardData?.autonomous?.overallPerformance?.systemUptime || 0.998) * 100)).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">drifttid</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mänsklig Granskning</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round((1 - (dashboardData?.autonomous?.autonomousRate || 0.923)) * (dashboardData?.autonomous?.totalDecisions || 847))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">beslut i kö</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Decision Engine Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Beslutsmotorprestanda</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { engine: 'Prissättning', autonomous: 94, confidence: 89, decisions: 523 },
                    { engine: 'Operativ', autonomous: 87, confidence: 82, decisions: 324 },
                    { engine: 'Strategisk', autonomous: 0, confidence: 0, decisions: 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="engine" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="autonomous" fill="#3B82F6" name="Autonominivå %" />
                    <Bar dataKey="confidence" fill="#10B981" name="Förtroende %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Affärseffekt Autonoma Beslut</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Prissättningsoptimering', value: 45000, color: '#3B82F6' },
                        { name: 'Operativ Effektivitet', value: 38000, color: '#10B981' },
                        { name: 'Kundretention', value: 44500, color: '#F59E0B' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                    >
                      {[{ color: '#3B82F6' }, { color: '#10B981' }, { color: '#F59E0B' }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} SEK`, 'Intäktseffekt']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* System Health & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Motorhälsa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboardData?.autonomous?.systemHealth || {
                    pricing: { status: 'healthy', lastCheck: Date.now() },
                    operational: { status: 'healthy', lastCheck: Date.now() }
                  }).map(([engine, health]: [string, any]) => (
                    <div key={engine} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          health.status === 'healthy' ? 'bg-green-500' : 
                          health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium capitalize">{engine === 'pricing' ? 'Prissättning' : 'Operativ'}</span>
                      </div>
                      <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
                        {health.status === 'healthy' ? 'Frisk' : health.status === 'degraded' ? 'Nedsatt' : 'Fel'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI-rekommendationer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(dashboardData?.autonomous?.recommendations || [
                    { type: 'system_autonomy', engine: 'master', priority: 'high', recommendation: 'Optimera beslutströsklar för högre autonomi' },
                    { type: 'confidence_improvement', engine: 'pricing', priority: 'medium', recommendation: 'Förbättra kontextanalys för prissättning' }
                  ]).slice(0, 5).map((rec: any, index: number) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                      rec.priority === 'medium' ? 'border-amber-500 bg-amber-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{rec.type === 'system_autonomy' ? 'Systemautonomi' : 'Förbättring'}</p>
                          <p className="text-sm text-gray-600">{rec.recommendation}</p>
                        </div>
                        <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                          {rec.priority === 'high' ? 'Hög' : rec.priority === 'medium' ? 'Medium' : 'Låg'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phase 4 Integration Status */}
          {dashboardData?.autonomous?.phase4Integration && (
            <Card>
              <CardHeader>
                <CardTitle>Fas 4 Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      dashboardData.autonomous.phase4Integration.biDataConnection ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm">Enhanced BI Anslutning</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      dashboardData.autonomous.phase4Integration.dashboardSync ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm">Dashboard Synkning</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm">Senaste BI-uppdatering: </span>
                    <span className="text-sm font-medium">{dashboardData.autonomous.phase4Integration.lastBIUpdate ? 
                      new Date(dashboardData.autonomous.phase4Integration.lastBIUpdate).toLocaleString('sv-SE') : 
                      'Okänd'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Module Coordination */}
          <Card>
            <CardHeader>
              <CardTitle>AI Module Coordination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Marketing AI</p>
                    <p className="text-xs text-gray-600">Active • 14 decisions/h</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <Car className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Fleet AI</p>
                    <p className="text-xs text-gray-600">Active • 28 decisions/h</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Customer AI</p>
                    <p className="text-xs text-gray-600">Active • 42 decisions/h</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-3">Cross-Module Learning</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Fleet → Marketing</span>
                      <Badge variant="outline" className="text-xs">3 insights shared</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Customer → Fleet</span>
                      <Badge variant="outline" className="text-xs">5 patterns detected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Marketing → Customer</span>
                      <Badge variant="outline" className="text-xs">2 optimizations applied</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Kundanalys & Segmentering</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Avancerad K-means klusteranalys med Customer Lifetime Value (CLV) prediktioner
              </p>
              <div className="space-y-4">
                {dashboardData?.customerSegments?.distribution?.map((segment: any) => (
                  <div key={segment.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold">{segment.name}</h4>
                      <p className="text-sm text-gray-600">{segment.count} kunder</p>
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
              <CardTitle>Cloud ML Efterfrågeprognoser</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                AWS SageMaker LSTM-modeller som ger 95%+ noggrannhet i efterfrågeprediktioner
              </p>
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-[#002A5C] mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">AI-prognosmotor aktiv</p>
                <p className="text-gray-600">
                  Konfidens: {Math.round((dashboardData?.metrics?.demand_confidence || 0.87) * 100)}%
                </p>
              </div>
              {dashboardData?.demandForecast?.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData.demandForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="predicted_bookings" stroke="#002A5C" fill="#002A5C" fillOpacity={0.6} name="Förväntat" />
                    <Area type="monotone" dataKey="actual_bookings" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} name="Faktiskt" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iot">
          <Card>
            <CardHeader>
              <CardTitle>IoT Flotteövervakning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Realtidsövervakning av fordonshälsa med prediktiva underhållsvarningar
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <Wrench className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-green-800">
                    {dashboardData?.vehicleHealth?.fleet_health_score || 87}%
                  </p>
                  <p className="text-green-700">Flottans hälsopoäng</p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <AlertTriangle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-blue-800">
                    {dashboardData?.vehicleHealth?.critical_alerts || 0}
                  </p>
                  <p className="text-blue-700">Kritiska varningar</p>
                </div>
              </div>
              
              {dashboardData?.vehicleHealth?.maintenance_predictions?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Underhållsprediktioner</h4>
                  <div className="space-y-2">
                    {dashboardData.vehicleHealth.maintenance_predictions.map((vehicle: any) => (
                      <div key={vehicle.vehicle_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">{vehicle.vehicle_id}</span>
                        <span className="text-sm">
                          Underhåll om {vehicle.days_to_maintenance} dagar
                        </span>
                        <Badge variant={
                          vehicle.priority === 'critical' ? 'destructive' :
                          vehicle.priority === 'high' ? 'default' : 'secondary'
                        }>
                          {vehicle.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments">
          <Card>
            <CardHeader>
              <CardTitle>A/B-testning Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Statistiskt testramverk med Bayesiansk analys
              </p>
              <div className="space-y-4">
                {activeExperiments.length > 0 ? (
                  activeExperiments.map((experiment: any) => (
                    <div key={experiment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{experiment.name}</h4>
                        <Badge variant={experiment.status === 'active' ? 'default' : 'secondary'}>
                          {experiment.status === 'active' ? 'Aktiv' : 'Slutförd'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{experiment.description}</p>
                      {experiment.statistical_significance && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Statistisk signifikans: {experiment.statistical_significance}%</span>
                          <span className="text-green-600">
                            +{experiment.projected_impact || experiment.control_group?.conversion_rate}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Inga aktiva experiment</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* Learning Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Learning Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {learningMetrics.improvements || 127}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">improvements/week</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Accuracy Gain</p>
                    <p className="text-2xl font-bold text-gray-900">
                      +{learningMetrics.accuracyImprovement || 12.4}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">last 30 days</p>
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
                    <p className="text-sm font-medium text-gray-600">New Patterns</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {learningMetrics.newPatterns || 89}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">discovered</p>
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
                    <p className="text-sm font-medium text-gray-600">Model Updates</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {learningMetrics.modelUpdates || 15}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">this month</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Insights */}
          <Card>
            <CardHeader>
              <CardTitle>AI Learning Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recommendations?.length > 0 ? (
                  dashboardData.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-[#002A5C]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                          <p className="text-gray-700 text-sm mt-1">{rec.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-600">
                              Impact: <span className="font-medium">{rec.expected_impact}</span>
                            </span>
                            <span className="text-sm text-gray-600">
                              Confidence: <span className="font-medium">{rec.confidence}%</span>
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="ml-4">
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">AI learning insights will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Learning Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { week: 'W1', accuracy: 78, patterns: 12, improvements: 34 },
                  { week: 'W2', accuracy: 82, patterns: 18, improvements: 45 },
                  { week: 'W3', accuracy: 85, patterns: 25, improvements: 52 },
                  { week: 'W4', accuracy: 87, patterns: 31, improvements: 68 },
                  { week: 'W5', accuracy: 89, patterns: 38, improvements: 74 },
                  { week: 'W6', accuracy: 90.4, patterns: 44, improvements: 89 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="accuracy" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Accuracy %" />
                  <Area type="monotone" dataKey="patterns" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Patterns" />
                  <Area type="monotone" dataKey="improvements" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Improvements" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Module-Specific Learning */}
          <Card>
            <CardHeader>
              <CardTitle>Module Learning Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Pricing Engine</h4>
                    <Badge variant="default">Active Learning</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Accuracy improvement</span>
                      <span className="font-medium text-green-600">+8.4%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">New patterns learned</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last update</span>
                      <span className="font-medium">2 hours ago</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Route Optimization</h4>
                    <Badge variant="outline">Training</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Accuracy improvement</span>
                      <span className="font-medium text-green-600">+5.2%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">New patterns learned</span>
                      <span className="font-medium">18</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last update</span>
                      <span className="font-medium">45 minutes ago</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Customer Segmentation</h4>
                    <Badge variant="default">Active Learning</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Accuracy improvement</span>
                      <span className="font-medium text-green-600">+12.1%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">New patterns learned</span>
                      <span className="font-medium">31</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last update</span>
                      <span className="font-medium">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          {/* System Mode Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>System Mode Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Global AI Mode</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      onClick={() => setAIMode('suggest')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        aiMode === 'suggest' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h5 className="font-semibold">Suggest Mode</h5>
                      <p className="text-sm text-gray-600 mt-1">AI provides recommendations for human approval</p>
                    </div>
                    <div 
                      onClick={() => setAIMode('auto')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        aiMode === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h5 className="font-semibold">Auto Mode</h5>
                      <p className="text-sm text-gray-600 mt-1">AI executes routine decisions automatically</p>
                    </div>
                    <div 
                      onClick={() => setAIMode('full')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        aiMode === 'full' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h5 className="font-semibold">Full Autonomy</h5>
                      <p className="text-sm text-gray-600 mt-1">AI operates with minimal human intervention</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3">Module-Specific Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Pricing Engine</h5>
                        <p className="text-sm text-gray-600">Dynamic pricing decisions</p>
                      </div>
                      <select className="px-3 py-1 border rounded-md text-sm">
                        <option value="suggest">Suggest</option>
                        <option value="auto">Auto</option>
                        <option value="full">Full</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Route Optimization</h5>
                        <p className="text-sm text-gray-600">Fleet routing decisions</p>
                      </div>
                      <select className="px-3 py-1 border rounded-md text-sm">
                        <option value="suggest">Suggest</option>
                        <option value="auto" selected>Auto</option>
                        <option value="full">Full</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Customer Service</h5>
                        <p className="text-sm text-gray-600">Customer interaction handling</p>
                      </div>
                      <select className="px-3 py-1 border rounded-md text-sm">
                        <option value="suggest" selected>Suggest</option>
                        <option value="auto">Auto</option>
                        <option value="full">Full</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decision Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle>Decision Thresholds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Auto-approval threshold</label>
                    <span className="text-sm font-bold">95%</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="95" className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Human review threshold</label>
                    <span className="text-sm font-bold">75%</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="75" className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Risk tolerance level</label>
                    <span className="text-sm font-bold">Medium</span>
                  </div>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>Very Low</option>
                    <option>Low</option>
                    <option selected>Medium</option>
                    <option>High</option>
                    <option>Very High</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Integration Settings */}
          <Card>
            <CardHeader>
              <CardTitle>API Integration Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">API Rate Limit</label>
                    <input type="number" defaultValue="1000" className="w-full mt-1 px-3 py-2 border rounded-md" />
                    <p className="text-xs text-gray-500 mt-1">requests per minute</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Timeout Duration</label>
                    <input type="number" defaultValue="30" className="w-full mt-1 px-3 py-2 border rounded-md" />
                    <p className="text-xs text-gray-500 mt-1">seconds</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Retry Attempts</label>
                    <input type="number" defaultValue="3" className="w-full mt-1 px-3 py-2 border rounded-md" />
                    <p className="text-xs text-gray-500 mt-1">maximum retries</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cache Duration</label>
                    <input type="number" defaultValue="300" className="w-full mt-1 px-3 py-2 border rounded-md" />
                    <p className="text-xs text-gray-500 mt-1">seconds</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <h5 className="font-medium">Enable Real-time Sync</h5>
                    <p className="text-sm text-gray-600">Sync decisions across all modules</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Configuration */}
          <div className="flex justify-end gap-4">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Configuration</Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Additional Command Center Components - After Tabs */}
      {/* Automation Rules */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 Automation Rules & Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { rule: 'Auto-approve bookings under 50m³', description: 'Instantly confirm small moves without manual review', impact: 'Saves 2h/day', enabled: true },
              { rule: 'Dynamic pricing for repeat customers', description: 'Apply loyalty discounts based on history', impact: '+12% retention', enabled: true },
              { rule: 'Smart staff assignment', description: 'Match crew to job requirements automatically', impact: '87% match rate', enabled: true },
              { rule: 'Proactive customer updates', description: 'Send status updates without prompting', impact: '4.8★ satisfaction', enabled: false },
              { rule: 'Predictive maintenance alerts', description: 'Schedule service before breakdowns', impact: '0 breakdowns', enabled: true }
            ].map((rule, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{rule.rule}</h4>
                    <Badge variant={rule.enabled ? 'default' : 'secondary'} className="text-xs">
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{rule.description}</p>
                  <p className="text-xs text-gray-500 font-medium">Impact: {rule.impact}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => toggleAutomationRule(index)}
                    size="sm"
                    variant={rule.enabled ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>⚙️ Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learning Rate Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">🧠 AI Learning Configuration</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Learning Rate</span>
                  <select className="text-sm border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600">
                    <option value="conservative">Conservative</option>
                    <option value="balanced" selected>Balanced</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Threshold</span>
                  <input 
                    type="range" 
                    min="50" 
                    max="95" 
                    value="85" 
                    className="w-24"
                  />
                  <span className="text-sm font-medium">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Auto-Training</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">🔔 Notification Preferences</h4>
              <div className="space-y-3">
                {[
                  { label: 'Critical Decisions', checked: true },
                  { label: 'Performance Alerts', checked: true },
                  { label: 'Learning Updates', checked: false },
                  { label: 'System Health', checked: true },
                  { label: 'Revenue Insights', checked: true }
                ].map((notification, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{notification.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={notification.checked} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Performance Targets */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">🎯 Performance Targets</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { metric: 'AI Accuracy', current: '94%', target: '95%', status: 'improving' },
                { metric: 'Time Savings', current: '6.2h/day', target: '8h/day', status: 'improving' },
                { metric: 'Revenue Impact', current: '12%', target: '15%', status: 'on-track' },
                { metric: 'Customer Satisfaction', current: '4.8/5', target: '4.9/5', status: 'excellent' }
              ].map((target, index) => (
                <div key={index} className="text-center p-3 bg-white dark:bg-gray-800 rounded border">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">{target.metric}</h5>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{target.current}</p>
                  <p className="text-xs text-gray-500">Target: {target.target}</p>
                  <div className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                    target.status === 'improving' ? 'bg-green-100 text-green-800' :
                    target.status === 'on-track' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {target.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔧 System Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🔄', label: 'Reset AI Learning', action: 'reset_learning', variant: 'destructive' },
              { icon: '📊', label: 'Export Data', action: 'export_data', variant: 'outline' },
              { icon: '🔒', label: 'Backup System', action: 'backup_system', variant: 'default' },
              { icon: '⚡', label: 'Optimize Performance', action: 'optimize_performance', variant: 'default' },
              { icon: '🧹', label: 'Clean Cache', action: 'clean_cache', variant: 'outline' },
              { icon: '📈', label: 'Generate Report', action: 'generate_report', variant: 'default' },
              { icon: '🔍', label: 'System Audit', action: 'system_audit', variant: 'outline' },
              { icon: '⚙️', label: 'Maintenance Mode', action: 'maintenance_mode', variant: 'destructive' }
            ].map((action, index) => (
              <Button
                key={index}
                onClick={() => executeSystemAction(action.action)}
                variant={action.variant as any}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                disabled={loading}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs text-center">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Phase 4 Enhanced Business Intelligence System | 
          Senast uppdaterad: {new Date(dashboardData?.metadata?.generated_at || Date.now()).toLocaleString('sv-SE')}
        </p>
      </div>
    </div>
  );
}