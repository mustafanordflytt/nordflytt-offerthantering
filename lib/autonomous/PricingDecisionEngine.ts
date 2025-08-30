// =============================================================================
// PHASE 5: PRICING DECISION ENGINE - Autonomous Dynamic Pricing
// Integrates with Phase 4 Enhanced BI and existing pricing logic
// =============================================================================

import { BaseDecisionEngine, DecisionContext } from './BaseDecisionEngine';
// import * as tf from '@tensorflow/tfjs'; // Temporarily disabled for deployment
// Mock tf for deployment
const tf = {
  loadLayersModel: async () => ({ predict: () => ({ array: async () => [[1800]] }) }),
  tensor2d: () => ({ dispose: () => {} }),
  dispose: () => {}
};

export interface PricingContext extends DecisionContext {
  data: {
    jobType: string;
    basePrice: number;
    date: string;
    customerHistory?: {
      totalJobs: number;
      averageRating: number;
      totalRevenue: number;
      lastJobDate?: string;
    };
    marketConditions?: 'stable' | 'volatile' | 'growing';
    jobDetails?: {
      volume?: number;
      distance?: number;
      complexity?: 'low' | 'medium' | 'high';
      urgency?: 'standard' | 'urgent' | 'emergency';
    };
  };
}

export interface PricingAnalysis {
  demandLevel: number;
  competitionPricing: number;
  weatherImpact: number;
  capacityUtilization: number;
  customerValue: number;
  basePrice: number;
  marketConditions: string;
  seasonalityFactor: number;
  urgencyFactor: number;
  volumeDiscount: number;
  riskFactors: string[];
}

export interface PricingDecision {
  type: 'pricing_decision';
  originalPrice: number;
  optimizedPrice: number;
  priceMultiplier: number;
  expectedConversion: number;
  expectedRevenue: number;
  reasoning: {
    direction: 'increase' | 'decrease' | 'maintain';
    factors: string[];
    summary: string;
  };
  validUntil: Date;
  factors: PricingAnalysis;
  integrationData?: {
    phase4CompatiblePrice: number;
    existingPricingData?: any;
  };
}

/**
 * Autonomous Pricing Decision Engine
 * Integrates with existing Phase 4 pricing logic and Enhanced BI data
 */
export class PricingDecisionEngine extends BaseDecisionEngine {
  private pricingModel: any | null = null;
  private marketData = new Map<string, any>();
  private phase4Integration: any;

  constructor(config: any = {}) {
    super({
      confidenceThreshold: config.confidenceThreshold || 0.90,
      humanReviewThreshold: config.humanReviewThreshold || 0.75,
      autonomyLevel: config.autonomyLevel || 0.85,
      ...config
    });
    
    this.initializePricingModel();
    this.initializePhase4Integration();
    this.loadMarketData();
  }

  /**
   * Initialize or load the AI pricing model
   */
  private async initializePricingModel(): Promise<void> {
    try {
      // Try to load existing model from Phase 4
      this.pricingModel = await tf.loadLayersModel('/models/phase4_pricing_model.json');
      this.logger.info('Loaded existing Phase 4 pricing model');
    } catch (error) {
      this.logger.info('Creating new enhanced pricing model for Phase 5');
      this.pricingModel = this.createEnhancedPricingModel();
    }
  }

  /**
   * Create enhanced neural network model for pricing
   */
  private createEnhancedPricingModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ 
          inputShape: [15], // Enhanced feature set from Phase 4 + Phase 5
          units: 128, 
          activation: 'relu',
          name: 'input_layer'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ 
          units: 64, 
          activation: 'relu',
          name: 'hidden_layer_1' 
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ 
          units: 32, 
          activation: 'relu',
          name: 'hidden_layer_2' 
        }),
        tf.layers.dense({ 
          units: 16, 
          activation: 'relu',
          name: 'hidden_layer_3' 
        }),
        tf.layers.dense({ 
          units: 1, 
          activation: 'sigmoid',
          name: 'output_layer'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    this.logger.info('Enhanced pricing model created with Phase 5 architecture');
    return model;
  }

  /**
   * Initialize integration with existing Phase 4 systems
   */
  private initializePhase4Integration(): void {
    this.phase4Integration = {
      // Integration points with existing Phase 4 Enhanced BI
      getBIData: async () => {
        try {
          const response = await fetch('/api/enhanced-business-intelligence-simple?range=7d');
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          this.logger.warn('Could not fetch Phase 4 BI data', { error });
        }
        return null;
      },
      
      // Integration with existing pricing data
      getExistingPricing: async (jobType: string) => {
        try {
          // Fetch existing pricing data from Phase 4 system
          if (this.redis) {
            const existingPrice = await this.redis.get(`pricing:${jobType}`);
            return existingPrice ? JSON.parse(existingPrice) : null;
          }
        } catch (error) {
          this.logger.warn('Could not fetch existing pricing data', { error });
        }
        return null;
      }
    };
  }

  /**
   * Load market data for pricing analysis
   */
  private async loadMarketData(): Promise<void> {
    try {
      // Load market data from Phase 4 BI system
      const biData = await this.phase4Integration.getBIData();
      if (biData) {
        this.marketData.set('current_bi_data', biData);
        this.logger.info('Market data loaded from Phase 4 BI system');
      }
      
      // Load additional market intelligence
      this.marketData.set('competition_baseline', {
        averagePrice: 2500,
        priceRange: { min: 2000, max: 3500 },
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      this.logger.error('Failed to load market data', { error });
    }
  }

  /**
   * Analyze pricing context using Phase 4 BI data and Phase 5 enhancements
   */
  protected async analyzeContext(context: DecisionContext): Promise<PricingAnalysis> {
    const pricingContext = context as PricingContext;
    const { jobType, basePrice, date, customerHistory, marketConditions, jobDetails } = pricingContext.data;

    this.logger.info('Analyzing pricing context', { 
      jobType, 
      basePrice, 
      date,
      hasCustomerHistory: !!customerHistory 
    });

    // Gather comprehensive market intelligence
    const [
      demandLevel,
      competitionPricing,
      weatherImpact,
      capacityUtilization,
      customerValue
    ] = await Promise.all([
      this.analyzeDemand(date, jobType),
      this.getCompetitionPricing(jobType),
      this.getWeatherImpact(date),
      this.getCapacityUtilization(date),
      this.analyzeCustomerValue(customerHistory)
    ]);

    const analysis: PricingAnalysis = {
      demandLevel,
      competitionPricing,
      weatherImpact,
      capacityUtilization,
      customerValue,
      basePrice,
      marketConditions: marketConditions || 'stable',
      seasonalityFactor: this.calculateSeasonality(date),
      urgencyFactor: this.calculateUrgency(date, jobDetails?.urgency),
      volumeDiscount: this.calculateVolumeDiscount(customerHistory),
      riskFactors: this.identifyRiskFactors(pricingContext)
    };

    this.logger.info('Pricing analysis completed', {
      demandLevel: analysis.demandLevel.toFixed(2),
      customerValue: analysis.customerValue.toFixed(2),
      seasonality: analysis.seasonalityFactor.toFixed(2)
    });

    return analysis;
  }

  /**
   * Generate autonomous pricing decision using AI model
   */
  protected async generateDecision(analysis: PricingAnalysis, options: any = {}): Promise<PricingDecision> {
    if (!this.pricingModel) {
      throw new Error('Pricing model not initialized');
    }

    // Create enhanced feature vector for ML model
    const features = tf.tensor2d([[
      analysis.demandLevel,
      analysis.competitionPricing / analysis.basePrice,
      analysis.weatherImpact,
      analysis.capacityUtilization,
      analysis.customerValue,
      analysis.seasonalityFactor,
      analysis.urgencyFactor,
      analysis.volumeDiscount,
      Math.sin(new Date().getMonth() * Math.PI / 6), // Seasonal sine
      Math.cos(new Date().getMonth() * Math.PI / 6), // Seasonal cosine
      new Date().getDay() / 7, // Day of week factor
      new Date().getHours() / 24, // Time of day factor
      analysis.riskFactors.length / 10, // Risk factor density
      this.getMarketVolatility(), // Market volatility index
      this.getCompetitivePosition(analysis.basePrice, analysis.competitionPricing) // Competitive position
    ]]);

    try {
      // Get price multiplier from AI model
      const prediction = await this.pricingModel.predict(features) as any;
      const priceMultiplierArray = await prediction.data();
      const rawMultiplier = priceMultiplierArray[0];
      
      // Convert to realistic price range (0.7-1.5x base price)
      const adjustedMultiplier = 0.7 + (rawMultiplier * 0.8);
      const optimizedPrice = Math.round(analysis.basePrice * adjustedMultiplier);
      
      // Calculate expected business impact
      const conversionRate = this.calculateConversionRate(
        optimizedPrice, 
        analysis.basePrice, 
        analysis.competitionPricing
      );
      const expectedRevenue = optimizedPrice * conversionRate;

      // Get existing Phase 4 pricing for compatibility
      const existingPricing = await this.phase4Integration.getExistingPricing(analysis.basePrice.toString());

      const decision: PricingDecision = {
        type: 'pricing_decision',
        originalPrice: analysis.basePrice,
        optimizedPrice,
        priceMultiplier: adjustedMultiplier,
        expectedConversion: conversionRate,
        expectedRevenue,
        reasoning: this.generatePricingReasoning(analysis, adjustedMultiplier),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        factors: analysis,
        integrationData: {
          phase4CompatiblePrice: this.ensurePhase4Compatibility(optimizedPrice),
          existingPricingData: existingPricing
        }
      };

      // Clean up tensors
      features.dispose();
      prediction.dispose();

      this.logger.info('Pricing decision generated', {
        originalPrice: decision.originalPrice,
        optimizedPrice: decision.optimizedPrice,
        multiplier: decision.priceMultiplier.toFixed(3),
        expectedConversion: decision.expectedConversion.toFixed(3)
      });

      return decision;

    } catch (error) {
      features.dispose();
      this.logger.error('Failed to generate pricing decision', { error });
      throw error;
    }
  }

  /**
   * Calculate confidence score for the pricing decision
   */
  protected async calculateConfidence(decision: PricingDecision, context: DecisionContext): Promise<number> {
    let confidence = 0.85; // Base confidence for pricing decisions

    // Confidence factors
    const priceDeviation = Math.abs(decision.priceMultiplier - 1.0);
    confidence -= priceDeviation * 0.25; // Reduce confidence for extreme price changes

    // Higher confidence with more market data
    if (this.marketData.size > 5) {
      confidence += 0.05;
    }

    // Confidence based on conversion rate prediction
    if (decision.expectedConversion > 0.8) {
      confidence += 0.1;
    } else if (decision.expectedConversion < 0.5) {
      confidence -= 0.15;
    }

    // Adjust for market conditions
    const pricingContext = context as PricingContext;
    if (pricingContext.data.marketConditions === 'volatile') {
      confidence -= 0.15;
    } else if (pricingContext.data.marketConditions === 'stable') {
      confidence += 0.05;
    }

    // Risk factors impact
    confidence -= decision.factors.riskFactors.length * 0.05;

    // Customer history impact
    if (pricingContext.data.customerHistory?.totalJobs > 3) {
      confidence += 0.05; // More confident with known customers
    }

    // Ensure confidence is within bounds
    const finalConfidence = Math.max(0.1, Math.min(1.0, confidence));

    this.logger.info('Pricing confidence calculated', {
      baseConfidence: 0.85,
      finalConfidence: finalConfidence.toFixed(3),
      factors: {
        priceDeviation: priceDeviation.toFixed(3),
        conversionRate: decision.expectedConversion.toFixed(3),
        riskFactors: decision.factors.riskFactors.length
      }
    });

    return finalConfidence;
  }

  /**
   * Execute the autonomous pricing decision
   */
  protected async executeDecision(decision: PricingDecision, context: DecisionContext): Promise<any> {
    const pricingContext = context as PricingContext;
    
    try {
      // Update pricing in system (integrate with Phase 4 pricing system)
      await this.updateSystemPricing(
        pricingContext.data.jobType, 
        decision.optimizedPrice,
        decision.integrationData?.phase4CompatiblePrice
      );
      
      // Store decision for learning and Phase 4 integration
      await this.storePricingDecision(decision, context);
      
      // Update business impact metrics
      this.updateBusinessImpact({
        revenueGenerated: decision.expectedRevenue - (decision.originalPrice * decision.expectedConversion),
        efficiencyGains: 1 // One automated pricing decision
      });

      const result = {
        success: true,
        action: 'price_updated',
        newPrice: decision.optimizedPrice,
        phase4Price: decision.integrationData?.phase4CompatiblePrice,
        expectedImpact: `${((decision.priceMultiplier - 1) * 100).toFixed(1)}% price adjustment`,
        estimatedRevenueImpact: decision.expectedRevenue - decision.originalPrice,
        confidence: await this.calculateConfidence(decision, context)
      };

      this.logger.info('Autonomous pricing decision executed successfully', {
        jobType: pricingContext.data.jobType,
        originalPrice: decision.originalPrice,
        newPrice: decision.optimizedPrice,
        impact: result.expectedImpact
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to execute pricing decision', {
        error: error.message,
        decision: {
          originalPrice: decision.originalPrice,
          optimizedPrice: decision.optimizedPrice
        }
      });
      throw error;
    }
  }

  /**
   * Generate human-readable reasoning for pricing decision
   */
  private generatePricingReasoning(analysis: PricingAnalysis, multiplier: number): PricingDecision['reasoning'] {
    const reasons: string[] = [];
    
    if (analysis.demandLevel > 0.8) {
      reasons.push('Hög efterfrågan upptäckt (+15% premium motiverat)');
    }
    if (analysis.weatherImpact > 0.5) {
      reasons.push('Väderförhållanden ökar operativ komplexitet');
    }
    if (analysis.capacityUtilization > 0.9) {
      reasons.push('Nära kapacitetstaket - premiumprissättning tillämpad');
    }
    if (analysis.customerValue > 0.8) {
      reasons.push('Högt kundvärde - optimerat för retention');
    }
    if (analysis.urgencyFactor > 0.8) {
      reasons.push('Högt brådskande - tillägg för snabb leverans');
    }
    if (analysis.riskFactors.length > 2) {
      reasons.push('Flera riskfaktorer identifierade');
    }
    
    const direction = multiplier > 1.05 ? 'increase' : 
                     multiplier < 0.95 ? 'decrease' : 'maintain';
    
    return {
      direction,
      factors: reasons,
      summary: `AI rekommenderar ${direction === 'increase' ? 'ökning' : 
                                   direction === 'decrease' ? 'minskning' : 'bibehållen prissättning'} baserat på marknadsanalys`
    };
  }

  // Helper methods for pricing analysis

  private async analyzeDemand(date: string, jobType: string): Promise<number> {
    const dayOfWeek = new Date(date).getDay();
    const month = new Date(date).getMonth();
    
    let demand = 0.5; // Base demand
    
    // Weekend premium
    if (dayOfWeek === 0 || dayOfWeek === 6) demand += 0.15;
    
    // Summer season boost
    if (month >= 4 && month <= 8) demand += 0.25;
    
    // Check Phase 4 BI data for demand trends
    const biData = this.marketData.get('current_bi_data');
    if (biData?.demandForecast) {
      const todayForecast = biData.demandForecast.find((f: any) => 
        f.date === date.split('T')[0]
      );
      if (todayForecast) {
        demand = Math.max(demand, todayForecast.predicted_bookings / 20); // Normalize
      }
    }
    
    return Math.min(1.0, demand);
  }

  private async getCompetitionPricing(jobType: string): Promise<number> {
    const competition = this.marketData.get('competition_baseline');
    if (competition) {
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
      return competition.averagePrice * (1 + variation);
    }
    
    // Fallback to estimated competition pricing
    const basePrices: { [key: string]: number } = {
      'moving': 2500,
      'packing': 1500,
      'storage': 800,
      'cleaning': 1200
    };
    
    return basePrices[jobType] || 2500;
  }

  private async getWeatherImpact(date: string): Promise<number> {
    // Simplified weather impact (in production, integrate with weather API)
    const month = new Date(date).getMonth();
    const winterMonths = [11, 0, 1, 2]; // Dec, Jan, Feb, Mar
    
    if (winterMonths.includes(month)) {
      return Math.random() * 0.4 + 0.3; // 0.3-0.7 impact in winter
    }
    
    return Math.random() * 0.3; // 0-0.3 impact in other seasons
  }

  private async getCapacityUtilization(date: string): Promise<number> {
    // Get capacity data from Phase 4 BI system
    const biData = this.marketData.get('current_bi_data');
    if (biData?.realtimeMetrics?.fleet_utilization) {
      return biData.realtimeMetrics.fleet_utilization / 100;
    }
    
    // Fallback simulation
    return Math.random() * 0.3 + 0.7; // 70-100% utilization
  }

  private async analyzeCustomerValue(customerHistory?: any): Promise<number> {
    if (!customerHistory) return 0.5;
    
    const { totalJobs, averageRating, totalRevenue } = customerHistory;
    let value = 0.5;
    
    if (totalJobs > 5) value += 0.25;
    else if (totalJobs > 2) value += 0.15;
    
    if (averageRating > 4.7) value += 0.2;
    else if (averageRating > 4.3) value += 0.1;
    
    if (totalRevenue > 20000) value += 0.15;
    else if (totalRevenue > 10000) value += 0.1;
    
    return Math.min(1.0, value);
  }

  private calculateSeasonality(date: string): number {
    const month = new Date(date).getMonth();
    // Peak: May-Aug, Low: Nov-Feb
    const factors = [0.4, 0.3, 0.5, 0.7, 0.9, 1.0, 1.0, 0.9, 0.8, 0.6, 0.4, 0.4];
    return factors[month];
  }

  private calculateUrgency(date: string, urgencyLevel?: string): number {
    if (urgencyLevel === 'emergency') return 1.0;
    if (urgencyLevel === 'urgent') return 0.8;
    
    const requestDate = new Date();
    const jobDate = new Date(date);
    const daysDiff = (jobDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 1) return 0.9; // Same day
    if (daysDiff < 3) return 0.7; // Within 3 days
    if (daysDiff < 7) return 0.5; // Within a week
    return 0.3; // More than a week
  }

  private calculateVolumeDiscount(customerHistory?: any): number {
    if (!customerHistory) return 1.0;
    
    const { totalJobs } = customerHistory;
    if (totalJobs > 15) return 0.85; // 15% discount for very frequent customers
    if (totalJobs > 10) return 0.90; // 10% discount
    if (totalJobs > 5) return 0.95;  // 5% discount
    return 1.0; // No discount
  }

  private identifyRiskFactors(context: PricingContext): string[] {
    const risks: string[] = [];
    
    if (context.data.marketConditions === 'volatile') {
      risks.push('market_volatility');
    }
    
    if (context.data.jobDetails?.complexity === 'high') {
      risks.push('high_complexity');
    }
    
    if (context.data.jobDetails?.urgency === 'emergency') {
      risks.push('emergency_timeline');
    }
    
    if (!context.data.customerHistory) {
      risks.push('unknown_customer');
    }
    
    return risks;
  }

  private calculateConversionRate(optimizedPrice: number, basePrice: number, competitionPrice: number): number {
    const priceRatio = optimizedPrice / competitionPrice;
    
    if (priceRatio <= 0.85) return 0.95;  // Significantly below competition
    if (priceRatio <= 0.95) return 0.90;  // Below competition
    if (priceRatio <= 1.05) return 0.85;  // At competition level
    if (priceRatio <= 1.15) return 0.75;  // Slightly above competition
    return 0.60; // Significantly above competition
  }

  private getMarketVolatility(): number {
    // Calculate market volatility based on recent pricing decisions
    const recentDecisions = this.getRecentDecisions(10);
    if (recentDecisions.length < 5) return 0.5;
    
    const priceChanges = recentDecisions
      .map(d => d.decision.priceMultiplier)
      .filter(m => m !== undefined);
    
    if (priceChanges.length === 0) return 0.5;
    
    const mean = priceChanges.reduce((sum, m) => sum + m, 0) / priceChanges.length;
    const variance = priceChanges.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / priceChanges.length;
    
    return Math.min(1.0, Math.sqrt(variance) * 2); // Normalize volatility
  }

  private getCompetitivePosition(ourPrice: number, competitionPrice: number): number {
    return ourPrice / competitionPrice; // <1 = below competition, >1 = above
  }

  private ensurePhase4Compatibility(price: number): number {
    // Ensure price is compatible with Phase 4 pricing constraints
    const roundedPrice = Math.round(price / 100) * 100; // Round to nearest 100
    return Math.max(1000, Math.min(10000, roundedPrice)); // Min 1000, Max 10000
  }

  private async updateSystemPricing(jobType: string, newPrice: number, phase4Price?: number): Promise<void> {
    try {
      // Update in Redis for immediate access
      if (this.redis) {
        await this.redis.setEx(
          `pricing:${jobType}`,
          3600, // 1 hour
          JSON.stringify({
            price: newPrice,
            phase4Price: phase4Price,
            timestamp: new Date().toISOString(),
            source: 'autonomous_pricing'
          })
        );
      }
      
      // Integration point for Phase 4 pricing system
      // This would call the existing Phase 4 pricing API
      this.logger.info('System pricing updated', {
        jobType,
        newPrice,
        phase4Price
      });
      
    } catch (error) {
      this.logger.error('Failed to update system pricing', { error, jobType, newPrice });
      throw error;
    }
  }

  private async storePricingDecision(decision: PricingDecision, context: DecisionContext): Promise<void> {
    try {
      if (this.redis) {
        // Store for machine learning improvement
        const trainingData = {
          features: decision.factors,
          price: decision.optimizedPrice,
          multiplier: decision.priceMultiplier,
          context: context,
          outcome: null, // Will be updated with actual conversion
          timestamp: new Date().toISOString()
        };
        
        await this.redis.lPush(
          'pricing_training_data',
          JSON.stringify(trainingData)
        );
        
        // Keep only last 5000 training records
        await this.redis.lTrim('pricing_training_data', 0, 4999);
      }
      
    } catch (error) {
      this.logger.error('Failed to store pricing decision for training', { error });
    }
  }
}

export default PricingDecisionEngine;