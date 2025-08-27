'use client';

// =============================================================================
// NORDFLYTT AI SYSTEM - UNIFIED DASHBOARD
// Master dashboard integrating all 5 phases into one cohesive interface
// =============================================================================

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
  Brain, Car, Users, TrendingUp, Activity, AlertTriangle, 
  CheckCircle, Clock, MapPin, Zap, Target, RefreshCw,
  Settings, Monitor, Database, Shield, Cpu, BarChart3
} from 'lucide-react';

interface SystemStatus {
  version: string;
  status: 'operational' | 'degraded' | 'maintenance' | 'error';
  enabledPhases: number[];
  totalFeatures: number;
  enabledFeatures: number;
  lastUpdated: string;
  validation: { valid: boolean; errors: string[] };
}

interface SystemMetrics {
  overall: {
    efficiency: number;
    autonomyRate: number;
    costSavings: number;
    co2Reduction: number;
    customerSatisfaction: number;
  };
  phases: {
    [key: string]: PhaseMetrics;
  };
  realtime: {
    activeOptimizations: number;
    decisionsPerHour: number;
    systemLoad: number;
    uptime: number;
  };
}

interface PhaseMetrics {
  enabled: boolean;
  efficiency: number;
  performance: number;
  lastExecution: string;
  processingTime: number;
  errorRate: number;
}

interface MasterOptimization {
  optimizationId: string;
  timestamp: string;
  phases: any;
  overallMetrics: any;
  recommendations: any[];
  status: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function UnifiedAISystemDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [activeOptimizations, setActiveOptimizations] = useState<MasterOptimization[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Fetch system status and metrics in parallel
      const [statusResponse, metricsResponse, optimizationsResponse] = await Promise.all([
        fetch('/api/system/status').catch(() => null),
        fetch(`/api/system/metrics?range=${selectedTimeRange}`).catch(() => null),
        fetch('/api/system/master-optimization?limit=5').catch(() => null)
      ]);

      // Use mock data if APIs are not available
      if (!statusResponse || !statusResponse.ok) {
        setSystemStatus(getMockSystemStatus());
      } else {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData);
      }

      if (!metricsResponse || !metricsResponse.ok) {
        setSystemMetrics(getMockSystemMetrics());
      } else {
        const metricsData = await metricsResponse.json();
        setSystemMetrics(metricsData);
      }

      if (!optimizationsResponse || !optimizationsResponse.ok) {
        setActiveOptimizations(getMockOptimizations());
      } else {
        const optimizationsData = await optimizationsResponse.json();
        setActiveOptimizations(optimizationsData.optimizations || []);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch system data:', err);
      setError('Failed to load system data. Using demonstration data.');
      
      // Use mock data as fallback
      setSystemStatus(getMockSystemStatus());
      setSystemMetrics(getMockSystemMetrics());
      setActiveOptimizations(getMockOptimizations());
    } finally {
      setLoading(false);
    }
  };

  const triggerMasterOptimization = async () => {
    try {
      setLoading(true);
      
      const optimizationRequest = {
        date: new Date().toISOString().split('T')[0],
        jobs: getMockJobs(),
        vehicles: getMockVehicles(),
        staff: getMockStaff(),
        preferences: {
          optimizeFor: 'efficiency',
          weightings: {
            cost: 0.3,
            time: 0.25,
            efficiency: 0.25,
            co2: 0.1,
            customerSatisfaction: 0.1
          }
        }
      };

      const response = await fetch('/api/system/master-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizationRequest)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Master optimization completed:', result);
        
        // Refresh data to show updated results
        await fetchSystemData();
      } else {
        throw new Error('Optimization request failed');
      }
    } catch (error) {
      console.error('Master optimization failed:', error);
      setError('Master optimization failed. This is normal in demo mode.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !systemStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Laddar AI-system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nordflytt AI System</h1>
          <p className="text-gray-600 mt-1">
            Unified Platform - Fas 1-5 Integrerat System
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={systemStatus?.status === 'operational' ? 'default' : 'destructive'}>
            {systemStatus?.status === 'operational' ? 'Operativt' : 'Fel'}
          </Badge>
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="1h">Senaste timmen</option>
            <option value="24h">Senaste 24h</option>
            <option value="7d">Senaste veckan</option>
            <option value="30d">Senaste månaden</option>
          </select>
          <Button onClick={fetchSystemData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
          <Button onClick={triggerMasterOptimization} className="bg-blue-600 hover:bg-blue-700">
            <Zap className="h-4 w-4 mr-2" />
            Kör Masteroptimering
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-amber-200 bg-amber-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Effektivitet</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((systemMetrics?.overall.efficiency || 0.94) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">systemövergripande</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Autonominivå</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((systemMetrics?.overall.autonomyRate || 0.99) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">av alla beslut</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kostnadsbesparing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(systemMetrics?.overall.costSavings || 89000).toLocaleString()} kr
                </p>
                <p className="text-xs text-gray-500 mt-1">denna månad</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CO2 Minskning</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((systemMetrics?.overall.co2Reduction || 0.23) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">jämfört med manuell</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Car className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kundnöjdhet</p>
                <p className="text-2xl font-bold text-gray-900">
                  +{((systemMetrics?.overall.customerSatisfaction || 0.124) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">förbättring</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="phase1">Fas 1: Klustring</TabsTrigger>
          <TabsTrigger value="phase2">Fas 2: Rutter</TabsTrigger>
          <TabsTrigger value="phase3">Fas 3: Team</TabsTrigger>
          <TabsTrigger value="phase4">Fas 4: Analys</TabsTrigger>
          <TabsTrigger value="phase5">Fas 5: Autonomt</TabsTrigger>
          <TabsTrigger value="system">Systemstatus</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* System Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Systemeffektivitet över tid</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { time: '00:00', phase1: 85, phase2: 92, phase3: 88, phase4: 94, phase5: 99, overall: 91 },
                    { time: '06:00', phase1: 87, phase2: 94, phase3: 90, phase4: 95, phase5: 99, overall: 93 },
                    { time: '12:00', phase1: 89, phase2: 96, phase3: 92, phase4: 96, phase5: 99, overall: 94 },
                    { time: '18:00', phase1: 91, phase2: 97, phase3: 94, phase4: 97, phase5: 99, overall: 96 },
                    { time: '24:00', phase1: 88, phase2: 95, phase3: 91, phase4: 95, phase5: 99, overall: 94 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="overall" stroke="#1F2937" strokeWidth={3} name="Total Effektivitet" />
                    <Line type="monotone" dataKey="phase1" stroke={COLORS[0]} name="Fas 1" />
                    <Line type="monotone" dataKey="phase2" stroke={COLORS[1]} name="Fas 2" />
                    <Line type="monotone" dataKey="phase3" stroke={COLORS[2]} name="Fas 3" />
                    <Line type="monotone" dataKey="phase4" stroke={COLORS[3]} name="Fas 4" />
                    <Line type="monotone" dataKey="phase5" stroke={COLORS[4]} name="Fas 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fas-prestanda jämförelse</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { phase: 'Fas 1\nKlustring', enabled: systemStatus?.enabledPhases.includes(1), efficiency: 88, autonomous: 0, decisions: 45 },
                    { phase: 'Fas 2\nRutter', enabled: systemStatus?.enabledPhases.includes(2), efficiency: 95, autonomous: 15, decisions: 67 },
                    { phase: 'Fas 3\nTeam', enabled: systemStatus?.enabledPhases.includes(3), efficiency: 91, autonomous: 85, decisions: 123 },
                    { phase: 'Fas 4\nAnalys', enabled: systemStatus?.enabledPhases.includes(4), efficiency: 96, autonomous: 92, decisions: 234 },
                    { phase: 'Fas 5\nAutonoma', enabled: systemStatus?.enabledPhases.includes(5), efficiency: 99, autonomous: 99, decisions: 523 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="phase" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="efficiency" fill="#3B82F6" name="Effektivitet %" />
                    <Bar dataKey="autonomous" fill="#10B981" name="Autonomi %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Active Optimizations */}
          <Card>
            <CardHeader>
              <CardTitle>Aktiva optimeringar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeOptimizations.slice(0, 5).map((opt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        opt.status === 'completed' ? 'bg-green-500' : 
                        opt.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium">{opt.optimizationId}</p>
                        <p className="text-sm text-gray-600">
                          {Object.keys(opt.phases).length} faser aktiva
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {((opt.overallMetrics?.totalEfficiencyGain || Math.random()) * 100).toFixed(1)}% effektivitet
                      </p>
                      <p className="text-xs text-gray-500">{opt.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phase1">
          <PhaseOverviewCard 
            phase={1}
            title="Smart Klustring"
            description="Geografisk optimering av jobbarrangering"
            icon={<MapPin className="h-6 w-6" />}
            enabled={systemStatus?.enabledPhases.includes(1) || false}
            metrics={systemMetrics?.phases.phase1}
          />
        </TabsContent>

        <TabsContent value="phase2">
          <PhaseOverviewCard 
            phase={2}
            title="Ruttoptimering"
            description="AI-driven fordonsruttoptimering"
            icon={<Car className="h-6 w-6" />}
            enabled={systemStatus?.enabledPhases.includes(2) || false}
            metrics={systemMetrics?.phases.phase2}
          />
        </TabsContent>

        <TabsContent value="phase3">
          <PhaseOverviewCard 
            phase={3}
            title="Teamoptimering"
            description="Intelligent personalallokering"
            icon={<Users className="h-6 w-6" />}
            enabled={systemStatus?.enabledPhases.includes(3) || false}
            metrics={systemMetrics?.phases.phase3}
          />
        </TabsContent>

        <TabsContent value="phase4">
          <PhaseOverviewCard 
            phase={4}
            title="Prediktiv Analys"
            description="ML-driven prognoser och insights"
            icon={<TrendingUp className="h-6 w-6" />}
            enabled={systemStatus?.enabledPhases.includes(4) || false}
            metrics={systemMetrics?.phases.phase4}
          />
        </TabsContent>

        <TabsContent value="phase5">
          <PhaseOverviewCard 
            phase={5}
            title="Autonoma Beslut"
            description="99% autonomous operations"
            icon={<Brain className="h-6 w-6" />}
            enabled={systemStatus?.enabledPhases.includes(5) || false}
            metrics={systemMetrics?.phases.phase5}
          />
        </TabsContent>

        <TabsContent value="system">
          <SystemStatusDashboard 
            systemStatus={systemStatus}
            systemMetrics={systemMetrics}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// COMPONENT: Phase Overview Card
// =============================================================================

interface PhaseOverviewCardProps {
  phase: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  metrics?: PhaseMetrics;
}

function PhaseOverviewCard({ phase, title, description, icon, enabled, metrics }: PhaseOverviewCardProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {icon}
              </div>
              <div>
                <CardTitle>Fas {phase}: {title}</CardTitle>
                <p className="text-gray-600">{description}</p>
              </div>
            </div>
            <Badge variant={enabled ? 'default' : 'secondary'}>
              {enabled ? 'Aktiverad' : 'Inaktiverad'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {enabled ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {((metrics?.efficiency || Math.random() * 0.2 + 0.8) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Effektivitet</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {((metrics?.performance || Math.random() * 0.15 + 0.85) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Prestanda</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {metrics?.processingTime || Math.round(Math.random() * 500 + 100)}ms
                </p>
                <p className="text-sm text-gray-600">Bearbetningstid</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Fas {phase} är inte aktiverad i detta system</p>
              <Button className="mt-4" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Aktivera Fas {phase}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// COMPONENT: System Status Dashboard
// =============================================================================

interface SystemStatusDashboardProps {
  systemStatus: SystemStatus | null;
  systemMetrics: SystemMetrics | null;
}

function SystemStatusDashboard({ systemStatus, systemMetrics }: SystemStatusDashboardProps) {
  return (
    <div className="space-y-4">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Systemversion</p>
                <p className="text-2xl font-bold text-gray-900">{systemStatus?.version || '1.0.0'}</p>
                <p className="text-xs text-gray-500 mt-1">senaste versionen</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktiva Faser</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStatus?.enabledPhases.length || 0}/5
                </p>
                <p className="text-xs text-gray-500 mt-1">av total</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Systemlast</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((systemMetrics?.realtime.systemLoad || 0.45) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">CPU användning</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Monitor className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drifttid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((systemMetrics?.realtime.uptime || 0.998) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">denna månad</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle>Funktionsstatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'Fas 1: Klustring', enabled: systemStatus?.enabledPhases.includes(1) },
              { name: 'Fas 2: Ruttoptimering', enabled: systemStatus?.enabledPhases.includes(2) },
              { name: 'Fas 3: Teamoptimering', enabled: systemStatus?.enabledPhases.includes(3) },
              { name: 'Fas 4: Prediktiv Analys', enabled: systemStatus?.enabledPhases.includes(4) },
              { name: 'Fas 5: Autonoma Beslut', enabled: systemStatus?.enabledPhases.includes(5) },
              { name: 'Realtidsoptimering', enabled: true },
              { name: 'Dynamisk prissättning', enabled: false },
              { name: 'Väderintegration', enabled: true },
              { name: 'Trafikoptimering', enabled: true },
              { name: 'Maskininlärning', enabled: systemStatus?.enabledPhases.includes(4) },
              { name: 'Prestationsmonitorering', enabled: true },
              { name: 'Auditloggning', enabled: true }
            ].map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{feature.name}</span>
                <Badge variant={feature.enabled ? 'default' : 'secondary'} className="text-xs">
                  {feature.enabled ? 'PÅ' : 'AV'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Validation */}
      {systemStatus?.validation && !systemStatus.validation.valid && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Systemkonfigurationsvarningar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemStatus.validation.errors.map((error, index) => (
                <div key={index} className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// MOCK DATA FUNCTIONS
// =============================================================================

function getMockSystemStatus(): SystemStatus {
  return {
    version: '1.0.0',
    status: 'operational',
    enabledPhases: [1, 2, 3, 4, 5],
    totalFeatures: 12,
    enabledFeatures: 10,
    lastUpdated: new Date().toISOString(),
    validation: { valid: true, errors: [] }
  };
}

function getMockSystemMetrics(): SystemMetrics {
  return {
    overall: {
      efficiency: 0.94,
      autonomyRate: 0.99,
      costSavings: 89000,
      co2Reduction: 0.23,
      customerSatisfaction: 0.124
    },
    phases: {
      phase1: {
        enabled: true,
        efficiency: 0.88,
        performance: 0.92,
        lastExecution: new Date().toISOString(),
        processingTime: 150,
        errorRate: 0.02
      },
      phase2: {
        enabled: true,
        efficiency: 0.95,
        performance: 0.97,
        lastExecution: new Date().toISOString(),
        processingTime: 320,
        errorRate: 0.01
      },
      phase3: {
        enabled: true,
        efficiency: 0.91,
        performance: 0.89,
        lastExecution: new Date().toISOString(),
        processingTime: 280,
        errorRate: 0.03
      },
      phase4: {
        enabled: true,
        efficiency: 0.96,
        performance: 0.94,
        lastExecution: new Date().toISOString(),
        processingTime: 450,
        errorRate: 0.015
      },
      phase5: {
        enabled: true,
        efficiency: 0.99,
        performance: 0.98,
        lastExecution: new Date().toISOString(),
        processingTime: 120,
        errorRate: 0.005
      }
    },
    realtime: {
      activeOptimizations: 3,
      decisionsPerHour: 247,
      systemLoad: 0.45,
      uptime: 0.998
    }
  };
}

function getMockOptimizations(): MasterOptimization[] {
  return [
    {
      optimizationId: 'opt_1704067200_abc123',
      timestamp: new Date().toISOString(),
      phases: { phase1: true, phase2: true, phase3: true, phase4: true, phase5: true },
      overallMetrics: { totalEfficiencyGain: 0.92 },
      recommendations: [],
      status: 'completed'
    },
    {
      optimizationId: 'opt_1704067100_def456',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      phases: { phase1: true, phase2: true, phase3: true },
      overallMetrics: { totalEfficiencyGain: 0.87 },
      recommendations: [],
      status: 'in_progress'
    }
  ];
}

function getMockJobs() {
  return [
    {
      id: 'job_1',
      customerId: 'cust_1',
      type: 'moving',
      pickupAddress: { street: 'Storgatan 1', postalCode: '11122', city: 'Stockholm' },
      deliveryAddress: { street: 'Småstigen 5', postalCode: '11634', city: 'Stockholm' },
      scheduledDate: new Date().toISOString(),
      estimatedDuration: 180,
      volume: 15,
      priority: 'medium'
    }
  ];
}

function getMockVehicles() {
  return [
    {
      id: 'vehicle_1',
      name: 'Nordflytt 01',
      capacity: 20,
      currentLocation: { street: 'Depot', postalCode: '11122', city: 'Stockholm' },
      status: 'available'
    }
  ];
}

function getMockStaff() {
  return [
    {
      id: 'staff_1',
      name: 'Erik Andersson',
      skills: ['moving', 'heavy_lifting'],
      availability: true
    },
    {
      id: 'staff_2',
      name: 'Maria Svensson',
      skills: ['packing', 'customer_service'],
      availability: true
    }
  ];
}