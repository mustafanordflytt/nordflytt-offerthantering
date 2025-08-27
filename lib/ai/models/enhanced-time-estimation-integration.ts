/**
 * Enhanced Time Estimation Integration with AI-Optimering System
 * Bridges Enhanced Algorithm v2.1 with the AI Command Center
 */

import { calculateEnhancedEstimatedTime, EnhancedTimeEstimationInput, EnhancedTimeEstimationResult } from '@/lib/utils/enhanced-time-estimation';
import { EventEmitter } from 'events';

export interface AIDecision {
  id: string;
  type: 'time_estimation';
  timestamp: string;
  input: any;
  output: any;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  executionTime: number;
  modelVersion: string;
}

export interface TimeEstimationAIConfig {
  confidenceThreshold: number;
  enableMLFallback: boolean;
  sagemakerEndpoint?: string;
  recordDecisions: boolean;
  humanReviewThreshold: number;
}

export class EnhancedTimeEstimationAI extends EventEmitter {
  private config: TimeEstimationAIConfig;
  private decisionsToday: number = 0;
  private totalDecisions: number = 0;
  private accuracyMetrics: {
    predictions: number;
    accurate: number;
    totalDeviation: number;
  } = { predictions: 0, accurate: 0, totalDeviation: 0 };

  constructor(config: Partial<TimeEstimationAIConfig> = {}) {
    super();
    this.config = {
      confidenceThreshold: 0.85,
      enableMLFallback: true,
      recordDecisions: true,
      humanReviewThreshold: 0.75,
      ...config
    };
  }

  /**
   * Make an AI-powered time estimation decision
   */
  async makeTimeEstimation(input: EnhancedTimeEstimationInput): Promise<AIDecision> {
    const startTime = Date.now();
    const decisionId = this.generateDecisionId();

    try {
      // Calculate using Enhanced Algorithm v2.1
      const estimation = calculateEnhancedEstimatedTime(input);
      
      // Calculate confidence based on various factors
      const confidence = this.calculateConfidence(input, estimation);
      
      // Check if ML model should be consulted
      let mlEnhanced = false;
      if (this.config.enableMLFallback && this.config.sagemakerEndpoint) {
        try {
          const mlResult = await this.consultMLModel(input);
          if (mlResult && mlResult.confidence > confidence) {
            // Use ML result if more confident
            estimation.totalHours = mlResult.totalHours;
            mlEnhanced = true;
          }
        } catch (error) {
          console.error('ML consultation failed, using algorithmic result', error);
        }
      }

      // Create AI decision record
      const decision: AIDecision = {
        id: decisionId,
        type: 'time_estimation',
        timestamp: new Date().toISOString(),
        input: {
          volume: input.volume,
          distance: input.distance,
          teamSize: input.teamSize,
          propertyType: input.propertyType,
          services: input.services
        },
        output: {
          totalHours: estimation.totalHours,
          breakdown: estimation.breakdown,
          teamOptimization: estimation.teamOptimization,
          competitiveAnalysis: estimation.competitiveAnalysis,
          confidence,
          mlEnhanced
        },
        confidence,
        status: confidence >= this.config.confidenceThreshold ? 'approved' : 'pending',
        executionTime: Date.now() - startTime,
        modelVersion: mlEnhanced ? 'v2.1-ml-enhanced' : 'v2.1-algorithmic'
      };

      // Emit decision for AI Command Center
      this.emit('decision', decision);
      
      // Update metrics
      this.decisionsToday++;
      this.totalDecisions++;
      
      // Record decision if enabled
      if (this.config.recordDecisions) {
        await this.recordDecision(decision);
      }

      // Check if human review needed
      if (confidence < this.config.humanReviewThreshold) {
        this.emit('reviewRequired', decision);
      }

      return decision;

    } catch (error) {
      const errorDecision: AIDecision = {
        id: decisionId,
        type: 'time_estimation',
        timestamp: new Date().toISOString(),
        input,
        output: { error: error.message },
        confidence: 0,
        status: 'rejected',
        executionTime: Date.now() - startTime,
        modelVersion: 'error'
      };
      
      this.emit('error', errorDecision);
      throw error;
    }
  }

  /**
   * Calculate confidence score for the estimation
   */
  private calculateConfidence(input: EnhancedTimeEstimationInput, result: EnhancedTimeEstimationResult): number {
    let confidence = 0.9; // Base confidence for algorithmic calculation

    // Adjust based on input completeness
    if (!input.roomBreakdown) confidence -= 0.05;
    if (!input.specialItems) confidence -= 0.03;
    if (!input.parkingDistance) confidence -= 0.02;

    // Adjust based on edge cases
    if (input.volume > 100) confidence -= 0.1; // Very large moves
    if (input.distance > 100) confidence -= 0.05; // Long distance
    if (input.teamSize === 1) confidence -= 0.05; // Single person jobs

    // Adjust based on competitive analysis
    if (result.competitiveAnalysis.estimateVsCompetitors === 'competitive') {
      confidence += 0.05;
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Consult ML model for enhanced prediction using SageMaker
   */
  private async consultMLModel(input: EnhancedTimeEstimationInput): Promise<any> {
    if (!this.config.enableMLFallback) {
      return null;
    }

    try {
      // Import SageMaker client
      const { sageMakerClient } = await import('@/lib/ai/sagemaker/sagemaker-client');
      
      // First calculate baseline with Enhanced Algorithm v2.1
      const baselineEstimate = calculateEnhancedEstimatedTime(input);
      
      // Prepare data for ML model
      const mlInput = {
        livingArea: input.livingArea,
        teamSize: input.teamSize,
        distance: input.distance,
        propertyType: input.propertyType,
        floors: input.floors,
        elevatorType: input.elevatorType,
        baselineEstimate: baselineEstimate.totalHours,
        moveDate: new Date().toISOString(), // Use current date if not provided
        customerPreparation: 0.7 // Default value, can be enhanced later
      };
      
      // Get ML prediction
      const mlResult = await sageMakerClient.predict(mlInput);
      
      console.log('🤖 ML Model Prediction:', {
        baseline: baselineEstimate.totalHours,
        mlPrediction: mlResult.predicted_hours,
        confidence: mlResult.confidence_score,
        inferenceTime: mlResult.inference_time_ms + 'ms'
      });
      
      return {
        totalHours: mlResult.predicted_hours,
        confidence: mlResult.confidence_score,
        mlEnhanced: true,
        modelVersion: mlResult.model_version,
        baselineHours: baselineEstimate.totalHours,
        improvement: ((baselineEstimate.totalHours - mlResult.predicted_hours) / baselineEstimate.totalHours * 100).toFixed(1) + '%'
      };
      
    } catch (error) {
      console.error('ML model consultation failed, using baseline:', error);
      // Return null to fall back to baseline algorithm
      return null;
    }
  }

  /**
   * Record decision for analytics and learning
   */
  private async recordDecision(decision: AIDecision): Promise<void> {
    try {
      const response = await fetch('/api/ai-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...decision,
          module: 'time_estimation',
          impact: {
            timeSaved: 0.1, // Hours saved through accurate estimation
            accuracyImprovement: 0.02 // 2% improvement
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to record decision');
      }
    } catch (error) {
      console.error('Error recording decision:', error);
    }
  }

  /**
   * Update actual time after job completion for learning
   */
  async updateActualTime(decisionId: string, actualHours: number): Promise<void> {
    try {
      const response = await fetch(`/api/ai-decisions/${decisionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualHours,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Update accuracy metrics
        this.accuracyMetrics.predictions++;
        const decision = await response.json();
        const deviation = Math.abs(decision.output.totalHours - actualHours);
        this.accuracyMetrics.totalDeviation += deviation;
        
        if (deviation < 0.5) { // Within 30 minutes
          this.accuracyMetrics.accurate++;
        }

        // Emit learning event
        this.emit('learning', {
          decisionId,
          predicted: decision.output.totalHours,
          actual: actualHours,
          deviation,
          accuracy: this.getAccuracy()
        });
      }
    } catch (error) {
      console.error('Error updating actual time:', error);
    }
  }

  /**
   * Get current accuracy percentage
   */
  getAccuracy(): number {
    if (this.accuracyMetrics.predictions === 0) return 0;
    return (this.accuracyMetrics.accurate / this.accuracyMetrics.predictions) * 100;
  }

  /**
   * Get metrics for AI dashboard
   */
  getMetrics() {
    return {
      decisionsToday: this.decisionsToday,
      totalDecisions: this.totalDecisions,
      accuracy: this.getAccuracy(),
      avgDeviation: this.accuracyMetrics.predictions > 0 
        ? this.accuracyMetrics.totalDeviation / this.accuracyMetrics.predictions 
        : 0,
      confidenceThreshold: this.config.confidenceThreshold,
      mlEnabled: this.config.enableMLFallback
    };
  }

  /**
   * Generate unique decision ID
   */
  private generateDecisionId(): string {
    return `TIME-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset daily metrics (call at midnight)
   */
  resetDailyMetrics(): void {
    this.decisionsToday = 0;
    this.emit('metricsReset', { timestamp: new Date().toISOString() });
  }
}

// Export singleton instance for use across the application
export const timeEstimationAI = new EnhancedTimeEstimationAI({
  confidenceThreshold: parseFloat(process.env.ML_CONFIDENCE_THRESHOLD || '0.85'),
  enableMLFallback: process.env.ML_ENABLED === 'true',
  sagemakerEndpoint: process.env.SAGEMAKER_ENDPOINT_NAME || 'nordflytt-time-estimation-015831',
  recordDecisions: true,
  humanReviewThreshold: 0.75
});

// Connect to AI Command Center events
timeEstimationAI.on('decision', (decision) => {
  console.log('🤖 Time Estimation AI Decision:', {
    id: decision.id,
    hours: decision.output.totalHours,
    confidence: decision.confidence,
    status: decision.status
  });
});

timeEstimationAI.on('reviewRequired', (decision) => {
  console.log('👤 Human Review Required:', decision.id);
});

timeEstimationAI.on('learning', (feedback) => {
  console.log('📈 AI Learning:', feedback);
});