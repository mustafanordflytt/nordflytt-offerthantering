'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Brain, TrendingUp, Activity, Zap, 
  CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';

interface MLMetrics {
  totalPredictions: number;
  mlEnhancedPredictions: number;
  avgInferenceTime: number;
  accuracy: number;
  avgImprovement: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  recentPredictions: Array<{
    timestamp: string;
    baseline: number;
    mlPrediction: number;
    actual?: number;
    confidence: number;
  }>;
}

export default function MLModelMonitor() {
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelStatus, setModelStatus] = useState<'healthy' | 'degraded' | 'offline'>('healthy');

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/ai/ml-metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setModelStatus(data.modelStatus || 'healthy');
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch ML metrics:', error);
      setModelStatus('offline');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const accuracyData = metrics?.recentPredictions?.map((p, i) => ({
    time: new Date(p.timestamp).toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    baseline: p.baseline,
    ml: p.mlPrediction,
    actual: p.actual,
    improvement: ((p.baseline - p.mlPrediction) / p.baseline * 100).toFixed(1)
  })) || [];

  const mlUsageRate = metrics ? 
    (metrics.mlEnhancedPredictions / metrics.totalPredictions * 100) : 0;

  return (
    <>
      {/* ML Model Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            ML Model Status
          </CardTitle>
          <Brain className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">SageMaker</span>
            <Badge 
              variant={modelStatus === 'healthy' ? 'default' : 
                      modelStatus === 'degraded' ? 'secondary' : 'destructive'}
              className="flex items-center gap-1"
            >
              {modelStatus === 'healthy' && <CheckCircle className="h-3 w-3" />}
              {modelStatus === 'degraded' && <AlertTriangle className="h-3 w-3" />}
              {modelStatus.charAt(0).toUpperCase() + modelStatus.slice(1)}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model Version</span>
              <span className="font-medium">v1.0-RandomForest</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Endpoint</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Latency</span>
              <span className="font-medium">{metrics?.avgInferenceTime || 0}ms</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>ML Usage Rate</span>
              <span className="font-medium">{mlUsageRate.toFixed(1)}%</span>
            </div>
            <Progress value={mlUsageRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* ML Performance Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            ML Performance
          </CardTitle>
          <Zap className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics?.accuracy.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-muted-foreground">vs baseline</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Improvement</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.avgImprovement.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-muted-foreground">time reduction</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Confidence Distribution</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>High (>85%)</span>
                <span className="font-medium">
                  {metrics?.confidenceDistribution.high || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Medium (70-85%)</span>
                <span className="font-medium">
                  {metrics?.confidenceDistribution.medium || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Low (<70%)</span>
                <span className="font-medium">
                  {metrics?.confidenceDistribution.low || 0}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML vs Baseline Comparison Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            ML Model vs Enhanced Algorithm v2.1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-medium">{payload[0].payload.time}</p>
                          <p className="text-blue-600">
                            Baseline: {payload[0].payload.baseline}h
                          </p>
                          <p className="text-purple-600">
                            ML: {payload[0].payload.ml}h
                          </p>
                          {payload[0].payload.actual && (
                            <p className="text-green-600">
                              Actual: {payload[0].payload.actual}h
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            Improvement: {payload[0].payload.improvement}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="baseline" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Enhanced v2.1"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="ml" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="ML Model"
                  dot={false}
                />
                {accuracyData.some(d => d.actual) && (
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Actual"
                    dot={{ r: 4 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600"></div>
              <span>Enhanced Algorithm v2.1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-purple-600"></div>
              <span>ML Model (SageMaker)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-600" style={{borderStyle: 'dashed'}}></div>
              <span>Actual Time</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent ML Predictions */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Recent ML Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics?.recentPredictions.slice(0, 5).map((pred, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(pred.timestamp).toLocaleString('sv-SE')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Baseline: {pred.baseline}h → ML: {pred.mlPrediction}h
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pred.confidence > 0.85 ? 'default' : 'secondary'}>
                    {(pred.confidence * 100).toFixed(0)}% conf
                  </Badge>
                  <span className={`text-sm font-medium ${
                    pred.mlPrediction < pred.baseline ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {pred.mlPrediction < pred.baseline ? '↓' : '↑'} 
                    {Math.abs(((pred.baseline - pred.mlPrediction) / pred.baseline * 100)).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}