// =============================================================================
// PHASE 5: AUTONOMOUS DECISION API - Integrated with Phase 4 Enhanced BI
// Provides autonomous decision-making capabilities with JWT authentication
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { MasterAutonomousController } from '@/lib/autonomous/MasterAutonomousController';
import { DecisionContext } from '@/lib/autonomous/BaseDecisionEngine';

// Initialize Master Controller (singleton pattern)
let masterController: MasterAutonomousController | null = null;

function getMasterController(): MasterAutonomousController {
  if (!masterController) {
    masterController = new MasterAutonomousController({
      autonomyLevel: 0.99, // 99% autonomous operations
      confidenceThreshold: 0.85,
      phase4Integration: true
    });
  }
  return masterController;
}

/**
 * JWT Authentication middleware
 */
function authenticateRequest(request: NextRequest): { authenticated: boolean; user?: any; error?: string } {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'phase5-autonomous-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    
    return { authenticated: true, user: decoded };
  } catch (error) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }
}

/**
 * Generate JWT token for testing/demo purposes
 */
function generateTestToken(): string {
  const jwtSecret = process.env.JWT_SECRET || 'phase5-autonomous-secret-key';
  return jwt.sign(
    { 
      userId: 'demo_user',
      role: 'operator',
      permissions: ['autonomous_decisions', 'read_metrics'],
      timestamp: new Date().toISOString()
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
}

/**
 * POST /api/autonomous/decision
 * Main autonomous decision endpoint
 */
export async function POST(request: NextRequest) {
  console.log('🤖 Autonomous decision request received');
  
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        message: auth.error,
        hint: 'Use /api/autonomous/token to get a test token',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { type, context, options = {} } = body;

    // Validate required parameters
    if (!type || !context) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
        message: 'Both "type" and "context" are required',
        example: {
          type: 'pricing',
          context: {
            type: 'pricing_request',
            priority: 'medium',
            data: {
              jobType: 'moving',
              basePrice: 2000,
              date: new Date().toISOString(),
              customerHistory: { totalJobs: 3, averageRating: 4.5 }
            }
          }
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate decision type
    const validTypes = ['pricing', 'operational', 'strategic'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid decision type',
        message: `Decision type must be one of: ${validTypes.join(', ')}`,
        providedType: type,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    console.log('🎯 Processing autonomous decision', { type, priority: context.priority });

    // Get master controller and process decision
    const controller = getMasterController();
    
    // Enhance context with user information
    const enhancedContext: DecisionContext = {
      ...context,
      requestUser: auth.user,
      requestTimestamp: new Date().toISOString(),
      phase4Integration: true
    };

    // Process the autonomous decision
    const decision = await controller.processAutonomousDecision(
      type,
      enhancedContext,
      options
    );

    // Prepare response with Phase 4 compatibility
    const response = {
      success: true,
      decision: {
        id: decision.id,
        timestamp: decision.timestamp,
        type: decision.decision?.type || type,
        autonomous: decision.autonomous,
        confidence: decision.confidence,
        humanReview: decision.humanReview,
        executionTime: decision.executionTime,
        outcome: decision.outcome,
        // Phase 4 compatible fields
        phase4Integration: {
          compatible: true,
          dashboardUpdate: true,
          biDataUsed: !!decision.context.phase4Data
        }
      },
      metadata: {
        engineType: type,
        processingTime: decision.executionTime,
        autonomyLevel: controller.autonomyLevel,
        phase4Compatible: true,
        requestUser: auth.user?.userId,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Autonomous decision completed', { 
      decisionId: decision.id, 
      autonomous: decision.autonomous,
      confidence: decision.confidence
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Autonomous-Version': '5.0',
        'X-Decision-ID': decision.id,
        'X-Confidence': decision.confidence.toString(),
        'X-Phase4-Compatible': 'true'
      }
    });

  } catch (error) {
    console.error('❌ Autonomous decision failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Autonomous decision processing failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      phase4Fallback: {
        recommended: true,
        fallbackEndpoint: '/api/enhanced-business-intelligence-simple'
      }
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Type': 'autonomous_processing_error'
      }
    });
  }
}

/**
 * GET /api/autonomous/decision
 * Get decision history and examples
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required for decision history',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'all';

    const controller = getMasterController();
    
    // Get recent decisions from all engines
    const allDecisions: any[] = [];
    
    // This would normally fetch from Redis/database
    // For now, return example structure
    const exampleDecisions = [
      {
        id: 'decision_1704067200_example1',
        timestamp: new Date().toISOString(),
        type: 'pricing',
        autonomous: true,
        confidence: 0.94,
        executionTime: 150,
        outcome: { success: true, priceOptimized: true },
        summary: 'Autonomous price optimization completed successfully'
      },
      {
        id: 'decision_1704067300_example2',
        timestamp: new Date().toISOString(),
        type: 'operational',
        autonomous: true,
        confidence: 0.87,
        executionTime: 220,
        outcome: { success: true, scheduleOptimized: true },
        summary: 'Schedule optimization reduced workload variance by 12%'
      }
    ];

    return NextResponse.json({
      success: true,
      decisions: exampleDecisions.slice(0, limit),
      total: exampleDecisions.length,
      filters: { type, limit },
      examples: {
        pricingRequest: {
          type: 'pricing',
          context: {
            type: 'pricing_request',
            priority: 'medium',
            data: {
              jobType: 'moving',
              basePrice: 2500,
              date: new Date().toISOString(),
              customerHistory: {
                totalJobs: 5,
                averageRating: 4.7,
                totalRevenue: 12000
              },
              jobDetails: {
                volume: 15,
                distance: 25,
                complexity: 'medium',
                urgency: 'standard'
              }
            }
          }
        },
        operationalRequest: {
          type: 'operational',
          context: {
            type: 'operational_optimization',
            priority: 'high',
            data: {
              operationType: 'schedule_optimization',
              currentState: {
                activeJobs: 8,
                availableStaff: 12,
                currentWorkload: 0.85
              },
              resources: {
                staff: 16,
                vehicles: 6,
                equipment: 10
              }
            }
          }
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve decision history',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/autonomous/token
 * Generate test JWT token for development/demo
 */
export async function GET_TOKEN(request: NextRequest) {
  try {
    const token = generateTestToken();
    
    return NextResponse.json({
      success: true,
      token,
      tokenType: 'Bearer',
      expiresIn: '24h',
      usage: {
        header: `Authorization: Bearer ${token}`,
        example: 'Use this token in the Authorization header for autonomous decision requests'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate token',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}