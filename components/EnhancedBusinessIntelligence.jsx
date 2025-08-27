// Enhanced Business Intelligence Dashboard with Interactive Charts and A/B Testing
// Phase 4 implementation featuring comprehensive analytics and real-time insights

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Area, AreaChart, ComposedChart,
  RadialBarChart, RadialBar, Treemap
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Calendar, 
  AlertTriangle, Settings, Filter, Download, Refresh,
  Target, Zap, Brain, Car, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const SEGMENT_COLORS = {
  'Champions': '#10B981',
  'VIP Customers': '#3B82F6', 
  'Loyal Customers': '#8B5CF6',
  'At Risk': '#F59E0B',
  'Lost Customers': '#EF4444',
  'Occasional Users': '#6B7280'
};

const EnhancedBusinessIntelligence = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'efficiency', 'satisfaction']);
  const [activeExperiments, setActiveExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realTimeData, setRealTimeData] = useState({});
  const [selectedDashboardTab, setSelectedDashboardTab] = useState('overview');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const refreshInterval = useMemo(() => autoRefresh ? 60000 : null, [autoRefresh]);

  useEffect(() => {
    fetchDashboardData();
    fetchActiveExperiments();
    
    if (refreshInterval) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, selectedSegment, refreshInterval]);

  useEffect(() => {
    if (autoRefresh) {
      const wsUrl = `ws://localhost:8080/api/ws/business-intelligence`;
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        const update = JSON.parse(event.data);
        handleRealTimeUpdate(update);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      return () => ws.close();
    }
  }, [autoRefresh]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/enhanced-business-intelligence?range=${selectedTimeRange}&segment=${selectedSegment}&metrics=${selectedMetrics.join(',')}`
      );
      const data = await response.json();
      setDashboardData(data);
      setRealTimeData(data.realtimeMetrics || {});
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDashboardData(getMockDashboardData());
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange, selectedSegment, selectedMetrics]);

  const fetchActiveExperiments = async () => {
    try {
      const response = await fetch('/api/ab-experiments/active');
      const experiments = await response.json();
      setActiveExperiments(experiments);
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
      setActiveExperiments(getMockExperiments());
    }
  };

  const handleRealTimeUpdate = (update) => {
    if (update.type === 'metric_update') {
      setRealTimeData(prev => ({
        ...prev,
        [update.metric]: update.value,
        lastUpdate: update.timestamp
      }));
    }
  };

  const startNewExperiment = async (experimentConfig) => {
    try {
      const response = await fetch('/api/ab-experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experimentConfig)
      });
      
      if (response.ok) {
        fetchActiveExperiments();
      }
    } catch (error) {
      console.error('Failed to start experiment:', error);
    }
  };

  const exportDashboardData = async (format = 'csv') => {
    try {
      const response = await fetch(`/api/export-dashboard?format=${format}&range=${selectedTimeRange}&segment=${selectedSegment}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `nordflytt-analytics-${selectedTimeRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading Enhanced Analytics...</span>
      </div>
    );
  }

  const { 
    metrics, predictions, alerts, customerSegments, 
    realtimeMetrics, iotAlerts, pricingExperiments,
    demandForecast, vehicleHealth, recommendations
  } = dashboardData || getMockDashboardData();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-8xl mx-auto">
        {/* Enhanced Header with Advanced Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="h-8 w-8 text-blue-600" />
                Enhanced Business Intelligence
              </h1>
              <p className="text-gray-600 mt-1">Phase 4: Cloud ML, IoT Analytics & Predictive Insights</p>
              {autoRefresh && (
                <div className="flex items-center mt-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm text-gray-600">Real-time Mode Active</span>
                  <span className="ml-4 text-xs text-gray-500">
                    {realTimeData.lastUpdate ? `Last update: ${new Date(realTimeData.lastUpdate).toLocaleTimeString()}` : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              
              <select 
                value={selectedTimeRange} 
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="custom">Custom Range</option>
              </select>
              
              <select 
                value={selectedSegment} 
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Customers</option>
                <option value="champions">Champions</option>
                <option value="vip">VIP Customers</option>
                <option value="loyal">Loyal Customers</option>
                <option value="at-risk">At Risk</option>
                <option value="lost">Lost Customers</option>
              </select>
              
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
              >
                <Refresh className="h-4 w-4" />
                Auto Refresh
              </button>
              
              <button 
                onClick={() => exportDashboardData('csv')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Dashboard Navigation Tabs */}
          <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
            {['overview', 'customers', 'operations', 'experiments', 'predictions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedDashboardTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDashboardTab === tab 
                    ? 'bg-white text-blue-600 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {filterPanelOpen && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Metrics to Display</label>
                <div className="space-y-2">
                  {['revenue', 'efficiency', 'satisfaction', 'churn', 'clv'].map(metric => (
                    <label key={metric} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMetrics([...selectedMetrics, metric]);
                          } else {
                            setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                          }
                        }}
                        className="mr-2"
                      />
                      {metric.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Service Types</label>
                <select className="w-full px-3 py-2 border rounded">
                  <option value="all">All Services</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="storage">Storage</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Geographic Region</label>
                <select className="w-full px-3 py-2 border rounded">
                  <option value="all">All Regions</option>
                  <option value="stockholm">Stockholm</option>
                  <option value="gothenburg">Gothenburg</option>
                  <option value="malmo">Malmö</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Vehicle Type</label>
                <select className="w-full px-3 py-2 border rounded">
                  <option value="all">All Vehicles</option>
                  <option value="small">Small Van</option>
                  <option value="medium">Medium Truck</option>
                  <option value="large">Large Truck</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Critical Alerts Section */}
        {(alerts.length > 0 || iotAlerts.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <AlertCard title="Business Alerts" alerts={alerts} type="business" />
            <AlertCard title="Vehicle IoT Alerts" alerts={iotAlerts} type="iot" />
          </div>
        )}

        {/* Real-time Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <MetricCard
            title="Real-time Revenue"
            value={`${(realtimeMetrics.current_revenue || 0).toLocaleString()} kr`}
            change={metrics.revenue_change}
            icon={<DollarSign className="h-6 w-6" />}
            trend={metrics.revenue_trend}
            realTime={true}
            confidence={0.95}
          />
          <MetricCard
            title="AI Demand Forecast"
            value={`${metrics.predicted_bookings || 0} bookings`}
            change={metrics.demand_change}
            icon={<Brain className="h-6 w-6" />}
            trend={metrics.demand_trend}
            confidence={metrics.demand_confidence}
          />
          <MetricCard
            title="Customer CLV"
            value={`${(metrics.avg_clv || 0).toLocaleString()} kr`}
            change={metrics.clv_change}
            icon={<Users className="h-6 w-6" />}
            trend={metrics.clv_trend}
          />
          <MetricCard
            title="System Efficiency"
            value={`${metrics.efficiency_score || 0}%`}
            change={metrics.efficiency_change}
            icon={<TrendingUp className="h-6 w-6" />}
            trend={metrics.efficiency_trend}
          />
          <MetricCard
            title="Fleet Health"
            value={`${realtimeMetrics.vehicle_health_score || 0}%`}
            change={realtimeMetrics.health_change}
            icon={<Car className="h-6 w-6" />}
            trend={realtimeMetrics.health_trend}
          />
          <MetricCard
            title="A/B Test Impact"
            value={`+${metrics.ab_test_impact || 0}%`}
            change={metrics.ab_impact_change}
            icon={<Target className="h-6 w-6" />}
            trend="up"
          />
        </div>

        {/* Dashboard Content Based on Selected Tab */}
        {selectedDashboardTab === 'overview' && (
          <OverviewDashboard 
            demandForecast={demandForecast}
            vehicleHealth={vehicleHealth}
            metrics={metrics}
            realTimeData={realTimeData}
          />
        )}

        {selectedDashboardTab === 'customers' && (
          <CustomerDashboard 
            customerSegments={customerSegments}
            selectedTimeRange={selectedTimeRange}
          />
        )}

        {selectedDashboardTab === 'operations' && (
          <OperationsDashboard 
            vehicleHealth={vehicleHealth}
            iotAlerts={iotAlerts}
            metrics={metrics}
          />
        )}

        {selectedDashboardTab === 'experiments' && (
          <ExperimentsDashboard 
            activeExperiments={activeExperiments}
            pricingExperiments={pricingExperiments}
            onStartExperiment={startNewExperiment}
          />
        )}

        {selectedDashboardTab === 'predictions' && (
          <PredictionsDashboard 
            demandForecast={demandForecast}
            predictions={predictions}
            recommendations={recommendations}
          />
        )}

        {/* AI Strategic Recommendations */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Strategic Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recommendations || []).map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Dashboard Component
const OverviewDashboard = ({ demandForecast, vehicleHealth, metrics, realTimeData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* ML Demand Forecast with Confidence Intervals */}
    <ChartCard title="Cloud ML Demand Forecast (LSTM)" span="lg:col-span-2">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={demandForecast}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="confidence_upper" 
            stackId="1"
            stroke="none" 
            fill="#93C5FD" 
            fillOpacity={0.3}
          />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="confidence_lower" 
            stackId="1"
            stroke="none" 
            fill="#93C5FD" 
            fillOpacity={0.3}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="predicted_bookings" 
            stroke="#3B82F6" 
            strokeWidth={3}
            name="AI Prediction"
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="actual_bookings" 
            stroke="#10B981" 
            strokeWidth={2} 
            strokeDasharray="5 5"
            name="Actual"
          />
          <Bar 
            yAxisId="right"
            dataKey="confidence" 
            fill="#F59E0B" 
            fillOpacity={0.6}
            name="Confidence %"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>

    {/* Vehicle Fleet Health */}
    <ChartCard title="IoT Fleet Health Monitoring">
      <ResponsiveContainer width="100%" height={300}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={vehicleHealth}>
          <RadialBar dataKey="health_score" cornerRadius={10} fill="#10B981" />
          <Tooltip />
        </RadialBarChart>
      </ResponsiveContainer>
    </ChartCard>

    {/* Real-time Performance Metrics */}
    <ChartCard title="Real-time Performance Metrics">
      <div className="space-y-4">
        {Object.entries(realTimeData).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-sm font-medium capitalize">{key.replace('_', ' ')}</span>
            <span className="text-lg font-bold text-blue-600">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  </div>
);

// Customer Dashboard Component
const CustomerDashboard = ({ customerSegments, selectedTimeRange }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Customer Segmentation K-means Results */}
    <ChartCard title="AI Customer Segmentation (K-means)" span="lg:col-span-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={customerSegments.distribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {customerSegments.distribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.name] || COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Segment Insights & CLV</h4>
          {customerSegments.insights.map((insight, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-gray-900">{insight.segment}</div>
                <div className="text-sm text-green-600 font-bold">
                  CLV: {insight.avg_clv?.toLocaleString() || 'N/A'}kr
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">{insight.recommendation}</div>
              <div className="flex justify-between text-xs">
                <span>Churn Risk: {(insight.churn_risk * 100 || 0).toFixed(1)}%</span>
                <span>Growth: {insight.growth_potential}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>

    {/* Customer Lifetime Value Distribution */}
    <ChartCard title="Customer Lifetime Value Distribution">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={customerSegments.clv_distribution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="segment" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value.toLocaleString()} kr`, 'CLV']} />
          <Bar dataKey="avg_clv" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    {/* Churn Risk Analysis */}
    <ChartCard title="Churn Risk Heatmap">
      <ResponsiveContainer width="100%" height={300}>
        <Treemap
          data={customerSegments.churn_analysis}
          dataKey="customers"
          aspectRatio={4/3}
          stroke="#fff"
          fill="#EF4444"
        />
      </ResponsiveContainer>
    </ChartCard>
  </div>
);

// Operations Dashboard Component
const OperationsDashboard = ({ vehicleHealth, iotAlerts, metrics }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Vehicle Maintenance Predictions */}
    <ChartCard title="Predictive Maintenance Schedule" span="lg:col-span-2">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={vehicleHealth.maintenance_predictions}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="vehicle_id" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="days_to_maintenance" fill="#EF4444" name="Days to Maintenance" />
          <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#10B981" strokeWidth={3} name="Confidence %" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>

    {/* Route Optimization Performance */}
    <ChartCard title="Route Optimization Efficiency">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={metrics.route_performance}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={2} />
          <Line type="monotone" dataKey="fuel_savings" stroke="#10B981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    {/* Real-time IoT Sensor Status */}
    <ChartCard title="Real-time IoT Sensor Status">
      <div className="grid grid-cols-2 gap-4">
        {vehicleHealth.sensor_status.map((sensor, index) => (
          <div key={index} className="text-center p-3 rounded-lg border">
            <div className={`text-2xl font-bold ${
              sensor.status === 'normal' ? 'text-green-600' :
              sensor.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {sensor.value}
            </div>
            <div className="text-sm text-gray-600">{sensor.name}</div>
            <div className={`text-xs ${
              sensor.status === 'normal' ? 'text-green-500' :
              sensor.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {sensor.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  </div>
);

// Experiments Dashboard Component
const ExperimentsDashboard = ({ activeExperiments, pricingExperiments, onStartExperiment }) => (
  <div className="space-y-6">
    {/* A/B Testing Dashboard */}
    <ABTestingDashboard 
      experiments={activeExperiments}
      onStartExperiment={onStartExperiment}
    />

    {/* Pricing Optimization Results */}
    <ChartCard title="Dynamic Pricing Performance">
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart data={pricingExperiments.results}>
          <CartesianGrid />
          <XAxis dataKey="price" name="Price (kr)" />
          <YAxis dataKey="conversion_rate" name="Conversion Rate %" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Price vs Conversion" data={pricingExperiments.results} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  </div>
);

// Predictions Dashboard Component
const PredictionsDashboard = ({ demandForecast, predictions, recommendations }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Advanced Demand Forecasting */}
    <ChartCard title="Multi-factor Demand Prediction" span="lg:col-span-2">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={demandForecast}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Area yAxisId="left" type="monotone" dataKey="weather_impact" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
          <Area yAxisId="left" type="monotone" dataKey="seasonal_impact" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
          <Line yAxisId="left" type="monotone" dataKey="predicted_bookings" stroke="#3B82F6" strokeWidth={3} />
          <Bar yAxisId="right" dataKey="confidence" fill="#10B981" fillOpacity={0.7} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>

    {/* ML Model Performance */}
    <ChartCard title="ML Model Accuracy Trends">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={predictions.model_performance}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} name="Accuracy %" />
          <Line type="monotone" dataKey="precision" stroke="#3B82F6" strokeWidth={2} name="Precision %" />
          <Line type="monotone" dataKey="recall" stroke="#8B5CF6" strokeWidth={2} name="Recall %" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    {/* Business Impact Predictions */}
    <ChartCard title="Predicted Business Impact">
      <div className="space-y-4">
        {predictions.business_impact.map((impact, index) => (
          <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="font-semibold text-gray-900">{impact.metric}</div>
            <div className="text-2xl font-bold text-blue-600">{impact.predicted_change}</div>
            <div className="text-sm text-gray-600">Confidence: {impact.confidence}%</div>
            <div className="text-xs text-purple-600 mt-1">{impact.time_horizon}</div>
          </div>
        ))}
      </div>
    </ChartCard>
  </div>
);

// Supporting Components
const MetricCard = ({ title, value, change, icon, trend, realTime, confidence }) => (
  <div className="bg-white rounded-lg shadow-lg p-4 relative overflow-hidden">
    {realTime && (
      <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    )}
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="p-2 bg-gray-100 rounded-lg text-blue-600">
          {icon}
        </div>
      </div>
      <div className={`text-sm flex items-center ${
        trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
      }`}>
        {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : 
         trend === 'down' ? <TrendingDown className="h-4 w-4" /> : null}
        <span className="ml-1">{change}%</span>
      </div>
    </div>
    <div className="mt-3">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
      {confidence && (
        <div className="text-xs text-blue-500 mt-1">
          Confidence: {(confidence * 100).toFixed(1)}%
        </div>
      )}
    </div>
  </div>
);

const ChartCard = ({ title, children, span }) => (
  <div className={`bg-white rounded-lg shadow-lg p-6 ${span || ''}`}>
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <BarChart3 className="h-5 w-5 text-blue-600" />
      {title}
    </h3>
    {children}
  </div>
);

const AlertCard = ({ title, alerts, type }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
      <AlertTriangle className="h-5 w-5 text-orange-600" />
      {title}
    </h3>
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {alerts.map((alert, index) => (
        <div 
          key={index}
          className={`p-3 rounded-lg text-sm ${
            alert.severity === 'critical' ? 'bg-red-50 text-red-800 border border-red-200' :
            alert.severity === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="font-medium">{alert.title || alert.message}</div>
          <div className="text-xs mt-1 opacity-75">
            {new Date(alert.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ABTestingDashboard = ({ experiments, onStartExperiment }) => {
  const [showNewExperiment, setShowNewExperiment] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          Active A/B Tests & Experiments
        </h3>
        <button 
          onClick={() => setShowNewExperiment(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          Start New Test
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiments.map((exp, index) => (
          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-medium">{exp.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs ${
                exp.status === 'running' ? 'bg-green-100 text-green-800' :
                exp.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {exp.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{exp.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Group A: {exp.results.group_a.conversion_rate}%</span>
                <span>Group B: {exp.results.group_b.conversion_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{width: `${exp.statistical_significance}%`}}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Significance: {exp.statistical_significance}%</span>
                <span>{exp.days_remaining} days left</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecommendationCard = ({ recommendation }) => (
  <div className="border-l-4 border-purple-500 pl-4 bg-purple-50 p-4 rounded-r-lg">
    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
      <Brain className="h-4 w-4 text-purple-600" />
      {recommendation.title}
    </h4>
    <p className="text-gray-700 text-sm mt-1">{recommendation.description}</p>
    <div className="flex justify-between items-center mt-3">
      <div className="text-xs text-purple-600">
        Impact: {recommendation.expected_impact} | Confidence: {recommendation.confidence}%
      </div>
      <button className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors">
        Implement
      </button>
    </div>
  </div>
);

// Mock data generators
const getMockDashboardData = () => ({
  metrics: {
    revenue_change: 15.3,
    demand_change: 8.7,
    clv_change: 12.4,
    efficiency_change: 4.2,
    ab_test_impact: 7.8,
    predicted_bookings: 156,
    avg_clv: 42000,
    efficiency_score: 94,
    demand_confidence: 0.89,
    revenue_trend: 'up',
    demand_trend: 'up',
    clv_trend: 'up',
    efficiency_trend: 'up'
  },
  realtimeMetrics: {
    current_revenue: 1250000,
    vehicle_health_score: 87,
    health_change: 2.1,
    health_trend: 'up',
    lastUpdate: new Date().toISOString()
  },
  customerSegments: {
    distribution: [
      { name: 'Champions', count: 125, percentage: 25 },
      { name: 'VIP Customers', count: 100, percentage: 20 },
      { name: 'Loyal Customers', count: 150, percentage: 30 },
      { name: 'At Risk', count: 75, percentage: 15 },
      { name: 'Lost Customers', count: 50, percentage: 10 }
    ],
    insights: [
      {
        segment: 'Champions',
        avg_clv: 85000,
        churn_risk: 0.15,
        growth_potential: 'medium',
        recommendation: 'Implement VIP program with exclusive benefits'
      },
      {
        segment: 'At Risk',
        avg_clv: 35000,
        churn_risk: 0.75,
        growth_potential: 'low',
        recommendation: 'Immediate win-back campaign with personalized offers'
      }
    ],
    clv_distribution: [
      { segment: 'Champions', avg_clv: 85000 },
      { segment: 'VIP Customers', avg_clv: 62000 },
      { segment: 'Loyal Customers', avg_clv: 45000 },
      { segment: 'At Risk', avg_clv: 35000 },
      { segment: 'Lost Customers', avg_clv: 28000 }
    ],
    churn_analysis: [
      { name: 'Low Risk', customers: 300, churn_probability: 0.1 },
      { name: 'Medium Risk', customers: 150, churn_probability: 0.4 },
      { name: 'High Risk', customers: 50, churn_probability: 0.8 }
    ]
  },
  demandForecast: Array.from({length: 14}, (_, i) => ({
    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    predicted_bookings: 12 + Math.sin(i * 0.5) * 3 + Math.random() * 2,
    confidence_lower: 8 + Math.sin(i * 0.5) * 2,
    confidence_upper: 16 + Math.sin(i * 0.5) * 4,
    confidence: 85 + Math.random() * 10,
    actual_bookings: i < 7 ? 11 + Math.sin(i * 0.5) * 3 + Math.random() * 2 : null,
    weather_impact: Math.random() * 2 - 1,
    seasonal_impact: Math.sin(i * 0.3) * 1.5
  })),
  vehicleHealth: {
    maintenance_predictions: [
      { vehicle_id: 'VH001', days_to_maintenance: 15, confidence: 87 },
      { vehicle_id: 'VH002', days_to_maintenance: 8, confidence: 92 },
      { vehicle_id: 'VH003', days_to_maintenance: 25, confidence: 78 },
      { vehicle_id: 'VH004', days_to_maintenance: 3, confidence: 95 },
      { vehicle_id: 'VH005', days_to_maintenance: 12, confidence: 85 }
    ],
    sensor_status: [
      { name: 'Engine Temp', value: '92°C', status: 'normal' },
      { name: 'Oil Pressure', value: '35 PSI', status: 'normal' },
      { name: 'Brake Pads', value: '6mm', status: 'warning' },
      { name: 'Tire Pressure', value: '32 PSI', status: 'normal' }
    ]
  },
  alerts: [
    {
      title: 'Demand Spike Predicted',
      message: 'AI predicts 40% increase in bookings next week',
      severity: 'warning',
      timestamp: new Date().toISOString()
    }
  ],
  iotAlerts: [
    {
      title: 'Vehicle VH002 Maintenance Due',
      message: 'Brake pad thickness below threshold',
      severity: 'critical',
      timestamp: new Date().toISOString()
    }
  ],
  pricingExperiments: {
    results: Array.from({length: 20}, (_, i) => ({
      price: 2000 + i * 200,
      conversion_rate: 85 - i * 2 + Math.random() * 10
    }))
  },
  predictions: {
    model_performance: Array.from({length: 30}, (_, i) => ({
      date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      accuracy: 80 + Math.sin(i * 0.1) * 5 + Math.random() * 3,
      precision: 75 + Math.sin(i * 0.12) * 6 + Math.random() * 3,
      recall: 82 + Math.sin(i * 0.08) * 4 + Math.random() * 3
    })),
    business_impact: [
      {
        metric: 'Revenue Growth',
        predicted_change: '+18.5%',
        confidence: 89,
        time_horizon: 'Next Quarter'
      },
      {
        metric: 'Customer Acquisition',
        predicted_change: '+25 customers',
        confidence: 76,
        time_horizon: 'Next Month'
      }
    ]
  },
  recommendations: [
    {
      title: 'Dynamic Pricing Optimization',
      description: 'Implement AI-driven pricing based on demand forecasts',
      expected_impact: '+12% revenue',
      confidence: 87
    },
    {
      title: 'Predictive Maintenance Schedule',
      description: 'Optimize maintenance based on IoT sensor predictions',
      expected_impact: '-15% downtime',
      confidence: 92
    }
  ]
});

const getMockExperiments = () => ([
  {
    name: 'Pricing Strategy A/B',
    description: 'Testing 10% price increase vs current pricing',
    status: 'running',
    results: {
      group_a: { conversion_rate: 82.5 },
      group_b: { conversion_rate: 79.2 }
    },
    statistical_significance: 78,
    days_remaining: 12
  },
  {
    name: 'Service Page Layout',
    description: 'New booking form vs current design',
    status: 'completed',
    results: {
      group_a: { conversion_rate: 76.8 },
      group_b: { conversion_rate: 84.3 }
    },
    statistical_significance: 95,
    days_remaining: 0
  }
]);

export default EnhancedBusinessIntelligence;