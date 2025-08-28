'use client';

import { CandidateMLData, MLPrediction, MLModelConfig, MLInsight } from '@/types/recruitment';
import * as tf from '@tensorflow/tfjs';

// Client-side only ML service
export class RecruitmentMLServiceClient {
  private model: tf.LayersModel | null = null;
  private modelConfig: MLModelConfig = {
    modelId: 'recruitment-v1',
    modelName: 'Nordflytt Recruitment Predictor',
    version: '1.0.0',
    endpoint: '',
    region: 'eu-north-1',
    features: [
      'experience_score',
      'skill_match_score',
      'previous_performance',
      'availability_score',
      'location_match',
      'certifications',
      'language_skills',
      'physical_capability',
      'vehicle_license',
      'team_fit_score'
    ],
    outputLabels: [
      'performance_prediction',
      'retention_probability',
      'team_fit_score',
      'growth_potential',
      'reliability_score'
    ],
    threshold: 0.75,
    lastUpdated: new Date().toISOString()
  };

  async initialize(): Promise<void> {
    try {
      // Create a simple model for demo purposes
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [10], units: 128, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 5, activation: 'sigmoid' })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
    } catch (error) {
      console.error('Failed to initialize ML model:', error);
    }
  }

  async predict(candidateData: CandidateMLData): Promise<MLPrediction> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const features = this.extractFeatures(candidateData);
    const input = tf.tensor2d([features]);
    
    try {
      const prediction = this.model.predict(input) as tf.Tensor;
      const values = await prediction.data();
      
      input.dispose();
      prediction.dispose();

      return {
        candidateId: candidateData.candidateId,
        predictions: {
          performanceScore: values[0],
          retentionProbability: values[1],
          teamFitScore: values[2],
          growthPotential: values[3],
          reliabilityScore: values[4]
        },
        confidence: this.calculateConfidence(values),
        modelVersion: this.modelConfig.version,
        timestamp: new Date().toISOString(),
        factors: this.generateFactors(candidateData, values)
      };
    } catch (error) {
      throw new Error(`Prediction failed: ${error}`);
    }
  }

  private extractFeatures(data: CandidateMLData): number[] {
    return [
      data.experienceYears / 10,
      data.skillMatchScore / 100,
      data.previousJobsCount / 5,
      data.averageJobDuration / 24,
      data.distanceFromOffice / 50,
      data.hasDriverLicense ? 1 : 0,
      data.hasCertifications ? 1 : 0,
      data.languageSkills / 5,
      data.physicalCapabilityScore / 100,
      data.availabilityScore / 100
    ];
  }

  private calculateConfidence(predictions: Float32Array | Int32Array | Uint8Array): number {
    const avg = Array.from(predictions).reduce((a, b) => a + b, 0) / predictions.length;
    return Math.min(0.95, Math.max(0.5, avg + 0.2));
  }

  private generateFactors(data: CandidateMLData, predictions: Float32Array | Int32Array | Uint8Array): string[] {
    const factors: string[] = [];
    
    if (data.experienceYears > 5) factors.push('Experienced professional');
    if (data.skillMatchScore > 80) factors.push('Excellent skill match');
    if (data.distanceFromOffice < 10) factors.push('Lives nearby');
    if (predictions[1] > 0.8) factors.push('High retention likelihood');
    if (predictions[2] > 0.85) factors.push('Great team fit');
    
    return factors;
  }

  generateInsights(predictions: MLPrediction[]): MLInsight[] {
    return [
      {
        type: 'recommendation',
        title: 'Top Performer Identified',
        description: 'Candidate shows exceptional potential',
        confidence: 0.92,
        actionable: true,
        priority: 'high',
        suggestedAction: 'Fast-track interview process'
      }
    ];
  }

  getModelConfig(): MLModelConfig {
    return this.modelConfig;
  }
}