/**
 * Health check endpoint for SageMaker ML integration
 * GET /api/autonomous/time-estimation/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { sageMakerClient } from '@/lib/ai/sagemaker/sagemaker-client';

export async function GET(request: NextRequest) {
  try {
    // Check authorization (simplified for health check)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Perform health check
    const startTime = Date.now();
    const isHealthy = await sageMakerClient.healthCheck();
    const checkDuration = Date.now() - startTime;
    
    // Get client metrics
    const metrics = sageMakerClient.getMetrics();
    
    // Build health response
    const healthStatus = {
      success: true,
      healthy: isHealthy,
      endpoint: process.env.SAGEMAKER_ENDPOINT_NAME || 'nordflytt-time-estimation',
      region: process.env.AWS_REGION || 'eu-west-2',
      modelVersion: 'v1.0-randomforest-nordflytt',
      checkDuration: checkDuration + 'ms',
      metrics: {
        totalPredictions: metrics.totalPredictions,
        avgInferenceTime: metrics.avgInferenceTime + 'ms',
        lastCheck: new Date().toISOString()
      },
      features: {
        mlEnabled: process.env.ENABLE_ML_PREDICTIONS === 'true',
        confidenceThreshold: Number(process.env.ML_CONFIDENCE_THRESHOLD) || 0.85,
        rolloutPercentage: Number(process.env.ML_ROLLOUT_PERCENTAGE) || 100
      }
    };
    
    return NextResponse.json(healthStatus, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Model-Version': 'v1.0-randomforest'
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      success: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      endpoint: process.env.SAGEMAKER_ENDPOINT_NAME || 'unknown',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}