// Enhanced Route Optimization Dashboard with Real-time Traffic and Sustainability Metrics
// Phase 2 implementation featuring Clarke-Wright algorithm and CO2 tracking

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function EnhancedRouteOptimizationDashboard() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clusters, setClusters] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [trafficUpdates, setTrafficUpdates] = useState({});
  const [sustainabilityMetrics, setSustainabilityMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [optimizationHistory, setOptimizationHistory] = useState([]);

  // Real-time traffic updates
  useEffect(() => {
    if (realTimeMode && routes.length > 0) {
      const interval = setInterval(fetchTrafficUpdates, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [realTimeMode, routes]);

  // Load initial data
  useEffect(() => {
    fetchVehicles();
    fetchClusters();
    fetchOptimizationHistory();
  }, [date]);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data);
      setSelectedVehicles(data.map(v => v.id)); // Select all by default
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      setError('Kunde inte hämta fordon');
    }
  };

  const fetchClusters = async () => {
    try {
      const response = await fetch(`/api/clusters?date=${date}`);
      const data = await response.json();
      setClusters(data);
    } catch (error) {
      console.error('Failed to fetch clusters:', error);
      setError('Kunde inte hämta jobbkluster');
    }
  };

  const fetchOptimizationHistory = async () => {
    try {
      const response = await fetch('/api/optimizations/history?limit=10');
      const data = await response.json();
      setOptimizationHistory(data);
    } catch (error) {
      console.error('Failed to fetch optimization history:', error);
    }
  };

  const fetchTrafficUpdates = useCallback(async () => {
    try {
      const response = await fetch('/api/routes/traffic-updates');
      const data = await response.json();
      setTrafficUpdates(data);
      
      // Check for significant delays and trigger rerouting
      await checkForRerouting(data);
    } catch (error) {
      console.error('Failed to fetch traffic updates:', error);
    }
  }, []);

  const checkForRerouting = async (trafficData) => {
    for (const [routeId, traffic] of Object.entries(trafficData)) {
      if (traffic.delayMinutes > 15) {
        console.log(`🔄 Triggering reroute for route ${routeId} due to ${traffic.delayMinutes} min delay`);
        
        try {
          const response = await fetch(`/api/routes/${routeId}/reroute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trafficCondition: traffic })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              console.log(`✅ Route ${routeId} successfully rerouted`);
              // Refresh routes to show updated information
              await fetchOptimizedRoutes();
            }
          }
        } catch (error) {
          console.error(`Failed to reroute ${routeId}:`, error);
        }
      }
    }
  };

  const fetchOptimizedRoutes = async () => {
    try {
      const response = await fetch(`/api/routes?date=${date}`);
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    }
  };

  const handleEnhancedOptimization = async () => {
    if (!clusters.length) {
      setError('Inga jobbkluster tillgängliga för optimering');
      return;
    }

    if (!selectedVehicles.length) {
      setError('Välj minst ett fordon för optimering');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Starting enhanced VRP optimization...');
      
      const response = await fetch('/api/optimize-routes-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date, 
          clusters, 
          vehicleIds: selectedVehicles,
          algorithm: 'clarke_wright',
          options: {
            enableTrafficOptimization: true,
            enableSustainabilityTracking: true,
            maxWorkingHours: 8
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setRoutes(data.routes);
      setOptimization(data);
      setSustainabilityMetrics(data.sustainability);
      
      console.log(`✅ Enhanced optimization complete: ${data.costAnalysis.efficiencyGain}% efficiency gain`);
      
      // Refresh optimization history
      await fetchOptimizationHistory();
      
    } catch (error) {
      console.error('Enhanced route optimization failed:', error);
      setError('Optimering misslyckades: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrafficColor = (routeId) => {
    const traffic = trafficUpdates[routeId];
    if (!traffic) return '#0066CC'; // Default blue
    
    switch (traffic.condition) {
      case 'heavy': return '#FF0000'; // Red
      case 'moderate': return '#FFA500'; // Orange  
      case 'light': return '#00FF00'; // Green
      default: return '#0066CC'; // Blue
    }
  };

  const getRouteColor = (index) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#F0932B', '#6C5CE7'
    ];
    return colors[index % colors.length];
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDistance = (meters) => {
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const getSustainabilityIcon = (rating) => {
    if (rating.includes('Utmärkt')) return '🌟';
    if (rating.includes('Mycket Bra')) return '🌱';
    if (rating.includes('Bra')) return '♻️';
    if (rating.includes('Tillfredsställande')) return '🌿';
    return '⚠️';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              🚛 Enhanced Route Optimization
            </h1>
            <p className="text-blue-100 text-lg">
              Clarke-Wright Algorithm • Real-time Traffic • CO₂ Tracking
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Powered by</div>
            <div className="text-lg font-semibold">Grok AI Phase 2</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum för optimering
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fordon ({selectedVehicles.length} valda)
            </label>
            <select
              multiple
              value={selectedVehicles}
              onChange={(e) => setSelectedVehicles(Array.from(e.target.selectedOptions, option => parseInt(option.value)))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={3}
            >
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} ({vehicle.vehicle_type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-4">
              <input
                type="checkbox"
                checked={realTimeMode}
                onChange={(e) => setRealTimeMode(e.target.checked)}
                className="mr-2"
              />
              Real-time Traffic Updates
            </label>
          </div>
          
          <div>
            <button
              onClick={handleEnhancedOptimization}
              disabled={loading || !clusters.length || !selectedVehicles.length}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-md font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Optimerar...
                </span>
              ) : (
                '⚡ Kör Enhanced VRP'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sustainability Metrics Dashboard */}
      {sustainabilityMetrics && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🌱 Sustainability Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {sustainabilityMetrics.totalCO2Emissions.toFixed(1)}
              </div>
              <div className="text-sm text-green-700 font-medium">kg CO₂ Emissions</div>
              <div className="text-xs text-green-600 mt-1">
                {sustainabilityMetrics.equivalentTreesPlanted.toFixed(1)} träd/år motsvarighet
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {sustainabilityMetrics.co2SaveingsVsNaive.toFixed(1)}
              </div>
              <div className="text-sm text-blue-700 font-medium">kg CO₂ Saved</div>
              <div className="text-xs text-blue-600 mt-1">
                vs naive routing
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {sustainabilityMetrics.co2ReductionPercent.toFixed(1)}%
              </div>
              <div className="text-sm text-purple-700 font-medium">CO₂ Reduction</div>
              <div className="text-xs text-purple-600 mt-1">
                optimization efficiency
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600 mb-1 flex items-center justify-center gap-1">
                {getSustainabilityIcon(sustainabilityMetrics.environmentalScore.sustainability_rating)}
                {sustainabilityMetrics.environmentalScore.overallScore}
              </div>
              <div className="text-sm text-orange-700 font-medium">Environmental Score</div>
              <div className="text-xs text-orange-600 mt-1">
                {sustainabilityMetrics.environmentalScore.sustainability_rating.replace(/[🌟🌱♻️🌿⚠️]/g, '').trim()}
              </div>
            </div>
          </div>

          {/* Monthly Savings Projection */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">💰 Projected Monthly Savings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Fuel Cost: </span>
                <span className="font-medium text-green-600">
                  {sustainabilityMetrics.monthlyFuelCostSavings} SEK/månad
                </span>
              </div>
              <div>
                <span className="text-gray-600">CO₂ Reduction: </span>
                <span className="font-medium text-blue-600">
                  {sustainabilityMetrics.estimatedCarbonFootprintReduction.toFixed(1)} kg/dag
                </span>
              </div>
              <div>
                <span className="text-gray-600">Distance Saved: </span>
                <span className="font-medium text-purple-600">
                  {optimization?.costAnalysis?.distanceSavings || 0} km/dag
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Performance Metrics */}
      {optimization && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Route Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {optimization.costAnalysis.efficiencyGain.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-700">Efficiency Gain</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {optimization.costAnalysis.totalRoutes}
              </div>
              <div className="text-sm text-green-700">Active Routes</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {optimization.costAnalysis.totalDistance.toFixed(1)}
              </div>
              <div className="text-sm text-purple-700">Total Distance (km)</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {optimization.costAnalysis.totalDuration.toFixed(1)}
              </div>
              <div className="text-sm text-orange-700">Total Time (hours)</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {optimization.costAnalysis.averageJobsPerRoute.toFixed(1)}
              </div>
              <div className="text-sm text-red-700">Jobs/Route Avg</div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Map with Traffic Visualization */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🗺️ Live Route Tracking</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {routes.length} active routes • Updated {realTimeMode ? 'real-time' : 'static'}
            </span>
          </div>
        </div>
        
        <div style={{ height: '600px' }} className="rounded-lg overflow-hidden">
          <MapContainer 
            center={[59.3293, 18.0686]} 
            zoom={11} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Depot marker */}
            <Marker position={[59.3293, 18.0686]}>
              <Popup>
                <div className="text-sm">
                  <strong>🏢 Nordflytt HQ</strong><br/>
                  Central Depot<br/>
                  Stockholm
                </div>
              </Popup>
            </Marker>
            
            {/* Route visualization */}
            {routes.map((route, index) => {
              if (!route.jobs || route.jobs.length === 0) return null;
              
              const routeCoords = [
                [59.3293, 18.0686], // Start from depot
                ...route.jobs.map(job => [job.lat, job.lng]),
                [59.3293, 18.0686]  // Return to depot
              ];
              
              const trafficColor = getTrafficColor(route.id);
              const routeColor = getRouteColor(index);
              
              return (
                <div key={route.id || index}>
                  {/* Route polyline */}
                  <Polyline
                    positions={routeCoords}
                    color={realTimeMode ? trafficColor : routeColor}
                    weight={5}
                    opacity={0.8}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>🚛 Route {route.vehicleId}</strong><br/>
                        Vehicle: {route.vehicle?.license_plate || 'Unknown'}<br/>
                        Jobs: {route.jobs.length}<br/>
                        Distance: {formatDistance(route.realTimeDistance || 0)}<br/>
                        Duration: {formatDuration(route.realTimeDurationInTraffic || 0)}<br/>
                        Traffic: {route.trafficCondition || 'Unknown'}<br/>
                        CO₂: {route.co2Emissions || 0} g<br/>
                        Fuel Cost: {route.fuelCost || 0} SEK
                        {trafficUpdates[route.id]?.delayMinutes > 0 && (
                          <>
                            <br/>
                            <span className="text-red-600">
                              Delay: {trafficUpdates[route.id].delayMinutes} min
                            </span>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Polyline>

                  {/* Job markers */}
                  {route.jobs.map((job, jobIndex) => (
                    <Marker 
                      key={`${route.id}-${job.id}`}
                      position={[job.lat, job.lng]}
                      icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: ${routeColor}; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${jobIndex + 1}</div>`,
                        iconSize: [26, 26],
                        iconAnchor: [13, 13]
                      })}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>📦 {job.customer_name || `Job ${job.id}`}</strong><br/>
                          Route: {route.vehicleId}<br/>
                          Position: #{jobIndex + 1}<br/>
                          Volume: {job.estimated_volume}m³<br/>
                          Duration: {Math.round(job.estimated_duration/60)}h<br/>
                          Service: {job.service_type || 'Moving'}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </div>
              );
            })}
          </MapContainer>
        </div>
        
        {/* Traffic Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm">Light Traffic</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
              <span className="text-sm">Moderate Traffic</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span className="text-sm">Heavy Traffic</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            📍 {routes.reduce((sum, route) => sum + (route.jobs?.length || 0), 0)} total jobs mapped
          </div>
        </div>
      </div>

      {/* Route Details Table */}
      {routes.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📋 Route Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traffic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CO₂</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Cost</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route, index) => (
                  <tr key={route.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: getRouteColor(index) }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">#{route.vehicleId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {route.vehicle?.license_plate || 'N/A'}
                      <div className="text-xs text-gray-500">{route.vehicle?.vehicle_type}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {route.jobs?.length || 0}
                      <div className="text-xs text-gray-500">{route.totalVolume || 0}m³</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDistance(route.realTimeDistance || 0)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(route.realTimeDurationInTraffic || 0)}
                      {trafficUpdates[route.id]?.delayMinutes > 0 && (
                        <div className="text-xs text-red-600">
                          +{trafficUpdates[route.id].delayMinutes}m delay
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        route.trafficCondition === 'light' ? 'bg-green-100 text-green-800' :
                        route.trafficCondition === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        route.trafficCondition === 'heavy' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {route.trafficCondition || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(route.co2Emissions || 0)}g
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {route.fuelCost || 0} SEK
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}