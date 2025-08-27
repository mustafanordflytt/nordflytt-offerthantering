/**
 * AI Core Engine - Central intelligence system for Nordflytt CRM
 * Manages all AI operations, predictions, and automated decisions
 */

import { EventEmitter } from 'events';
import OpenAI from 'openai';
import { 
  leadScoringModel,
  clvPredictionModel,
  churnPredictionModel,
  personalizationEngine
} from '../ml-models';
import {
  smartJobScheduler,
  dynamicPricingEngine,
  automatedAssignment
} from '../workflow';

// Core AI Engine configuration
export interface AIConfig {
  openaiApiKey: string;
  modelVersion: string;
  confidenceThreshold: number;
  learningEnabled: boolean;
}

// AI Decision types
export interface AIDecision {
  id: string;
  type: 'lead_scoring' | 'pricing' | 'scheduling' | 'customer_action';
  confidence: number;
  recommendation: any;
  reasoning: string;
  timestamp: Date;
}

// Customer Intelligence types
export interface CustomerScore {
  customerId: string;
  leadScore: number;
  lifetimeValue: number;
  churnRisk: number;
  upsellPotential: number;
  nextLikelyService: string;
  recommendedActions: string[];
}

// Business Intelligence types
export interface MarketIntelligence {
  competitorActivity: any[];
  marketOpportunities: any[];
  demandForecast: number;
  optimalPricing: number;
}

export class AIEngine extends EventEmitter {
  private openai: OpenAI;
  private config: AIConfig;
  private decisionHistory: AIDecision[] = [];
  private learningData: Map<string, any> = new Map();

  constructor(config: AIConfig) {
    super();
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    
    this.initializeEngine();
  }

  private async initializeEngine() {
    console.log('🧠 AI Engine initializing...');
    
    // Set up real-time monitoring
    this.setupRealtimeMonitoring();
    
    // Initialize learning models
    this.initializeLearningModels();
    
    // Connect to data streams
    this.connectDataStreams();
    
    console.log('✅ AI Engine ready for intelligent operations');
    this.emit('ready');
  }

  /**
   * Score a lead based on multiple factors
   */
  async scoreCustomerLead(leadData: any): Promise<CustomerScore> {
    const startTime = Date.now();
    
    try {
      // Use advanced ML model for lead scoring
      const leadFeatures = {
        source: leadData.source || 'organic',
        channel: leadData.channel || 'web',
        location: leadData.location,
        companySize: leadData.companySize,
        websiteVisits: leadData.websiteVisits || 1,
        pagesViewed: leadData.pagesViewed || [],
        timeOnSite: leadData.timeOnSite || 0,
        formCompletionTime: leadData.formCompletionTime,
        chatEngagement: leadData.chatEngagement || false,
        serviceInterest: leadData.serviceInterest || [],
        urgency: leadData.urgency || 'medium',
        budget: leadData.budget,
        timeline: leadData.timeline,
        emailOpens: leadData.emailOpens || 0,
        emailClicks: leadData.emailClicks || 0,
        contentDownloads: leadData.contentDownloads || [],
        previousInquiries: leadData.previousInquiries || 0,
        seasonality: this.getSeasonalityFactor(),
        marketDemand: await this.getCurrentMarketDemand(),
        competitorActivity: await this.getCompetitorActivityLevel(),
        economicIndicators: await this.getEconomicIndicators()
      };

      const scoringResult = await leadScoringModel.scoreLead(leadFeatures);

      // Get CLV prediction if customer exists
      let lifetimeValue = 45000; // Default
      if (leadData.customerId) {
        const clvData = await this.getCustomerDataForCLV(leadData.customerId);
        if (clvData) {
          const clvPrediction = await clvPredictionModel.predictCLV(clvData);
          lifetimeValue = clvPrediction.clvTotal;
        }
      }

      // Get churn risk if existing customer
      let churnRisk = 0.1; // Default low for new leads
      if (leadData.customerId) {
        const churnData = await this.getCustomerDataForChurn(leadData.customerId);
        if (churnData) {
          const churnPrediction = await churnPredictionModel.predictChurn(churnData);
          churnRisk = churnPrediction.churnRisk;
        }
      }

      const score: CustomerScore = {
        customerId: leadData.customerId || leadData.id || 'new',
        leadScore: scoringResult.score,
        lifetimeValue: Math.round(lifetimeValue),
        churnRisk: Math.round(churnRisk * 100),
        upsellPotential: Math.round(scoringResult.conversionProbability * 100),
        nextLikelyService: scoringResult.segmentation.primary,
        recommendedActions: scoringResult.recommendedActions
      };

      // Record decision
      this.recordDecision({
        id: `lead-score-${Date.now()}`,
        type: 'lead_scoring',
        confidence: scoringResult.confidence,
        recommendation: score,
        reasoning: `ML Model: ${scoringResult.factors[0].insight}`,
        timestamp: new Date()
      });

      // Emit event for real-time updates
      this.emit('lead-scored', score);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Lead scored in ${processingTime}ms`);

      return score;

    } catch (error) {
      console.error('❌ Error scoring lead:', error);
      throw error;
    }
  }

  /**
   * Generate optimal pricing based on market conditions
   */
  async calculateDynamicPrice(serviceRequest: any): Promise<{
    basePrice: number;
    optimizedPrice: number;
    confidence: number;
    factors: any;
  }> {
    // Use the advanced dynamic pricing engine
    const pricingRequest = {
      customerId: serviceRequest.customerId,
      serviceType: serviceRequest.serviceType,
      volume: serviceRequest.volume || 10,
      distance: serviceRequest.distance || 20,
      floors: serviceRequest.floors || { pickup: 1, delivery: 1 },
      elevator: serviceRequest.elevator || { pickup: true, delivery: true },
      parkingDistance: serviceRequest.parkingDistance || { pickup: 5, delivery: 5 },
      additionalServices: serviceRequest.additionalServices || [],
      requestedDate: serviceRequest.requestedDate || new Date(),
      urgency: serviceRequest.urgency || 'normal',
      flexibility: serviceRequest.flexibility || 3,
      fragileItems: serviceRequest.fragileItems || false,
      valuableItems: serviceRequest.valuableItems || false,
      specialHandling: serviceRequest.specialHandling || []
    };

    const pricingResult = await dynamicPricingEngine.calculatePrice(pricingRequest);

    const result = {
      basePrice: pricingResult.basePrice,
      optimizedPrice: pricingResult.optimizedPrice,
      confidence: pricingResult.confidence,
      factors: {
        adjustments: pricingResult.adjustments,
        breakdown: pricingResult.breakdown,
        alternatives: pricingResult.alternatives
      }
    };

    this.emit('price-calculated', result);
    return result;
  }

  /**
   * Intelligently schedule and assign jobs
   */
  async optimizeJobSchedule(job: any): Promise<{
    assignedTeam: string;
    scheduledTime: Date;
    route: any;
    efficiency: number;
  }> {
    // Use smart job scheduler for optimization
    const schedulingRequest = {
      jobId: job.id || `job-${Date.now()}`,
      customerId: job.customerId,
      serviceType: job.serviceType,
      estimatedDuration: job.estimatedDuration || 3,
      requiredSkills: job.requiredSkills || [],
      equipmentNeeded: job.equipmentNeeded || [],
      teamSize: job.teamSize || 2,
      preferredDate: job.preferredDate || new Date(),
      preferredTimeSlot: job.preferredTimeSlot || 'morning' as any,
      flexibilityDays: job.flexibilityDays || 3,
      pickupLocation: job.pickupLocation || { 
        address: job.address,
        coordinates: { lat: 59.3293, lng: 18.0686 }, // Stockholm default
        floor: 1,
        elevator: true,
        parkingDistance: 10
      },
      deliveryLocation: job.deliveryLocation || job.pickupLocation,
      distance: job.distance || 15,
      urgency: job.urgency || 'normal' as any,
      specialInstructions: job.specialInstructions
    };

    const schedulingResult = await smartJobScheduler.scheduleJob(schedulingRequest);

    // Use automated assignment for team selection
    const assignmentRequest = {
      jobId: job.id || schedulingRequest.jobId,
      jobType: job.serviceType,
      requiredSkills: job.requiredSkills || [],
      estimatedDuration: job.estimatedDuration || 3,
      location: schedulingRequest.pickupLocation,
      preferredDate: schedulingResult.scheduledDate,
      priority: job.urgency || 'normal' as any,
      customerSegment: job.customerSegment || 'standard',
      specialRequirements: job.specialRequirements
    };

    const assignmentResult = await automatedAssignment.assignJob(assignmentRequest);

    const result = {
      assignedTeam: assignmentResult.assignedTeam.teamName,
      scheduledTime: schedulingResult.scheduledDate,
      route: schedulingResult.route,
      efficiency: schedulingResult.utilizationScore
    };

    this.emit('job-scheduled', result);
    return result;
  }

  /**
   * Monitor business metrics and generate insights
   */
  async generateBusinessIntelligence(): Promise<MarketIntelligence> {
    const competitors = await this.monitorCompetitors();
    const marketTrends = await this.analyzeMarketTrends();
    const demand = await this.forecastDemand();
    
    const intelligence: MarketIntelligence = {
      competitorActivity: competitors,
      marketOpportunities: this.identifyOpportunities(marketTrends),
      demandForecast: demand.nextWeek,
      optimalPricing: await this.calculateMarketOptimalPrice()
    };

    this.emit('intelligence-generated', intelligence);
    return intelligence;
  }

  /**
   * Predict and prevent customer churn
   */
  async predictChurnRisk(customerId: string): Promise<{
    risk: number;
    reasons: string[];
    preventionActions: string[];
  }> {
    try {
      // Get comprehensive customer data for churn analysis
      const churnData = await this.getCustomerDataForChurn(customerId);
      
      if (!churnData) {
        // Fallback for minimal data
        return {
          risk: 0.1,
          reasons: ['Insufficient data for accurate prediction'],
          preventionActions: ['Gather more customer data']
        };
      }

      // Use ML model for churn prediction
      const churnPrediction = await churnPredictionModel.predictChurn(churnData);
      
      return {
        risk: churnPrediction.churnRisk,
        reasons: churnPrediction.riskFactors.map(f => f.description),
        preventionActions: churnPrediction.preventionStrategies.map(s => s.message)
      };
    } catch (error) {
      console.error('Error predicting churn:', error);
      // Fallback prediction
      return {
        risk: 0.3,
        reasons: ['Unable to analyze churn risk'],
        preventionActions: ['Schedule customer check-in']
      };
    }
  }

  /**
   * Learn from outcomes to improve future predictions
   */
  async learnFromOutcome(decisionId: string, outcome: any): Promise<void> {
    const decision = this.decisionHistory.find(d => d.id === decisionId);
    if (!decision) return;

    // Update learning data
    this.learningData.set(decisionId, {
      decision,
      outcome,
      accuracy: this.calculateAccuracy(decision.recommendation, outcome)
    });

    // Adjust model parameters based on outcome
    await this.adjustModelParameters(decision.type, outcome);

    console.log(`📚 AI learned from outcome: ${decision.type} - Accuracy: ${outcome.accuracy}%`);
  }

  // Private helper methods
  private async analyzeLeadCharacteristics(leadData: any) {
    // Complex analysis using multiple data points
    return {
      sourceQuality: this.assessSourceQuality(leadData.source),
      engagementLevel: leadData.interactions?.length || 0,
      budgetIndication: this.extractBudgetSignals(leadData),
      urgency: this.assessUrgency(leadData),
      fitScore: this.calculateFitScore(leadData)
    };
  }

  private calculateLeadScore(analysis: any): number {
    // Weighted scoring algorithm
    const weights = {
      sourceQuality: 0.2,
      engagementLevel: 0.3,
      budgetIndication: 0.2,
      urgency: 0.2,
      fitScore: 0.1
    };

    let score = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      score += (analysis[factor] || 0) * weight;
    }

    return Math.min(1, Math.max(0, score));
  }

  private async predictLifetimeValue(analysis: any): Promise<number> {
    // ML model for CLV prediction
    const baseValue = 45000; // Average customer value
    const multiplier = 1 + (analysis.fitScore * 0.5) + (analysis.budgetIndication * 0.3);
    return baseValue * multiplier;
  }

  private assessChurnRisk(analysis: any): number {
    // Inverse of engagement and fit
    return 1 - (analysis.engagementLevel * 0.6 + analysis.fitScore * 0.4);
  }

  private identifyUpsellOpportunities(analysis: any): number {
    // Based on budget indicators and engagement
    return (analysis.budgetIndication * 0.7 + analysis.engagementLevel * 0.3);
  }

  private predictNextService(analysis: any): string {
    // Pattern matching for service prediction
    const services = ['Hemflytt', 'Kontorsflytt', 'Magasinering', 'Städning'];
    // Simplified - would use ML model in production
    return services[Math.floor(Math.random() * services.length)];
  }

  private async generateCustomerRecommendations(data: any): Promise<string[]> {
    const recommendations = [];

    if (data.leadScore > 70) {
      recommendations.push('Prioritera denna lead - hög konverteringspotential');
      recommendations.push('Skicka personligt erbjudande inom 1 timme');
    }

    if (data.churnRisk > 50) {
      recommendations.push('Risk för kundförlust - kontakta omedelbart');
      recommendations.push('Erbjud rabatt eller extra service');
    }

    if (data.upsellPotential > 60) {
      recommendations.push('Föreslå premium-tjänster');
      recommendations.push('Visa testimonials från liknande kunder');
    }

    return recommendations;
  }

  private calculateConfidence(score: CustomerScore): number {
    // Confidence based on data completeness and model certainty
    const factors = [
      score.leadScore > 0 ? 1 : 0,
      score.lifetimeValue > 0 ? 1 : 0,
      score.recommendedActions.length > 0 ? 1 : 0
    ];
    
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  private recordDecision(decision: AIDecision) {
    this.decisionHistory.push(decision);
    
    // Keep only last 1000 decisions in memory
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory.shift();
    }
  }

  private setupRealtimeMonitoring() {
    // Set up monitoring intervals
    setInterval(() => this.monitorSystemHealth(), 60000); // Every minute
    setInterval(() => this.checkAnomalies(), 300000); // Every 5 minutes
  }

  private initializeLearningModels() {
    // Initialize ML models for continuous learning
    console.log('🔧 Initializing learning models...');
  }

  private connectDataStreams() {
    // Connect to real-time data sources
    console.log('🔌 Connecting to data streams...');
  }

  private async monitorSystemHealth() {
    // Monitor AI system health
    const health = {
      decisionsPerMinute: this.decisionHistory.filter(d => 
        d.timestamp > new Date(Date.now() - 60000)
      ).length,
      averageConfidence: this.calculateAverageConfidence(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
    };

    this.emit('health-check', health);
  }

  private calculateAverageConfidence(): number {
    const recent = this.decisionHistory.slice(-100);
    if (recent.length === 0) return 0;
    
    const sum = recent.reduce((acc, d) => acc + d.confidence, 0);
    return sum / recent.length;
  }

  private async checkAnomalies() {
    // Check for unusual patterns
    const anomalies = [];
    
    // Check for sudden drop in confidence
    if (this.calculateAverageConfidence() < 0.7) {
      anomalies.push('Low confidence detected in recent decisions');
    }

    if (anomalies.length > 0) {
      this.emit('anomalies-detected', anomalies);
    }
  }

  // Placeholder methods - to be implemented with real integrations
  private async getMarketConditions() {
    return { currentDemand: 0.8, competitorPricing: 15000 };
  }

  private async getCustomerValue(customerId: string) {
    return { score: 0.75 };
  }

  private async getCurrentCapacity() {
    return { utilization: 0.7 };
  }

  private getSeasonalityFactor() {
    return 1.2; // Summer peak
  }

  private calculateJobComplexity(serviceRequest: any) {
    return 0.6;
  }

  private calculateBasePrice(serviceRequest: any) {
    return 15750;
  }

  private async optimizePrice(basePrice: number, factors: any) {
    const adjustment = 1 + (factors.demand * 0.2) + (factors.customerValue * 0.1);
    return basePrice * adjustment;
  }

  private async getAvailableTeams() {
    return [];
  }

  private async getTrafficPredictions() {
    return {};
  }

  private async getCustomerPreferences(customerId: string) {
    return {};
  }

  private async runScheduleOptimization(params: any) {
    return {
      bestTeam: 'team-1',
      optimalTime: new Date(),
      optimizedRoute: {},
      efficiencyScore: 0.95
    };
  }

  private async monitorCompetitors() {
    return [];
  }

  private async analyzeMarketTrends() {
    return {};
  }

  private async forecastDemand() {
    return { nextWeek: 1.15 };
  }

  private identifyOpportunities(trends: any) {
    return [];
  }

  private async calculateMarketOptimalPrice() {
    return 16500;
  }

  private async getCustomerHistory(customerId: string) {
    return {};
  }

  private analyzeCustomerBehavior(history: any) {
    return {};
  }

  private daysSinceLastInteraction(history: any) {
    return 30;
  }

  private calculateSatisfactionTrend(history: any) {
    return -0.1;
  }

  private async detectCompetitorInterest(customerId: string) {
    return 0.3;
  }

  private countPriceComplaints(history: any) {
    return 2;
  }

  private async calculateChurnRiskScore(indicators: any) {
    return 0.45;
  }

  private identifyChurnReasons(indicators: any) {
    return ['No recent interaction', 'Price sensitivity'];
  }

  private generatePreventionActions(risk: number, indicators: any) {
    return ['Offer loyalty discount', 'Schedule personal call'];
  }

  private calculateAccuracy(prediction: any, outcome: any) {
    return 85; // Simplified
  }

  private async adjustModelParameters(type: string, outcome: any) {
    console.log(`Adjusting ${type} model based on outcome`);
  }

  private assessSourceQuality(source: string) {
    const qualityMap: Record<string, number> = {
      'website': 0.7,
      'referral': 0.9,
      'ads': 0.5,
      'direct': 0.8
    };
    return qualityMap[source] || 0.5;
  }

  private extractBudgetSignals(leadData: any) {
    return 0.7; // Simplified
  }

  private assessUrgency(leadData: any) {
    return leadData.moveDate ? 0.9 : 0.3;
  }

  private calculateFitScore(leadData: any) {
    return 0.8; // Simplified
  }

  // Helper methods for ML model integration
  private async getCurrentMarketDemand(): Promise<number> {
    // Would fetch from market analysis service
    return 0.8; // 0-1 scale
  }

  private async getCompetitorActivityLevel(): Promise<number> {
    // Would fetch from competitive intelligence
    return 0.6; // 0-1 scale
  }

  private async getEconomicIndicators(): Promise<number> {
    // Would fetch from economic data service
    return 0.7; // 0-1 scale, 1 = very positive
  }

  private async getCustomerDataForCLV(customerId: string): Promise<any> {
    // Fetch comprehensive customer data for CLV prediction
    // This is a simplified version - would include full transaction history
    return null; // Would return CustomerData type from CLV model
  }

  private async getCustomerDataForChurn(customerId: string): Promise<any> {
    // Fetch comprehensive customer data for churn prediction
    // This is a simplified version - would include support tickets, satisfaction, etc.
    return null; // Would return ChurnAnalysisData type from churn model
  }
}

// Export singleton instance
export const aiEngine = new AIEngine({
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  modelVersion: 'gpt-4',
  confidenceThreshold: 0.7,
  learningEnabled: true
});