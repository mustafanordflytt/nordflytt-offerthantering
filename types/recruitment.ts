// ML-Enhanced Recruitment Types

export interface CandidateMLData {
  // Basic Information
  candidateId: number;
  applicationId: number;
  timestamp: Date;
  
  // Demographic Data
  ageGroup?: string;
  geographicLocation: string;
  educationLevel?: string;
  yearsOfExperience?: number;
  
  // Skills & Competencies
  skills: {
    technical: string[];
    soft: string[];
    languages: {
      language: string;
      proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
    }[];
  };
  
  // Behavioral Data from Lowisa
  conversationMetrics: {
    responseTime: number; // Average response time in seconds
    messageLength: number; // Average message length
    sentimentScore: number; // -1 to 1
    engagementLevel: number; // 0 to 1
    clarityScore: number; // 0 to 1
    professionalismScore: number; // 0 to 1
  };
  
  // Assessment Results
  assessmentScores: {
    personality?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    cognitiveAbility?: number;
    problemSolving?: number;
    customerServiceOrientation?: number;
  };
  
  // Historical Performance (for existing employees)
  performanceHistory?: {
    punctualityScore: number;
    customerRating: number;
    teamworkScore: number;
    completionRate: number;
    incidentRate: number;
  };
}

export interface MLPrediction {
  candidateId: number;
  predictions: {
    // Success Probability
    successProbability: number; // 0-1
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    
    // Performance Predictions
    predictedPerformance: {
      customerSatisfaction: number; // 1-5
      punctuality: number; // 0-1
      teamFit: number; // 0-1
      retentionProbability: number; // 0-1
      promotionPotential: number; // 0-1
    };
    
    // Risk Factors
    riskFactors: {
      type: 'turnover' | 'performance' | 'cultural_fit' | 'skill_gap';
      probability: number;
      description: string;
      mitigation: string;
    }[];
    
    // Optimal Placement
    optimalPlacement: {
      position: string;
      location: string;
      team: string;
      shift: 'morning' | 'afternoon' | 'evening' | 'flexible';
      matchScore: number;
    };
    
    // Development Recommendations
    developmentPlan: {
      immediateTraining: string[];
      longTermDevelopment: string[];
      mentorshipRecommended: boolean;
      estimatedTimeToProductivity: number; // days
    };
  };
  
  // Model Metadata
  modelVersion: string;
  modelConfidence: number;
  generatedAt: Date;
  features: string[]; // Features used for prediction
}

export interface MLModelConfig {
  modelId: string;
  modelName: string;
  version: string;
  endpoint: string;
  region: string;
  features: {
    name: string;
    type: 'numeric' | 'categorical' | 'text';
    required: boolean;
  }[];
  hyperparameters: Record<string, any>;
  performanceMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    lastUpdated: Date;
  };
}

export interface MLTrainingData {
  datasetId: string;
  samples: number;
  features: string[];
  labels: string[];
  splitRatio: {
    train: number;
    validation: number;
    test: number;
  };
  preprocessingSteps: string[];
  augmentationApplied: boolean;
}

export interface MLInsight {
  insightId: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  category: 'recruitment' | 'performance' | 'retention' | 'optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions?: {
    action: string;
    expectedOutcome: string;
    effort: 'low' | 'medium' | 'high';
    priority: number;
  }[];
  relatedCandidates?: number[];
  confidence: number;
  validUntil: Date;
  metadata?: Record<string, any>;
}

export interface RecruitmentMLDashboard {
  // Overall Metrics
  overallMetrics: {
    totalPredictions: number;
    averageAccuracy: number;
    costSavings: number;
    timeReduction: number;
    qualityImprovement: number;
  };
  
  // Model Performance
  modelPerformance: {
    modelId: string;
    metrics: MLModelConfig['performanceMetrics'];
    predictionDistribution: {
      range: string;
      count: number;
      percentage: number;
    }[];
  };
  
  // Insights
  activeInsights: MLInsight[];
  
  // Predictions Summary
  recentPredictions: {
    candidate: {
      id: number;
      name: string;
      position: string;
    };
    prediction: MLPrediction;
    actualOutcome?: {
      hired: boolean;
      performanceScore?: number;
      stillEmployed?: boolean;
    };
  }[];
  
  // Feature Importance
  featureImportance: {
    feature: string;
    importance: number;
    category: string;
  }[];
}
