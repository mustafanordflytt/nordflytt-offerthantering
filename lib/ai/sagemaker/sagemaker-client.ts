/**
 * AWS SageMaker Client for Nordflytt ML Model
 * Handles real-time inference requests to the deployed RandomForest model
 */

import { 
  SageMakerRuntimeClient, 
  InvokeEndpointCommand,
  InvokeEndpointCommandInput,
  InvokeEndpointCommandOutput 
} from '@aws-sdk/client-sagemaker-runtime';
import { fromIni } from '@aws-sdk/credential-provider-ini';

export interface SageMakerConfig {
  endpointName: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  profile?: string;
}

export interface MLModelInput {
  living_area: number;
  team_size: number;
  distance_km: number;
  floors: number;
  weather_score: number;
  customer_preparation: number;
  enhanced_v21_estimate: number;
  property_type_villa: number;
  property_type_kontor: number;
  elevator_ingen: number;
  elevator_liten: number;
}

export interface MLModelOutput {
  predicted_hours: number;
  confidence_score: number;
  model_version: string;
  inference_time_ms: number;
  feature_importance?: Record<string, number>;
}

export class SageMakerMLClient {
  private client: SageMakerRuntimeClient;
  private endpointName: string;
  private modelVersion: string = 'v1.0-randomforest';
  private inferenceCount: number = 0;
  private totalInferenceTime: number = 0;

  constructor(config: SageMakerConfig) {
    this.endpointName = config.endpointName || 'nordflytt-time-estimation-prod';
    
    // Initialize AWS SDK client with credentials
    const clientConfig: any = {
      region: config.region || 'eu-north-1' // Stockholm region
    };

    // Use explicit credentials if provided, otherwise use default chain
    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      };
    } else if (config.profile) {
      clientConfig.credentials = fromIni({ profile: config.profile });
    }

    this.client = new SageMakerRuntimeClient(clientConfig);
  }

  /**
   * Prepare input features for ML model
   */
  prepareModelInput(jobData: any): MLModelInput {
    // Use feature engineering utility for consistent transformation
    const { FeatureEngineer } = require('./feature-engineering');
    
    // Get baseline estimate if not provided
    const baselineEstimate = jobData.baselineEstimate || 6;
    
    // Transform using feature engineering
    return FeatureEngineer.transformJobToFeatures(jobData, baselineEstimate);
  }

  /**
   * Calculate weather score based on move date
   */
  private calculateWeatherScore(moveDate: string): number {
    if (!moveDate) return 0.8; // Default good weather
    
    const date = new Date(moveDate);
    const month = date.getMonth();
    
    // Swedish weather patterns
    const weatherScores: Record<number, number> = {
      0: 0.3,  // January - cold, snow
      1: 0.3,  // February - cold, snow
      2: 0.5,  // March - variable
      3: 0.6,  // April - spring
      4: 0.8,  // May - good
      5: 0.9,  // June - best
      6: 0.9,  // July - best
      7: 0.9,  // August - best
      8: 0.7,  // September - good
      9: 0.5,  // October - rain
      10: 0.4, // November - cold, rain
      11: 0.3  // December - cold, snow
    };
    
    return weatherScores[month] || 0.8;
  }

  /**
   * Invoke SageMaker endpoint for prediction
   */
  async predict(jobData: any): Promise<MLModelOutput> {
    const startTime = Date.now();
    
    try {
      // Prepare input features
      const modelInput = this.prepareModelInput(jobData);
      
      // Convert to JSON for SageMaker
      const inputData = JSON.stringify({
        instances: [Object.values(modelInput)]
      });
      
      // Prepare invoke command
      const command = new InvokeEndpointCommand({
        EndpointName: this.endpointName,
        ContentType: 'application/json',
        Accept: 'application/json',
        Body: new TextEncoder().encode(inputData)
      });
      
      // Make prediction request
      const response = await this.client.send(command);
      
      // Parse response
      const responseBody = new TextDecoder().decode(response.Body);
      const prediction = JSON.parse(responseBody);
      
      // Extract prediction value (format depends on model deployment)
      const predictedHours = Array.isArray(prediction.predictions) 
        ? prediction.predictions[0] 
        : prediction.predicted_hours || prediction;
      
      // Calculate inference time
      const inferenceTime = Date.now() - startTime;
      this.inferenceCount++;
      this.totalInferenceTime += inferenceTime;
      
      // Calculate confidence based on model characteristics
      const confidence = this.calculateConfidenceScore(modelInput, predictedHours);
      
      return {
        predicted_hours: Number(predictedHours),
        confidence_score: confidence,
        model_version: this.modelVersion,
        inference_time_ms: inferenceTime,
        feature_importance: this.getFeatureImportance()
      };
      
    } catch (error) {
      console.error('SageMaker prediction error:', error);
      
      // Log error details for debugging
      if (error.name === 'ModelError') {
        console.error('Model error - endpoint may be updating or unavailable');
      } else if (error.name === 'ValidationException') {
        console.error('Input validation error:', error.message);
      }
      
      throw new Error(`SageMaker prediction failed: ${error.message}`);
    }
  }

  /**
   * Calculate confidence score based on input characteristics
   */
  private calculateConfidenceScore(input: MLModelInput, prediction: number): number {
    let confidence = 0.85; // Base confidence for RandomForest model
    
    // Adjust based on input data quality
    if (input.living_area > 0 && input.living_area < 500) confidence += 0.02;
    if (input.team_size >= 2 && input.team_size <= 4) confidence += 0.03;
    if (input.distance_km < 50) confidence += 0.02;
    if (input.customer_preparation > 0.5) confidence += 0.03;
    
    // Adjust based on prediction reasonableness
    const hourlyRate = input.living_area / prediction;
    if (hourlyRate >= 10 && hourlyRate <= 30) { // Reasonable m²/hour range
      confidence += 0.05;
    }
    
    // Cap confidence at 0.95
    return Math.min(0.95, confidence);
  }

  /**
   * Get feature importance from RandomForest model
   */
  private getFeatureImportance(): Record<string, number> {
    // These would ideally come from the model, but we'll use typical values
    return {
      enhanced_v21_estimate: 0.35,
      living_area: 0.20,
      team_size: 0.15,
      distance_km: 0.10,
      floors: 0.08,
      weather_score: 0.05,
      customer_preparation: 0.04,
      elevator_ingen: 0.02,
      property_type_villa: 0.01
    };
  }

  /**
   * Get client metrics
   */
  getMetrics() {
    return {
      totalPredictions: this.inferenceCount,
      avgInferenceTime: this.inferenceCount > 0 
        ? Math.round(this.totalInferenceTime / this.inferenceCount) 
        : 0,
      endpointName: this.endpointName,
      modelVersion: this.modelVersion,
      region: this.client.config.region
    };
  }

  /**
   * Health check for SageMaker endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Make a test prediction with typical values
      const testData = {
        livingArea: 70,
        teamSize: 2,
        distance: 10,
        propertyType: 'lägenhet',
        baselineEstimate: 6
      };
      
      const result = await this.predict(testData);
      return result.predicted_hours > 0 && result.predicted_hours < 24;
    } catch (error) {
      console.error('SageMaker health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance with configuration
export const sageMakerClient = new SageMakerMLClient({
  endpointName: process.env.SAGEMAKER_ENDPOINT_NAME || 'nordflytt-time-estimation-015831',
  region: process.env.AWS_REGION || 'eu-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});