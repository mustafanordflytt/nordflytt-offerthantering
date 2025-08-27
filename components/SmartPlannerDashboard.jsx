import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default markers in React
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function SmartPlannerDashboard() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobs, setJobs] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetchJobs(date);
    fetchWeather(date);
  }, [date]);

  const fetchJobs = async (date) => {
    try {
      setError(null);
      const response = await fetch(`/api/jobs?date=${date}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Kunde inte hämta jobb för denna dag');
      // Fallback mock data för demo
      setJobs([
        { id: 1, lat: 59.3293, lng: 18.0686, customer_name: 'Test Kund 1', estimated_duration_minutes: 120 },
        { id: 2, lat: 59.3156, lng: 18.0739, customer_name: 'Test Kund 2', estimated_duration_minutes: 180 },
        { id: 3, lat: 59.3370, lng: 18.0827, customer_name: 'Test Kund 3', estimated_duration_minutes: 90 }
      ]);
    }
  };

  const fetchWeather = async (date) => {
    try {
      const response = await fetch(`/api/weather?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setWeather(data);
      }
    } catch (error) {
      console.error('Weather fetch failed:', error);
    }
  };

  const handleOptimize = async () => {
    if (!jobs.length) {
      setError('Inga jobb att optimera för denna dag');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/optimize-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, jobs })
      });
      
      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setOptimization(data);
    } catch (err) {
      console.error('Optimization error:', err);
      setError('Optimering misslyckades: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getClusterColor = (clusterId) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[clusterId % colors.length];
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">🤖 Smart Schemaläggning</h1>
          <p className="text-blue-100">DBSCAN-kluster optimering för Stockholm</p>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum för optimering
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleOptimize}
                disabled={loading || !jobs.length}
                className="bg-blue-500 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  '⚡ Optimera Schema'
                )}
              </button>
            </div>

            {/* Job Count */}
            <div className="bg-gray-100 px-3 py-2 rounded-md">
              <span className="text-sm text-gray-600">
                📋 {jobs.length} jobb för {date}
              </span>
            </div>

            {/* Weather Info */}
            {weather && (
              <div className="bg-blue-50 px-3 py-2 rounded-md">
                <span className="text-sm text-blue-700">
                  🌤️ {weather.weather?.temperature_avg}°C
                  {weather.impact?.extraTimeMinutes > 0 && (
                    <span className="text-orange-600 ml-2">
                      +{weather.impact.extraTimeMinutes}min väder
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
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

        {/* Results */}
        <div className="p-6">
          {optimization ? (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3">📊 Optimeringsresultat</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {optimization.efficiency_gain}%
                    </div>
                    <div className="text-sm text-green-700">Effektivitet</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {optimization.clusters?.length || 0}
                    </div>
                    <div className="text-sm text-blue-700">Kluster</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {optimization.optimization_score || 0}
                    </div>
                    <div className="text-sm text-purple-700">AI-Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {optimization.noise?.length || 0}
                    </div>
                    <div className="text-sm text-orange-700">Ej grupperade</div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">🗺️ Kluster-karta</h3>
                </div>
                <div style={{ height: '500px' }}>
                  <MapContainer 
                    center={[59.3293, 18.0686]} 
                    zoom={12} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Render clustered jobs */}
                    {optimization.clusters?.map((cluster, clusterIndex) =>
                      cluster.jobs?.map((job, jobIndex) => (
                        <Marker 
                          key={`${clusterIndex}-${jobIndex}`}
                          position={[job.lat || job.address_lat, job.lng || job.address_lng]}
                          icon={L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="background-color: ${getClusterColor(clusterIndex)}; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${clusterIndex + 1}</div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                          })}
                        >
                          <Popup>
                            <div className="text-sm">
                              <strong>Kluster {clusterIndex + 1}</strong><br/>
                              Kund: {job.customer_name || job.id}<br/>
                              Tid: {formatDuration(job.estimated_duration_minutes || 120)}<br/>
                              Team: {cluster.recommended_team_size || 2} personer
                            </div>
                          </Popup>
                        </Marker>
                      ))
                    )}

                    {/* Render noise points */}
                    {optimization.noise?.map((job, index) => (
                      <Marker 
                        key={`noise-${index}`}
                        position={[job.lat || job.address_lat, job.lng || job.address_lng]}
                        icon={L.divIcon({
                          className: 'custom-div-icon',
                          html: `<div style="background-color: #666; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">?</div>`,
                          iconSize: [20, 20],
                          iconAnchor: [10, 10]
                        })}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong>Ej grupperad</strong><br/>
                            Kund: {job.customer_name || job.id}<br/>
                            Tid: {formatDuration(job.estimated_duration_minutes || 120)}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              {/* Cluster Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {optimization.clusters?.map((cluster, index) => (
                  <div 
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-3">
                      <div 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: getClusterColor(index) }}
                      ></div>
                      <h4 className="font-semibold">Kluster {index + 1}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>📍 {cluster.jobs?.length || 0} jobb</div>
                      <div>⏱️ {formatDuration(cluster.estimated_duration || 0)}</div>
                      <div>👥 {cluster.recommended_team_size || 2} personer</div>
                      {cluster.jobs?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-600">Jobb:</div>
                          {cluster.jobs.slice(0, 3).map((job, jobIndex) => (
                            <div key={jobIndex} className="text-xs text-gray-500">
                              • {job.customer_name || `Jobb ${job.id}`}
                            </div>
                          ))}
                          {cluster.jobs.length > 3 && (
                            <div className="text-xs text-gray-400">
                              ... och {cluster.jobs.length - 3} till
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium mb-2">Välj datum och klicka "Optimera Schema"</h3>
              <p className="text-sm">AI:n kommer att gruppera jobb geografiskt för maximal effektivitet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}