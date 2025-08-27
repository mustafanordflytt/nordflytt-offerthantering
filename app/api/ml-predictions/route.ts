/**
 * ML Prediction Service API
 * Direct access to SageMaker ML predictions with caching and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { sageMakerClient } from '@/lib/ai/sagemaker/sagemaker-client';
import { calculateEnhancedEstimatedTime, EnhancedTimeEstimationInput } from '@/lib/utils/enhanced-time-estimation';

// In-memory cache for predictions (could be Redis in production)
const predictionCache = new Map<string, { prediction: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Monitoring metrics
const metrics = {
  totalRequests: 0,
  mlSuccesses: 0,
  mlFailures: 0,
  cacheHits: 0,
  totalResponseTime: 0,
  lastHourRequests: [] as number[],
};

/**
 * Generate cache key from input
 */
function generateCacheKey(input: any): string {
  const key = `${input.livingArea}-${input.teamSize}-${input.distance}-${input.propertyType}-${input.floors?.from}-${input.floors?.to}`;
  return key;
}

/**
 * Clean expired cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of predictionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      predictionCache.delete(key);
    }
  }
}

/**
 * Update hourly metrics
 */
function updateHourlyMetrics() {
  const now = Date.now();
  metrics.lastHourRequests = metrics.lastHourRequests.filter(
    timestamp => now - timestamp < 3600000 // Keep last hour only
  );
  metrics.lastHourRequests.push(now);
}

/**
 * POST /api/ml-predictions
 * Get ML prediction for time estimation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  metrics.totalRequests++;
  updateHourlyMetrics();

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.livingArea || !body.distance || !body.propertyType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        required: ['livingArea', 'distance', 'propertyType']
      }, { status: 400 });
    }

    // Check if ML is enabled
    const mlEnabled = process.env.ML_ENABLED === 'true';
    if (!mlEnabled) {
      return NextResponse.json({
        success: false,
        error: 'ML predictions are currently disabled',
        fallback: 'Use /api/autonomous/time-estimation instead'
      }, { status: 503 });
    }

    // Check cache
    const cacheKey = generateCacheKey(body);
    const cached = predictionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      metrics.cacheHits++;
      const responseTime = Date.now() - startTime;
      metrics.totalResponseTime += responseTime;
      
      return NextResponse.json({
        success: true,
        prediction: cached.prediction,
        cached: true,
        responseTime,
        metrics: {
          requestsPerHour: metrics.lastHourRequests.length,
          cacheHitRate: (metrics.cacheHits / metrics.totalRequests * 100).toFixed(1) + '%',
          mlSuccessRate: (metrics.mlSuccesses / (metrics.mlSuccesses + metrics.mlFailures) * 100).toFixed(1) + '%'
        }
      });
    }

    // Clean cache periodically
    if (metrics.totalRequests % 100 === 0) {
      cleanCache();
    }

    // Prepare input for ML model
    const mlInput: EnhancedTimeEstimationInput = {
      livingArea: body.livingArea,
      teamSize: body.teamSize || 2,
      distance: body.distance,
      propertyType: body.propertyType,
      volume: body.volume || (body.livingArea * 0.3),
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

    // Get baseline estimate first
    const baselineEstimate = calculateEnhancedEstimatedTime(mlInput);
    
    // Prepare job data for ML
    const jobData = {
      livingArea: mlInput.livingArea,
      teamSize: mlInput.teamSize,
      distance: mlInput.distance,
      propertyType: mlInput.propertyType,
      floors: mlInput.floors,
      elevatorType: mlInput.elevatorType,
      baselineEstimate: baselineEstimate.totalHours,
      moveDate: body.moveDate || new Date().toISOString(),
      customerPreparation: body.customerPreparation || 0.7
    };

    try {
      // Get ML prediction
      const mlResult = await sageMakerClient.predict(jobData);
      metrics.mlSuccesses++;
      
      // Calculate improvement
      const improvement = ((baselineEstimate.totalHours - mlResult.predicted_hours) / baselineEstimate.totalHours * 100);
      
      // Prepare response
      const prediction = {
        mlPrediction: mlResult.predicted_hours,
        baselinePrediction: baselineEstimate.totalHours,
        confidence: mlResult.confidence_score,
        improvement: improvement.toFixed(1) + '%',
        breakdown: baselineEstimate.breakdown,
        teamOptimization: baselineEstimate.teamOptimization,
        competitiveAnalysis: {
          ...baselineEstimate.competitiveAnalysis,
          mlEnhanced: true
        },
        modelVersion: mlResult.model_version,
        featureImportance: mlResult.feature_importance,
        inferenceTime: mlResult.inference_time_ms
      };
      
      // Cache the prediction
      predictionCache.set(cacheKey, {
        prediction,
        timestamp: Date.now()
      });
      
      const responseTime = Date.now() - startTime;
      metrics.totalResponseTime += responseTime;
      
      return NextResponse.json({
        success: true,
        prediction,
        cached: false,
        responseTime,
        metrics: {
          requestsPerHour: metrics.lastHourRequests.length,
          cacheHitRate: (metrics.cacheHits / metrics.totalRequests * 100).toFixed(1) + '%',
          mlSuccessRate: (metrics.mlSuccesses / (metrics.mlSuccesses + metrics.mlFailures) * 100).toFixed(1) + '%',
          avgResponseTime: Math.round(metrics.totalResponseTime / metrics.totalRequests) + 'ms'
        }
      });
      
    } catch (mlError) {
      metrics.mlFailures++;
      console.error('ML prediction failed:', mlError);
      
      // Fallback to baseline algorithm
      if (process.env.ML_FALLBACK_TO_ALGORITHM === 'true') {
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json({
          success: true,
          prediction: {
            mlPrediction: null,
            baselinePrediction: baselineEstimate.totalHours,
            confidence: 0.85,
            improvement: '0%',
            breakdown: baselineEstimate.breakdown,
            teamOptimization: baselineEstimate.teamOptimization,
            competitiveAnalysis: baselineEstimate.competitiveAnalysis,
            modelVersion: 'enhanced-v2.1',
            mlError: mlError instanceof Error ? mlError.message : 'ML prediction failed',
            fallback: true
          },
          cached: false,
          responseTime,
          metrics: {
            requestsPerHour: metrics.lastHourRequests.length,
            cacheHitRate: (metrics.cacheHits / metrics.totalRequests * 100).toFixed(1) + '%',
            mlSuccessRate: (metrics.mlSuccesses / (metrics.mlSuccesses + metrics.mlFailures) * 100).toFixed(1) + '%'
          }
        });
      }
      
      throw mlError;
    }
    
  } catch (error) {
    console.error('ML prediction API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get ML prediction',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/ml-predictions/health
 * Health check and metrics endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Check if ML is enabled
    const mlEnabled = process.env.ML_ENABLED === 'true';
    
    // Test SageMaker connection if enabled
    let sagemakerHealthy = false;
    if (mlEnabled) {
      try {
        sagemakerHealthy = await sageMakerClient.healthCheck();
      } catch (error) {
        console.error('SageMaker health check failed:', error);
      }
    }
    
    // Get SageMaker metrics
    const sagemakerMetrics = sageMakerClient.getMetrics();
    
    return NextResponse.json({
      status: mlEnabled && sagemakerHealthy ? 'healthy' : mlEnabled ? 'degraded' : 'disabled',
      mlEnabled,
      sagemakerHealthy,
      endpoint: process.env.SAGEMAKER_ENDPOINT_NAME || 'not-configured',
      region: process.env.AWS_REGION || 'not-configured',
      metrics: {
        api: {
          totalRequests: metrics.totalRequests,
          requestsPerHour: metrics.lastHourRequests.length,
          mlSuccesses: metrics.mlSuccesses,
          mlFailures: metrics.mlFailures,
          cacheHits: metrics.cacheHits,
          cacheSize: predictionCache.size,
          avgResponseTime: metrics.totalRequests > 0 
            ? Math.round(metrics.totalResponseTime / metrics.totalRequests) + 'ms' 
            : '0ms',
          cacheHitRate: metrics.totalRequests > 0
            ? (metrics.cacheHits / metrics.totalRequests * 100).toFixed(1) + '%'
            : '0%',
          mlSuccessRate: (metrics.mlSuccesses + metrics.mlFailures) > 0
            ? (metrics.mlSuccesses / (metrics.mlSuccesses + metrics.mlFailures) * 100).toFixed(1) + '%'
            : '0%'
        },
        sagemaker: sagemakerMetrics
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}