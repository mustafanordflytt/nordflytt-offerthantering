// =============================================================================
// PHASE 5: HUMAN REVIEW QUEUE API - Decisions requiring human oversight
// Provides interface for reviewing autonomous decisions that need human input
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { MasterAutonomousController } from '@/lib/autonomous/MasterAutonomousController';

// Get singleton instance of master controller
let masterController: MasterAutonomousController | null = null;

function getMasterController(): MasterAutonomousController {
  if (!masterController) {
    masterController = new MasterAutonomousController({
      autonomyLevel: 0.99,
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
    return { authenticated: false, error: 'Missing authorization header' };
  }

  const token = authHeader.substring(7);
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'phase5-autonomous-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    
    return { authenticated: true, user: decoded };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' };
  }
}

/**
 * GET /api/autonomous/human-review
 * Get decisions pending human review
 */
export async function GET(request: NextRequest) {
  console.log('👤 Human review queue requested');
  
  try {
    // Check authentication
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'This endpoint requires a valid JWT token',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'pending';

    const controller = getMasterController();

    // Get pending human review decisions
    const reviewQueue = await getHumanReviewQueue(priority, limit, status);
    
    // Get queue statistics
    const queueStats = await getQueueStatistics();

    console.log('✅ Human review queue retrieved', {
      totalItems: reviewQueue.length,
      pendingCount: queueStats.pendingCount,
      urgentCount: queueStats.urgentCount
    });

    return NextResponse.json({
      success: true,
      queue: reviewQueue,
      statistics: queueStats,
      filters: {
        priority,
        limit,
        status
      },
      metadata: {
        requestedBy: auth.user?.userId,
        timestamp: new Date().toISOString(),
        queueSize: reviewQueue.length
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Queue-Size': reviewQueue.length.toString(),
        'X-Pending-Count': queueStats.pendingCount.toString(),
        'X-Phase5-Version': '1.0'
      }
    });

  } catch (error) {
    console.error('❌ Failed to get human review queue:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve human review queue',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Type': 'queue_retrieval_error'
      }
    });
  }
}

/**
 * POST /api/autonomous/human-review
 * Submit human review decision or update review status
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required for review actions',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const body = await request.json();
    const { action, decisionId, reviewDecision, comments, override } = body;

    const validActions = ['approve', 'reject', 'modify', 'escalate', 'complete_review'];
    
    if (!action || !validActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: `Action must be one of: ${validActions.join(', ')}`,
        providedAction: action,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!decisionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter',
        message: 'decisionId is required for review actions',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const controller = getMasterController();
    let result;

    switch (action) {
      case 'approve':
        result = await approveDecision(decisionId, auth.user, comments);
        break;
        
      case 'reject':
        result = await rejectDecision(decisionId, auth.user, comments);
        break;
        
      case 'modify':
        result = await modifyDecision(decisionId, auth.user, reviewDecision, comments);
        break;
        
      case 'escalate':
        result = await escalateDecision(decisionId, auth.user, comments);
        break;
        
      case 'complete_review':
        result = await completeReview(decisionId, auth.user, reviewDecision, comments);
        break;
        
      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    return NextResponse.json({
      success: true,
      action,
      decisionId,
      result,
      reviewedBy: auth.user?.userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Human review action failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper functions

async function getHumanReviewQueue(priority: string, limit: number, status: string): Promise<any[]> {
  // In a real implementation, this would fetch from Redis/database
  // For now, return example structure showing decisions needing human review
  
  const exampleQueue = [
    {
      id: 'review_1704067200_pricing1',
      decisionId: 'decision_1704067200_pricing1',
      timestamp: new Date().toISOString(),
      type: 'pricing',
      priority: 'high',
      status: 'pending_review',
      reason: 'Low confidence score (0.72) - requires human validation',
      originalDecision: {
        type: 'pricing_decision',
        originalPrice: 3500,
        optimizedPrice: 4200,
        priceMultiplier: 1.2,
        confidence: 0.72
      },
      context: {
        jobType: 'large_moving',
        urgency: 'urgent',
        marketConditions: 'volatile'
      },
      estimatedImpact: {
        revenue: 700,
        risk: 'medium'
      },
      timeInQueue: '15 minutes',
      assignedReviewer: null,
      escalationLevel: 0
    },
    {
      id: 'review_1704067300_operational1',
      decisionId: 'decision_1704067300_operational1',
      timestamp: new Date().toISOString(),
      type: 'operational',
      priority: 'critical',
      status: 'pending_review',
      reason: 'Emergency situation detected - human oversight required',
      originalDecision: {
        type: 'emergency_response',
        action: 'reallocate_emergency_resources',
        affectedJobs: 5,
        estimatedCost: 5000
      },
      context: {
        emergencyType: 'vehicle_breakdown',
        severity: 'high',
        affectedCustomers: 3
      },
      estimatedImpact: {
        customerSatisfaction: -0.2,
        operationalDisruption: 'significant'
      },
      timeInQueue: '5 minutes',
      assignedReviewer: 'operations_manager',
      escalationLevel: 1
    },
    {
      id: 'review_1704067400_strategic1',
      decisionId: 'decision_1704067400_strategic1',
      timestamp: new Date().toISOString(),
      type: 'strategic',
      priority: 'medium',
      status: 'under_review',
      reason: 'Strategic decision with significant business impact',
      originalDecision: {
        type: 'capacity_expansion',
        recommendation: 'hire_additional_staff',
        estimatedCost: 50000,
        timeframe: '3_months'
      },
      context: {
        demandGrowth: 'high',
        seasonalFactor: 'peak_season_approaching',
        competitorActivity: 'expansion'
      },
      estimatedImpact: {
        revenueIncrease: 25000,
        marketShare: 0.15
      },
      timeInQueue: '2 hours',
      assignedReviewer: 'strategy_team',
      escalationLevel: 0
    }
  ];

  // Filter by priority if specified
  let filteredQueue = exampleQueue;
  if (priority !== 'all') {
    filteredQueue = exampleQueue.filter(item => item.priority === priority);
  }

  // Filter by status if specified
  if (status !== 'all') {
    filteredQueue = filteredQueue.filter(item => item.status === status);
  }

  // Apply limit
  return filteredQueue.slice(0, limit);
}

async function getQueueStatistics(): Promise<any> {
  return {
    totalItems: 12,
    pendingCount: 8,
    underReviewCount: 3,
    completedToday: 15,
    averageReviewTime: '25 minutes',
    urgentCount: 2,
    escalatedCount: 1,
    queueHealth: {
      status: 'healthy',
      averageWaitTime: '18 minutes',
      slaCompliance: 0.94
    },
    reviewerWorkload: {
      'operations_manager': 3,
      'pricing_specialist': 2,
      'strategy_team': 1,
      'unassigned': 6
    }
  };
}

async function approveDecision(decisionId: string, user: any, comments?: string): Promise<any> {
  // Implementation would update the decision status and execute the approved action
  console.log('✅ Decision approved', { decisionId, user: user?.userId, comments });
  
  return {
    action: 'decision_approved',
    decisionId,
    status: 'approved',
    executionStatus: 'scheduled',
    approvedBy: user?.userId,
    approvalTime: new Date().toISOString(),
    comments: comments || 'Approved without additional comments',
    nextSteps: ['Execute approved decision', 'Monitor outcome', 'Update performance metrics']
  };
}

async function rejectDecision(decisionId: string, user: any, comments?: string): Promise<any> {
  console.log('❌ Decision rejected', { decisionId, user: user?.userId, comments });
  
  return {
    action: 'decision_rejected',
    decisionId,
    status: 'rejected',
    rejectedBy: user?.userId,
    rejectionTime: new Date().toISOString(),
    comments: comments || 'Rejected - reason not specified',
    nextSteps: ['Return to autonomous system for reanalysis', 'Update learning parameters']
  };
}

async function modifyDecision(decisionId: string, user: any, modifiedDecision: any, comments?: string): Promise<any> {
  console.log('🔄 Decision modified', { decisionId, user: user?.userId, modifiedDecision });
  
  return {
    action: 'decision_modified',
    decisionId,
    status: 'modified',
    originalDecision: 'stored_for_learning',
    modifiedDecision,
    modifiedBy: user?.userId,
    modificationTime: new Date().toISOString(),
    comments: comments || 'Modified by human reviewer',
    nextSteps: ['Execute modified decision', 'Update ML model with correction']
  };
}

async function escalateDecision(decisionId: string, user: any, comments?: string): Promise<any> {
  console.log('⬆️ Decision escalated', { decisionId, user: user?.userId, comments });
  
  return {
    action: 'decision_escalated',
    decisionId,
    status: 'escalated',
    escalatedBy: user?.userId,
    escalationTime: new Date().toISOString(),
    escalationLevel: 'senior_management',
    comments: comments || 'Escalated for senior review',
    estimatedResolutionTime: '4 hours',
    nextSteps: ['Assign to senior reviewer', 'Set priority handling', 'Notify stakeholders']
  };
}

async function completeReview(decisionId: string, user: any, finalDecision: any, comments?: string): Promise<any> {
  console.log('✔️ Review completed', { decisionId, user: user?.userId, finalDecision });
  
  return {
    action: 'review_completed',
    decisionId,
    status: 'review_complete',
    finalDecision,
    reviewedBy: user?.userId,
    completionTime: new Date().toISOString(),
    comments: comments || 'Review completed successfully',
    outcome: finalDecision?.approved ? 'approved' : 'rejected',
    nextSteps: finalDecision?.approved ? 
      ['Execute final decision', 'Close review case'] : 
      ['Archive decision', 'Update autonomous parameters']
  };
}