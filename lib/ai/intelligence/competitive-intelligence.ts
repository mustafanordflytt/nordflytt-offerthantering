/**
 * Competitive Intelligence System
 * Real-time competitor monitoring and market analysis
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';
import { aiEngine } from '../core/ai-engine';

export interface CompetitorProfile {
  id: string;
  name: string;
  website: string;
  
  // Service offerings
  services: ServiceOffering[];
  serviceAreas: string[];
  specializations: string[];
  
  // Pricing intelligence
  pricingModel: PricingModel;
  pricePoints: PricePoint[];
  discountPatterns: DiscountPattern[];
  
  // Market position
  marketShare: number;
  customerSegments: string[];
  strengths: string[];
  weaknesses: string[];
  
  // Digital presence
  seoRankings: SEORanking[];
  socialMedia: SocialMediaMetrics;
  reviewScores: ReviewMetrics;
  
  // Business metrics
  estimatedRevenue: number;
  growthRate: number;
  employeeCount: number;
  fleetSize: number;
}

export interface ServiceOffering {
  service: string;
  availability: boolean;
  uniqueFeatures: string[];
  limitations: string[];
}

export interface PricingModel {
  strategy: 'premium' | 'competitive' | 'budget' | 'dynamic';
  transparency: 'high' | 'medium' | 'low';
  structure: 'fixed' | 'hourly' | 'volume' | 'hybrid';
}

export interface PricePoint {
  service: string;
  basePrice: number;
  lastUpdated: Date;
  confidence: number;
  source: string;
}

export interface DiscountPattern {
  type: string;
  frequency: number;
  averageDiscount: number;
  triggers: string[];
}

export interface SEORanking {
  keyword: string;
  position: number;
  trend: 'up' | 'down' | 'stable';
  difficulty: number;
}

export interface SocialMediaMetrics {
  platforms: Record<string, PlatformMetrics>;
  engagementRate: number;
  postFrequency: number;
  sentiment: number;
}

export interface PlatformMetrics {
  followers: number;
  growthRate: number;
  avgEngagement: number;
}

export interface ReviewMetrics {
  averageRating: number;
  totalReviews: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  topComplaints: string[];
  topPraises: string[];
}

export interface MarketIntelligence {
  timestamp: Date;
  
  // Market overview
  marketSize: number;
  growthRate: number;
  seasonality: SeasonalPattern[];
  
  // Competitive landscape
  competitors: CompetitorProfile[];
  marketLeader: string;
  ourPosition: number;
  
  // Opportunities & Threats
  opportunities: MarketOpportunity[];
  threats: MarketThreat[];
  
  // Price benchmarking
  priceComparison: PriceBenchmark[];
  pricePositioning: string;
  
  // Service gaps
  unservedNeeds: string[];
  emergingServices: string[];
  
  // Customer insights
  switchingFactors: string[];
  loyaltyDrivers: string[];
  
  // Predictions
  nextMoves: CompetitorMove[];
  marketForecast: MarketForecast;
}

export interface SeasonalPattern {
  period: string;
  demandIndex: number;
  priceIndex: number;
  competitionLevel: number;
}

export interface MarketOpportunity {
  type: string;
  description: string;
  potentialValue: number;
  difficulty: 'low' | 'medium' | 'high';
  timeframe: string;
  requiredActions: string[];
}

export interface MarketThreat {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  probability: number;
  mitigationStrategies: string[];
}

export interface PriceBenchmark {
  service: string;
  ourPrice: number;
  marketAverage: number;
  marketMin: number;
  marketMax: number;
  recommendation: string;
}

export interface CompetitorMove {
  competitor: string;
  predictedAction: string;
  probability: number;
  impact: string;
  responseStrategy: string;
}

export interface MarketForecast {
  period: string;
  demandGrowth: number;
  priceMovement: number;
  newEntrants: number;
  consolidation: boolean;
}

export class CompetitiveIntelligence extends EventEmitter {
  private supabase = createClient();
  private systemVersion = '2.0';
  private competitors = new Map<string, CompetitorProfile>();
  private marketData: MarketIntelligence | null = null;
  
  // Monitoring configuration
  private readonly monitoringConfig = {
    priceCheckInterval: 6 * 60 * 60 * 1000, // 6 hours
    seoCheckInterval: 24 * 60 * 60 * 1000, // Daily
    socialCheckInterval: 4 * 60 * 60 * 1000, // 4 hours
    reviewCheckInterval: 12 * 60 * 60 * 1000, // 12 hours
    
    // Alert thresholds
    priceChangeThreshold: 0.05, // 5%
    rankingChangeThreshold: 3,
    reviewChangeThreshold: 0.2,
    marketShareChangeThreshold: 0.02
  };
  
  // Known competitors (Swedish market)
  private readonly competitorList = [
    { name: 'Flyttfirma Stockholm', domain: 'flyttfirmastockholm.se' },
    { name: 'Prima Flytt', domain: 'primaflytt.se' },
    { name: 'Stockholms Flyttbyrå', domain: 'stockholmsflyttbyra.se' },
    { name: 'City Flyttservice', domain: 'cityflyttservice.se' },
    { name: 'Express Flytt', domain: 'expressflytt.se' }
  ];
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('🔍 Initializing Competitive Intelligence v2.0...');
    
    // Load competitor profiles
    await this.loadCompetitorProfiles();
    
    // Start monitoring systems
    this.startPriceMonitoring();
    this.startSEOMonitoring();
    this.startSocialMonitoring();
    this.startReviewMonitoring();
    
    // Initialize market analysis
    await this.analyzeMarket();
    
    console.log('✅ Competitive Intelligence ready');
    this.emit('ready');
  }

  /**
   * Get comprehensive market intelligence
   */
  async getMarketIntelligence(): Promise<MarketIntelligence> {
    if (!this.marketData || this.isDataStale(this.marketData.timestamp)) {
      await this.analyzeMarket();
    }
    
    return this.marketData!;
  }

  /**
   * Monitor specific competitor
   */
  async monitorCompetitor(competitorId: string): Promise<CompetitorProfile | null> {
    const competitor = this.competitors.get(competitorId);
    if (!competitor) return null;
    
    // Update all metrics
    await Promise.all([
      this.updatePricing(competitor),
      this.updateSEO(competitor),
      this.updateSocialMedia(competitor),
      this.updateReviews(competitor)
    ]);
    
    // Analyze changes
    const changes = await this.detectChanges(competitor);
    if (changes.length > 0) {
      this.emit('competitor-changes', { competitor, changes });
    }
    
    return competitor;
  }

  /**
   * Analyze market comprehensively
   */
  private async analyzeMarket() {
    const startTime = Date.now();
    
    // Update all competitor data
    const competitors = await this.updateAllCompetitors();
    
    // Calculate market metrics
    const marketSize = await this.calculateMarketSize();
    const growthRate = await this.calculateGrowthRate();
    const seasonality = this.analyzeSeasonality();
    
    // Determine market position
    const ourPosition = await this.calculateMarketPosition(competitors);
    const marketLeader = this.identifyMarketLeader(competitors);
    
    // Identify opportunities and threats
    const opportunities = await this.identifyOpportunities(competitors);
    const threats = await this.identifyThreats(competitors);
    
    // Price benchmarking
    const priceComparison = await this.benchmarkPrices(competitors);
    const pricePositioning = this.analyzePricePositioning(priceComparison);
    
    // Service gap analysis
    const { unservedNeeds, emergingServices } = await this.analyzeServiceGaps(competitors);
    
    // Customer insights
    const { switchingFactors, loyaltyDrivers } = await this.analyzeCustomerBehavior();
    
    // Predictions
    const nextMoves = this.predictCompetitorMoves(competitors);
    const marketForecast = this.forecastMarket();
    
    this.marketData = {
      timestamp: new Date(),
      marketSize,
      growthRate,
      seasonality,
      competitors: Array.from(competitors.values()),
      marketLeader,
      ourPosition,
      opportunities,
      threats,
      priceComparison,
      pricePositioning,
      unservedNeeds,
      emergingServices,
      switchingFactors,
      loyaltyDrivers,
      nextMoves,
      marketForecast
    };
    
    // Log analysis
    await this.logMarketAnalysis(this.marketData);
    
    // Emit insights
    this.emit('market-analyzed', {
      data: this.marketData,
      processingTime: Date.now() - startTime
    });
  }

  /**
   * Update all competitor profiles
   */
  private async updateAllCompetitors(): Promise<Map<string, CompetitorProfile>> {
    const updates = await Promise.all(
      this.competitorList.map(async comp => {
        const profile = await this.buildCompetitorProfile(comp);
        this.competitors.set(profile.id, profile);
        return profile;
      })
    );
    
    return this.competitors;
  }

  /**
   * Build comprehensive competitor profile
   */
  private async buildCompetitorProfile(competitor: any): Promise<CompetitorProfile> {
    // Fetch various data sources
    const [pricing, seo, social, reviews, business] = await Promise.all([
      this.fetchPricingData(competitor),
      this.fetchSEOData(competitor),
      this.fetchSocialData(competitor),
      this.fetchReviewData(competitor),
      this.fetchBusinessData(competitor)
    ]);
    
    // Analyze service offerings
    const services = this.analyzeServices(competitor, pricing);
    
    // Calculate metrics
    const marketShare = await this.calculateCompetitorMarketShare(competitor);
    const strengths = this.identifyStrengths(seo, social, reviews);
    const weaknesses = this.identifyWeaknesses(seo, social, reviews);
    
    return {
      id: competitor.domain,
      name: competitor.name,
      website: `https://${competitor.domain}`,
      services: services.offerings,
      serviceAreas: services.areas,
      specializations: services.specializations,
      pricingModel: pricing.model,
      pricePoints: pricing.points,
      discountPatterns: pricing.discounts,
      marketShare,
      customerSegments: this.identifyCustomerSegments(reviews, social),
      strengths,
      weaknesses,
      seoRankings: seo.rankings,
      socialMedia: social,
      reviewScores: reviews,
      estimatedRevenue: business.revenue,
      growthRate: business.growth,
      employeeCount: business.employees,
      fleetSize: business.fleet
    };
  }

  /**
   * Monitoring systems
   */
  private startPriceMonitoring() {
    setInterval(async () => {
      console.log('💰 Checking competitor prices...');
      
      for (const [id, competitor] of this.competitors) {
        const oldPrices = [...competitor.pricePoints];
        await this.updatePricing(competitor);
        
        // Detect significant changes
        const changes = this.detectPriceChanges(oldPrices, competitor.pricePoints);
        if (changes.length > 0) {
          this.emit('price-changes', { competitor, changes });
        }
      }
    }, this.monitoringConfig.priceCheckInterval);
  }

  private startSEOMonitoring() {
    setInterval(async () => {
      console.log('🔍 Checking SEO rankings...');
      
      for (const [id, competitor] of this.competitors) {
        const oldRankings = [...competitor.seoRankings];
        await this.updateSEO(competitor);
        
        // Detect significant changes
        const changes = this.detectRankingChanges(oldRankings, competitor.seoRankings);
        if (changes.length > 0) {
          this.emit('seo-changes', { competitor, changes });
        }
      }
    }, this.monitoringConfig.seoCheckInterval);
  }

  private startSocialMonitoring() {
    setInterval(async () => {
      console.log('📱 Checking social media...');
      
      for (const [id, competitor] of this.competitors) {
        await this.updateSocialMedia(competitor);
        
        // Check for viral content or campaigns
        const viralContent = await this.detectViralContent(competitor);
        if (viralContent) {
          this.emit('viral-content', { competitor, content: viralContent });
        }
      }
    }, this.monitoringConfig.socialCheckInterval);
  }

  private startReviewMonitoring() {
    setInterval(async () => {
      console.log('⭐ Checking reviews...');
      
      for (const [id, competitor] of this.competitors) {
        const oldScore = competitor.reviewScores.averageRating;
        await this.updateReviews(competitor);
        
        // Detect significant changes
        if (Math.abs(competitor.reviewScores.averageRating - oldScore) > 
            this.monitoringConfig.reviewChangeThreshold) {
          this.emit('review-changes', { 
            competitor, 
            oldScore, 
            newScore: competitor.reviewScores.averageRating 
          });
        }
      }
    }, this.monitoringConfig.reviewCheckInterval);
  }

  /**
   * Analysis methods
   */
  private async calculateMarketSize(): Promise<number> {
    // Estimate total market size for moving services in Stockholm
    const { data: totalJobs } = await this.supabase
      .from('market_data')
      .select('total_jobs, average_value')
      .eq('region', 'stockholm')
      .single();
    
    const baseMarketSize = (totalJobs?.total_jobs || 50000) * (totalJobs?.average_value || 15000);
    
    // Adjust for unreported market
    return baseMarketSize * 1.3; // 30% gray market
  }

  private async calculateGrowthRate(): Promise<number> {
    const { data: historicalData } = await this.supabase
      .from('market_data')
      .select('year, market_size')
      .order('year', { ascending: false })
      .limit(2);
    
    if (!historicalData || historicalData.length < 2) return 0.05; // 5% default
    
    const growth = (historicalData[0].market_size - historicalData[1].market_size) / 
                   historicalData[1].market_size;
    
    return growth;
  }

  private analyzeSeasonality(): SeasonalPattern[] {
    return [
      { period: 'January', demandIndex: 0.7, priceIndex: 0.9, competitionLevel: 0.6 },
      { period: 'February', demandIndex: 0.75, priceIndex: 0.9, competitionLevel: 0.65 },
      { period: 'March', demandIndex: 0.85, priceIndex: 0.95, competitionLevel: 0.75 },
      { period: 'April', demandIndex: 0.95, priceIndex: 1.0, competitionLevel: 0.85 },
      { period: 'May', demandIndex: 1.15, priceIndex: 1.05, competitionLevel: 0.95 },
      { period: 'June', demandIndex: 1.3, priceIndex: 1.1, competitionLevel: 1.0 },
      { period: 'July', demandIndex: 1.35, priceIndex: 1.15, competitionLevel: 1.0 },
      { period: 'August', demandIndex: 1.25, priceIndex: 1.1, competitionLevel: 0.95 },
      { period: 'September', demandIndex: 1.05, priceIndex: 1.05, competitionLevel: 0.85 },
      { period: 'October', demandIndex: 0.9, priceIndex: 1.0, competitionLevel: 0.75 },
      { period: 'November', demandIndex: 0.8, priceIndex: 0.95, competitionLevel: 0.65 },
      { period: 'December', demandIndex: 0.65, priceIndex: 0.85, competitionLevel: 0.5 }
    ];
  }

  private async calculateMarketPosition(competitors: Map<string, CompetitorProfile>): Promise<number> {
    // Get our metrics
    const { data: ourMetrics } = await this.supabase
      .from('company_metrics')
      .select('market_share, revenue, customer_count')
      .single();
    
    const ourShare = ourMetrics?.market_share || 0.15;
    
    // Calculate position (1 = leader, n = last)
    const shares = Array.from(competitors.values())
      .map(c => c.marketShare)
      .concat(ourShare)
      .sort((a, b) => b - a);
    
    return shares.indexOf(ourShare) + 1;
  }

  private identifyMarketLeader(competitors: Map<string, CompetitorProfile>): string {
    let leader = { name: 'Nordflytt', share: 0.15 }; // Our default
    
    competitors.forEach(comp => {
      if (comp.marketShare > leader.share) {
        leader = { name: comp.name, share: comp.marketShare };
      }
    });
    
    return leader.name;
  }

  private async identifyOpportunities(
    competitors: Map<string, CompetitorProfile>
  ): Promise<MarketOpportunity[]> {
    const opportunities: MarketOpportunity[] = [];
    
    // Service gaps
    const allServices = new Set<string>();
    competitors.forEach(comp => {
      comp.services.forEach(s => allServices.add(s.service));
    });
    
    // Find underserved services
    const serviceCounts = new Map<string, number>();
    competitors.forEach(comp => {
      comp.services.forEach(s => {
        serviceCounts.set(s.service, (serviceCounts.get(s.service) || 0) + 1);
      });
    });
    
    serviceCounts.forEach((count, service) => {
      if (count < 2) {
        opportunities.push({
          type: 'service_gap',
          description: `Low competition in ${service} - only ${count} competitors`,
          potentialValue: 500000,
          difficulty: 'medium',
          timeframe: '3-6 months',
          requiredActions: [
            `Develop ${service} capabilities`,
            'Train staff',
            'Market new service'
          ]
        });
      }
    });
    
    // Geographic expansion
    const underservedAreas = await this.identifyUnderservedAreas();
    underservedAreas.forEach(area => {
      opportunities.push({
        type: 'geographic_expansion',
        description: `Expand to ${area.name} - low competitor density`,
        potentialValue: area.potentialValue,
        difficulty: 'low',
        timeframe: '1-3 months',
        requiredActions: [
          `Research ${area.name} market`,
          'Establish local presence',
          'Local marketing campaign'
        ]
      });
    });
    
    // Technology gaps
    if (!this.hasModernTech(competitors)) {
      opportunities.push({
        type: 'technology_leadership',
        description: 'Become tech leader with AI-powered operations',
        potentialValue: 2000000,
        difficulty: 'high',
        timeframe: '6-12 months',
        requiredActions: [
          'Implement AI systems',
          'Train staff on tech',
          'Market tech advantage'
        ]
      });
    }
    
    // Price optimization
    const priceGaps = this.findPriceGaps(competitors);
    priceGaps.forEach(gap => {
      opportunities.push({
        type: 'price_optimization',
        description: gap.description,
        potentialValue: gap.value,
        difficulty: 'low',
        timeframe: 'immediate',
        requiredActions: ['Adjust pricing', 'Test market response']
      });
    });
    
    return opportunities;
  }

  private async identifyThreats(
    competitors: Map<string, CompetitorProfile>
  ): Promise<MarketThreat[]> {
    const threats: MarketThreat[] = [];
    
    // New entrants
    const newCompetitors = await this.detectNewEntrants();
    if (newCompetitors.length > 0) {
      threats.push({
        type: 'new_entrants',
        description: `${newCompetitors.length} new competitors detected`,
        impact: 'medium',
        probability: 1.0,
        mitigationStrategies: [
          'Strengthen customer relationships',
          'Improve service quality',
          'Competitive pricing'
        ]
      });
    }
    
    // Price wars
    const aggressivePricers = Array.from(competitors.values())
      .filter(c => c.pricingModel.strategy === 'budget');
    
    if (aggressivePricers.length > 2) {
      threats.push({
        type: 'price_war',
        description: 'Multiple competitors using aggressive pricing',
        impact: 'high',
        probability: 0.7,
        mitigationStrategies: [
          'Focus on value differentiation',
          'Improve operational efficiency',
          'Target premium segments'
        ]
      });
    }
    
    // Technology disruption
    const techLeaders = Array.from(competitors.values())
      .filter(c => c.strengths.includes('technology'));
    
    if (techLeaders.length > 0) {
      threats.push({
        type: 'tech_disruption',
        description: 'Competitors gaining tech advantage',
        impact: 'high',
        probability: 0.8,
        mitigationStrategies: [
          'Accelerate digital transformation',
          'Partner with tech providers',
          'Invest in innovation'
        ]
      });
    }
    
    // Market consolidation
    if (await this.detectConsolidation()) {
      threats.push({
        type: 'consolidation',
        description: 'Market consolidation creating larger competitors',
        impact: 'high',
        probability: 0.6,
        mitigationStrategies: [
          'Consider strategic partnerships',
          'Focus on niche markets',
          'Improve economies of scale'
        ]
      });
    }
    
    return threats;
  }

  private async benchmarkPrices(
    competitors: Map<string, CompetitorProfile>
  ): Promise<PriceBenchmark[]> {
    const benchmarks: PriceBenchmark[] = [];
    const services = ['hemflytt', 'kontorsflytt', 'magasinering', 'städning'];
    
    for (const service of services) {
      // Get all prices for this service
      const prices: number[] = [];
      competitors.forEach(comp => {
        const price = comp.pricePoints.find(p => p.service === service);
        if (price) prices.push(price.basePrice);
      });
      
      // Get our price
      const { data: ourPrice } = await this.supabase
        .from('service_prices')
        .select('base_price')
        .eq('service', service)
        .single();
      
      if (prices.length > 0) {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const our = ourPrice?.base_price || avg;
        
        let recommendation = 'Maintain current pricing';
        if (our > avg * 1.1) recommendation = 'Consider price reduction';
        else if (our < avg * 0.9) recommendation = 'Opportunity to increase price';
        
        benchmarks.push({
          service,
          ourPrice: our,
          marketAverage: avg,
          marketMin: min,
          marketMax: max,
          recommendation
        });
      }
    }
    
    return benchmarks;
  }

  private predictCompetitorMoves(
    competitors: Map<string, CompetitorProfile>
  ): CompetitorMove[] {
    const predictions: CompetitorMove[] = [];
    
    competitors.forEach(comp => {
      // Predict based on patterns
      if (comp.growthRate > 0.2) {
        predictions.push({
          competitor: comp.name,
          predictedAction: 'Geographic expansion',
          probability: 0.8,
          impact: 'Increased competition in new areas',
          responseStrategy: 'Strengthen presence in current markets'
        });
      }
      
      if (comp.reviewScores.recentTrend === 'declining') {
        predictions.push({
          competitor: comp.name,
          predictedAction: 'Service quality improvement initiative',
          probability: 0.7,
          impact: 'Potential customer win-back campaign',
          responseStrategy: 'Proactive customer retention'
        });
      }
      
      if (comp.pricingModel.strategy === 'budget' && comp.marketShare < 0.1) {
        predictions.push({
          competitor: comp.name,
          predictedAction: 'Aggressive price cuts',
          probability: 0.6,
          impact: 'Pressure on market prices',
          responseStrategy: 'Emphasize value over price'
        });
      }
    });
    
    return predictions;
  }

  private forecastMarket(): MarketForecast {
    // Simple forecast based on current trends
    return {
      period: 'Next 12 months',
      demandGrowth: 0.08, // 8% growth
      priceMovement: 0.03, // 3% increase
      newEntrants: 2,
      consolidation: false
    };
  }

  /**
   * Helper methods
   */
  private isDataStale(timestamp: Date): boolean {
    const age = Date.now() - timestamp.getTime();
    return age > 24 * 60 * 60 * 1000; // 24 hours
  }

  private async detectChanges(competitor: CompetitorProfile): Promise<any[]> {
    const changes = [];
    
    // Compare with historical data
    const { data: history } = await this.supabase
      .from('competitor_history')
      .select('*')
      .eq('competitor_id', competitor.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (history && history[0]) {
      // Price changes
      if (Math.abs(competitor.marketShare - history[0].market_share) > 0.02) {
        changes.push({
          type: 'market_share',
          old: history[0].market_share,
          new: competitor.marketShare
        });
      }
    }
    
    return changes;
  }

  private detectPriceChanges(
    oldPrices: PricePoint[], 
    newPrices: PricePoint[]
  ): any[] {
    const changes = [];
    
    newPrices.forEach(newPrice => {
      const oldPrice = oldPrices.find(p => p.service === newPrice.service);
      if (oldPrice) {
        const change = (newPrice.basePrice - oldPrice.basePrice) / oldPrice.basePrice;
        if (Math.abs(change) > this.monitoringConfig.priceChangeThreshold) {
          changes.push({
            service: newPrice.service,
            oldPrice: oldPrice.basePrice,
            newPrice: newPrice.basePrice,
            change: change
          });
        }
      }
    });
    
    return changes;
  }

  private detectRankingChanges(
    oldRankings: SEORanking[], 
    newRankings: SEORanking[]
  ): any[] {
    const changes = [];
    
    newRankings.forEach(newRank => {
      const oldRank = oldRankings.find(r => r.keyword === newRank.keyword);
      if (oldRank) {
        const change = Math.abs(newRank.position - oldRank.position);
        if (change >= this.monitoringConfig.rankingChangeThreshold) {
          changes.push({
            keyword: newRank.keyword,
            oldPosition: oldRank.position,
            newPosition: newRank.position,
            direction: newRank.position < oldRank.position ? 'improved' : 'declined'
          });
        }
      }
    });
    
    return changes;
  }

  // Mock methods - would integrate with real data sources
  private async fetchPricingData(competitor: any): Promise<any> {
    return {
      model: {
        strategy: 'competitive',
        transparency: 'medium',
        structure: 'hybrid'
      },
      points: [
        { service: 'hemflytt', basePrice: 15000, lastUpdated: new Date(), confidence: 0.8, source: 'website' },
        { service: 'kontorsflytt', basePrice: 25000, lastUpdated: new Date(), confidence: 0.7, source: 'quote' }
      ],
      discounts: [
        { type: 'early_booking', frequency: 0.3, averageDiscount: 0.1, triggers: ['30+ days advance'] }
      ]
    };
  }

  private async fetchSEOData(competitor: any): Promise<any> {
    return {
      rankings: [
        { keyword: 'flyttfirma stockholm', position: 5, trend: 'stable', difficulty: 85 },
        { keyword: 'billig flytt', position: 12, trend: 'up', difficulty: 70 }
      ]
    };
  }

  private async fetchSocialData(competitor: any): Promise<SocialMediaMetrics> {
    return {
      platforms: {
        facebook: { followers: 2500, growthRate: 0.02, avgEngagement: 0.03 },
        instagram: { followers: 1200, growthRate: 0.05, avgEngagement: 0.05 }
      },
      engagementRate: 0.04,
      postFrequency: 3,
      sentiment: 0.7
    };
  }

  private async fetchReviewData(competitor: any): Promise<ReviewMetrics> {
    return {
      averageRating: 4.2,
      totalReviews: 156,
      recentTrend: 'stable',
      topComplaints: ['pricing', 'communication'],
      topPraises: ['professional', 'careful handling']
    };
  }

  private async fetchBusinessData(competitor: any): Promise<any> {
    return {
      revenue: 15000000,
      growth: 0.12,
      employees: 25,
      fleet: 8
    };
  }

  private analyzeServices(competitor: any, pricing: any): any {
    return {
      offerings: [
        { service: 'hemflytt', availability: true, uniqueFeatures: ['weekend service'], limitations: [] },
        { service: 'kontorsflytt', availability: true, uniqueFeatures: [], limitations: ['no IT services'] }
      ],
      areas: ['Stockholm', 'Uppsala', 'Södertälje'],
      specializations: ['apartment moves', 'office moves']
    };
  }

  private async calculateCompetitorMarketShare(competitor: any): Promise<number> {
    // Simplified calculation
    const marketSize = await this.calculateMarketSize();
    const competitorRevenue = 15000000; // Would fetch real data
    return competitorRevenue / marketSize;
  }

  private identifyStrengths(seo: any, social: any, reviews: any): string[] {
    const strengths = [];
    
    if (seo.rankings.some((r: any) => r.position <= 3)) strengths.push('SEO leadership');
    if (social.engagementRate > 0.05) strengths.push('Strong social presence');
    if (reviews.averageRating >= 4.5) strengths.push('Excellent reputation');
    
    return strengths;
  }

  private identifyWeaknesses(seo: any, social: any, reviews: any): string[] {
    const weaknesses = [];
    
    if (seo.rankings.every((r: any) => r.position > 10)) weaknesses.push('Poor SEO');
    if (social.engagementRate < 0.02) weaknesses.push('Weak social engagement');
    if (reviews.averageRating < 3.5) weaknesses.push('Low customer satisfaction');
    
    return weaknesses;
  }

  private identifyCustomerSegments(reviews: any, social: any): string[] {
    // Analyze patterns to identify segments
    return ['residential', 'small business', 'premium'];
  }

  private async detectViralContent(competitor: CompetitorProfile): Promise<any> {
    // Check for unusual engagement spikes
    const threshold = competitor.socialMedia.engagementRate * 3;
    // Would check actual posts
    return null;
  }

  private async identifyUnderservedAreas(): Promise<any[]> {
    return [
      { name: 'Nacka', potentialValue: 300000 },
      { name: 'Sollentuna', potentialValue: 250000 }
    ];
  }

  private hasModernTech(competitors: Map<string, CompetitorProfile>): boolean {
    return Array.from(competitors.values()).some(c => 
      c.strengths.includes('technology') || c.strengths.includes('digital')
    );
  }

  private findPriceGaps(competitors: Map<string, CompetitorProfile>): any[] {
    return [
      { description: 'Premium pricing opportunity for express service', value: 500000 }
    ];
  }

  private async detectNewEntrants(): Promise<any[]> {
    // Would scan business registrations, new websites, etc.
    return [];
  }

  private async detectConsolidation(): Promise<boolean> {
    // Check for M&A activity
    return false;
  }

  private analyzePricePositioning(comparison: PriceBenchmark[]): string {
    const avgPosition = comparison.reduce((sum, b) => 
      sum + (b.ourPrice / b.marketAverage), 0
    ) / comparison.length;
    
    if (avgPosition > 1.15) return 'Premium';
    if (avgPosition > 1.05) return 'Above Market';
    if (avgPosition > 0.95) return 'Competitive';
    if (avgPosition > 0.85) return 'Below Market';
    return 'Budget';
  }

  private async analyzeServiceGaps(
    competitors: Map<string, CompetitorProfile>
  ): Promise<{ unservedNeeds: string[], emergingServices: string[] }> {
    return {
      unservedNeeds: ['pet relocation', 'art handling', 'same-day service'],
      emergingServices: ['virtual surveys', 'carbon-neutral moves']
    };
  }

  private async analyzeCustomerBehavior(): Promise<{
    switchingFactors: string[],
    loyaltyDrivers: string[]
  }> {
    return {
      switchingFactors: ['price', 'availability', 'bad experience'],
      loyaltyDrivers: ['reliability', 'care', 'communication']
    };
  }

  private async updatePricing(competitor: CompetitorProfile) {
    const newPricing = await this.fetchPricingData(competitor);
    competitor.pricePoints = newPricing.points;
    competitor.discountPatterns = newPricing.discounts;
  }

  private async updateSEO(competitor: CompetitorProfile) {
    const newSEO = await this.fetchSEOData(competitor);
    competitor.seoRankings = newSEO.rankings;
  }

  private async updateSocialMedia(competitor: CompetitorProfile) {
    competitor.socialMedia = await this.fetchSocialData(competitor);
  }

  private async updateReviews(competitor: CompetitorProfile) {
    competitor.reviewScores = await this.fetchReviewData(competitor);
  }

  private async logMarketAnalysis(data: MarketIntelligence) {
    await this.supabase
      .from('market_intelligence_log')
      .insert({
        data,
        version: this.systemVersion,
        created_at: new Date()
      });
  }

  /**
   * Public methods
   */
  async getCompetitor(competitorId: string): Promise<CompetitorProfile | null> {
    return this.competitors.get(competitorId) || null;
  }

  async getAllCompetitors(): Promise<CompetitorProfile[]> {
    return Array.from(this.competitors.values());
  }

  async getPriceBenchmark(service: string): Promise<PriceBenchmark | null> {
    const intelligence = await this.getMarketIntelligence();
    return intelligence.priceComparison.find(p => p.service === service) || null;
  }

  async getMarketTrends(): Promise<{
    opportunities: MarketOpportunity[],
    threats: MarketThreat[]
  }> {
    const intelligence = await this.getMarketIntelligence();
    return {
      opportunities: intelligence.opportunities,
      threats: intelligence.threats
    };
  }

  async triggerCompetitorAlert(competitorId: string, alertType: string) {
    const competitor = this.competitors.get(competitorId);
    if (!competitor) return;
    
    this.emit('manual-alert', {
      competitor,
      type: alertType,
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const competitiveIntelligence = new CompetitiveIntelligence();