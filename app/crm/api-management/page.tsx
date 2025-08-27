'use client';

import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, TrendingUp, DollarSign, Bell, Settings, BarChart3, Zap, CheckCircle, XCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Mock data for demonstration
const mockAPIStatus = {
  'SendGrid': {
    status: 'healthy',
    uptime: 99.9,
    responseTime: 245,
    usage: { calls: 1247, percentage: 62, limit: 2000, resetTime: 'Daily' },
    cost: { current: 124.50, budget: 1000, percentage: 12.4, projection: 450, status: 'good' },
    lastCheck: '2024-01-16T10:30:00Z'
  },
  'Mailgun': {
    status: 'healthy',
    uptime: 99.5,
    responseTime: 189,
    usage: { calls: 342, percentage: 43, limit: 800, resetTime: 'Daily' },
    cost: { current: 67.30, budget: 800, percentage: 8.4, projection: 280, status: 'good' },
    lastCheck: '2024-01-16T10:30:00Z'
  },
  'Twilio': {
    status: 'healthy',
    uptime: 99.8,
    responseTime: 156,
    usage: { calls: 89, percentage: 22, limit: 400, resetTime: 'Daily' },
    cost: { current: 356.80, budget: 1200, percentage: 29.7, projection: 1100, status: 'good' },
    lastCheck: '2024-01-16T10:30:00Z'
  },
  'Google Maps': {
    status: 'warning',
    uptime: 97.2,
    responseTime: 1250,
    usage: { calls: 1567, percentage: 78, limit: 2000, resetTime: 'Daily' },
    cost: { current: 1456.20, budget: 2000, percentage: 72.8, projection: 1890, status: 'warning' },
    lastCheck: '2024-01-16T10:30:00Z'
  },
  'SMHI Weather': {
    status: 'healthy',
    uptime: 98.9,
    responseTime: 423,
    usage: { calls: 234, percentage: 12, limit: 2000, resetTime: 'Daily' },
    cost: { current: 0, budget: 0, percentage: 0, projection: 0, status: 'good' },
    lastCheck: '2024-01-16T10:30:00Z'
  },
  'Fortnox': {
    status: 'failed',
    uptime: 0,
    responseTime: 0,
    usage: { calls: 0, percentage: 0, limit: 1000, resetTime: 'Daily' },
    cost: { current: 0, budget: 1500, percentage: 0, projection: 0, status: 'good' },
    error: 'Authentication failed - invalid token',
    lastSuccess: '2024-01-15T08:22:00Z',
    lastCheck: '2024-01-16T10:30:00Z'
  },
  'OpenAI Pricing Expert': {
    status: 'healthy',
    uptime: 99.7,
    responseTime: 2340,
    usage: { calls: 156, percentage: 39, limit: 400, resetTime: 'Daily' },
    cost: { current: 2345.60, budget: 3000, percentage: 78.2, projection: 2890, status: 'warning' },
    lastCheck: '2024-01-16T10:30:00Z'
  },
  'OpenAI Logistics Expert': {
    status: 'healthy',
    uptime: 99.4,
    responseTime: 1890,
    usage: { calls: 89, percentage: 22, limit: 400, resetTime: 'Daily' },
    cost: { current: 1234.50, budget: 2500, percentage: 49.4, projection: 2100, status: 'good' },
    lastCheck: '2024-01-16T10:30:00Z'
  }
};

const mockAlerts = [
  {
    id: 1,
    api: 'Fortnox',
    level: 'critical',
    message: 'API completely down - authentication failed',
    impact: 'Accounting integration broken',
    action: 'Check API credentials and endpoint status',
    timestamp: '2024-01-16T10:25:00Z'
  },
  {
    id: 2,
    api: 'Google Maps',
    level: 'warning',
    message: 'High response time detected (1250ms)',
    impact: 'Slow route optimization',
    action: 'Monitor performance and consider fallback',
    timestamp: '2024-01-16T10:20:00Z'
  },
  {
    id: 3,
    api: 'OpenAI Pricing Expert',
    level: 'warning',
    message: 'Cost at 78% of monthly budget',
    impact: 'May exceed budget this month',
    action: 'Monitor usage and consider cost optimization',
    timestamp: '2024-01-16T09:45:00Z'
  }
];

export default function APIManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiStatus, setApiStatus] = useState(mockAPIStatus);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Load initial data
    loadAPIStatus();
    loadAlerts();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAPIStatus();
      loadAlerts();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAPIStatus = async () => {
    try {
      const response = await fetch('/api/management/status');
      const result = await response.json();
      
      if (result.success) {
        setApiStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load API status:', error);
      // Fallback to mock data on error
      setApiStatus(mockAPIStatus);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/management/alerts');
      const result = await response.json();
      
      if (result.success) {
        setAlerts(result.data.alerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      // Fallback to mock data on error
      setAlerts(mockAlerts);
    }
  };

  const apiManagementTabs = [
    { id: 'overview', label: 'API Overview', icon: '📊' },
    { id: 'usage', label: 'Usage Monitoring', icon: '📈' },
    { id: 'costs', label: 'Cost Tracking', icon: '💰' },
    { id: 'alerts', label: 'Alert Management', icon: '🚨' },
    { id: 'config', label: 'Configuration', icon: '⚙️' },
    { id: 'health', label: 'Health Monitoring', icon: '🔍' }
  ];

  // Calculate summary metrics
  const totalAPIs = Object.keys(apiStatus).length;
  const healthyAPIs = Object.values(apiStatus).filter(api => api.status === 'healthy').length;
  const failedAPIs = Object.values(apiStatus).filter(api => api.status === 'failed').length;
  const totalCost = Object.values(apiStatus).reduce((sum, api) => sum + api.cost.current, 0);
  const totalBudget = Object.values(apiStatus).reduce((sum, api) => sum + api.cost.budget, 0);
  const criticalAlerts = alerts.filter(alert => alert.level === 'critical').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'failed': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('sv-SE');
  };

  const resolveAlert = async (alertId: number) => {
    try {
      const response = await fetch('/api/management/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: alertId,
          resolved: true,
          resolvedBy: 1 // Admin user ID
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove alert from local state
        setAlerts(alerts.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const dismissAlert = async (alertId: number) => {
    try {
      // For now, just remove from local state
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Activity className="h-8 w-8 text-[#002A5C]" />
          API Management Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Real-time monitoring och hantering av alla externa API:er
        </p>
        <div className="text-sm text-gray-500 mt-1">
          Senast uppdaterad: {lastUpdate.toLocaleString('sv-SE')}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-500" />
              API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthyAPIs}/{totalAPIs}</div>
            <p className="text-sm text-gray-600 mt-1">
              {failedAPIs > 0 && (
                <span className="text-red-600">{failedAPIs} failed</span>
              )}
              {failedAPIs === 0 && (
                <span className="text-green-600">All systems operational</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-sm text-gray-600 mt-1">
              av {formatCurrency(totalBudget)} budget
            </p>
            <Progress value={(totalCost / totalBudget) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alerts.length}</div>
            <p className="text-sm text-gray-600 mt-1">
              {criticalAlerts > 0 && (
                <span className="text-red-600">{criticalAlerts} critical</span>
              )}
              {criticalAlerts === 0 && (
                <span className="text-green-600">No critical alerts</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                Object.values(apiStatus).reduce((sum, api) => sum + api.responseTime, 0) / 
                Object.values(apiStatus).length
              )}ms
            </div>
            <p className="text-sm text-gray-600 mt-1">Across all APIs</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(alert => alert.level === 'critical').length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong>Critical API Issues:</strong> {criticalAlerts} API{criticalAlerts > 1 ? 's' : ''} require immediate attention.
            <Button variant="link" className="p-0 ml-2 h-auto font-normal text-red-600">
              View All Alerts →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs - Vertical Layout */}
      <div className="flex gap-6">
        {/* Vertical Tab Navigation */}
        <div className="w-64 bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">API Management</h3>
          </div>
          <nav className="p-2 space-y-1">
            {apiManagementTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#002A5C] text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              {/* API Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Real-time API Status</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(apiStatus).map(([apiName, status]) => (
                      <Card key={apiName} className={`${getStatusColor(status.status)} border-2`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status.status)}
                              {apiName}
                            </div>
                            <Badge variant={status.status === 'healthy' ? 'default' : 'destructive'}>
                              {status.status}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-medium">Uptime</div>
                              <div className="text-gray-600">{status.uptime}%</div>
                            </div>
                            <div>
                              <div className="font-medium">Response</div>
                              <div className="text-gray-600">{status.responseTime}ms</div>
                            </div>
                            <div>
                              <div className="font-medium">Usage</div>
                              <div className="text-gray-600">{status.usage.percentage}%</div>
                            </div>
                            <div>
                              <div className="font-medium">Cost</div>
                              <div className="text-gray-600">{formatCurrency(status.cost.current)}</div>
                            </div>
                          </div>
                          
                          {status.status === 'failed' && (
                            <div className="mt-4 p-3 bg-red-100 rounded-md">
                              <div className="text-sm font-medium text-red-800">Error:</div>
                              <div className="text-sm text-red-700">{status.error}</div>
                              <div className="text-sm text-red-600 mt-1">
                                Last success: {formatTime(status.lastSuccess!)}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Monitoring Tab */}
              {activeTab === 'usage' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">API Usage Monitoring</h3>
                    <Button variant="outline">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Export Usage Data
                    </Button>
                  </div>
                  
                  <div className="bg-white rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            API
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Calls Made
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usage %
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Limit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reset Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(apiStatus).map(([apiName, status]) => (
                          <tr key={apiName}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              {apiName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {status.usage.calls.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      status.usage.percentage > 80 ? 'bg-red-500' : 
                                      status.usage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${status.usage.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600">{status.usage.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {status.usage.limit.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {status.usage.resetTime}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={status.usage.percentage > 80 ? 'destructive' : 'default'}>
                                {status.usage.percentage > 80 ? 'High Usage' : 'Normal'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cost Tracking Tab */}
              {activeTab === 'costs' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Monthly Cost Tracking</h3>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        Set Budget Alerts
                      </Button>
                      <Button variant="outline">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Export Cost Report
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Total Monthly Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
                        <p className="text-sm text-gray-600">of {formatCurrency(totalBudget)} budget</p>
                        <Progress value={(totalCost / totalBudget) * 100} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Budget Remaining</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalBudget - totalCost)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {Math.round(((totalBudget - totalCost) / totalBudget) * 100)}% remaining
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Projected Monthly Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(
                            Object.values(apiStatus).reduce((sum, api) => sum + api.cost.projection, 0)
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Based on current usage</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-white rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            API
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Budget
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usage %
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Projection
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(apiStatus).map(([apiName, status]) => (
                          <tr key={apiName}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              {apiName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {formatCurrency(status.cost.current)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {formatCurrency(status.cost.budget)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      status.cost.percentage > 80 ? 'bg-red-500' : 
                                      status.cost.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${status.cost.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600">{status.cost.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {formatCurrency(status.cost.projection)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={
                                status.cost.status === 'danger' ? 'destructive' : 
                                status.cost.status === 'warning' ? 'secondary' : 'default'
                              }>
                                {status.cost.status === 'danger' && '🚨 Over Budget'}
                                {status.cost.status === 'warning' && '⚠️ High Usage'}
                                {status.cost.status === 'good' && '✅ Within Budget'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Alert Management Tab */}
              {activeTab === 'alerts' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Alert Management</h3>
                    <Button className="bg-[#002A5C] hover:bg-[#001d47]">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure Alerts
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-red-600">Critical Alerts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{alerts.filter(a => a.level === 'critical').length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-yellow-600">Warning Alerts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{alerts.filter(a => a.level === 'warning').length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-blue-600">Info Alerts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{alerts.filter(a => a.level === 'info').length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base text-green-600">Total Alerts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{alerts.length}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {alerts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <div className="text-lg font-medium">No Active Alerts</div>
                        <div>All systems are running smoothly!</div>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <Card key={alert.id} className={`border-l-4 ${
                          alert.level === 'critical' ? 'border-l-red-500' : 
                          alert.level === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium">
                                    {alert.level === 'critical' && '🔴 CRITICAL'}
                                    {alert.level === 'warning' && '🟡 WARNING'}
                                    {alert.level === 'info' && '🔵 INFO'}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {formatTime(alert.timestamp)}
                                  </span>
                                </div>
                                <div className="font-medium text-gray-900">
                                  {alert.api}: {alert.message}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <strong>Impact:</strong> {alert.impact}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <strong>Recommended Action:</strong> {alert.action}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => dismissAlert(alert.id)}
                                >
                                  Dismiss
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => resolveAlert(alert.id)}
                                >
                                  Resolve
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Configuration Tab */}
              {activeTab === 'config' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">API Configuration</h3>
                  <p className="text-gray-600">Hantera API-inställningar och tröskelvärden.</p>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium mb-4">Alert Thresholds</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Usage Threshold (%)</label>
                        <input type="number" defaultValue="80" className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Cost Threshold (%)</label>
                        <input type="number" defaultValue="80" className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Response Time Threshold (ms)</label>
                        <input type="number" defaultValue="5000" className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Uptime Threshold (%)</label>
                        <input type="number" defaultValue="95" className="w-full p-2 border rounded" />
                      </div>
                    </div>
                    <Button className="mt-4 bg-[#002A5C] hover:bg-[#001d47]">
                      Save Configuration
                    </Button>
                  </div>
                </div>
              )}

              {/* Health Monitoring Tab */}
              {activeTab === 'health' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Health Monitoring</h3>
                  <p className="text-gray-600">Prestationsstatistik och systemhälsa över tid.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">System Uptime</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 flex items-center justify-center text-gray-500">
                          [Uptime Chart - 30 days]
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Response Times</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 flex items-center justify-center text-gray-500">
                          [Response Time Chart - 7 days]
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Error Rates</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 flex items-center justify-center text-gray-500">
                          [Error Rate Chart - 24 hours]
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">API Usage Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 flex items-center justify-center text-gray-500">
                          [Usage Trend Chart - 30 days]
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}