import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

interface MLPredictionStatusProps {
  baseline: number;
  mlPrediction?: number;
  finalEstimate: number;
  confidence?: number;
  method: 'baseline' | 'ml' | 'hybrid' | 'weighted';
  cached?: boolean;
  error?: string;
}

export function MLPredictionStatus({
  baseline,
  mlPrediction,
  finalEstimate,
  confidence = 0,
  method,
  cached = false,
  error
}: MLPredictionStatusProps) {
  const improvement = mlPrediction 
    ? ((baseline - mlPrediction) / baseline) * 100 
    : 0;

  const getMethodBadge = () => {
    switch (method) {
      case 'ml':
        return (
          <Badge className="bg-purple-600 text-white">
            <Brain className="w-3 h-3 mr-1" />
            ML Enhanced
          </Badge>
        );
      case 'hybrid':
        return (
          <Badge className="bg-blue-600 text-white">
            <Zap className="w-3 h-3 mr-1" />
            Hybrid AI
          </Badge>
        );
      case 'weighted':
        return (
          <Badge className="bg-green-600 text-white">
            <Activity className="w-3 h-3 mr-1" />
            Weighted Average
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Enhanced v2.1
          </Badge>
        );
    }
  };

  const getConfidenceColor = () => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card className="border-2 border-gray-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Time Estimation
          </CardTitle>
          {getMethodBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Predictions Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Enhanced v2.1</p>
            <p className="text-xl font-bold">{baseline.toFixed(1)}h</p>
            <p className="text-xs text-gray-400">Baseline</p>
          </div>
          
          {mlPrediction && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">ML Prediction</p>
              <p className="text-xl font-bold text-purple-600">
                {mlPrediction.toFixed(1)}h
              </p>
              <p className="text-xs text-gray-400">
                {improvement > 0 ? (
                  <span className="text-green-600">
                    ↓ {improvement.toFixed(1)}% faster
                  </span>
                ) : improvement < 0 ? (
                  <span className="text-orange-600">
                    ↑ {Math.abs(improvement).toFixed(1)}% slower
                  </span>
                ) : (
                  'Same as baseline'
                )}
              </p>
            </div>
          )}
        </div>

        {/* Final Estimate */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Final Estimate</span>
            {cached && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Cached
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-[#002A5C]">
            {finalEstimate.toFixed(1)} timmar
          </p>
        </div>

        {/* Confidence Score */}
        {mlPrediction && confidence > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>ML Confidence</span>
              <span className={`font-medium ${getConfidenceColor()}`}>
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={confidence * 100} className="h-2" />
          </div>
        )}

        {/* Method Explanation */}
        <div className="text-xs text-gray-500 space-y-1">
          {method === 'ml' && (
            <p className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Using ML prediction (high confidence)
            </p>
          )}
          {method === 'hybrid' && (
            <p className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-500" />
              Combined ML + Enhanced Algorithm
            </p>
          )}
          {method === 'weighted' && (
            <p className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-green-500" />
              Weighted average based on confidence
            </p>
          )}
          {method === 'baseline' && (
            <p className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-yellow-500" />
              {error ? 'ML unavailable' : 'Using proven baseline'}
            </p>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">ML Active</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Enhanced v2.1</span>
          </div>
          {improvement > 10 && (
            <Badge variant="outline" className="text-xs ml-auto">
              <TrendingUp className="w-3 h-3 mr-1" />
              Optimized
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}