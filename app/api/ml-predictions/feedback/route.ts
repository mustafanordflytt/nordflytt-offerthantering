/**
 * ML Prediction Feedback API
 * Collects actual time data to improve ML model accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface FeedbackData {
  jobId: string;
  predictedHours: number;
  actualHours: number;
  teamSize: number;
  completedAt: string;
  notes?: string;
  factors?: {
    weatherImpact?: boolean;
    trafficDelays?: boolean;
    customerNotReady?: boolean;
    unexpectedComplexity?: boolean;
    equipmentIssues?: boolean;
  };
}

// In-memory storage for feedback (should be database in production)
const feedbackStore: FeedbackData[] = [];

/**
 * POST /api/ml-predictions/feedback
 * Submit feedback on prediction accuracy
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.jobId || !body.predictedHours || !body.actualHours) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        required: ['jobId', 'predictedHours', 'actualHours']
      }, { status: 400 });
    }

    const feedback: FeedbackData = {
      jobId: body.jobId,
      predictedHours: parseFloat(body.predictedHours),
      actualHours: parseFloat(body.actualHours),
      teamSize: body.teamSize || 2,
      completedAt: body.completedAt || new Date().toISOString(),
      notes: body.notes,
      factors: body.factors
    };

    // Calculate accuracy metrics
    const deviation = Math.abs(feedback.actualHours - feedback.predictedHours);
    const deviationPercentage = (deviation / feedback.predictedHours) * 100;
    const isAccurate = deviation <= 0.5; // Within 30 minutes

    // Store feedback
    feedbackStore.push(feedback);

    // Store in database if available
    try {
      const supabase = createRouteHandlerClient({ cookies });
      
      // Create ml_feedback table if not exists
      const { error: insertError } = await supabase
        .from('ml_feedback')
        .insert([{
          job_id: feedback.jobId,
          predicted_hours: feedback.predictedHours,
          actual_hours: feedback.actualHours,
          deviation_hours: deviation,
          deviation_percentage: deviationPercentage,
          is_accurate: isAccurate,
          team_size: feedback.teamSize,
          completed_at: feedback.completedAt,
          notes: feedback.notes,
          factors: feedback.factors,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Failed to store feedback in database:', insertError);
      }
    } catch (dbError) {
      console.error('Database error storing feedback:', dbError);
    }

    // Update the AI model with feedback
    try {
      const { timeEstimationAI } = await import('@/lib/ai/models/enhanced-time-estimation-integration');
      await timeEstimationAI.updateActualTime(feedback.jobId, feedback.actualHours);
    } catch (aiError) {
      console.error('Failed to update AI with feedback:', aiError);
    }

    // Prepare response with insights
    const response = {
      success: true,
      feedback: {
        jobId: feedback.jobId,
        deviation: deviation.toFixed(2),
        deviationPercentage: deviationPercentage.toFixed(1) + '%',
        accuracy: isAccurate ? 'accurate' : 'needs improvement',
        insights: generateInsights(feedback, deviation, deviationPercentage)
      },
      aggregateMetrics: calculateAggregateMetrics()
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process feedback',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/ml-predictions/feedback
 * Get feedback analytics
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    if (jobId) {
      // Get specific job feedback
      const feedback = feedbackStore.find(f => f.jobId === jobId);
      
      if (!feedback) {
        return NextResponse.json({
          success: false,
          error: 'Feedback not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        feedback,
        metrics: calculateJobMetrics(feedback)
      });
    }

    // Get aggregate feedback analytics
    const recentFeedback = feedbackStore.slice(-limit);
    const metrics = calculateAggregateMetrics();
    const patterns = identifyPatterns(recentFeedback);

    return NextResponse.json({
      success: true,
      totalFeedback: feedbackStore.length,
      recentFeedback: recentFeedback.map(f => ({
        jobId: f.jobId,
        predicted: f.predictedHours,
        actual: f.actualHours,
        deviation: Math.abs(f.actualHours - f.predictedHours),
        completedAt: f.completedAt
      })),
      metrics,
      patterns,
      recommendations: generateRecommendations(metrics, patterns)
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve feedback',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Generate insights from feedback
 */
function generateInsights(feedback: FeedbackData, deviation: number, deviationPercentage: number): string[] {
  const insights: string[] = [];

  if (feedback.actualHours > feedback.predictedHours) {
    insights.push(`Job took ${deviation.toFixed(1)}h longer than predicted (${deviationPercentage.toFixed(0)}% over)`);
    
    if (feedback.factors?.weatherImpact) {
      insights.push('Weather conditions affected performance');
    }
    if (feedback.factors?.customerNotReady) {
      insights.push('Customer preparation was below expected');
    }
    if (feedback.factors?.unexpectedComplexity) {
      insights.push('Job complexity was higher than estimated');
    }
  } else {
    insights.push(`Job completed ${deviation.toFixed(1)}h faster than predicted (${deviationPercentage.toFixed(0)}% under)`);
    
    if (feedback.teamSize > 3) {
      insights.push('Larger team size contributed to efficiency');
    }
  }

  // Team size insights
  if (feedback.teamSize === 1 && deviation > 1) {
    insights.push('Single-person jobs show higher variance');
  }

  return insights;
}

/**
 * Calculate aggregate metrics from all feedback
 */
function calculateAggregateMetrics() {
  if (feedbackStore.length === 0) {
    return {
      totalJobs: 0,
      avgDeviation: 0,
      accuracy: 0,
      overestimated: 0,
      underestimated: 0,
      withinTarget: 0
    };
  }

  const totalJobs = feedbackStore.length;
  let totalDeviation = 0;
  let accurateCount = 0;
  let overestimated = 0;
  let underestimated = 0;

  feedbackStore.forEach(feedback => {
    const deviation = Math.abs(feedback.actualHours - feedback.predictedHours);
    totalDeviation += deviation;
    
    if (deviation <= 0.5) accurateCount++;
    if (feedback.predictedHours > feedback.actualHours) overestimated++;
    if (feedback.predictedHours < feedback.actualHours) underestimated++;
  });

  return {
    totalJobs,
    avgDeviation: totalDeviation / totalJobs,
    accuracy: (accurateCount / totalJobs) * 100,
    overestimated: (overestimated / totalJobs) * 100,
    underestimated: (underestimated / totalJobs) * 100,
    withinTarget: accurateCount
  };
}

/**
 * Calculate metrics for a specific job
 */
function calculateJobMetrics(feedback: FeedbackData) {
  const deviation = Math.abs(feedback.actualHours - feedback.predictedHours);
  const deviationPercentage = (deviation / feedback.predictedHours) * 100;
  
  return {
    deviation: deviation.toFixed(2),
    deviationPercentage: deviationPercentage.toFixed(1) + '%',
    accuracy: deviation <= 0.5 ? 'accurate' : deviation <= 1 ? 'acceptable' : 'needs improvement',
    direction: feedback.actualHours > feedback.predictedHours ? 'underestimated' : 'overestimated'
  };
}

/**
 * Identify patterns in feedback data
 */
function identifyPatterns(feedback: FeedbackData[]) {
  const patterns = {
    teamSizeImpact: {} as Record<number, number>,
    factorFrequency: {} as Record<string, number>,
    timeOfDayImpact: {} as Record<string, number>
  };

  feedback.forEach(f => {
    // Team size impact
    if (!patterns.teamSizeImpact[f.teamSize]) {
      patterns.teamSizeImpact[f.teamSize] = 0;
    }
    patterns.teamSizeImpact[f.teamSize] += Math.abs(f.actualHours - f.predictedHours);

    // Factor frequency
    if (f.factors) {
      Object.entries(f.factors).forEach(([factor, value]) => {
        if (value) {
          patterns.factorFrequency[factor] = (patterns.factorFrequency[factor] || 0) + 1;
        }
      });
    }
  });

  return patterns;
}

/**
 * Generate recommendations based on metrics and patterns
 */
function generateRecommendations(metrics: any, patterns: any): string[] {
  const recommendations: string[] = [];

  if (metrics.accuracy < 70) {
    recommendations.push('Model accuracy is below target. Consider retraining with recent data.');
  }

  if (metrics.underestimated > 60) {
    recommendations.push('Model tends to underestimate. Adjust baseline multipliers.');
  }

  if (metrics.overestimated > 60) {
    recommendations.push('Model tends to overestimate. Review efficiency calculations.');
  }

  if (patterns.factorFrequency.weatherImpact > 5) {
    recommendations.push('Weather significantly impacts predictions. Enhance weather scoring.');
  }

  if (patterns.factorFrequency.customerNotReady > 5) {
    recommendations.push('Customer preparation is often below expected. Adjust default preparation score.');
  }

  return recommendations;
}