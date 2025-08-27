'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MLPredictionMonitor from '@/components/ai/MLPredictionMonitor';
import MLTimeEstimationDisplay from '@/components/crm/MLTimeEstimationDisplay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  BarChart3,
  FileText,
  RefreshCw,
  Download
} from 'lucide-react';

// Mock data for demo
const mockEstimation = {
  mlPrediction: 5.2,
  baselinePrediction: 6.0,
  confidence: 0.89,
  improvement: '13.3%',
  modelVersion: 'v1.0-randomforest',
  breakdown: {
    loadingHours: 1.8,
    unloadingHours: 1.6,
    drivingHours: 0.8,
    packingHours: 0.7,
    cleaningHours: 0,
    logisticsHours: 0.2,
    additionalHours: 0.1
  },
  teamOptimization: {
    currentTeamSize: 3,
    optimalTeamSize: 3,
    efficiencyRating: 'optimal',
    recommendations: [
      'Team size is optimal for this job',
      'Consider parallel work for packing and loading'
    ]
  }
};

export default function MLInsightsPage() {
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch feedback analytics
  const fetchFeedbackAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ml-predictions/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedbackData(data);
      }
    } catch (error) {
      console.error('Failed to fetch feedback analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackAnalytics();
  }, []);

  const exportData = () => {
    // Create CSV export of feedback data
    if (!feedbackData || !feedbackData.recentFeedback) return;

    const csv = [
      ['Job ID', 'Predicted Hours', 'Actual Hours', 'Deviation', 'Completed At'],
      ...feedbackData.recentFeedback.map(f => [
        f.jobId,
        f.predicted,
        f.actual,
        f.deviation,
        f.completedAt
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            ML Insights & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and improve machine learning predictions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchFeedbackAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="monitor">
            <Activity className="h-4 w-4 mr-2" />
            Real-time Monitor
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="example">
            <FileText className="h-4 w-4 mr-2" />
            Example Prediction
          </TabsTrigger>
        </TabsList>

        {/* Real-time Monitor Tab */}
        <TabsContent value="monitor">
          <MLPredictionMonitor />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {feedbackData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Feedback</p>
                      <p className="text-3xl font-bold">{feedbackData.totalFeedback}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                      <p className="text-3xl font-bold">{feedbackData.metrics?.accuracy?.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Within 30 min</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Avg Deviation</p>
                      <p className="text-3xl font-bold">{feedbackData.metrics?.avgDeviation?.toFixed(2)}h</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Trend</p>
                      <div className="flex items-center gap-2">
                        {feedbackData.metrics?.underestimated > feedbackData.metrics?.overestimated ? (
                          <>
                            <TrendingUp className="h-6 w-6 text-orange-500" />
                            <span className="text-sm">Underestimating</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-6 w-6 text-blue-500" />
                            <span className="text-sm">Overestimating</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Patterns & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patterns */}
                <Card>
                  <CardHeader>
                    <CardTitle>Identified Patterns</CardTitle>
                    <CardDescription>Common factors affecting predictions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feedbackData.patterns && (
                      <div className="space-y-3">
                        {/* Team Size Impact */}
                        <div>
                          <p className="text-sm font-medium mb-2">Team Size Impact</p>
                          <div className="space-y-1">
                            {Object.entries(feedbackData.patterns.teamSizeImpact).map(([size, impact]) => (
                              <div key={size} className="flex items-center justify-between text-sm">
                                <span>{size} people team</span>
                                <Badge variant="secondary">{impact}h avg deviation</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Factor Frequency */}
                        <div>
                          <p className="text-sm font-medium mb-2">Common Factors</p>
                          <div className="space-y-1">
                            {Object.entries(feedbackData.patterns.factorFrequency).map(([factor, count]) => (
                              <div key={factor} className="flex items-center justify-between text-sm">
                                <span>{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <Badge variant="outline">{count} times</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Recommendations</CardTitle>
                    <CardDescription>Suggestions for improving accuracy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feedbackData.recommendations && feedbackData.recommendations.length > 0 ? (
                      <div className="space-y-2">
                        {feedbackData.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No recommendations at this time. Model is performing well.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Feedback Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Feedback</CardTitle>
                  <CardDescription>Latest prediction accuracy data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-medium">Job ID</th>
                          <th className="text-right p-2 text-sm font-medium">Predicted</th>
                          <th className="text-right p-2 text-sm font-medium">Actual</th>
                          <th className="text-right p-2 text-sm font-medium">Deviation</th>
                          <th className="text-right p-2 text-sm font-medium">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedbackData.recentFeedback?.slice(0, 10).map((feedback, idx) => {
                          const accuracy = feedback.deviation <= 0.5 ? 'accurate' : 
                                         feedback.deviation <= 1 ? 'acceptable' : 'needs improvement';
                          const accuracyColor = accuracy === 'accurate' ? 'text-green-600' :
                                              accuracy === 'acceptable' ? 'text-yellow-600' : 'text-red-600';
                          
                          return (
                            <tr key={idx} className="border-b">
                              <td className="p-2 text-sm font-mono">{feedback.jobId}</td>
                              <td className="p-2 text-sm text-right">{feedback.predicted.toFixed(1)}h</td>
                              <td className="p-2 text-sm text-right">{feedback.actual.toFixed(1)}h</td>
                              <td className="p-2 text-sm text-right">{feedback.deviation.toFixed(1)}h</td>
                              <td className="p-2 text-right">
                                <span className={`text-sm font-medium ${accuracyColor}`}>
                                  {accuracy}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Example Prediction Tab */}
        <TabsContent value="example">
          <div className="max-w-2xl mx-auto">
            <MLTimeEstimationDisplay 
              estimation={mockEstimation}
              jobId="DEMO-001"
              showFeedback={true}
              onFeedbackSubmit={(feedback) => {
                console.log('Feedback submitted:', feedback);
                fetchFeedbackAnalytics();
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}