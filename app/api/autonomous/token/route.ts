// =============================================================================
// PHASE 5: JWT TOKEN GENERATION API - Development and testing support
// Provides JWT tokens for testing autonomous decision APIs
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for testing/demo purposes
 */
function generateTestToken(role: string = 'operator', permissions: string[] = []): string {
  const jwtSecret = process.env.JWT_SECRET || 'phase5-autonomous-secret-key';
  
  const defaultPermissions: { [key: string]: string[] } = {
    'operator': ['autonomous_decisions', 'read_metrics', 'read_status'],
    'manager': ['autonomous_decisions', 'read_metrics', 'read_status', 'human_review', 'update_config'],
    'admin': ['autonomous_decisions', 'read_metrics', 'read_status', 'human_review', 'update_config', 'system_admin'],
    'viewer': ['read_metrics', 'read_status']
  };
  
  const tokenPermissions = permissions.length > 0 ? permissions : (defaultPermissions[role] || defaultPermissions['operator']);
  
  return jwt.sign(
    { 
      userId: `demo_${role}`,
      role: role,
      permissions: tokenPermissions,
      timestamp: new Date().toISOString(),
      generatedFor: 'phase5_autonomous_testing'
    },
    jwtSecret,
    { 
      expiresIn: '24h',
      issuer: 'phase5-autonomous-system',
      audience: 'nordflytt-autonomous-api'
    }
  );
}

/**
 * GET /api/autonomous/token
 * Generate test JWT token for development/demo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'operator';
    const permissionsParam = searchParams.get('permissions');
    
    const validRoles = ['operator', 'manager', 'admin', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}`,
        providedRole: role,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Parse custom permissions if provided
    let customPermissions: string[] = [];
    if (permissionsParam) {
      try {
        customPermissions = permissionsParam.split(',').map(p => p.trim());
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Invalid permissions format',
          message: 'Permissions should be comma-separated',
          example: 'permissions=autonomous_decisions,read_metrics,human_review',
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    const token = generateTestToken(role, customPermissions);
    
    console.log('🔑 Test token generated', { 
      role, 
      permissions: customPermissions.length > 0 ? customPermissions : 'default_for_role',
      expiresIn: '24h'
    });
    
    return NextResponse.json({
      success: true,
      token,
      tokenType: 'Bearer',
      expiresIn: '24h',
      role,
      permissions: customPermissions.length > 0 ? customPermissions : undefined,
      usage: {
        header: `Authorization: Bearer ${token}`,
        example: 'curl -H "Authorization: Bearer <token>" /api/autonomous/decision',
        endpoints: [
          'POST /api/autonomous/decision - Make autonomous decisions',
          'GET /api/autonomous/status - Get system status',
          'GET /api/autonomous/human-review - View human review queue',
          'GET /api/autonomous/performance - Get performance metrics'
        ]
      },
      testExamples: {
        pricingDecision: {
          url: '/api/autonomous/decision',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: {
            type: 'pricing',
            context: {
              type: 'pricing_request',
              priority: 'medium',
              data: {
                jobType: 'moving',
                basePrice: 2500,
                date: new Date().toISOString(),
                customerHistory: {
                  totalJobs: 3,
                  averageRating: 4.5,
                  totalRevenue: 7500
                },
                jobDetails: {
                  volume: 12,
                  distance: 18,
                  complexity: 'medium',
                  urgency: 'standard'
                }
              }
            }
          }
        },
        statusCheck: {
          url: '/api/autonomous/status',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        },
        performanceMetrics: {
          url: '/api/autonomous/performance?range=24h&detailed=true',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      },
      security: {
        algorithm: 'HS256',
        issuer: 'phase5-autonomous-system',
        audience: 'nordflytt-autonomous-api',
        notice: 'This is a test token for development purposes only'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to generate test token:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate token',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/autonomous/token
 * Generate custom token with specific parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      role = 'operator', 
      permissions = [], 
      expiresIn = '24h',
      customClaims = {}
    } = body;

    const validRoles = ['operator', 'manager', 'admin', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const validExpirations = ['1h', '24h', '7d', '30d'];
    if (!validExpirations.includes(expiresIn)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid expiration time',
        message: `ExpiresIn must be one of: ${validExpirations.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'phase5-autonomous-secret-key';
    
    const tokenPayload = {
      userId: customClaims.userId || `demo_${role}`,
      role: role,
      permissions: permissions.length > 0 ? permissions : ['autonomous_decisions', 'read_metrics'],
      timestamp: new Date().toISOString(),
      generatedFor: 'phase5_autonomous_custom',
      ...customClaims
    };

    const token = jwt.sign(
      tokenPayload,
      jwtSecret,
      { 
        expiresIn,
        issuer: 'phase5-autonomous-system',
        audience: 'nordflytt-autonomous-api'
      }
    );

    console.log('🔑 Custom token generated', { 
      role, 
      permissions: permissions.length || 'default',
      expiresIn,
      customClaims: Object.keys(customClaims).length
    });

    return NextResponse.json({
      success: true,
      token,
      tokenType: 'Bearer',
      payload: tokenPayload,
      expiresIn,
      usage: {
        header: `Authorization: Bearer ${token}`,
        validFor: `Next ${expiresIn}`,
        permissions: tokenPayload.permissions
      },
      verification: {
        decode: `Use jwt.io to decode and verify token structure`,
        secret: process.env.NODE_ENV === 'development' ? 'phase5-autonomous-secret-key' : '[HIDDEN]'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to generate custom token:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate custom token',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * PUT /api/autonomous/token
 * Verify and refresh existing token
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Missing token',
        message: 'Provide token in Authorization header for verification',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'phase5-autonomous-secret-key';

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Generate refreshed token with same claims but new expiration
      const refreshedToken = jwt.sign(
        {
          userId: decoded.userId,
          role: decoded.role,
          permissions: decoded.permissions,
          timestamp: new Date().toISOString(),
          refreshedFrom: decoded.iat
        },
        jwtSecret,
        { 
          expiresIn: '24h',
          issuer: 'phase5-autonomous-system',
          audience: 'nordflytt-autonomous-api'
        }
      );

      return NextResponse.json({
        success: true,
        verified: true,
        originalToken: {
          valid: true,
          userId: decoded.userId,
          role: decoded.role,
          permissions: decoded.permissions,
          issuedAt: new Date(decoded.iat * 1000).toISOString(),
          expiresAt: new Date(decoded.exp * 1000).toISOString()
        },
        refreshedToken,
        tokenType: 'Bearer',
        newExpiresIn: '24h',
        usage: {
          header: `Authorization: Bearer ${refreshedToken}`,
          message: 'Use the refreshed token for future requests'
        },
        timestamp: new Date().toISOString()
      });

    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        verified: false,
        error: 'Invalid token',
        message: jwtError instanceof Error ? jwtError.message : 'Token verification failed',
        suggestion: 'Generate a new token using GET /api/autonomous/token',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

  } catch (error) {
    console.error('❌ Failed to verify/refresh token:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Token verification failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}