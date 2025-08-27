'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  Zap,
  BarChart3,
  Activity,
  Lightbulb,
  Clock,
  DollarSign
} from 'lucide-react';
import { RecruitmentMLDashboard, MLInsight } from '@/types/recruitment';

export default function MLInsightsDashboard() {
  const [dashboard, setDashboard] = useState<RecruitmentMLDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<MLInsight | null>(null);

  useEffect(() => {
    fetchMLDashboard();
    const interval = setInterval(fetchMLDashboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMLDashboard = async () => {
    try {
      const response = await fetch('/api/recruitment/ml-dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch ML dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'prediction': return <Target className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002A5C]" />
      </div>
    );
  }

  if (!dashboard) {
    return <div>No ML data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.overallMetrics.totalPredictions}</div>
            <p className="text-xs text-muted-foreground">AI-powered assessments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Model Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(dashboard.overallMetrics.averageAccuracy * 100).toFixed(1)}%
            </div>
            <Progress value={dashboard.overallMetrics.averageAccuracy * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cost Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboard.overallMetrics.costSavings.toLocaleString()} kr
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Time Reduction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboard.overallMetrics.timeReduction}%
            </div>
            <p className="text-xs text-muted-foreground">vs manual process</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              +{dashboard.overallMetrics.qualityImprovement}%
            </div>
            <p className="text-xs text-muted-foreground">Hire quality</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Active ML Insights
            </CardTitle>
            <CardDescription>Real-time recommendations from ML models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.activeInsights.slice(0, 5).map((insight) => (
                <div
                  key={insight.insightId}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedInsight(insight)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getImpactColor(insight.impact)}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Importance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Feature Importance
            </CardTitle>
            <CardDescription>What drives successful predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.featureImportance.slice(0, 8).map((feature, index) => (
                <div key={feature.feature} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{feature.feature}</span>
                    <span className="text-gray-600">{(feature.importance * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={feature.importance * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Model Performance Metrics
          </CardTitle>
          <CardDescription>Current ML model statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold text-green-600">
                {(dashboard.modelPerformance.metrics.accuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Precision</p>
              <p className="text-2xl font-bold text-blue-600">
                {(dashboard.modelPerformance.metrics.precision * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recall</p>
              <p className="text-2xl font-bold text-purple-600">
                {(dashboard.modelPerformance.metrics.recall * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">F1 Score</p>
              <p className="text-2xl font-bold text-orange-600">
                {(dashboard.modelPerformance.metrics.f1Score * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Last updated: {new Date(dashboard.modelPerformance.metrics.lastUpdated).toLocaleString('sv-SE')}
          </p>
        </CardContent>
      </Card>

      {/* Recent Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent ML Predictions
          </CardTitle>
          <CardDescription>Latest candidate assessments with outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Candidate</th>
                  <th className="text-left p-2">Position</th>
                  <th className="text-left p-2">Success Probability</th>
                  <th className="text-left p-2">Risk Factors</th>
                  <th className="text-left p-2">Actual Outcome</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentPredictions.slice(0, 5).map((pred, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{pred.candidate.name}</p>
                        <p className="text-xs text-gray-500">ID: {pred.candidate.id}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{pred.candidate.position}</Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={pred.prediction.predictions.successProbability * 100} 
                          className="h-2 w-16" 
                        />
                        <span className="text-sm font-medium">
                          {(pred.prediction.predictions.successProbability * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      {pred.prediction.predictions.riskFactors.length > 0 ? (
                        <Badge variant="destructive">
                          {pred.prediction.predictions.riskFactors.length} risks
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No risks</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      {pred.actualOutcome ? (
                        <div className="flex items-center gap-1">
                          {pred.actualOutcome.hired ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {pred.actualOutcome.hired ? 'Hired' : 'Not hired'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getInsightIcon(selectedInsight.type)}
                {selectedInsight.title}
              </CardTitle>
              <CardDescription>{selectedInsight.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={selectedInsight.impact === 'high' ? 'destructive' : 'secondary'}>
                    {selectedInsight.impact} impact
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {selectedInsight.confidence}% confidence
                  </span>
                  {selectedInsight.actionable && (
                    <Badge variant="outline">
                      <Zap className="h-3 w-3 mr-1" />
                      Actionable
                    </Badge>
                  )}
                </div>

                {selectedInsight.suggestedActions && selectedInsight.suggestedActions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Suggested Actions</h4>
                    <div className="space-y-2">
                      {selectedInsight.suggestedActions.map((action, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-sm">{action.action}</p>
                          <p className="text-xs text-gray-600 mt-1">{action.expectedOutcome}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline">
                              Effort: {action.effort}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Priority: {action.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedInsight(null)}>
                    Close
                  </Button>
                  {selectedInsight.actionable && (
                    <Button className="bg-[#002A5C] hover:bg-[#001a3d]">
                      <Zap className="h-4 w-4 mr-2" />
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}