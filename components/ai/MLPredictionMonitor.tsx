'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  BarChart3,
  Zap,
  Clock,
  Brain
} from 'lucide-react';

interface MLMetrics {
  status: string;
  mlEnabled: boolean;
  sagemakerHealthy: boolean;
  endpoint: string;
  metrics: {
    api: {
      totalRequests: number;
      requestsPerHour: number;
      mlSuccesses: number;
      mlFailures: number;
      cacheHits: number;
      avgResponseTime: string;
      cacheHitRate: string;
      mlSuccessRate: string;
    };
    sagemaker: {
      totalPredictions: number;
      avgInferenceTime: number;
      endpointName: string;
      modelVersion: string;
    };
  };
}

interface PredictionResult {
  mlPrediction: number;
  baselinePrediction: number;
  confidence: number;
  improvement: string;
  modelVersion: string;
  inferenceTime: number;
}

export default function MLPredictionMonitor() {
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/ml-predictions/health');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  // Test prediction
  const testPrediction = async () => {
    try {
      const testData = {
        livingArea: 75,
        teamSize: 3,
        distance: 15,
        propertyType: 'lägenhet',
        floors: { from: 2, to: 3 },
        elevatorType: { from: 'liten', to: 'stor' },
        services: ['moving', 'packing']
      };

      const response = await fetch('/api/ml-predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (!response.ok) throw new Error('Prediction failed');
      const data = await response.json();
      
      if (data.success && data.prediction) {
        setLastPrediction(data.prediction);
      }
    } catch (err) {
      console.error('Test prediction failed:', err);
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchMetrics();
    const interval = autoRefresh ? setInterval(fetchMetrics, 5000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const statusColor = metrics.status === 'healthy' ? 'bg-green-500' : 
                     metrics.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500';
  
  const successRate = parseFloat(metrics.metrics.api.mlSuccessRate);
  const cacheHitRate = parseFloat(metrics.metrics.api.cacheHitRate);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                ML Prediction Monitor
              </CardTitle>
              <CardDescription>
                Real-time monitoring of SageMaker ML predictions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                {metrics.status.toUpperCase()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ML Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ML Status</p>
                <p className="text-2xl font-bold">
                  {metrics.mlEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              {metrics.mlEnabled ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Requests per Hour */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requests/Hour</p>
                <p className="text-2xl font-bold">{metrics.metrics.api.requestsPerHour}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">ML Success Rate</p>
                {successRate > 90 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <Progress value={successRate} className="h-2" />
              <p className="text-sm font-medium">{metrics.metrics.api.mlSuccessRate}</p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{metrics.metrics.api.avgResponseTime}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cache Performance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                <Badge variant="secondary">{metrics.metrics.api.cacheHitRate}</Badge>
              </div>
              <Progress value={cacheHitRate} className="h-2" />
            </div>

            {/* ML Predictions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total ML Predictions</span>
                <span className="font-medium">{metrics.metrics.api.mlSuccesses}</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {metrics.metrics.api.mlFailures} failures
                </span>
              </div>
            </div>

            {/* SageMaker Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inference Time</span>
                <Badge variant="secondary">{metrics.metrics.sagemaker.avgInferenceTime}ms</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {metrics.metrics.sagemaker.modelVersion}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Prediction */}
      {lastPrediction && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Last Test Prediction</CardTitle>
              <Button size="sm" onClick={testPrediction}>
                Run Test
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ML Prediction</p>
                <p className="text-xl font-bold">{lastPrediction.mlPrediction}h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Baseline</p>
                <p className="text-xl font-bold">{lastPrediction.baselinePrediction}h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Improvement</p>
                <p className="text-xl font-bold text-green-600">{lastPrediction.improvement}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-xl font-bold">{(lastPrediction.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoint Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">SageMaker Endpoint:</span>
            <code className="bg-muted px-2 py-1 rounded">{metrics.endpoint}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}