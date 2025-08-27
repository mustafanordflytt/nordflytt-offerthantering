/**
 * Autonomous Time Estimation API
 * Integrates Enhanced Algorithm v2.1 with AI Command Center
 */

import { NextRequest, NextResponse } from 'next/server';
import { timeEstimationAI } from '@/lib/ai/models/enhanced-time-estimation-integration';
import { EnhancedTimeEstimationInput } from '@/lib/utils/enhanced-time-estimation';

// Helper to extract bearer token
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * POST /api/autonomous/time-estimation
 * Make autonomous time estimation decision
 */
export async function POST(request: NextRequest) {
  console.log('🤖 Autonomous time estimation request received');
  
  try {
    // Simple auth check (integrate with your auth system)
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate input
    if (!body.volume || !body.distance || !body.propertyType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        required: ['volume', 'distance', 'propertyType', 'livingArea', 'teamSize'],
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Convert to enhanced input format
    const input: EnhancedTimeEstimationInput = {
      volume: body.volume || (body.livingArea * 0.3),
      distance: body.distance,
      teamSize: body.teamSize || 2,
      propertyType: body.propertyType,
      livingArea: body.livingArea,
      floors: body.floors || { from: 0, to: 0 },
      elevatorType: body.elevatorType || { from: 'ingen', to: 'ingen' },
      parkingDistance: body.parkingDistance || { from: 0, to: 0 },
      services: body.services || ['moving'],
      trafficFactor: body.trafficFactor || 'normal',
      roomBreakdown: body.roomBreakdown,
      heavyItems: body.heavyItems || false,
      specialItems: body.specialItems || [],
      storageItems: body.storageItems || false
    };

    // Make AI decision
    const decision = await timeEstimationAI.makeTimeEstimation(input);
    
    // Check if ML enhancement was used
    const mlEnhanced = decision.output.mlEnhanced || false;
    const baselineHours = decision.output.baselineHours || decision.output.totalHours;
    
    // Return response
    return NextResponse.json({
      success: true,
      decision: {
        id: decision.id,
        estimatedHours: decision.output.totalHours,
        baselineHours: baselineHours,
        confidence: decision.confidence,
        status: decision.status,
        requiresReview: decision.confidence < 0.75,
        breakdown: decision.output.breakdown,
        optimization: decision.output.teamOptimization,
        competitiveAnalysis: decision.output.competitiveAnalysis,
        modelVersion: decision.modelVersion,
        mlEnhanced: mlEnhanced,
        improvement: mlEnhanced ? 
          `${Math.abs(((baselineHours - decision.output.totalHours) / baselineHours * 100)).toFixed(1)}%` : 
          null
      },
      metrics: {
        ...timeEstimationAI.getMetrics(),
        sagemakerEnabled: mlEnhanced,
        modelType: mlEnhanced ? 'RandomForest + Enhanced v2.1' : 'Enhanced v2.1 only'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Time estimation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Time estimation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * PUT /api/autonomous/time-estimation/:id/feedback
 * Update with actual time for learning
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { actualHours } = body;

    if (!actualHours || actualHours <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid actual hours'
      }, { status: 400 });
    }

    // Update AI with feedback
    await timeEstimationAI.updateActualTime(params.id, actualHours);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
      metrics: timeEstimationAI.getMetrics(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Feedback update failed'
    }, { status: 500 });
  }
}

/**
 * GET /api/autonomous/time-estimation/metrics
 * Get current AI metrics
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const metrics = timeEstimationAI.getMetrics();
    
    return NextResponse.json({
      success: true,
      metrics: {
        ...metrics,
        timeSaved: (metrics.decisionsToday * 0.1).toFixed(1) + 'h',
        accuracyTrend: '+2.4%', // Placeholder - implement actual trend
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch metrics'
    }, { status: 500 });
  }
}