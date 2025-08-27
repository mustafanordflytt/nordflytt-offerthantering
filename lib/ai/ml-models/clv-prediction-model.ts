/**
 * Customer Lifetime Value (CLV) Prediction Model
 * Advanced ML model for predicting customer value over time
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';

export interface CustomerData {
  customerId: string;
  
  // Historical transaction data
  transactions: Transaction[];
  firstPurchaseDate: Date;
  lastPurchaseDate: Date;
  totalSpent: number;
  orderCount: number;
  
  // Service usage patterns
  servicesUsed: ServiceUsage[];
  preferredServices: string[];
  seasonalPatterns: SeasonalPattern[];
  
  // Engagement metrics
  supportTickets: number;
  satisfactionScores: number[];
  referrals: number;
  complaints: number;
  
  // Behavioral data
  websiteVisits: number;
  emailEngagement: EmailMetrics;
  loyaltyProgramMember: boolean;
  contractCustomer: boolean;
  
  // Demographics
  customerType: 'individual' | 'company';
  location: string;
  industry?: string;
  companySize?: number;
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  service: string;
  profit: number;
  satisfaction?: number;
}

export interface ServiceUsage {
  service: string;
  frequency: number;
  avgValue: number;
  lastUsed: Date;
}

export interface SeasonalPattern {
  month: number;
  probability: number;
  avgValue: number;
}

export interface EmailMetrics {
  sent: number;
  opened: number;
  clicked: number;
  unsubscribed: boolean;
}

export interface CLVPrediction {
  customerId: string;
  
  // Value predictions
  clv3Months: number;
  clv6Months: number;
  clv12Months: number;
  clv24Months: number;
  clvTotal: number;
  
  // Confidence and components
  confidence: number;
  modelVersion: string;
  
  // Value breakdown
  components: CLVComponents;
  
  // Risk factors
  churnProbability: ChurnProbability;
  
  // Opportunities
  growthOpportunities: GrowthOpportunity[];
  
  // Recommendations
  recommendations: string[];
}

export interface CLVComponents {
  baseValue: number;
  frequencyMultiplier: number;
  recencyMultiplier: number;
  serviceMultiplier: number;
  loyaltyMultiplier: number;
  riskAdjustment: number;
}

export interface ChurnProbability {
  month3: number;
  month6: number;
  month12: number;
  factors: string[];
}

export interface GrowthOpportunity {
  type: string;
  service: string;
  potentialValue: number;
  probability: number;
  recommendation: string;
}

export class CLVPredictionModel extends EventEmitter {
  private supabase = createClient();
  private modelVersion = '2.5';
  
  // Model parameters (trained on historical data)
  private readonly params = {
    // RFM weights
    recencyWeight: 0.3,
    frequencyWeight: 0.4,
    monetaryWeight: 0.3,
    
    // Time decay
    decayRate: 0.15, // 15% annual decay
    
    // Service multipliers
    serviceValues: {
      hemflytt: 1.0,
      kontorsflytt: 3.5,
      magasinering: 2.0,
      packtjänst: 0.8,
      städning: 0.6,
      international: 5.0
    },
    
    // Loyalty factors
    referralValue: 5000,
    contractMultiplier: 1.5,
    satisfactionImpact: 0.2
  };
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('💰 Initializing CLV Prediction Model v2.5...');
    
    // Load model parameters
    await this.loadModelParameters();
    
    // Start model monitoring
    this.startModelMonitoring();
    
    console.log('✅ CLV Model ready');
    this.emit('ready');
  }

  /**
   * Predict customer lifetime value
   */
  async predictCLV(customerData: CustomerData): Promise<CLVPrediction> {
    const startTime = Date.now();
    
    // Calculate RFM scores
    const rfmScores = this.calculateRFMScores(customerData);
    
    // Calculate base CLV
    const baseValue = this.calculateBaseValue(customerData, rfmScores);
    
    // Apply multipliers
    const components = this.calculateComponents(customerData, baseValue);
    
    // Time-based projections
    const projections = this.projectValueOverTime(components, customerData);
    
    // Calculate churn probability
    const churnProbability = await this.predictChurn(customerData);
    
    // Identify growth opportunities
    const growthOpportunities = this.identifyGrowthOpportunities(customerData);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      customerData,
      projections,
      churnProbability,
      growthOpportunities
    );
    
    // Calculate confidence
    const confidence = this.calculateConfidence(customerData);
    
    const prediction: CLVPrediction = {
      customerId: customerData.customerId,
      clv3Months: projections.month3,
      clv6Months: projections.month6,
      clv12Months: projections.month12,
      clv24Months: projections.month24,
      clvTotal: projections.total,
      confidence,
      modelVersion: this.modelVersion,
      components,
      churnProbability,
      growthOpportunities,
      recommendations
    };
    
    // Log prediction
    await this.logPrediction(customerData, prediction);
    
    // Emit event
    this.emit('clv-predicted', {
      prediction,
      processingTime: Date.now() - startTime
    });
    
    return prediction;
  }

  /**
   * Calculate RFM (Recency, Frequency, Monetary) scores
   */
  private calculateRFMScores(data: CustomerData): {
    recency: number;
    frequency: number;
    monetary: number;
  } {
    // Recency score (days since last purchase)
    const daysSinceLastPurchase = Math.floor(
      (Date.now() - data.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let recency = 1.0;
    if (daysSinceLastPurchase < 30) recency = 1.0;
    else if (daysSinceLastPurchase < 90) recency = 0.8;
    else if (daysSinceLastPurchase < 180) recency = 0.6;
    else if (daysSinceLastPurchase < 365) recency = 0.4;
    else recency = 0.2;
    
    // Frequency score
    const monthsActive = Math.max(1, Math.floor(
      (data.lastPurchaseDate.getTime() - data.firstPurchaseDate.getTime()) / 
      (1000 * 60 * 60 * 24 * 30)
    ));
    const purchasesPerMonth = data.orderCount / monthsActive;
    
    let frequency = Math.min(1.0, purchasesPerMonth / 2); // Cap at 2 purchases/month
    
    // Monetary score
    const avgOrderValue = data.totalSpent / Math.max(1, data.orderCount);
    const monetaryScore = Math.min(1.0, avgOrderValue / 50000); // Normalize to 50k
    
    return {
      recency,
      frequency,
      monetary: monetaryScore
    };
  }

  /**
   * Calculate base CLV value
   */
  private calculateBaseValue(data: CustomerData, rfm: any): number {
    // Weighted RFM score
    const rfmScore = 
      rfm.recency * this.params.recencyWeight +
      rfm.frequency * this.params.frequencyWeight +
      rfm.monetary * this.params.monetaryWeight;
    
    // Historical average order value
    const avgOrderValue = data.totalSpent / Math.max(1, data.orderCount);
    
    // Projected annual purchases based on frequency
    const annualPurchases = (data.orderCount / this.getCustomerAge(data)) * 12;
    
    // Base CLV = AOV × Purchase Frequency × RFM Score
    return avgOrderValue * annualPurchases * rfmScore;
  }

  /**
   * Calculate CLV components with multipliers
   */
  private calculateComponents(data: CustomerData, baseValue: number): CLVComponents {
    // Frequency multiplier (rewards consistent customers)
    const purchaseFrequency = data.orderCount / this.getCustomerAge(data);
    const frequencyMultiplier = 1 + Math.log10(1 + purchaseFrequency) * 0.5;
    
    // Recency multiplier (recent activity indicates engagement)
    const daysSinceLastPurchase = Math.floor(
      (Date.now() - data.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyMultiplier = Math.exp(-daysSinceLastPurchase / 365); // Exponential decay
    
    // Service multiplier (based on service mix)
    let serviceMultiplier = 1.0;
    data.servicesUsed.forEach(usage => {
      const serviceValue = this.params.serviceValues[usage.service as keyof typeof this.params.serviceValues] || 1.0;
      serviceMultiplier += (serviceValue - 1) * (usage.frequency / data.orderCount);
    });
    
    // Loyalty multiplier
    let loyaltyMultiplier = 1.0;
    if (data.contractCustomer) loyaltyMultiplier *= this.params.contractMultiplier;
    if (data.loyaltyProgramMember) loyaltyMultiplier *= 1.2;
    if (data.referrals > 0) loyaltyMultiplier *= (1 + data.referrals * 0.1);
    
    // Risk adjustment (based on satisfaction and complaints)
    const avgSatisfaction = data.satisfactionScores.length > 0
      ? data.satisfactionScores.reduce((a, b) => a + b, 0) / data.satisfactionScores.length
      : 3.5; // Default neutral
    
    const satisfactionFactor = (avgSatisfaction - 3) / 2; // -1 to 1 scale
    const complaintFactor = Math.max(0, 1 - data.complaints * 0.2);
    const riskAdjustment = (1 + satisfactionFactor * this.params.satisfactionImpact) * complaintFactor;
    
    return {
      baseValue,
      frequencyMultiplier,
      recencyMultiplier,
      serviceMultiplier,
      loyaltyMultiplier,
      riskAdjustment
    };
  }

  /**
   * Project value over time periods
   */
  private projectValueOverTime(
    components: CLVComponents, 
    data: CustomerData
  ): {
    month3: number;
    month6: number;
    month12: number;
    month24: number;
    total: number;
  } {
    // Calculate adjusted base value
    const adjustedValue = components.baseValue *
      components.frequencyMultiplier *
      components.recencyMultiplier *
      components.serviceMultiplier *
      components.loyaltyMultiplier *
      components.riskAdjustment;
    
    // Apply time decay for projections
    const month3 = adjustedValue * 0.25; // 3 months
    const month6 = adjustedValue * 0.5 * Math.pow(1 - this.params.decayRate, 0.25);
    const month12 = adjustedValue * Math.pow(1 - this.params.decayRate, 0.5);
    const month24 = adjustedValue * 2 * Math.pow(1 - this.params.decayRate, 1.5);
    
    // Total CLV (5-year projection with decay)
    let total = 0;
    for (let year = 0; year < 5; year++) {
      total += adjustedValue * Math.pow(1 - this.params.decayRate, year);
    }
    
    // Apply seasonal adjustments
    const seasonalAdjustment = this.calculateSeasonalAdjustment(data);
    
    return {
      month3: Math.round(month3 * seasonalAdjustment),
      month6: Math.round(month6 * seasonalAdjustment),
      month12: Math.round(month12 * seasonalAdjustment),
      month24: Math.round(month24 * seasonalAdjustment),
      total: Math.round(total)
    };
  }

  /**
   * Predict churn probability
   */
  private async predictChurn(data: CustomerData): Promise<ChurnProbability> {
    const factors: string[] = [];
    let baseChurnRate = 0.15; // 15% annual baseline
    
    // Recency factor
    const daysSinceLastPurchase = Math.floor(
      (Date.now() - data.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastPurchase > 180) {
      baseChurnRate += 0.3;
      factors.push('No purchase in 6+ months');
    } else if (daysSinceLastPurchase > 90) {
      baseChurnRate += 0.15;
      factors.push('No recent activity');
    }
    
    // Frequency decline
    const recentTransactions = data.transactions.filter(t => 
      t.date.getTime() > Date.now() - 180 * 24 * 60 * 60 * 1000
    ).length;
    
    const historicalFrequency = data.orderCount / this.getCustomerAge(data);
    const recentFrequency = recentTransactions / 0.5; // Per 6 months
    
    if (recentFrequency < historicalFrequency * 0.5) {
      baseChurnRate += 0.2;
      factors.push('Declining purchase frequency');
    }
    
    // Satisfaction issues
    const recentSatisfaction = data.satisfactionScores.slice(-3);
    if (recentSatisfaction.some(score => score < 3)) {
      baseChurnRate += 0.25;
      factors.push('Recent low satisfaction');
    }
    
    // Complaints
    if (data.complaints > 1) {
      baseChurnRate += 0.1 * data.complaints;
      factors.push(`${data.complaints} unresolved complaints`);
    }
    
    // Email disengagement
    if (data.emailEngagement.unsubscribed) {
      baseChurnRate += 0.3;
      factors.push('Unsubscribed from emails');
    } else if (data.emailEngagement.opened === 0 && data.emailEngagement.sent > 10) {
      baseChurnRate += 0.15;
      factors.push('No email engagement');
    }
    
    // Contract protection
    if (data.contractCustomer) {
      baseChurnRate *= 0.3; // 70% reduction
    }
    
    // Calculate time-based probabilities
    const month3 = Math.min(0.95, baseChurnRate * 0.25);
    const month6 = Math.min(0.95, baseChurnRate * 0.5);
    const month12 = Math.min(0.95, baseChurnRate);
    
    return {
      month3,
      month6,
      month12,
      factors
    };
  }

  /**
   * Identify growth opportunities
   */
  private identifyGrowthOpportunities(data: CustomerData): GrowthOpportunity[] {
    const opportunities: GrowthOpportunity[] = [];
    
    // Cross-sell opportunities
    const usedServices = new Set(data.servicesUsed.map(s => s.service));
    
    // Office moving → Storage opportunity
    if (usedServices.has('kontorsflytt') && !usedServices.has('magasinering')) {
      opportunities.push({
        type: 'cross-sell',
        service: 'magasinering',
        potentialValue: 24000, // 2000/month × 12
        probability: 0.35,
        recommendation: 'Offer document storage after office move'
      });
    }
    
    // Home moving → Cleaning opportunity
    if (usedServices.has('hemflytt') && !usedServices.has('städning')) {
      opportunities.push({
        type: 'cross-sell',
        service: 'städning',
        potentialValue: 3500,
        probability: 0.45,
        recommendation: 'Bundle cleaning with moving service'
      });
    }
    
    // Frequency increase opportunity
    if (data.orderCount < 3 && this.getCustomerAge(data) > 12) {
      const avgValue = data.totalSpent / data.orderCount;
      opportunities.push({
        type: 'frequency-increase',
        service: 'loyalty-program',
        potentialValue: avgValue * 2,
        probability: 0.25,
        recommendation: 'Enroll in loyalty program for repeat business'
      });
    }
    
    // Upsell to premium services
    if (data.customerType === 'company' && !usedServices.has('international')) {
      opportunities.push({
        type: 'upsell',
        service: 'international',
        potentialValue: 150000,
        probability: 0.15,
        recommendation: 'Present international relocation capabilities'
      });
    }
    
    // Contract opportunity
    if (!data.contractCustomer && data.orderCount > 2) {
      const projectedAnnualValue = (data.totalSpent / this.getCustomerAge(data)) * 12;
      opportunities.push({
        type: 'contract',
        service: 'annual-contract',
        potentialValue: projectedAnnualValue * 1.5,
        probability: 0.4,
        recommendation: 'Offer annual contract with preferred pricing'
      });
    }
    
    // Referral program
    if (data.referrals === 0 && data.satisfactionScores.some(s => s >= 4)) {
      opportunities.push({
        type: 'referral',
        service: 'referral-program',
        potentialValue: this.params.referralValue * 2,
        probability: 0.3,
        recommendation: 'Activate referral program participation'
      });
    }
    
    // Sort by expected value
    return opportunities.sort((a, b) => 
      (b.potentialValue * b.probability) - (a.potentialValue * a.probability)
    );
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    data: CustomerData,
    projections: any,
    churn: ChurnProbability,
    opportunities: GrowthOpportunity[]
  ): string[] {
    const recommendations: string[] = [];
    
    // High-value customer recommendations
    if (projections.total > 200000) {
      recommendations.push('🌟 Assign dedicated account manager');
      recommendations.push('💎 Invite to VIP customer program');
    }
    
    // Churn prevention recommendations
    if (churn.month6 > 0.5) {
      recommendations.push('🚨 High churn risk - immediate intervention needed');
      recommendations.push('📞 Schedule personal check-in call');
      
      if (data.complaints > 0) {
        recommendations.push('🔧 Resolve outstanding complaints priority');
      }
    } else if (churn.month12 > 0.3) {
      recommendations.push('⚠️ Medium churn risk - proactive engagement recommended');
      recommendations.push('🎁 Send retention offer or loyalty rewards');
    }
    
    // Growth opportunity recommendations
    const topOpportunity = opportunities[0];
    if (topOpportunity) {
      recommendations.push(`💰 ${topOpportunity.recommendation}`);
      
      if (topOpportunity.probability > 0.4) {
        recommendations.push(`✅ High probability (${Math.round(topOpportunity.probability * 100)}%) - prioritize this opportunity`);
      }
    }
    
    // Engagement recommendations
    if (data.emailEngagement.opened === 0 && !data.emailEngagement.unsubscribed) {
      recommendations.push('📧 Test different email content/timing');
    }
    
    // Service-specific recommendations
    if (data.preferredServices.includes('kontorsflytt') && data.customerType === 'company') {
      recommendations.push('🏢 Track company growth for expansion opportunities');
    }
    
    // Seasonal recommendations
    const nextHighSeason = this.getNextHighSeason(data);
    if (nextHighSeason) {
      recommendations.push(`📅 Proactive outreach before ${nextHighSeason}`);
    }
    
    return recommendations.slice(0, 5); // Top 5 most relevant
  }

  /**
   * Calculate model confidence
   */
  private calculateConfidence(data: CustomerData): number {
    let confidence = 0.5; // Base confidence
    
    // Data quality factors
    if (data.transactions.length > 10) confidence += 0.1;
    if (data.transactions.length > 20) confidence += 0.1;
    if (this.getCustomerAge(data) > 24) confidence += 0.1; // 2+ years
    if (data.satisfactionScores.length > 3) confidence += 0.05;
    
    // Behavioral consistency
    const transactionVariance = this.calculateTransactionVariance(data);
    if (transactionVariance < 0.3) confidence += 0.1; // Consistent behavior
    
    // Recent activity
    const daysSinceLastPurchase = Math.floor(
      (Date.now() - data.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastPurchase < 90) confidence += 0.05;
    
    return Math.min(0.95, confidence);
  }

  /**
   * Utility methods
   */
  private getCustomerAge(data: CustomerData): number {
    const months = Math.max(1, Math.floor(
      (Date.now() - data.firstPurchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ));
    return months;
  }

  private calculateSeasonalAdjustment(data: CustomerData): number {
    const currentMonth = new Date().getMonth();
    const pattern = data.seasonalPatterns.find(p => p.month === currentMonth);
    
    if (pattern) {
      return 0.8 + (pattern.probability * 0.4); // 0.8 to 1.2 range
    }
    
    // Default seasonal pattern for moving industry
    const defaultPattern = [0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 0.9, 0.8, 0.8];
    return defaultPattern[currentMonth];
  }

  private calculateTransactionVariance(data: CustomerData): number {
    if (data.transactions.length < 2) return 1.0;
    
    const amounts = data.transactions.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private getNextHighSeason(data: CustomerData): string | null {
    const currentMonth = new Date().getMonth();
    const highSeasons = data.seasonalPatterns
      .filter(p => p.probability > 0.7)
      .sort((a, b) => a.month - b.month);
    
    const nextSeason = highSeasons.find(s => s.month > currentMonth) || highSeasons[0];
    
    if (nextSeason) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[nextSeason.month];
    }
    
    return null;
  }

  /**
   * Model management
   */
  private async loadModelParameters() {
    // Load latest model parameters from database
    const { data: params } = await this.supabase
      .from('ml_model_parameters')
      .select('*')
      .eq('model', 'clv_prediction')
      .eq('version', this.modelVersion)
      .single();
    
    if (params) {
      Object.assign(this.params, params.parameters);
    }
  }

  private startModelMonitoring() {
    // Monitor prediction accuracy
    setInterval(async () => {
      await this.evaluateModelAccuracy();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async evaluateModelAccuracy() {
    // Compare predictions with actual outcomes
    const { data: predictions } = await this.supabase
      .from('clv_predictions')
      .select('*')
      .gte('predicted_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // 1 year old
      .lte('predicted_at', new Date(Date.now() - 335 * 24 * 60 * 60 * 1000)); // 11-12 months old
    
    if (!predictions || predictions.length < 50) return;
    
    let totalError = 0;
    let count = 0;
    
    for (const pred of predictions) {
      const { data: actual } = await this.supabase
        .from('customer_transactions')
        .select('amount')
        .eq('customer_id', pred.customer_id)
        .gte('date', pred.predicted_at)
        .lte('date', new Date(pred.predicted_at.getTime() + 365 * 24 * 60 * 60 * 1000));
      
      if (actual) {
        const actualValue = actual.reduce((sum, t) => sum + t.amount, 0);
        const predictedValue = pred.clv_12_months;
        const error = Math.abs(actualValue - predictedValue) / predictedValue;
        
        totalError += error;
        count++;
      }
    }
    
    const avgError = totalError / count;
    console.log(`📊 CLV Model accuracy: ${((1 - avgError) * 100).toFixed(1)}%`);
    
    // Store accuracy metrics
    await this.supabase
      .from('ml_model_performance')
      .insert({
        model: 'clv_prediction',
        version: this.modelVersion,
        metric: 'mean_absolute_percentage_error',
        value: avgError,
        sample_size: count,
        evaluated_at: new Date()
      });
  }

  private async logPrediction(data: CustomerData, prediction: CLVPrediction) {
    await this.supabase
      .from('clv_predictions')
      .insert({
        customer_id: data.customerId,
        clv_3_months: prediction.clv3Months,
        clv_6_months: prediction.clv6Months,
        clv_12_months: prediction.clv12Months,
        clv_24_months: prediction.clv24Months,
        clv_total: prediction.clvTotal,
        confidence: prediction.confidence,
        churn_probability: prediction.churnProbability,
        growth_opportunities: prediction.growthOpportunities,
        model_version: this.modelVersion,
        predicted_at: new Date()
      });
  }

  /**
   * Public methods
   */
  async getCustomerValue(customerId: string): Promise<number> {
    const { data } = await this.supabase
      .from('clv_predictions')
      .select('clv_total')
      .eq('customer_id', customerId)
      .order('predicted_at', { ascending: false })
      .limit(1)
      .single();
    
    return data?.clv_total || 0;
  }

  async getHighValueCustomers(minValue: number = 100000): Promise<string[]> {
    const { data } = await this.supabase
      .from('clv_predictions')
      .select('customer_id')
      .gte('clv_total', minValue)
      .order('clv_total', { ascending: false });
    
    return data?.map(d => d.customer_id) || [];
  }

  async getChurnRiskCustomers(threshold: number = 0.5): Promise<any[]> {
    const { data } = await this.supabase
      .from('clv_predictions')
      .select('customer_id, churn_probability')
      .gte('churn_probability->month6', threshold)
      .order('churn_probability->month6', { ascending: false });
    
    return data || [];
  }
}

// Export singleton instance
export const clvPredictionModel = new CLVPredictionModel();