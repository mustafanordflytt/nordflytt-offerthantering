// Enhanced Team Dashboard with Interactive Charts and Real-time Updates
// Phase 3 implementation featuring ML insights and live adaptation

import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

export default function EnhancedTeamDashboard() {
  const [teamOptimization, setTeamOptimization] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState({});
  const [workloadData, setWorkloadData] = useState([]);
  const [skillsAnalysis, setSkillsAnalysis] = useState(null);
  const [performanceTrends, setPerformanceTrends] = useState([]);
  const [staffAvailability, setStaffAvailability] = useState([]);
  const [adaptationHistory, setAdaptationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    
    if (realTimeMode) {
      setupWebSocket();
      const interval = setInterval(fetchRealTimeMetrics, 30000);
      return () => {
        clearInterval(interval);
        closeWebSocket();
      };
    }
  }, [selectedDate, realTimeMode]);

  const setupWebSocket = () => {
    try {
      wsRef.current = new WebSocket(`ws://localhost:8080/api/ws/team-updates`);
      
      wsRef.current.onmessage = (event) => {
        const update = JSON.parse(event.data);
        handleRealTimeUpdate(update);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current.onopen = () => {
        console.log('📡 Real-time connection established');
      };
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
    }
  };

  const closeWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const handleRealTimeUpdate = (update) => {
    if (update.type === 'team_reoptimization') {
      setRealTimeMetrics(prev => ({
        ...prev,
        reoptimizations: (prev.reoptimizations_today || 0) + 1,
        lastUpdate: update.timestamp
      }));
      
      // Add notification
      setNotifications(prev => [{
        id: Date.now(),
        type: 'reoptimization',
        message: `Team reoptimized: ${update.data.efficiencyChange} efficiency change`,
        timestamp: update.timestamp,
        severity: update.data.efficiencyChange > 0 ? 'success' : 'warning'
      }, ...prev.slice(0, 4)]);
      
      // Refresh team data if significant change
      if (Math.abs(parseFloat(update.data.efficiencyChange)) > 5) {
        fetchDashboardData();
      }
    }
    
    if (update.type === 'staff_availability_change') {
      fetchStaffAvailability();
      setNotifications(prev => [{
        id: Date.now(),
        type: 'availability',
        message: `Staff ${update.data.staffId} status: ${update.data.newStatus}`,
        timestamp: update.timestamp,
        severity: update.data.newStatus === 'available' ? 'success' : 'warning'
      }, ...prev.slice(0, 4)]);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [teamResponse, workloadResponse, trendsResponse, availabilityResponse, historyResponse] = await Promise.all([
        fetch('/api/optimize-teams-enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routes: await getRoutesForDate(selectedDate), date: selectedDate })
        }),
        fetch(`/api/workload-analysis/${selectedDate}`),
        fetch(`/api/performance-trends?days=30`),
        fetch(`/api/staff-availability/${selectedDate}`),
        fetch(`/api/adaptation-history?days=7`)
      ]);

      const teamData = await teamResponse.json();
      const workloadData = await workloadResponse.json();
      const trendsData = await trendsResponse.json();
      const availabilityData = await availabilityResponse.json();
      const historyData = await historyResponse.json();

      setTeamOptimization(teamData);
      setWorkloadData(workloadData);
      setSkillsAnalysis(teamData.skillAnalysis);
      setPerformanceTrends(trendsData);
      setStaffAvailability(availabilityData);
      setAdaptationHistory(historyData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use mock data
      setMockData();
    }
    setLoading(false);
  };

  const setMockData = () => {
    setTeamOptimization({
      efficiencyScore: 94,
      teamAssignments: [
        {
          routeId: 'route-1',
          team: [
            { id: 1, name: 'Erik Lindström' },
            { id: 2, name: 'Anna Karlsson' },
            { id: 3, name: 'Johan Andersson' }
          ],
          teamLead: { id: 1, name: 'Erik Lindström' },
          estimatedDuration: 240
        },
        {
          routeId: 'route-2',
          team: [
            { id: 4, name: 'Maria Svensson' },
            { id: 5, name: 'Peter Johansson' }
          ],
          teamLead: { id: 4, name: 'Maria Svensson' },
          estimatedDuration: 180
        }
      ],
      performancePredictions: [
        {
          routeId: 'route-1',
          predictedEfficiency: 0.92,
          predictionConfidence: 0.85,
          riskFactors: [],
          recommendedActions: []
        },
        {
          routeId: 'route-2',
          predictedEfficiency: 0.89,
          predictionConfidence: 0.78,
          riskFactors: [
            { type: 'skill_imbalance', severity: 'medium', description: 'Team lacks heavy lifting specialist' }
          ],
          recommendedActions: [
            { type: 'skill_development', action: 'Consider heavy lifting training' }
          ]
        }
      ],
      workloadOptimization: { summary: { workloadVariance: 0.15 } },
      mlPredictionConfidence: 0.82,
      recommendedTraining: [
        {
          skillType: 'heavy_lifting',
          priority: 'medium',
          currentCoverage: 75,
          affectedRoutes: 2,
          estimatedDuration: '4 hours',
          estimatedCost: 3500,
          recommendedAction: 'Targeted heavy lifting skill development',
          businessImpact: { improvementPotential: 8 }
        }
      ]
    });

    setWorkloadData([
      { staff_name: 'Erik Lindström', actual_hours: 7.5 },
      { staff_name: 'Anna Karlsson', actual_hours: 8.2 },
      { staff_name: 'Johan Andersson', actual_hours: 6.8 },
      { staff_name: 'Maria Svensson', actual_hours: 7.9 },
      { staff_name: 'Peter Johansson', actual_hours: 8.5 }
    ]);

    setSkillsAnalysis({
      skillGaps: [
        { skillType: 'heavy_lifting', deficit: 2.5 },
        { skillType: 'fragile_items', deficit: 1.8 },
        { skillType: 'customer_service', deficit: 1.2 }
      ],
      summary: { avgCoverage: 82 }
    });

    setPerformanceTrends([
      { date: '2025-01-07', efficiency: 91, ml_accuracy: 83 },
      { date: '2025-01-08', efficiency: 89, ml_accuracy: 85 },
      { date: '2025-01-09', efficiency: 93, ml_accuracy: 87 },
      { date: '2025-01-10', efficiency: 94, ml_accuracy: 89 },
      { date: '2025-01-11', efficiency: 92, ml_accuracy: 88 }
    ]);

    setStaffAvailability([
      { availability: 'available', staff_count: 15, percentage: 75 },
      { availability: 'busy', staff_count: 3, percentage: 15 },
      { availability: 'sick', staff_count: 1, percentage: 5 },
      { availability: 'vacation', staff_count: 1, percentage: 5 }
    ]);

    setAdaptationHistory([
      { date: '2025-01-11', reoptimizations_count: 2, avg_efficiency_change: 0.06 },
      { date: '2025-01-10', reoptimizations_count: 1, avg_efficiency_change: 0.04 },
      { date: '2025-01-09', reoptimizations_count: 3, avg_efficiency_change: 0.08 }
    ]);
  };

  const fetchRealTimeMetrics = async () => {
    try {
      const response = await fetch(`/api/optimization-metrics/${selectedDate}`);
      const metrics = await response.json();
      setRealTimeMetrics(metrics);
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error);
    }
  };

  const getRoutesForDate = async (date) => {
    // Mock implementation - in production, fetch actual routes
    return [
      { id: 'route-1', jobs: [{ id: 1 }, { id: 2 }], estimatedDuration: 240 },
      { id: 'route-2', jobs: [{ id: 3 }, { id: 4 }], estimatedDuration: 180 }
    ];
  };

  const handleTeamOptimization = async () => {
    setLoading(true);
    try {
      const routes = await getRoutesForDate(selectedDate);
      const response = await fetch('/api/optimize-teams-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          routes,
          date: selectedDate,
          useML: true,
          realTimeAdaptation: true
        })
      });
      const data = await response.json();
      setTeamOptimization(data);
      setSkillsAnalysis(data.skillAnalysis);
    } catch (error) {
      console.error('Enhanced team optimization failed:', error);
    }
    setLoading(false);
  };

  const handleStaffAvailabilityChange = async (staffId, newStatus) => {
    try {
      const response = await fetch('/api/update-staff-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, status: newStatus })
      });
      
      const result = await response.json();
      
      if (result.reoptimized) {
        fetchDashboardData();
        setNotifications(prev => [{
          id: Date.now(),
          type: 'auto_reoptimization',
          message: `Automatic reoptimization completed: ${result.efficiencyChange} efficiency change`,
          timestamp: new Date().toISOString(),
          severity: 'success'
        }, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Failed to update staff availability:', error);
    }
  };

  const scheduleTraining = async (training) => {
    try {
      const response = await fetch('/api/schedule-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillType: training.skillType,
          priority: training.priority,
          duration: training.estimatedDuration,
          affectedStaff: [],
          estimatedCost: training.estimatedCost
        })
      });
      
      if (response.ok) {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'training_scheduled',
          message: `Training scheduled: ${training.skillType.replace('_', ' ')}`,
          timestamp: new Date().toISOString(),
          severity: 'success'
        }, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Failed to schedule training:', error);
    }
  };

  // Chart data preparation
  const workloadChartData = {
    labels: workloadData.slice(0, 10).map(staff => staff.staff_name),
    datasets: [{
      label: 'Arbetstimmar',
      data: workloadData.slice(0, 10).map(staff => staff.actual_hours || 0),
      backgroundColor: workloadData.slice(0, 10).map(staff => {
        const hours = staff.actual_hours || 0;
        if (hours > 8.5) return 'rgba(239, 68, 68, 0.8)';
        if (hours > 8) return 'rgba(245, 158, 11, 0.8)';
        if (hours > 6) return 'rgba(34, 197, 94, 0.8)';
        return 'rgba(59, 130, 246, 0.8)';
      }),
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };

  const skillsGapChartData = skillsAnalysis?.skillGaps ? {
    labels: skillsAnalysis.skillGaps.slice(0, 8).map(gap => gap.skillType.replace('_', ' ')),
    datasets: [{
      label: 'Kompetensgap (nivå)',
      data: skillsAnalysis.skillGaps.slice(0, 8).map(gap => gap.deficit),
      backgroundColor: 'rgba(239, 68, 68, 0.6)',
      borderColor: 'rgba(239, 68, 68, 1)',
      borderWidth: 2
    }]
  } : null;

  const performanceTrendData = {
    labels: performanceTrends.map(trend => trend.date),
    datasets: [{
      label: 'Team Efficiency (%)',
      data: performanceTrends.map(trend => trend.efficiency),
      borderColor: 'rgba(34, 197, 94, 1)',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      tension: 0.4
    }, {
      label: 'ML Prediction Accuracy (%)',
      data: performanceTrends.map(trend => trend.ml_accuracy),
      borderColor: 'rgba(147, 51, 234, 1)',
      backgroundColor: 'rgba(147, 51, 234, 0.2)',
      tension: 0.4
    }]
  };

  const staffAvailabilityData = {
    labels: staffAvailability.map(item => item.availability),
    datasets: [{
      data: staffAvailability.map(item => item.staff_count),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(59, 130, 246, 0.8)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(59, 130, 246, 1)'
      ],
      borderWidth: 2
    }]
  };

  const adaptationTrendData = {
    labels: adaptationHistory.map(item => item.date),
    datasets: [{
      label: 'Reoptimizations',
      data: adaptationHistory.map(item => item.reoptimizations_count),
      borderColor: 'rgba(245, 158, 11, 1)',
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      tension: 0.4,
      yAxisID: 'y'
    }, {
      label: 'Avg Efficiency Change (%)',
      data: adaptationHistory.map(item => item.avg_efficiency_change * 100),
      borderColor: 'rgba(147, 51, 234, 1)',
      backgroundColor: 'rgba(147, 51, 234, 0.2)',
      tension: 0.4,
      yAxisID: 'y1'
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Team Performance Analytics'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const adaptationChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Enhanced Header with Real-time Indicators */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              🧠 Enhanced Team AI Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Phase 3: ML-powered optimization with real-time adaptation</p>
            {realTimeMode && (
              <div className="flex items-center mt-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-gray-600">Real-time Mode Active</span>
                <span className="ml-4 text-xs text-gray-500">
                  {realTimeMetrics.lastUpdate ? `Last update: ${new Date(realTimeMetrics.lastUpdate).toLocaleTimeString()}` : ''}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={realTimeMode}
                onChange={(e) => setRealTimeMode(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Real-time Mode</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={handleTeamOptimization}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? '🤖 Optimizing...' : '👥 AI Optimize Teams'}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            🔔 Real-time Updates
          </h3>
          <div className="space-y-2">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                className={`p-3 rounded-lg text-sm flex items-center justify-between ${
                  notification.severity === 'success' ? 'bg-green-50 text-green-800' :
                  notification.severity === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                  'bg-blue-50 text-blue-800'
                }`}
              >
                <span>{notification.message}</span>
                <span className="text-xs opacity-75">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Metrics Cards */}
      {teamOptimization && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-purple-600">
                  {teamOptimization.efficiencyScore}%
                </div>
                <div className="text-sm text-gray-600">AI Predicted Efficiency</div>
                {teamOptimization.mlPredictionConfidence && (
                  <div className="text-xs text-purple-500">
                    {(teamOptimization.mlPredictionConfidence * 100).toFixed(1)}% ML Confidence
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">⚖️</span>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-blue-600">
                  {(teamOptimization.workloadOptimization?.summary?.workloadVariance * 100 || 15).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Workload Variance</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-green-600">
                  {realTimeMetrics.reoptimizations_today || 0}
                </div>
                <div className="text-sm text-gray-600">Reoptimizations Today</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-orange-600">
                  {skillsAnalysis?.summary?.avgCoverage?.toFixed(1) || 'N/A'}%
                </div>
                <div className="text-sm text-gray-600">Skill Coverage</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-red-600">
                  {realTimeMetrics.real_time_adaptation_rate || 0}%
                </div>
                <div className="text-sm text-gray-600">Real-time Adaptation Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Workload Distribution
          </h2>
          <div style={{ height: '300px' }}>
            <Bar data={workloadChartData} options={{...chartOptions, maintainAspectRatio: false}} />
          </div>
        </div>

        {/* Staff Availability Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            👥 Staff Availability
          </h2>
          <div style={{ height: '300px' }}>
            <Doughnut data={staffAvailabilityData} options={{maintainAspectRatio: false}} />
          </div>
        </div>

        {/* Skills Gap Analysis Chart */}
        {skillsGapChartData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🎯 Skills Gap Analysis
            </h2>
            <div style={{ height: '300px' }}>
              <Bar data={skillsGapChartData} options={{...chartOptions, maintainAspectRatio: false}} />
            </div>
          </div>
        )}

        {/* Real-time Adaptation Trends */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🔄 Real-time Adaptation Trends
          </h2>
          <div style={{ height: '300px' }}>
            <Line data={adaptationTrendData} options={{...adaptationChartOptions, maintainAspectRatio: false}} />
          </div>
        </div>
      </div>

      {/* Performance Trends Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          📈 Performance & ML Accuracy Trends (30 Days)
        </h2>
        <div style={{ height: '300px' }}>
          <Line data={performanceTrendData} options={{...chartOptions, maintainAspectRatio: false}} />
        </div>
      </div>

      {/* Enhanced Team Assignments with ML Insights */}
      {teamOptimization?.teamAssignments && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            👥 AI-Optimized Team Assignments
            <span className="text-sm font-normal text-gray-500">
              (with ML predictions)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teamOptimization.teamAssignments.map((assignment, index) => {
              const prediction = teamOptimization.performancePredictions?.find(p => p.routeId === assignment.routeId);
              return (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Route {assignment.routeId}</h3>
                    <span className="text-sm text-gray-600">{assignment.team.length} members</span>
                  </div>
                  
                  {/* Team Lead */}
                  <div className="mb-3">
                    <div className="text-sm font-medium text-purple-600">👑 Team Lead</div>
                    <div className="text-sm">{assignment.teamLead.name}</div>
                  </div>
                  
                  {/* Team Members */}
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700">Team Members</div>
                    <div className="space-y-1">
                      {assignment.team.filter(member => member.id !== assignment.teamLead.id).map((member, idx) => (
                        <div key={idx} className="text-sm text-gray-600">• {member.name}</div>
                      ))}
                    </div>
                  </div>
                  
                  {/* ML Prediction */}
                  {prediction && (
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">🤖 ML Prediction:</span>
                        <span className={`font-semibold ${
                          prediction.predictedEfficiency > 0.9 ? 'text-green-600' :
                          prediction.predictedEfficiency > 0.8 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(prediction.predictedEfficiency * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${prediction.predictionConfidence * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {(prediction.predictionConfidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Risk Factors */}
                      {prediction.riskFactors?.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-red-600 font-medium">⚠️ Risk Factors:</div>
                          {prediction.riskFactors.map((risk, riskIdx) => (
                            <div key={riskIdx} className="text-xs text-red-500 mt-1">
                              • {risk.description}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Recommended Actions */}
                      {prediction.recommendedActions?.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-blue-600 font-medium">💡 Recommendations:</div>
                          {prediction.recommendedActions.map((action, actionIdx) => (
                            <div key={actionIdx} className="text-xs text-blue-500 mt-1">
                              • {action.action}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Training Recommendations */}
      {teamOptimization?.recommendedTraining && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📚 AI Training Recommendations
          </h2>
          <div className="space-y-4">
            {teamOptimization.recommendedTraining.slice(0, 5).map((training, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {training.skillType.replace('_', ' ')} Training
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{training.recommendedAction}</p>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Coverage:</span>
                        <span className="ml-1 font-medium">{training.currentCoverage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-1 font-medium">{training.estimatedDuration}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cost:</span>
                        <span className="ml-1 font-medium">{training.estimatedCost.toLocaleString()} kr</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Impact:</span>
                        <span className="ml-1 font-medium text-green-600">+{training.businessImpact.improvementPotential}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      training.priority === 'high' ? 'bg-red-100 text-red-800' :
                      training.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {training.priority} priority
                    </span>
                    <button
                      onClick={() => scheduleTraining(training)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}