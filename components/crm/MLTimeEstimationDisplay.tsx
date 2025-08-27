'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Brain,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Send
} from 'lucide-react';

interface TimeEstimation {
  mlPrediction?: number;
  baselinePrediction: number;
  confidence: number;
  improvement?: string;
  modelVersion?: string;
  breakdown?: {
    loadingHours: number;
    unloadingHours: number;
    drivingHours: number;
    packingHours?: number;
    cleaningHours?: number;
    logisticsHours: number;
    additionalHours: number;
  };
  teamOptimization?: {
    currentTeamSize: number;
    optimalTeamSize: number;
    efficiencyRating: string;
    recommendations: string[];
  };
}

interface Props {
  estimation: TimeEstimation | null;
  jobId?: string;
  onFeedbackSubmit?: (feedback: any) => void;
  showFeedback?: boolean;
  actualHours?: number;
}

export default function MLTimeEstimationDisplay({ 
  estimation, 
  jobId, 
  onFeedbackSubmit, 
  showFeedback = false,
  actualHours 
}: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    actualHours: actualHours || '',
    notes: '',
    factors: {
      weatherImpact: false,
      trafficDelays: false,
      customerNotReady: false,
      unexpectedComplexity: false,
      equipmentIssues: false
    }
  });

  if (!estimation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No time estimation available
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayHours = estimation.mlPrediction || estimation.baselinePrediction;
  const isMLEnhanced = !!estimation.mlPrediction;
  const confidencePercent = (estimation.confidence * 100).toFixed(0);
  const confidenceColor = estimation.confidence >= 0.85 ? 'text-green-600' : 
                         estimation.confidence >= 0.7 ? 'text-yellow-600' : 'text-red-600';

  const handleFeedbackSubmit = async () => {
    if (!jobId || !feedbackData.actualHours) return;

    try {
      const response = await fetch('/api/ml-predictions/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          predictedHours: displayHours,
          actualHours: parseFloat(feedbackData.actualHours),
          teamSize: estimation.teamOptimization?.currentTeamSize || 2,
          notes: feedbackData.notes,
          factors: feedbackData.factors
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (onFeedbackSubmit) {
          onFeedbackSubmit(result);
        }
        setFeedbackOpen(false);
        // Reset form
        setFeedbackData({
          actualHours: '',
          notes: '',
          factors: {
            weatherImpact: false,
            trafficDelays: false,
            customerNotReady: false,
            unexpectedComplexity: false,
            equipmentIssues: false
          }
        });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Estimation Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Estimation
              </CardTitle>
              <CardDescription>
                {isMLEnhanced ? 'ML-Enhanced Prediction' : 'Algorithm-Based Estimation'}
              </CardDescription>
            </div>
            {isMLEnhanced && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                ML Enhanced
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main Prediction */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">
                {displayHours.toFixed(1)} hours
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Estimated completion time
              </p>
            </div>

            {/* ML vs Baseline Comparison */}
            {isMLEnhanced && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ML Prediction</p>
                  <p className="text-xl font-semibold">{estimation.mlPrediction?.toFixed(1)}h</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Baseline</p>
                  <p className="text-xl font-semibold">{estimation.baselinePrediction.toFixed(1)}h</p>
                </div>
              </div>
            )}

            {/* Confidence and Improvement */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Confidence</span>
                  <span className={`text-sm font-semibold ${confidenceColor}`}>
                    {confidencePercent}%
                  </span>
                </div>
                <Progress value={parseFloat(confidencePercent)} className="h-2" />
              </div>

              {estimation.improvement && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Efficiency Improvement</span>
                  <Badge variant="secondary" className="bg-green-100">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {estimation.improvement}
                  </Badge>
                </div>
              )}
            </div>

            {/* Model Version */}
            {estimation.modelVersion && (
              <div className="text-xs text-muted-foreground text-center">
                Model: {estimation.modelVersion}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Breakdown */}
      {estimation.breakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Time Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(estimation.breakdown).map(([key, value]) => {
                if (value === 0) return null;
                const label = key.replace(/Hours$/, '').replace(/([A-Z])/g, ' $1').trim();
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{label}</span>
                    <span className="text-sm font-medium">{value.toFixed(1)}h</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Optimization */}
      {estimation.teamOptimization && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Team</p>
                  <p className="text-lg font-medium">
                    {estimation.teamOptimization.currentTeamSize} people
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Optimal Team</p>
                  <p className="text-lg font-medium">
                    {estimation.teamOptimization.optimalTeamSize} people
                  </p>
                </div>
              </div>
              
              <Badge 
                variant={estimation.teamOptimization.efficiencyRating === 'optimal' ? 'default' : 'secondary'}
                className="w-full justify-center"
              >
                {estimation.teamOptimization.efficiencyRating.toUpperCase()}
              </Badge>

              {estimation.teamOptimization.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recommendations:</p>
                  {estimation.teamOptimization.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Section */}
      {showFeedback && jobId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Prediction Feedback
              </CardTitle>
              {!feedbackOpen && (
                <Button size="sm" onClick={() => setFeedbackOpen(true)}>
                  Add Feedback
                </Button>
              )}
            </div>
          </CardHeader>
          {feedbackOpen && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Actual Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={feedbackData.actualHours}
                    onChange={(e) => setFeedbackData({
                      ...feedbackData,
                      actualHours: e.target.value
                    })}
                    placeholder="Enter actual hours"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Contributing Factors</label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(feedbackData.factors).map(([factor, checked]) => (
                      <div key={factor} className="flex items-center gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checked) => setFeedbackData({
                            ...feedbackData,
                            factors: {
                              ...feedbackData.factors,
                              [factor]: !!checked
                            }
                          })}
                        />
                        <label className="text-sm">
                          {factor.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Additional Notes</label>
                  <Textarea
                    className="mt-1"
                    value={feedbackData.notes}
                    onChange={(e) => setFeedbackData({
                      ...feedbackData,
                      notes: e.target.value
                    })}
                    placeholder="Any additional observations..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackData.actualHours}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setFeedbackOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}