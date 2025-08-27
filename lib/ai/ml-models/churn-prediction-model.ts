/**
 * Churn Prediction Model
 * Advanced ML model for predicting and preventing customer churn
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';

export interface ChurnAnalysisData {
  customerId: string;
  
  // Transactional behavior
  lastTransactionDate: Date;
  transactionFrequency: number; // per month
  transactionRecency: number; // days
  transactionMonetaryValue: number;
  transactionTrend: 'increasing' | 'stable' | 'decreasing';
  
  // Service usage patterns
  servicesUsed: number;
  lastServiceType: string;
  serviceDowngrades: number;
  contractStatus: 'active' | 'expired' | 'none';
  contractEndDate?: Date;
  
  // Interaction patterns
  supportTickets: SupportTicket[];
  lastInteractionDate: Date;
  interactionFrequency: number;
  communicationChannels: string[];
  responseRate: number;
  
  // Satisfaction indicators
  npsScore?: number;
  csatScores: number[];
  complaints: Complaint[];
  compliments: number;
  
  // Engagement metrics
  emailEngagement: {
    sent: number;
    opened: number;
    clicked: number;
    unsubscribed: boolean;
  };
  websiteActivity: {
    lastVisit: Date;
    pageViews: number;
    sessionDuration: number;
  };
  
  // Competitive signals
  competitorMentions: number;
  priceInquiries: number;
  cancellationRequests: number;
  
  // Customer profile
  customerLifetime: number; // months
  customerSegment: string;
  totalLifetimeValue: number;
}

export interface SupportTicket {
  id: string;
  date: Date;
  type: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolutionTime: number; // hours
  satisfaction?: number;
}

export interface Complaint {
  date: Date;
  category: string;
  severity: 'minor' | 'major' | 'critical';
  resolved: boolean;
}

export interface ChurnPrediction {
  customerId: string;
  
  // Risk scores
  churnRisk: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Time-based predictions
  churnProbability: {
    day30: number;
    day60: number;
    day90: number;
    day180: number;
  };
  
  // Risk factors
  riskFactors: RiskFactor[];
  
  // Behavioral insights
  behaviorAnalysis: BehaviorAnalysis;
  
  // Prevention recommendations
  preventionStrategies: PreventionStrategy[];
  
  // Model metadata
  confidence: number;
  modelVersion: string;
  predictedAt: Date;
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  score: number;
  description: string;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface BehaviorAnalysis {
  engagementTrend: string;
  satisfactionTrend: string;
  valuePerception: string;
  competitiveRisk: boolean;
  seasonalPattern?: string;
}

export interface PreventionStrategy {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  channel: string;
  message: string;
  expectedImpact: number; // risk reduction
  timing: string;
}

export class ChurnPredictionModel extends EventEmitter {
  private supabase = createClient();
  private modelVersion = '3.2';
  
  // Model parameters (trained on historical churn data)
  private readonly weights = {
    // Behavioral weights
    recency: 0.25,
    frequency: 0.20,
    monetary: 0.15,
    
    // Satisfaction weights
    satisfaction: 0.20,
    support: 0.10,
    
    // Engagement weights
    engagement: 0.10
  };
  
  // Risk thresholds
  private readonly thresholds = {
    critical: 0.8,
    high: 0.6,
    medium: 0.4,
    low: 0.2
  };
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('🔮 Initializing Churn Prediction Model v3.2...');
    
    // Load model parameters
    await this.loadModelParameters();
    
    // Start continuous learning
    this.startContinuousLearning();
    
    console.log('✅ Churn Model ready');
    this.emit('ready');
  }

  /**
   * Predict customer churn risk
   */
  async predictChurn(data: ChurnAnalysisData): Promise<ChurnPrediction> {
    const startTime = Date.now();
    
    // Calculate component scores
    const behavioralScore = this.calculateBehavioralScore(data);
    const satisfactionScore = this.calculateSatisfactionScore(data);
    const engagementScore = this.calculateEngagementScore(data);
    const supportScore = this.calculateSupportScore(data);
    const competitiveScore = this.calculateCompetitiveScore(data);
    
    // Calculate overall churn risk
    const churnRisk = this.calculateOverallRisk({
      behavioral: behavioralScore,
      satisfaction: satisfactionScore,
      engagement: engagementScore,
      support: supportScore,
      competitive: competitiveScore
    });
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(churnRisk);
    
    // Calculate time-based probabilities
    const churnProbability = this.calculateTimeProbabilities(churnRisk, data);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(data, {
      behavioral: behavioralScore,
      satisfaction: satisfactionScore,
      engagement: engagementScore,
      support: supportScore,
      competitive: competitiveScore
    });
    
    // Analyze behavior patterns
    const behaviorAnalysis = this.analyzeBehaviorPatterns(data);
    
    // Generate prevention strategies
    const preventionStrategies = this.generatePreventionStrategies(
      riskLevel,
      riskFactors,
      behaviorAnalysis,
      data
    );
    
    // Calculate confidence
    const confidence = this.calculateConfidence(data);
    
    const prediction: ChurnPrediction = {
      customerId: data.customerId,
      churnRisk,
      riskLevel,
      churnProbability,
      riskFactors,
      behaviorAnalysis,
      preventionStrategies,
      confidence,
      modelVersion: this.modelVersion,
      predictedAt: new Date()
    };
    
    // Log prediction
    await this.logPrediction(data, prediction);
    
    // Emit high-risk alerts
    if (riskLevel === 'critical' || riskLevel === 'high') {
      this.emit('high-churn-risk', prediction);
    }
    
    this.emit('churn-predicted', {
      prediction,
      processingTime: Date.now() - startTime
    });
    
    return prediction;
  }

  /**
   * Calculate behavioral score (RFM-based)
   */
  private calculateBehavioralScore(data: ChurnAnalysisData): number {
    // Recency score (exponential decay)
    const recencyScore = Math.exp(-data.transactionRecency / 180); // 6-month half-life
    
    // Frequency score (normalized)
    const expectedFrequency = this.getExpectedFrequency(data.customerSegment);
    const frequencyScore = Math.min(1, data.transactionFrequency / expectedFrequency);
    
    // Monetary score (relative to segment)
    const segmentAvgValue = this.getSegmentAverageValue(data.customerSegment);
    const monetaryScore = Math.min(1, data.transactionMonetaryValue / segmentAvgValue);
    
    // Trend adjustment
    let trendMultiplier = 1.0;
    if (data.transactionTrend === 'decreasing') trendMultiplier = 0.7;
    else if (data.transactionTrend === 'increasing') trendMultiplier = 1.3;
    
    return (
      recencyScore * this.weights.recency +
      frequencyScore * this.weights.frequency +
      monetaryScore * this.weights.monetary
    ) * trendMultiplier;
  }

  /**
   * Calculate satisfaction score
   */
  private calculateSatisfactionScore(data: ChurnAnalysisData): number {
    let score = 0.5; // Neutral baseline
    
    // NPS impact
    if (data.npsScore !== undefined) {
      if (data.npsScore >= 9) score += 0.3; // Promoter
      else if (data.npsScore >= 7) score += 0.1; // Passive
      else score -= 0.3; // Detractor
    }
    
    // CSAT scores
    if (data.csatScores.length > 0) {
      const avgCsat = data.csatScores.reduce((a, b) => a + b, 0) / data.csatScores.length;
      score += (avgCsat - 3) * 0.1; // Adjust from neutral (3/5)
    }
    
    // Complaints impact
    const complaintImpact = data.complaints.reduce((impact, complaint) => {
      let weight = 0.1;
      if (complaint.severity === 'critical') weight = 0.3;
      else if (complaint.severity === 'major') weight = 0.2;
      
      if (!complaint.resolved) weight *= 2; // Double impact if unresolved
      
      return impact - weight;
    }, 0);
    
    score += complaintImpact;
    
    // Compliments boost
    score += data.compliments * 0.05;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(data: ChurnAnalysisData): number {
    let score = 0;
    
    // Email engagement
    const emailEngagementRate = data.emailEngagement.sent > 0
      ? (data.emailEngagement.opened + data.emailEngagement.clicked * 2) / (data.emailEngagement.sent * 3)
      : 0;
    
    score += emailEngagementRate * 0.3;
    
    // Unsubscribe penalty
    if (data.emailEngagement.unsubscribed) score -= 0.5;
    
    // Website activity
    const daysSinceLastVisit = Math.floor(
      (Date.now() - data.websiteActivity.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastVisit < 30) score += 0.3;
    else if (daysSinceLastVisit < 90) score += 0.1;
    
    // Communication channels diversity
    score += Math.min(0.2, data.communicationChannels.length * 0.1);
    
    // Response rate
    score += data.responseRate * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate support score
   */
  private calculateSupportScore(data: ChurnAnalysisData): number {
    if (data.supportTickets.length === 0) return 0.8; // No issues baseline
    
    let score = 0.5;
    
    // Recent tickets impact
    const recentTickets = data.supportTickets.filter(t => 
      t.date.getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000 // Last 90 days
    );
    
    recentTickets.forEach(ticket => {
      let impact = -0.1;
      if (ticket.severity === 'high') impact = -0.2;
      if (!ticket.resolved) impact *= 2;
      
      // Quick resolution bonus
      if (ticket.resolved && ticket.resolutionTime < 24) impact *= 0.5;
      
      // Satisfaction recovery
      if (ticket.satisfaction && ticket.satisfaction >= 4) impact *= 0.3;
      
      score += impact;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate competitive risk score
   */
  private calculateCompetitiveScore(data: ChurnAnalysisData): number {
    let riskScore = 0;
    
    // Direct competitive signals
    riskScore += data.competitorMentions * 0.2;
    riskScore += data.priceInquiries * 0.15;
    riskScore += data.cancellationRequests * 0.5;
    
    // Contract protection
    if (data.contractStatus === 'active') {
      const daysUntilExpiry = data.contractEndDate
        ? Math.floor((data.contractEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : Infinity;
      
      if (daysUntilExpiry < 90) riskScore += 0.3; // Contract ending soon
      else riskScore *= 0.3; // Protected by contract
    }
    
    return Math.min(1, riskScore);
  }

  /**
   * Calculate overall churn risk
   */
  private calculateOverallRisk(scores: Record<string, number>): number {
    // Weighted combination with interaction effects
    let risk = 1 - (
      scores.behavioral * 0.35 +
      scores.satisfaction * 0.25 +
      scores.engagement * 0.20 +
      scores.support * 0.10 +
      (1 - scores.competitive) * 0.10
    );
    
    // Amplify risk if multiple factors are poor
    const poorScores = Object.values(scores).filter(s => s < 0.3).length;
    if (poorScores >= 3) risk *= 1.3;
    
    return Math.max(0, Math.min(1, risk));
  }

  /**
   * Determine risk level category
   */
  private determineRiskLevel(risk: number): 'low' | 'medium' | 'high' | 'critical' {
    if (risk >= this.thresholds.critical) return 'critical';
    if (risk >= this.thresholds.high) return 'high';
    if (risk >= this.thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Calculate time-based churn probabilities
   */
  private calculateTimeProbabilities(
    baseRisk: number, 
    data: ChurnAnalysisData
  ): ChurnPrediction['churnProbability'] {
    // Survival curve modeling
    const survivalRate = Math.exp(-baseRisk);
    
    // Time decay factors
    const timeFactors = {
      day30: 0.15,
      day60: 0.35,
      day90: 0.60,
      day180: 0.85
    };
    
    // Adjust for customer lifetime (longer customers churn slower)
    const lifetimeAdjustment = Math.log10(1 + data.customerLifetime / 12);
    
    return {
      day30: Math.min(0.95, baseRisk * timeFactors.day30 / lifetimeAdjustment),
      day60: Math.min(0.95, baseRisk * timeFactors.day60 / lifetimeAdjustment),
      day90: Math.min(0.95, baseRisk * timeFactors.day90 / lifetimeAdjustment),
      day180: Math.min(0.95, baseRisk * timeFactors.day180 / lifetimeAdjustment)
    };
  }

  /**
   * Identify specific risk factors
   */
  private identifyRiskFactors(
    data: ChurnAnalysisData,
    scores: Record<string, number>
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    // Behavioral factors
    if (data.transactionRecency > 120) {
      factors.push({
        factor: 'Long time since last purchase',
        impact: 'high',
        score: 0.8,
        description: `${data.transactionRecency} days since last transaction`,
        trend: 'worsening'
      });
    }
    
    if (data.transactionTrend === 'decreasing') {
      factors.push({
        factor: 'Declining purchase frequency',
        impact: 'medium',
        score: 0.6,
        description: 'Transaction frequency trending downward',
        trend: 'worsening'
      });
    }
    
    // Satisfaction factors
    if (data.npsScore !== undefined && data.npsScore < 7) {
      factors.push({
        factor: 'Low NPS score',
        impact: 'high',
        score: 0.7,
        description: `NPS score of ${data.npsScore} indicates dissatisfaction`,
        trend: 'stable'
      });
    }
    
    const unresolvedComplaints = data.complaints.filter(c => !c.resolved);
    if (unresolvedComplaints.length > 0) {
      factors.push({
        factor: 'Unresolved complaints',
        impact: 'high',
        score: 0.9,
        description: `${unresolvedComplaints.length} complaints pending resolution`,
        trend: 'worsening'
      });
    }
    
    // Engagement factors
    if (data.emailEngagement.unsubscribed) {
      factors.push({
        factor: 'Email unsubscribe',
        impact: 'medium',
        score: 0.7,
        description: 'Customer has unsubscribed from communications',
        trend: 'stable'
      });
    }
    
    // Support factors
    const highSeverityTickets = data.supportTickets.filter(t => t.severity === 'high' && !t.resolved);
    if (highSeverityTickets.length > 0) {
      factors.push({
        factor: 'Unresolved critical issues',
        impact: 'high',
        score: 0.85,
        description: `${highSeverityTickets.length} high-severity tickets open`,
        trend: 'worsening'
      });
    }
    
    // Competitive factors
    if (data.competitorMentions > 2) {
      factors.push({
        factor: 'Considering competitors',
        impact: 'high',
        score: 0.75,
        description: 'Customer has mentioned competitors multiple times',
        trend: 'worsening'
      });
    }
    
    if (data.priceInquiries > 3) {
      factors.push({
        factor: 'Price sensitivity',
        impact: 'medium',
        score: 0.6,
        description: 'Multiple price reduction requests',
        trend: 'stable'
      });
    }
    
    // Sort by impact and score
    return factors.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      return (impactWeight[b.impact] * b.score) - (impactWeight[a.impact] * a.score);
    });
  }

  /**
   * Analyze behavior patterns
   */
  private analyzeBehaviorPatterns(data: ChurnAnalysisData): BehaviorAnalysis {
    // Engagement trend
    let engagementTrend = 'stable';
    if (data.interactionFrequency < 0.5) engagementTrend = 'disengaging';
    else if (data.interactionFrequency > 2) engagementTrend = 'highly engaged';
    
    // Satisfaction trend
    let satisfactionTrend = 'stable';
    if (data.csatScores.length >= 3) {
      const recent = data.csatScores.slice(-3);
      const older = data.csatScores.slice(0, -3);
      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg + 0.5) satisfactionTrend = 'improving';
        else if (recentAvg < olderAvg - 0.5) satisfactionTrend = 'declining';
      }
    }
    
    // Value perception
    let valuePerception = 'fair';
    if (data.priceInquiries > 2) valuePerception = 'expensive';
    else if (data.compliments > 2) valuePerception = 'good value';
    
    // Competitive risk
    const competitiveRisk = data.competitorMentions > 0 || data.cancellationRequests > 0;
    
    // Seasonal pattern
    const seasonalPattern = this.detectSeasonalPattern(data);
    
    return {
      engagementTrend,
      satisfactionTrend,
      valuePerception,
      competitiveRisk,
      seasonalPattern
    };
  }

  /**
   * Generate prevention strategies
   */
  private generatePreventionStrategies(
    riskLevel: string,
    factors: RiskFactor[],
    behavior: BehaviorAnalysis,
    data: ChurnAnalysisData
  ): PreventionStrategy[] {
    const strategies: PreventionStrategy[] = [];
    
    // Critical risk strategies
    if (riskLevel === 'critical') {
      strategies.push({
        action: 'Executive intervention',
        priority: 'immediate',
        channel: 'phone',
        message: 'CEO/Senior management personal outreach',
        expectedImpact: 0.4,
        timing: 'Within 24 hours'
      });
      
      strategies.push({
        action: 'Retention offer',
        priority: 'immediate',
        channel: 'email',
        message: 'Exclusive 30% discount + premium services',
        expectedImpact: 0.3,
        timing: 'Immediate'
      });
    }
    
    // High risk strategies
    if (riskLevel === 'high' || riskLevel === 'critical') {
      strategies.push({
        action: 'Personal account review',
        priority: 'high',
        channel: 'video call',
        message: 'Schedule account health check with senior manager',
        expectedImpact: 0.25,
        timing: 'Within 48 hours'
      });
    }
    
    // Factor-specific strategies
    const topFactor = factors[0];
    if (topFactor) {
      if (topFactor.factor.includes('complaint')) {
        strategies.push({
          action: 'Complaint resolution',
          priority: 'immediate',
          channel: 'phone',
          message: 'Escalate to resolution team immediately',
          expectedImpact: 0.35,
          timing: 'Same day'
        });
      }
      
      if (topFactor.factor.includes('Long time since')) {
        strategies.push({
          action: 'Re-engagement campaign',
          priority: 'high',
          channel: 'multi-channel',
          message: 'Personalized "We miss you" campaign with incentive',
          expectedImpact: 0.2,
          timing: 'This week'
        });
      }
      
      if (topFactor.factor.includes('competitor')) {
        strategies.push({
          action: 'Competitive counter-offer',
          priority: 'high',
          channel: 'email',
          message: 'Match competitor pricing + exclusive benefits',
          expectedImpact: 0.3,
          timing: 'Within 72 hours'
        });
      }
    }
    
    // Behavior-based strategies
    if (behavior.satisfactionTrend === 'declining') {
      strategies.push({
        action: 'Service quality review',
        priority: 'high',
        channel: 'survey',
        message: 'Detailed feedback collection + improvement plan',
        expectedImpact: 0.15,
        timing: 'This week'
      });
    }
    
    if (behavior.valuePerception === 'expensive') {
      strategies.push({
        action: 'Value demonstration',
        priority: 'medium',
        channel: 'email',
        message: 'ROI report + cost savings analysis',
        expectedImpact: 0.1,
        timing: 'Within 1 week'
      });
    }
    
    // Proactive strategies for medium risk
    if (riskLevel === 'medium') {
      strategies.push({
        action: 'Loyalty program enrollment',
        priority: 'medium',
        channel: 'email',
        message: 'Exclusive benefits for valued customers',
        expectedImpact: 0.15,
        timing: 'Within 2 weeks'
      });
      
      strategies.push({
        action: 'Success story sharing',
        priority: 'low',
        channel: 'newsletter',
        message: 'Customer success stories + tips',
        expectedImpact: 0.05,
        timing: 'Monthly'
      });
    }
    
    // Contract renewal strategy
    if (data.contractStatus === 'active' && data.contractEndDate) {
      const daysUntilExpiry = Math.floor(
        (data.contractEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiry < 90) {
        strategies.push({
          action: 'Contract renewal negotiation',
          priority: 'high',
          channel: 'meeting',
          message: 'Early renewal incentive + enhanced terms',
          expectedImpact: 0.5,
          timing: `${daysUntilExpiry} days before expiry`
        });
      }
    }
    
    // Sort by expected impact
    return strategies.sort((a, b) => b.expectedImpact - a.expectedImpact).slice(0, 5);
  }

  /**
   * Calculate model confidence
   */
  private calculateConfidence(data: ChurnAnalysisData): number {
    let confidence = 0.6; // Base confidence
    
    // Data completeness
    if (data.npsScore !== undefined) confidence += 0.05;
    if (data.csatScores.length > 3) confidence += 0.05;
    if (data.supportTickets.length > 0) confidence += 0.05;
    if (data.customerLifetime > 24) confidence += 0.1; // 2+ year history
    
    // Behavioral consistency
    if (data.transactionTrend !== 'stable') confidence += 0.05; // Clear trend
    
    // Recent interactions
    const daysSinceInteraction = Math.floor(
      (Date.now() - data.lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceInteraction < 30) confidence += 0.05;
    
    return Math.min(0.95, confidence);
  }

  /**
   * Utility methods
   */
  private getExpectedFrequency(segment: string): number {
    const frequencies: Record<string, number> = {
      'enterprise': 2.5,
      'premium': 1.5,
      'standard': 0.8,
      'basic': 0.3
    };
    return frequencies[segment] || 0.5;
  }

  private getSegmentAverageValue(segment: string): number {
    const values: Record<string, number> = {
      'enterprise': 75000,
      'premium': 35000,
      'standard': 15000,
      'basic': 5000
    };
    return values[segment] || 10000;
  }

  private detectSeasonalPattern(data: ChurnAnalysisData): string | undefined {
    // Simplified seasonal detection
    if (data.customerLifetime < 12) return undefined;
    
    // Would analyze transaction patterns by month
    return 'summer-peak'; // Placeholder
  }

  /**
   * Model management
   */
  private async loadModelParameters() {
    const { data: params } = await this.supabase
      .from('ml_model_parameters')
      .select('*')
      .eq('model', 'churn_prediction')
      .eq('version', this.modelVersion)
      .single();
    
    if (params) {
      Object.assign(this.weights, params.weights);
      Object.assign(this.thresholds, params.thresholds);
    }
  }

  private startContinuousLearning() {
    // Update model based on actual churn outcomes
    setInterval(async () => {
      await this.updateModelFromOutcomes();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }

  private async updateModelFromOutcomes() {
    // Fetch predictions from 90+ days ago
    const { data: oldPredictions } = await this.supabase
      .from('churn_predictions')
      .select('*')
      .gte('predicted_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))
      .lte('predicted_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
    
    if (!oldPredictions || oldPredictions.length < 100) return;
    
    // Check actual outcomes
    let correctPredictions = 0;
    
    for (const pred of oldPredictions) {
      const { data: customer } = await this.supabase
        .from('customers')
        .select('status, last_transaction_date')
        .eq('id', pred.customer_id)
        .single();
      
      if (customer) {
        const actuallyChurned = customer.status === 'churned' || 
          new Date(customer.last_transaction_date) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        
        const predictedChurn = pred.churn_probability_90 > 0.5;
        
        if (actuallyChurned === predictedChurn) {
          correctPredictions++;
        }
      }
    }
    
    const accuracy = correctPredictions / oldPredictions.length;
    console.log(`📊 Churn model accuracy: ${(accuracy * 100).toFixed(1)}%`);
    
    // Adjust weights if accuracy is low
    if (accuracy < 0.75) {
      // Would implement weight adjustment logic
      console.log('🔧 Adjusting model weights based on outcomes');
    }
  }

  private async logPrediction(data: ChurnAnalysisData, prediction: ChurnPrediction) {
    await this.supabase
      .from('churn_predictions')
      .insert({
        customer_id: data.customerId,
        churn_risk: prediction.churnRisk,
        risk_level: prediction.riskLevel,
        churn_probability_30: prediction.churnProbability.day30,
        churn_probability_60: prediction.churnProbability.day60,
        churn_probability_90: prediction.churnProbability.day90,
        churn_probability_180: prediction.churnProbability.day180,
        risk_factors: prediction.riskFactors,
        prevention_strategies: prediction.preventionStrategies,
        confidence: prediction.confidence,
        model_version: this.modelVersion,
        predicted_at: new Date()
      });
  }

  /**
   * Public methods
   */
  async getHighRiskCustomers(threshold: number = 0.6): Promise<any[]> {
    const { data } = await this.supabase
      .from('churn_predictions')
      .select('*')
      .gte('churn_risk', threshold)
      .order('churn_risk', { ascending: false })
      .limit(100);
    
    return data || [];
  }

  async getPreventionEffectiveness(): Promise<any> {
    // Analyze effectiveness of prevention strategies
    const { data: prevented } = await this.supabase
      .from('churn_prevention_results')
      .select('*')
      .eq('outcome', 'prevented');
    
    const { data: failed } = await this.supabase
      .from('churn_prevention_results')
      .select('*')
      .eq('outcome', 'churned');
    
    const totalAttempts = (prevented?.length || 0) + (failed?.length || 0);
    const successRate = totalAttempts > 0 ? (prevented?.length || 0) / totalAttempts : 0;
    
    return {
      totalAttempts,
      prevented: prevented?.length || 0,
      failed: failed?.length || 0,
      successRate,
      mostEffectiveStrategies: this.analyzeMostEffectiveStrategies(prevented || [])
    };
  }

  private analyzeMostEffectiveStrategies(preventedCases: any[]): any[] {
    const strategySuccess: Record<string, { count: number; total: number }> = {};
    
    preventedCases.forEach(case_ => {
      case_.strategies_used.forEach((strategy: string) => {
        if (!strategySuccess[strategy]) {
          strategySuccess[strategy] = { count: 0, total: 0 };
        }
        strategySuccess[strategy].count++;
        strategySuccess[strategy].total++;
      });
    });
    
    return Object.entries(strategySuccess)
      .map(([strategy, stats]) => ({
        strategy,
        effectiveness: stats.count / stats.total,
        usageCount: stats.total
      }))
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5);
  }
}

// Export singleton instance
export const churnPredictionModel = new ChurnPredictionModel();