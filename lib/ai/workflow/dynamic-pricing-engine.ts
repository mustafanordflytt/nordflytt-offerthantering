/**
 * Dynamic Pricing Engine
 * AI-powered real-time pricing optimization
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';
import { aiEngine } from '../core/ai-engine';

export interface PricingRequest {
  customerId: string;
  serviceType: string;
  
  // Service details
  volume: number; // cubic meters
  distance: number; // kilometers
  floors: {
    pickup: number;
    delivery: number;
  };
  elevator: {
    pickup: boolean;
    delivery: boolean;
  };
  parkingDistance: {
    pickup: number;
    delivery: number;
  };
  
  // Additional services
  additionalServices: AdditionalService[];
  
  // Timing
  requestedDate: Date;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  flexibility: number; // days
  
  // Special requirements
  fragileItems: boolean;
  valuableItems: boolean;
  specialHandling: string[];
}

export interface AdditionalService {
  type: string;
  quantity: number;
  details?: any;
}

export interface PricingResult {
  // Base calculations
  basePrice: number;
  optimizedPrice: number;
  
  // Price breakdown
  breakdown: PriceBreakdown;
  
  // Dynamic adjustments
  adjustments: PriceAdjustment[];
  
  // Discounts and offers
  discounts: Discount[];
  
  // Final pricing
  subtotal: number;
  vatAmount: number;
  totalPrice: number;
  
  // Confidence and alternatives
  confidence: number;
  priceRange: {
    min: number;
    max: number;
  };
  alternatives: PricingAlternative[];
  
  // Explanations
  reasoning: string[];
  marketPosition: string;
  
  // Validity
  validUntil: Date;
  quoteId: string;
}

export interface PriceBreakdown {
  labor: number;
  transport: number;
  materials: number;
  equipment: number;
  insurance: number;
  additionalServices: Record<string, number>;
}

export interface PriceAdjustment {
  type: string;
  reason: string;
  amount: number;
  percentage?: number;
}

export interface Discount {
  type: string;
  description: string;
  amount: number;
  conditions?: string[];
}

export interface PricingAlternative {
  description: string;
  price: number;
  savings: number;
  changes: string[];
}

export class DynamicPricingEngine extends EventEmitter {
  private supabase = createClient();
  private engineVersion = '3.0';
  
  // Base pricing rules
  private readonly basePricing = {
    volumeRate: 240, // kr per cubic meter after RUT
    distanceRate: 15, // kr per km
    hourlyRate: 500, // kr per hour
    
    floors: {
      noElevator: 500, // per floor above 2nd
      brokenElevator: 300 // per floor
    },
    
    parking: {
      rate: 99, // kr per meter over 5m
      threshold: 5 // free up to 5 meters
    },
    
    materials: {
      boxes: 79,
      tape: 99,
      bubbleWrap: 149,
      plasticBags: 20
    },
    
    urgency: {
      critical: 2.0, // 100% surcharge
      high: 1.5,     // 50% surcharge
      normal: 1.0,   // no surcharge
      low: 0.9       // 10% discount
    }
  };
  
  // Market dynamics
  private marketConditions = {
    demandLevel: 0.8, // 0-1 scale
    competitorAverage: 15000,
    seasonalFactor: 1.2, // summer peak
    capacityUtilization: 0.75
  };
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('💰 Initializing Dynamic Pricing Engine v3.0...');
    
    // Load pricing models
    await this.loadPricingModels();
    
    // Start market monitoring
    this.startMarketMonitoring();
    
    // Initialize competitor tracking
    this.initializeCompetitorTracking();
    
    console.log('✅ Pricing Engine ready');
    this.emit('ready');
  }

  /**
   * Calculate dynamic price for service request
   */
  async calculatePrice(request: PricingRequest): Promise<PricingResult> {
    const startTime = Date.now();
    
    try {
      // Get customer intelligence
      const customerData = await this.getCustomerIntelligence(request.customerId);
      
      // Calculate base price
      const basePrice = this.calculateBasePrice(request);
      
      // Get market conditions
      const marketData = await this.getMarketConditions(request);
      
      // Calculate dynamic adjustments
      const adjustments = await this.calculateDynamicAdjustments(
        request,
        basePrice,
        customerData,
        marketData
      );
      
      // Apply ML optimization
      const optimizedPrice = await this.optimizePrice(
        basePrice,
        adjustments,
        customerData,
        marketData
      );
      
      // Calculate discounts
      const discounts = await this.calculateDiscounts(
        request,
        optimizedPrice,
        customerData
      );
      
      // Generate alternatives
      const alternatives = this.generatePricingAlternatives(
        request,
        optimizedPrice
      );
      
      // Build price breakdown
      const breakdown = this.buildPriceBreakdown(request, adjustments);
      
      // Calculate final pricing
      const subtotal = optimizedPrice.finalPrice - discounts.reduce((sum, d) => sum + d.amount, 0);
      const vatAmount = subtotal * 0.25;
      const totalPrice = subtotal + vatAmount;
      
      // Generate reasoning
      const reasoning = this.generatePricingReasoning(
        request,
        adjustments,
        customerData,
        marketData
      );
      
      const result: PricingResult = {
        basePrice: basePrice.total,
        optimizedPrice: optimizedPrice.finalPrice,
        breakdown,
        adjustments: adjustments.list,
        discounts,
        subtotal,
        vatAmount,
        totalPrice,
        confidence: optimizedPrice.confidence,
        priceRange: {
          min: totalPrice * 0.9,
          max: totalPrice * 1.1
        },
        alternatives,
        reasoning,
        marketPosition: this.assessMarketPosition(totalPrice, marketData),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        quoteId: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Log pricing decision
      await this.logPricingDecision(request, result);
      
      // Emit event
      this.emit('price-calculated', {
        request,
        result,
        processingTime: Date.now() - startTime
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error calculating price:', error);
      throw error;
    }
  }

  /**
   * Calculate base price using standard rules
   */
  private calculateBasePrice(request: PricingRequest): any {
    let total = 0;
    const components: any = {};
    
    // Volume-based pricing
    components.volume = request.volume * this.basePricing.volumeRate;
    total += components.volume;
    
    // Distance-based pricing
    components.distance = request.distance * this.basePricing.distanceRate;
    total += components.distance;
    
    // Floor charges
    components.floors = 0;
    if (!request.elevator.pickup && request.floors.pickup > 2) {
      components.floors += (request.floors.pickup - 2) * this.basePricing.floors.noElevator;
    }
    if (!request.elevator.delivery && request.floors.delivery > 2) {
      components.floors += (request.floors.delivery - 2) * this.basePricing.floors.noElevator;
    }
    total += components.floors;
    
    // Parking charges
    components.parking = 0;
    if (request.parkingDistance.pickup > this.basePricing.parking.threshold) {
      components.parking += (request.parkingDistance.pickup - this.basePricing.parking.threshold) * 
                           this.basePricing.parking.rate;
    }
    if (request.parkingDistance.delivery > this.basePricing.parking.threshold) {
      components.parking += (request.parkingDistance.delivery - this.basePricing.parking.threshold) * 
                           this.basePricing.parking.rate;
    }
    total += components.parking;
    
    // Additional services
    components.additionalServices = 0;
    request.additionalServices.forEach(service => {
      const servicePrice = this.calculateServicePrice(service);
      components.additionalServices += servicePrice;
      total += servicePrice;
    });
    
    // Labor estimation
    const estimatedHours = this.estimateLabor(request);
    components.labor = estimatedHours * this.basePricing.hourlyRate;
    total += components.labor;
    
    return {
      total,
      components,
      estimatedHours
    };
  }

  /**
   * Calculate dynamic pricing adjustments
   */
  private async calculateDynamicAdjustments(
    request: PricingRequest,
    basePrice: any,
    customerData: any,
    marketData: any
  ): Promise<any> {
    const adjustments: PriceAdjustment[] = [];
    let totalAdjustment = 0;
    
    // Demand-based adjustment
    if (marketData.currentDemand > 0.8) {
      const demandAdjustment = basePrice.total * 0.15 * marketData.currentDemand;
      adjustments.push({
        type: 'demand',
        reason: 'High demand period',
        amount: demandAdjustment,
        percentage: 15 * marketData.currentDemand
      });
      totalAdjustment += demandAdjustment;
    } else if (marketData.currentDemand < 0.4) {
      const demandAdjustment = -basePrice.total * 0.1;
      adjustments.push({
        type: 'demand',
        reason: 'Low demand incentive',
        amount: demandAdjustment,
        percentage: -10
      });
      totalAdjustment += demandAdjustment;
    }
    
    // Urgency adjustment
    const urgencyMultiplier = this.basePricing.urgency[request.urgency];
    if (urgencyMultiplier !== 1.0) {
      const urgencyAdjustment = basePrice.total * (urgencyMultiplier - 1);
      adjustments.push({
        type: 'urgency',
        reason: `${request.urgency} urgency service`,
        amount: urgencyAdjustment,
        percentage: (urgencyMultiplier - 1) * 100
      });
      totalAdjustment += urgencyAdjustment;
    }
    
    // Seasonal adjustment
    if (marketData.seasonalFactor !== 1.0) {
      const seasonalAdjustment = basePrice.total * (marketData.seasonalFactor - 1) * 0.5;
      adjustments.push({
        type: 'seasonal',
        reason: this.getSeasonalReason(marketData.seasonalFactor),
        amount: seasonalAdjustment,
        percentage: (marketData.seasonalFactor - 1) * 50
      });
      totalAdjustment += seasonalAdjustment;
    }
    
    // Capacity-based adjustment
    if (marketData.capacityUtilization > 0.9) {
      const capacityAdjustment = basePrice.total * 0.2;
      adjustments.push({
        type: 'capacity',
        reason: 'Limited availability',
        amount: capacityAdjustment,
        percentage: 20
      });
      totalAdjustment += capacityAdjustment;
    }
    
    // Customer value adjustment
    if (customerData.clv > 100000) {
      const loyaltyAdjustment = -basePrice.total * 0.08;
      adjustments.push({
        type: 'loyalty',
        reason: 'VIP customer pricing',
        amount: loyaltyAdjustment,
        percentage: -8
      });
      totalAdjustment += loyaltyAdjustment;
    }
    
    // Competitive positioning
    const competitiveAdjustment = await this.calculateCompetitiveAdjustment(
      basePrice.total + totalAdjustment,
      marketData,
      customerData
    );
    if (competitiveAdjustment !== 0) {
      adjustments.push({
        type: 'competitive',
        reason: 'Market positioning',
        amount: competitiveAdjustment,
        percentage: (competitiveAdjustment / basePrice.total) * 100
      });
      totalAdjustment += competitiveAdjustment;
    }
    
    // Special handling adjustments
    if (request.fragileItems || request.valuableItems) {
      const specialAdjustment = basePrice.total * 0.15;
      adjustments.push({
        type: 'special_handling',
        reason: 'Fragile/valuable items handling',
        amount: specialAdjustment,
        percentage: 15
      });
      totalAdjustment += specialAdjustment;
    }
    
    return {
      list: adjustments,
      total: totalAdjustment
    };
  }

  /**
   * Optimize price using ML and market intelligence
   */
  private async optimizePrice(
    basePrice: any,
    adjustments: any,
    customerData: any,
    marketData: any
  ): Promise<any> {
    // Initial price with adjustments
    let optimizedPrice = basePrice.total + adjustments.total;
    
    // Price elasticity modeling
    const elasticity = await this.calculatePriceElasticity(
      customerData,
      marketData,
      optimizedPrice
    );
    
    // Optimization objectives
    const objectives = {
      maximizeRevenue: 0.4,
      maximizeConversion: 0.3,
      maintainMargin: 0.2,
      competitivePosition: 0.1
    };
    
    // Multi-objective optimization
    let bestPrice = optimizedPrice;
    let bestScore = 0;
    
    // Test different price points
    for (let multiplier = 0.85; multiplier <= 1.15; multiplier += 0.05) {
      const testPrice = optimizedPrice * multiplier;
      
      // Calculate conversion probability
      const conversionProb = this.calculateConversionProbability(
        testPrice,
        customerData,
        marketData,
        elasticity
      );
      
      // Calculate expected revenue
      const expectedRevenue = testPrice * conversionProb;
      
      // Calculate margin
      const margin = (testPrice - basePrice.total * 0.7) / testPrice;
      
      // Calculate competitive score
      const competitiveScore = this.calculateCompetitiveScore(
        testPrice,
        marketData.competitorPrices
      );
      
      // Combined score
      const score = 
        expectedRevenue * objectives.maximizeRevenue +
        conversionProb * objectives.maximizeConversion +
        margin * objectives.maintainMargin +
        competitiveScore * objectives.competitivePosition;
      
      if (score > bestScore) {
        bestScore = score;
        bestPrice = testPrice;
      }
    }
    
    // Psychological pricing
    bestPrice = this.applyPsychologicalPricing(bestPrice);
    
    // Calculate confidence
    const confidence = this.calculatePricingConfidence(
      customerData,
      marketData,
      elasticity
    );
    
    return {
      finalPrice: Math.round(bestPrice),
      confidence,
      elasticity,
      expectedConversion: this.calculateConversionProbability(
        bestPrice,
        customerData,
        marketData,
        elasticity
      )
    };
  }

  /**
   * Calculate applicable discounts
   */
  private async calculateDiscounts(
    request: PricingRequest,
    optimizedPrice: any,
    customerData: any
  ): Promise<Discount[]> {
    const discounts: Discount[] = [];
    
    // Early booking discount
    const daysInAdvance = Math.floor(
      (request.requestedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysInAdvance >= 30) {
      discounts.push({
        type: 'early_booking',
        description: 'Early booking discount (30+ days)',
        amount: optimizedPrice.finalPrice * 0.05,
        conditions: ['Booking must be confirmed within 48 hours']
      });
    }
    
    // Loyalty discount
    if (customerData.orderCount >= 5) {
      discounts.push({
        type: 'loyalty',
        description: `Loyalty discount (${customerData.orderCount} previous orders)`,
        amount: optimizedPrice.finalPrice * 0.03
      });
    }
    
    // Referral discount
    if (customerData.referralCode) {
      discounts.push({
        type: 'referral',
        description: 'Referral program discount',
        amount: 500,
        conditions: ['Valid for first-time referral use']
      });
    }
    
    // Volume discount
    if (request.volume > 50) {
      discounts.push({
        type: 'volume',
        description: 'Large volume discount',
        amount: optimizedPrice.finalPrice * 0.07
      });
    }
    
    // Flexible timing discount
    if (request.flexibility >= 7 && request.urgency === 'low') {
      discounts.push({
        type: 'flexible',
        description: 'Flexible scheduling discount',
        amount: optimizedPrice.finalPrice * 0.04,
        conditions: ['Date may be adjusted ±7 days for optimization']
      });
    }
    
    // Bundle discount
    if (request.additionalServices.length >= 3) {
      discounts.push({
        type: 'bundle',
        description: 'Service bundle discount',
        amount: optimizedPrice.finalPrice * 0.06
      });
    }
    
    // Cap total discount at 20%
    const totalDiscount = discounts.reduce((sum, d) => sum + d.amount, 0);
    const maxDiscount = optimizedPrice.finalPrice * 0.20;
    
    if (totalDiscount > maxDiscount) {
      // Scale down proportionally
      const scale = maxDiscount / totalDiscount;
      discounts.forEach(d => d.amount *= scale);
    }
    
    return discounts;
  }

  /**
   * Generate pricing alternatives
   */
  private generatePricingAlternatives(
    request: PricingRequest,
    optimizedPrice: any
  ): PricingAlternative[] {
    const alternatives: PricingAlternative[] = [];
    
    // Off-peak alternative
    alternatives.push({
      description: 'Off-peak scheduling (weekday morning)',
      price: optimizedPrice.finalPrice * 0.85,
      savings: optimizedPrice.finalPrice * 0.15,
      changes: [
        'Schedule for weekday between 9-11 AM',
        'Avoid peak traffic times',
        '15% lower price'
      ]
    });
    
    // Self-pack alternative
    alternatives.push({
      description: 'Self-packing option',
      price: optimizedPrice.finalPrice * 0.75,
      savings: optimizedPrice.finalPrice * 0.25,
      changes: [
        'Customer packs all items',
        'We provide moving and transport only',
        'Packing materials available for purchase'
      ]
    });
    
    // Extended timeline alternative
    if (request.urgency !== 'low') {
      alternatives.push({
        description: 'Flexible 2-week window',
        price: optimizedPrice.finalPrice * 0.90,
        savings: optimizedPrice.finalPrice * 0.10,
        changes: [
          'Allow 2-week scheduling window',
          'We optimize route with other jobs',
          'Same day notification before arrival'
        ]
      });
    }
    
    // Premium alternative
    alternatives.push({
      description: 'Premium white-glove service',
      price: optimizedPrice.finalPrice * 1.35,
      savings: -optimizedPrice.finalPrice * 0.35,
      changes: [
        'Dedicated senior team',
        'Full packing/unpacking service',
        'Furniture assembly included',
        'Priority scheduling',
        'Extended insurance coverage'
      ]
    });
    
    return alternatives;
  }

  /**
   * Build detailed price breakdown
   */
  private buildPriceBreakdown(request: PricingRequest, adjustments: any): PriceBreakdown {
    const baseComponents = this.calculateBasePrice(request).components;
    
    return {
      labor: baseComponents.labor || 0,
      transport: (baseComponents.distance || 0) + (baseComponents.volume || 0) * 0.3,
      materials: this.calculateMaterialsCost(request),
      equipment: this.calculateEquipmentCost(request),
      insurance: this.calculateInsuranceCost(request, baseComponents),
      additionalServices: this.breakdownAdditionalServices(request.additionalServices)
    };
  }

  /**
   * Helper methods
   */
  private async getCustomerIntelligence(customerId: string): Promise<any> {
    // Get comprehensive customer data including CLV, history, preferences
    const intelligence = await aiEngine.scoreCustomerLead({ customerId });
    
    const { data: customer } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    return {
      ...customer,
      clv: intelligence.lifetimeValue,
      churnRisk: intelligence.churnRisk,
      segment: intelligence.nextLikelyService
    };
  }

  private async getMarketConditions(request: PricingRequest): Promise<any> {
    // Real-time market data
    const dayOfWeek = request.requestedDate.getDay();
    const month = request.requestedDate.getMonth();
    
    // Get current demand
    const { data: recentJobs } = await this.supabase
      .from('jobs')
      .select('count')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    const demandLevel = Math.min(1, (recentJobs?.[0]?.count || 50) / 100);
    
    // Get competitor prices
    const competitorPrices = await this.getCompetitorPrices(request.serviceType);
    
    // Seasonal factor
    const seasonalFactor = this.calculateSeasonalFactor(month);
    
    // Capacity utilization
    const capacity = await this.getCapacityUtilization(request.requestedDate);
    
    return {
      currentDemand: demandLevel,
      competitorPrices,
      competitorAverage: competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length,
      seasonalFactor,
      capacityUtilization: capacity,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isHoliday: await this.isHoliday(request.requestedDate)
    };
  }

  private calculateServicePrice(service: AdditionalService): number {
    const servicePrices: Record<string, number> = {
      packing: 1500,
      unpacking: 1200,
      cleaning: 2500,
      storage: 500, // per day
      disposal: 800,
      assembly: 400, // per item
      'piano-moving': 3500,
      'art-handling': 2000
    };
    
    return (servicePrices[service.type] || 500) * (service.quantity || 1);
  }

  private estimateLabor(request: PricingRequest): number {
    // Base hours calculation
    let hours = 2; // minimum
    
    // Volume-based estimation
    hours += request.volume * 0.15; // 15 min per cubic meter
    
    // Distance factor
    hours += request.distance * 0.02; // 1.2 min per km
    
    // Floor factor
    if (!request.elevator.pickup) hours += request.floors.pickup * 0.25;
    if (!request.elevator.delivery) hours += request.floors.delivery * 0.25;
    
    // Special handling
    if (request.fragileItems) hours *= 1.2;
    if (request.valuableItems) hours *= 1.15;
    
    return Math.round(hours * 2) / 2; // Round to nearest half hour
  }

  private getSeasonalReason(factor: number): string {
    if (factor > 1.3) return 'Peak summer moving season';
    if (factor > 1.1) return 'High season pricing';
    if (factor < 0.9) return 'Low season discount';
    return 'Standard season pricing';
  }

  private calculateCompetitiveAdjustment(
    currentPrice: number,
    marketData: any,
    customerData: any
  ): number {
    const competitorAvg = marketData.competitorAverage;
    const priceDiff = currentPrice - competitorAvg;
    const diffPercent = priceDiff / competitorAvg;
    
    // If we're significantly higher, adjust down (unless premium justified)
    if (diffPercent > 0.2 && customerData.segment !== 'premium') {
      return -priceDiff * 0.5; // Meet halfway
    }
    
    // If we're significantly lower, adjust up (capture value)
    if (diffPercent < -0.15) {
      return -priceDiff * 0.3; // Increase but stay competitive
    }
    
    return 0;
  }

  private async calculatePriceElasticity(
    customerData: any,
    marketData: any,
    basePrice: number
  ): Promise<number> {
    // Price sensitivity factors
    let elasticity = -1.2; // Base elasticity
    
    // Customer factors
    if (customerData.segment === 'premium') elasticity *= 0.6; // Less sensitive
    if (customerData.clv > 100000) elasticity *= 0.7;
    if (customerData.orderCount > 5) elasticity *= 0.8;
    
    // Market factors
    if (marketData.currentDemand > 0.8) elasticity *= 0.8; // Less sensitive in high demand
    if (marketData.competitorPrices.length < 3) elasticity *= 0.7; // Less competition
    
    // Service factors
    if (basePrice > 50000) elasticity *= 1.2; // More sensitive for expensive services
    
    return elasticity;
  }

  private calculateConversionProbability(
    price: number,
    customerData: any,
    marketData: any,
    elasticity: number
  ): number {
    // Base conversion rate
    let baseConversion = 0.25;
    
    // Price impact
    const priceRatio = price / marketData.competitorAverage;
    const priceImpact = Math.pow(priceRatio, elasticity);
    
    // Customer factors
    if (customerData.segment === 'hot-lead') baseConversion *= 2;
    if (customerData.orderCount > 0) baseConversion *= 1.5;
    
    // Market factors
    if (marketData.currentDemand > 0.8) baseConversion *= 1.2;
    
    return Math.max(0.05, Math.min(0.95, baseConversion * priceImpact));
  }

  private calculateCompetitiveScore(price: number, competitorPrices: number[]): number {
    if (!competitorPrices || competitorPrices.length === 0) return 0.5;
    
    const sorted = [...competitorPrices].sort((a, b) => a - b);
    const position = sorted.findIndex(p => p > price) / sorted.length;
    
    // Optimal position is 30-50th percentile
    if (position >= 0.3 && position <= 0.5) return 1.0;
    if (position < 0.3) return 0.7; // Too cheap
    if (position > 0.7) return 0.5; // Too expensive
    return 0.8;
  }

  private applyPsychologicalPricing(price: number): number {
    // Round to nearest 95 or 00
    const hundreds = Math.floor(price / 100) * 100;
    const remainder = price - hundreds;
    
    if (remainder < 50) return hundreds - 5; // xx95
    return hundreds + 95; // x95
  }

  private calculatePricingConfidence(
    customerData: any,
    marketData: any,
    elasticity: number
  ): number {
    let confidence = 0.7; // Base confidence
    
    // Data quality
    if (customerData.orderCount > 3) confidence += 0.1;
    if (marketData.competitorPrices.length > 5) confidence += 0.1;
    if (Math.abs(elasticity) < 2) confidence += 0.05; // Reasonable elasticity
    
    // Market stability
    if (marketData.currentDemand > 0.3 && marketData.currentDemand < 0.9) {
      confidence += 0.05; // Stable market
    }
    
    return Math.min(0.95, confidence);
  }

  private generatePricingReasoning(
    request: PricingRequest,
    adjustments: any,
    customerData: any,
    marketData: any
  ): string[] {
    const reasons = [];
    
    // Base pricing explanation
    reasons.push(`Base price calculated using volume (${request.volume}m³) and distance (${request.distance}km)`);
    
    // Major adjustments
    adjustments.list.forEach((adj: PriceAdjustment) => {
      if (Math.abs(adj.percentage || 0) > 5) {
        reasons.push(`${adj.reason}: ${adj.percentage > 0 ? '+' : ''}${adj.percentage}%`);
      }
    });
    
    // Market positioning
    if (marketData.competitorAverage) {
      const diff = ((request.totalPrice / marketData.competitorAverage) - 1) * 100;
      reasons.push(`Price is ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'above' : 'below'} market average`);
    }
    
    // Customer value
    if (customerData.clv > 100000) {
      reasons.push('VIP customer pricing applied');
    }
    
    return reasons;
  }

  private assessMarketPosition(price: number, marketData: any): string {
    const ratio = price / marketData.competitorAverage;
    
    if (ratio < 0.85) return 'Budget';
    if (ratio < 0.95) return 'Competitive';
    if (ratio < 1.05) return 'Market Rate';
    if (ratio < 1.15) return 'Premium';
    return 'Luxury';
  }

  private calculateMaterialsCost(request: PricingRequest): number {
    let cost = 0;
    
    // Estimate materials based on volume
    const estimatedBoxes = Math.ceil(request.volume * 2);
    cost += estimatedBoxes * 20; // Cost price
    
    if (request.fragileItems) {
      cost += request.volume * 50; // Bubble wrap, etc.
    }
    
    return cost;
  }

  private calculateEquipmentCost(request: PricingRequest): number {
    // Equipment rental/depreciation
    let cost = 500; // Base truck cost
    
    if (request.volume > 30) cost += 300; // Larger truck
    if (request.specialHandling.includes('piano')) cost += 200; // Special equipment
    
    return cost;
  }

  private calculateInsuranceCost(request: PricingRequest, baseComponents: any): number {
    const totalValue = (baseComponents.total || 15000) * 10; // Estimate goods value
    return totalValue * 0.002; // 0.2% insurance rate
  }

  private breakdownAdditionalServices(services: AdditionalService[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    services.forEach(service => {
      breakdown[service.type] = this.calculateServicePrice(service);
    });
    
    return breakdown;
  }

  private async getCompetitorPrices(serviceType: string): Promise<number[]> {
    // Mock competitor prices - would fetch from market intelligence
    const basePrices = [12000, 13500, 14000, 15000, 15500, 16000, 17000];
    const multiplier = serviceType === 'kontorsflytt' ? 1.5 : 1.0;
    return basePrices.map(p => p * multiplier);
  }

  private calculateSeasonalFactor(month: number): number {
    // Swedish moving seasonality
    const factors = [
      0.7,  // Jan
      0.75, // Feb
      0.85, // Mar
      0.95, // Apr
      1.15, // May
      1.3,  // Jun
      1.35, // Jul
      1.25, // Aug
      1.05, // Sep
      0.9,  // Oct
      0.8,  // Nov
      0.65  // Dec
    ];
    return factors[month];
  }

  private async getCapacityUtilization(date: Date): Promise<number> {
    const { data: jobs } = await this.supabase
      .from('scheduled_jobs')
      .select('count')
      .eq('date', date.toISOString().split('T')[0]);
    
    const { data: teams } = await this.supabase
      .from('teams')
      .select('count')
      .eq('active', true);
    
    const jobCount = jobs?.[0]?.count || 0;
    const teamCount = teams?.[0]?.count || 5;
    const maxCapacity = teamCount * 3; // 3 jobs per team per day
    
    return Math.min(1, jobCount / maxCapacity);
  }

  private async isHoliday(date: Date): Promise<boolean> {
    // Check Swedish holidays
    const { data } = await this.supabase
      .from('holidays')
      .select('*')
      .eq('date', date.toISOString().split('T')[0])
      .single();
    
    return !!data;
  }

  private async logPricingDecision(request: PricingRequest, result: PricingResult) {
    await this.supabase
      .from('pricing_log')
      .insert({
        customer_id: request.customerId,
        request,
        result,
        model_version: this.engineVersion,
        created_at: new Date()
      });
  }

  /**
   * Model management
   */
  private async loadPricingModels() {
    // Load ML pricing models
    const { data: models } = await this.supabase
      .from('pricing_models')
      .select('*')
      .eq('active', true);
    
    console.log(`📊 Loaded ${models?.length || 0} pricing models`);
  }

  private startMarketMonitoring() {
    // Monitor market conditions in real-time
    setInterval(async () => {
      await this.updateMarketConditions();
    }, 60 * 60 * 1000); // Every hour
  }

  private async updateMarketConditions() {
    // Update demand level
    const { data: recentQuotes } = await this.supabase
      .from('quotes')
      .select('count')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    const quoteCount = recentQuotes?.[0]?.count || 0;
    this.marketConditions.demandLevel = Math.min(1, quoteCount / 50);
    
    // Update capacity
    const capacity = await this.getCapacityUtilization(new Date());
    this.marketConditions.capacityUtilization = capacity;
    
    console.log('📈 Market conditions updated:', this.marketConditions);
  }

  private initializeCompetitorTracking() {
    // Set up competitor price monitoring
    console.log('🔍 Competitor tracking initialized');
  }

  /**
   * Public methods
   */
  async getQuote(quoteId: string): Promise<PricingResult | null> {
    const { data } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('quote_id', quoteId)
      .single();
    
    return data?.result || null;
  }

  async validateQuote(quoteId: string): Promise<boolean> {
    const quote = await this.getQuote(quoteId);
    if (!quote) return false;
    
    return new Date(quote.validUntil) > new Date();
  }

  async getPriceHistory(customerId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('pricing_log')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return data || [];
  }

  async simulatePrice(request: PricingRequest, adjustments: any): Promise<PricingResult> {
    // Allow manual price simulation with custom adjustments
    const baseRequest = { ...request };
    
    // Apply manual adjustments
    Object.assign(baseRequest, adjustments);
    
    return this.calculatePrice(baseRequest);
  }
}

// Export singleton instance
export const dynamicPricingEngine = new DynamicPricingEngine();