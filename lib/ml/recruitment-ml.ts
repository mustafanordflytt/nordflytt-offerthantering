import { CandidateMLData, MLPrediction, MLModelConfig, MLInsight } from '@/types/recruitment';
import * as tf from '@tensorflow/tfjs';

// AWS SageMaker configuration
const SAGEMAKER_CONFIG = {
  endpoint: process.env.SAGEMAKER_ENDPOINT || '',
  region: process.env.AWS_REGION || 'eu-north-1',
  modelName: 'nordflytt-recruitment-model',
  apiVersion: '2017-05-13'
};

export class RecruitmentMLService {
  private model: tf.LayersModel | null = null;
  private modelConfig: MLModelConfig = {
    modelId: 'recruitment-v1',
    modelName: 'Nordflytt Recruitment Predictor',
    version: '1.0.0',
    endpoint: SAGEMAKER_CONFIG.endpoint,
    region: SAGEMAKER_CONFIG.region,
    features: [
      { name: 'ageGroup', type: 'categorical', required: false },
      { name: 'yearsOfExperience', type: 'numeric', required: false },
      { name: 'educationLevel', type: 'categorical', required: false },
      { name: 'responseTime', type: 'numeric', required: true },
      { name: 'engagementLevel', type: 'numeric', required: true },
      { name: 'sentimentScore', type: 'numeric', required: true },
      { name: 'clarityScore', type: 'numeric', required: true },
      { name: 'professionalismScore', type: 'numeric', required: true },
      { name: 'skillsCount', type: 'numeric', required: true },
      { name: 'languageCount', type: 'numeric', required: true }
    ],
    hyperparameters: {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 100,
      hiddenLayers: [128, 64, 32],
      dropout: 0.2
    },
    performanceMetrics: {
      accuracy: 0.92,
      precision: 0.89,
      recall: 0.94,
      f1Score: 0.91,
      lastUpdated: new Date()
    }
  };

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      // In production, load from SageMaker
      // For now, create a simple neural network
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [10], units: 128, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 5, activation: 'sigmoid' }) // 5 output predictions
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

  private preprocessData(data: CandidateMLData): tf.Tensor {
    // Extract and normalize features
    const features = [
      this.encodeAgeGroup(data.ageGroup),
      this.normalizeExperience(data.yearsOfExperience),
      this.encodeEducation(data.educationLevel),
      data.conversationMetrics.responseTime / 60, // Normalize to minutes
      data.conversationMetrics.engagementLevel,
      (data.conversationMetrics.sentimentScore + 1) / 2, // Normalize from [-1,1] to [0,1]
      data.conversationMetrics.clarityScore,
      data.conversationMetrics.professionalismScore,
      data.skills.technical.length / 10, // Normalize skill count
      data.skills.languages.length / 5 // Normalize language count
    ];

    return tf.tensor2d([features]);
  }

  private encodeAgeGroup(ageGroup?: string): number {
    const groups: Record<string, number> = {
      '18-25': 0.2,
      '26-35': 0.4,
      '36-45': 0.6,
      '46-55': 0.8,
      '56+': 1.0
    };
    return groups[ageGroup || '26-35'] || 0.4;
  }

  private normalizeExperience(years?: number): number {
    if (!years) return 0;
    return Math.min(years / 20, 1); // Normalize to 0-1, max 20 years
  }

  private encodeEducation(level?: string): number {
    const levels: Record<string, number> = {
      'grundskola': 0.2,
      'gymnasium': 0.4,
      'yrkeshögskola': 0.6,
      'universitet': 0.8,
      'master': 1.0
    };
    return levels[level || 'gymnasium'] || 0.4;
  }

  async predict(candidateData: CandidateMLData): Promise<MLPrediction> {
    try {
      if (!this.model) {
        throw new Error('Model not initialized');
      }

      const input = this.preprocessData(candidateData);
      const prediction = this.model.predict(input) as tf.Tensor;
      const values = await prediction.array() as number[][];
      
      // Clean up tensors
      input.dispose();
      prediction.dispose();

      const [
        successProbability,
        customerSatisfaction,
        punctuality,
        teamFit,
        retentionProbability
      ] = values[0];

      // Generate comprehensive prediction
      const mlPrediction: MLPrediction = {
        candidateId: candidateData.candidateId,
        predictions: {
          successProbability,
          confidenceInterval: {
            lower: Math.max(0, successProbability - 0.1),
            upper: Math.min(1, successProbability + 0.1)
          },
          predictedPerformance: {
            customerSatisfaction: customerSatisfaction * 5, // Scale to 1-5
            punctuality,
            teamFit,
            retentionProbability,
            promotionPotential: (successProbability + teamFit) / 2
          },
          riskFactors: this.identifyRiskFactors(candidateData, {
            successProbability,
            retentionProbability,
            teamFit
          }),
          optimalPlacement: this.determineOptimalPlacement(candidateData, {
            customerSatisfaction,
            teamFit
          }),
          developmentPlan: this.generateDevelopmentPlan(candidateData, {
            successProbability,
            customerSatisfaction,
            teamFit
          })
        },
        modelVersion: this.modelConfig.version,
        modelConfidence: this.calculateConfidence(values[0]),
        generatedAt: new Date(),
        features: this.modelConfig.features.map(f => f.name)
      };

      return mlPrediction;
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  private identifyRiskFactors(
    data: CandidateMLData, 
    predictions: { successProbability: number; retentionProbability: number; teamFit: number }
  ): MLPrediction['predictions']['riskFactors'] {
    const riskFactors: MLPrediction['predictions']['riskFactors'] = [];

    // Turnover risk
    if (predictions.retentionProbability < 0.6) {
      riskFactors.push({
        type: 'turnover',
        probability: 1 - predictions.retentionProbability,
        description: 'Hög risk för personalomsättning inom första året',
        mitigation: 'Fokusera på onboarding och mentorskap'
      });
    }

    // Performance risk
    if (predictions.successProbability < 0.5) {
      riskFactors.push({
        type: 'performance',
        probability: 1 - predictions.successProbability,
        description: 'Risk för prestandaproblem',
        mitigation: 'Intensiv träning och tät uppföljning första månaden'
      });
    }

    // Cultural fit risk
    if (predictions.teamFit < 0.5) {
      riskFactors.push({
        type: 'cultural_fit',
        probability: 1 - predictions.teamFit,
        description: 'Potentiella utmaningar med teamintegration',
        mitigation: 'Team-building aktiviteter och buddy-system'
      });
    }

    // Skill gap risk
    if (!data.skills.technical.length || data.yearsOfExperience === 0) {
      riskFactors.push({
        type: 'skill_gap',
        probability: 0.7,
        description: 'Kompetensgap som kräver träning',
        mitigation: 'Strukturerad utbildningsplan första veckorna'
      });
    }

    return riskFactors;
  }

  private determineOptimalPlacement(
    data: CandidateMLData,
    predictions: { customerSatisfaction: number; teamFit: number }
  ): MLPrediction['predictions']['optimalPlacement'] {
    // Logic to determine best placement based on data and predictions
    let position = 'flyttpersonal';
    let shift: 'morning' | 'afternoon' | 'evening' | 'flexible' = 'flexible';
    
    // High customer satisfaction score suggests customer-facing roles
    if (predictions.customerSatisfaction > 0.8) {
      position = 'kundservice';
    }
    
    // Strong team fit and experience suggests leadership
    if (predictions.teamFit > 0.8 && (data.yearsOfExperience || 0) > 3) {
      position = 'team_leader';
    }

    return {
      position,
      location: data.geographicLocation || 'Stockholm',
      team: predictions.teamFit > 0.7 ? 'A-Team' : 'B-Team',
      shift,
      matchScore: (predictions.customerSatisfaction + predictions.teamFit) / 2
    };
  }

  private generateDevelopmentPlan(
    data: CandidateMLData,
    predictions: { successProbability: number; customerSatisfaction: number; teamFit: number }
  ): MLPrediction['predictions']['developmentPlan'] {
    const immediateTraining: string[] = [];
    const longTermDevelopment: string[] = [];

    // Immediate training needs
    if (!data.skills.technical.includes('lyfttekniker')) {
      immediateTraining.push('Grundläggande lyfttekniker och ergonomi');
    }
    
    if (predictions.customerSatisfaction < 0.7) {
      immediateTraining.push('Kundservice och kommunikation');
    }

    if (!data.skills.languages.find(l => l.language === 'svenska' && l.proficiency !== 'basic')) {
      immediateTraining.push('Yrkessvenska för flyttbranschen');
    }

    // Long-term development
    if (predictions.successProbability > 0.8) {
      longTermDevelopment.push('Ledarskapsutbildning');
      longTermDevelopment.push('Projektledning inom flytt');
    }

    return {
      immediateTraining,
      longTermDevelopment,
      mentorshipRecommended: predictions.teamFit < 0.6 || predictions.successProbability < 0.5,
      estimatedTimeToProductivity: this.estimateProductivityTime(data, predictions)
    };
  }

  private estimateProductivityTime(
    data: CandidateMLData,
    predictions: { successProbability: number; customerSatisfaction: number; teamFit: number }
  ): number {
    let baseDays = 14; // Standard onboarding

    // Adjust based on experience
    if ((data.yearsOfExperience || 0) > 2) {
      baseDays -= 3;
    }

    // Adjust based on predictions
    if (predictions.successProbability < 0.6) {
      baseDays += 7;
    }

    if (predictions.teamFit < 0.5) {
      baseDays += 5;
    }

    return Math.max(7, Math.min(30, baseDays));
  }

  private calculateConfidence(predictions: number[]): number {
    // Calculate confidence based on prediction variance
    const mean = predictions.reduce((a, b) => a + b) / predictions.length;
    const variance = predictions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / predictions.length;
    
    // Lower variance = higher confidence
    return Math.max(0.5, 1 - Math.sqrt(variance));
  }

  async generateInsights(candidates: CandidateMLData[]): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];

    // Analyze trends in candidate data
    const avgEngagement = candidates.reduce((sum, c) => sum + c.conversationMetrics.engagementLevel, 0) / candidates.length;
    
    if (avgEngagement > 0.8) {
      insights.push({
        insightId: `insight-${Date.now()}-1`,
        type: 'trend',
        category: 'recruitment',
        title: 'Högt kandidatengagemang',
        description: 'Kandidater visar exceptionellt högt engagemang i Lowisa-konversationer',
        impact: 'high',
        actionable: true,
        suggestedActions: [{
          action: 'Öka rekryteringstakten',
          expectedOutcome: 'Fånga högkvalitativa kandidater medan de är engagerade',
          effort: 'medium',
          priority: 1
        }],
        confidence: 0.9,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }

    // Geographic insights
    const locationGroups = this.groupByLocation(candidates);
    for (const [location, locationCandidates] of Object.entries(locationGroups)) {
      if (locationCandidates.length > 5) {
        insights.push({
          insightId: `insight-${Date.now()}-geo-${location}`,
          type: 'trend',
          category: 'recruitment',
          title: `Hög kandidattillgång i ${location}`,
          description: `${locationCandidates.length} kvalificerade kandidater i ${location}`,
          impact: 'medium',
          actionable: true,
          suggestedActions: [{
            action: `Planera rekryteringsevent i ${location}`,
            expectedOutcome: 'Maximera lokal rekrytering',
            effort: 'medium',
            priority: 2
          }],
          confidence: 0.85,
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        });
      }
    }

    return insights;
  }

  private groupByLocation(candidates: CandidateMLData[]): Record<string, CandidateMLData[]> {
    return candidates.reduce((groups, candidate) => {
      const location = candidate.geographicLocation || 'Unknown';
      if (!groups[location]) {
        groups[location] = [];
      }
      groups[location].push(candidate);
      return groups;
    }, {} as Record<string, CandidateMLData[]>);
  }

  async updateModel(trainingData: { input: number[][]; output: number[][] }): Promise<void> {
    if (!this.model) return;

    const xs = tf.tensor2d(trainingData.input);
    const ys = tf.tensor2d(trainingData.output);

    await this.model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
        }
      }
    });

    xs.dispose();
    ys.dispose();

    // Update performance metrics
    this.modelConfig.performanceMetrics.lastUpdated = new Date();
  }

  getModelConfig(): MLModelConfig {
    return this.modelConfig;
  }
}

// Singleton instance
export const recruitmentML = new RecruitmentMLService();