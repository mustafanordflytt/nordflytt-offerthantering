// Performance Trends API for ML and team analytics
// Phase 3 implementation supporting advanced trend analysis

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const teamId = searchParams.get('teamId');
    const includeML = searchParams.get('includeML') === 'true';
    
    console.log('📈 Fetching performance trends:', { days, teamId, includeML });

    // Validate parameters
    if (days < 1 || days > 365) {
      return NextResponse.json({ 
        error: 'Days parameter must be between 1 and 365' 
      }, { status: 400 });
    }

    try {
      // In production, this would query the actual database
      // For now, generate realistic mock data
      const performanceTrends = generatePerformanceTrends(days, teamId, includeML);
      
      const summary = calculateTrendSummary(performanceTrends);
      
      console.log(`✅ Performance trends generated: ${performanceTrends.length} data points`);

      return NextResponse.json({
        trends: performanceTrends,
        summary,
        parameters: {
          days,
          teamId,
          includeML,
          dataPoints: performanceTrends.length
        },
        generatedAt: new Date().toISOString()
      }, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Data-Points': performanceTrends.length.toString(),
          'X-Days-Range': days.toString(),
          'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
        }
      });

    } catch (dataError) {
      console.error('Failed to generate performance trends:', dataError);
      
      return NextResponse.json({ 
        error: 'Failed to generate performance trends',
        message: dataError instanceof Error ? dataError.message : 'Data generation error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Performance trends API failed:', error);
    
    return NextResponse.json({ 
      error: 'Performance trends request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, filters = {}, aggregation = 'daily' } = body;
    
    console.log('📊 Custom performance trends request:', { startDate, endDate, filters, aggregation });

    // Validate dates
    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Start date and end date are required' 
      }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format' 
      }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json({ 
        error: 'Start date must be before end date' 
      }, { status: 400 });
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 365) {
      return NextResponse.json({ 
        error: 'Date range cannot exceed 365 days' 
      }, { status: 400 });
    }

    // Generate custom trends based on filters
    const customTrends = generateCustomPerformanceTrends(start, end, filters, aggregation);
    const analysis = analyzeCustomTrends(customTrends, filters);
    
    return NextResponse.json({
      trends: customTrends,
      analysis,
      parameters: {
        startDate,
        endDate,
        filters,
        aggregation,
        daysDiff
      },
      generatedAt: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Custom performance trends failed:', error);
    
    return NextResponse.json({ 
      error: 'Custom trends request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generatePerformanceTrends(days: number, teamId?: string, includeML: boolean = false) {
  const trends = [];
  const baseDate = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    
    // Generate realistic efficiency trend with some variation
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Base efficiency varies by day of week
    let baseEfficiency = isWeekend ? 85 : 90;
    
    // Add some seasonal/weekly patterns
    const weekProgress = (7 - dayOfWeek) / 7;
    baseEfficiency += weekProgress * 5;
    
    // Add some random variation
    const variation = (Math.random() - 0.5) * 8;
    const efficiency = Math.max(70, Math.min(99, baseEfficiency + variation));
    
    // ML accuracy tends to improve over time
    let mlAccuracy = 75 + (days - i) * 0.3 + (Math.random() - 0.5) * 6;
    mlAccuracy = Math.max(60, Math.min(95, mlAccuracy));
    
    const trend: any = {
      date: date.toISOString().split('T')[0],
      efficiency: Math.round(efficiency * 10) / 10,
      team_count: Math.floor(Math.random() * 3) + 3, // 3-5 teams
      avg_completion_time: Math.round((240 + (Math.random() - 0.5) * 60) * 10) / 10,
      customer_satisfaction: Math.round((4.0 + Math.random() * 1.0) * 10) / 10,
      incident_count: Math.floor(Math.random() * 3),
      workload_variance: Math.round((0.1 + Math.random() * 0.3) * 100) / 100
    };

    if (includeML) {
      trend.ml_accuracy = Math.round(mlAccuracy * 10) / 10;
      trend.prediction_confidence = Math.round((0.7 + Math.random() * 0.25) * 100) / 100;
      trend.model_retraining = Math.random() < 0.1; // 10% chance of retraining
    }

    if (teamId) {
      // Add team-specific metrics
      trend.team_id = teamId;
      trend.team_efficiency_rank = Math.floor(Math.random() * 5) + 1;
      trend.skill_utilization = Math.round((0.75 + Math.random() * 0.25) * 100) / 100;
    }

    trends.push(trend);
  }
  
  return trends;
}

function generateCustomPerformanceTrends(startDate: Date, endDate: Date, filters: any, aggregation: string) {
  const trends = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let stepDays = 1;
  if (aggregation === 'weekly') stepDays = 7;
  if (aggregation === 'monthly') stepDays = 30;
  
  for (let i = 0; i < daysDiff; i += stepDays) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const trend: any = {
      date: date.toISOString().split('T')[0],
      period: aggregation,
      efficiency: Math.round((85 + Math.random() * 15) * 10) / 10,
      team_count: Math.floor(Math.random() * 4) + 2,
      optimization_count: Math.floor(Math.random() * 5),
      real_time_adaptations: Math.floor(Math.random() * 3)
    };

    // Apply filters
    if (filters.teamIds && filters.teamIds.length > 0) {
      trend.filtered_teams = filters.teamIds;
      trend.efficiency += Math.random() * 5 - 2.5; // Variation for filtered data
    }
    
    if (filters.skillTypes && filters.skillTypes.length > 0) {
      trend.skill_focus = filters.skillTypes;
      trend.skill_improvement = Math.round((Math.random() * 0.2) * 100) / 100;
    }

    trends.push(trend);
  }
  
  return trends;
}

function calculateTrendSummary(trends: any[]) {
  if (trends.length === 0) return {};
  
  const efficiencies = trends.map(t => t.efficiency);
  const avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
  const maxEfficiency = Math.max(...efficiencies);
  const minEfficiency = Math.min(...efficiencies);
  
  // Calculate trend direction
  const recentTrends = trends.slice(-7); // Last 7 data points
  const oldTrends = trends.slice(-14, -7); // Previous 7 data points
  
  const recentAvg = recentTrends.reduce((sum, t) => sum + t.efficiency, 0) / recentTrends.length;
  const oldAvg = oldTrends.length > 0 ? oldTrends.reduce((sum, t) => sum + t.efficiency, 0) / oldTrends.length : recentAvg;
  
  const trendDirection = recentAvg > oldAvg ? 'improving' : recentAvg < oldAvg ? 'declining' : 'stable';
  const trendMagnitude = Math.abs(recentAvg - oldAvg);
  
  return {
    avgEfficiency: Math.round(avgEfficiency * 10) / 10,
    maxEfficiency: Math.round(maxEfficiency * 10) / 10,
    minEfficiency: Math.round(minEfficiency * 10) / 10,
    trendDirection,
    trendMagnitude: Math.round(trendMagnitude * 10) / 10,
    dataPoints: trends.length,
    timespan: {
      start: trends[0]?.date,
      end: trends[trends.length - 1]?.date
    },
    varianceScore: calculateVariance(efficiencies),
    stabilityRating: trendMagnitude < 2 ? 'stable' : trendMagnitude < 5 ? 'moderate' : 'volatile'
  };
}

function analyzeCustomTrends(trends: any[], filters: any) {
  const insights = [];
  
  if (trends.length < 2) {
    return { insights: ['Insufficient data for analysis'] };
  }
  
  // Efficiency analysis
  const efficiencies = trends.map(t => t.efficiency);
  const avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
  
  if (avgEfficiency > 90) {
    insights.push('Excellent performance levels maintained');
  } else if (avgEfficiency < 80) {
    insights.push('Performance below optimal levels - review needed');
  }
  
  // Optimization frequency analysis
  const optimizations = trends.map(t => t.optimization_count || 0);
  const avgOptimizations = optimizations.reduce((a, b) => a + b, 0) / optimizations.length;
  
  if (avgOptimizations > 3) {
    insights.push('High optimization frequency indicates dynamic environment');
  } else if (avgOptimizations < 1) {
    insights.push('Low optimization activity - consider more frequent reviews');
  }
  
  // Real-time adaptation analysis
  const adaptations = trends.map(t => t.real_time_adaptations || 0);
  const avgAdaptations = adaptations.reduce((a, b) => a + b, 0) / adaptations.length;
  
  if (avgAdaptations > 2) {
    insights.push('High real-time adaptation rate indicates responsive system');
  }
  
  return {
    insights,
    metrics: {
      avgEfficiency: Math.round(avgEfficiency * 10) / 10,
      avgOptimizations: Math.round(avgOptimizations * 10) / 10,
      avgAdaptations: Math.round(avgAdaptations * 10) / 10
    }
  };
}

function calculateVariance(numbers: number[]) {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  return Math.round(variance * 100) / 100;
}