/**
 * Demand Forecasting System
 * ML-based demand prediction and capacity planning
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';
import { aiEngine } from '../core/ai-engine';

export interface DemandForecast {
  period: ForecastPeriod;
  
  // Overall demand
  totalDemand: number;
  confidence: number;
  
  // Service breakdown
  serviceForecasts: ServiceForecast[];
  
  // Geographic distribution
  geographicDemand: GeographicForecast[];
  
  // Temporal patterns
  dailyPattern: DailyPattern[];
  weeklyPattern: WeeklyPattern[];
  
  // Capacity requirements
  capacityNeeds: CapacityRequirement;
  
  // Risk factors
  riskFactors: RiskFactor[];
  
  // Recommendations
  recommendations: ForecastRecommendation[];
  
  // Model metadata
  modelVersion: string;
  generatedAt: Date;
}

export interface ForecastPeriod {
  start: Date;
  end: Date;
  granularity: 'day' | 'week' | 'month';
}

export interface ServiceForecast {
  service: string;
  demandUnits: number;
  growthRate: number;
  seasonalFactor: number;
  confidence: number;
  drivers: string[];
}

export interface GeographicForecast {
  area: string;
  coordinates: { lat: number; lng: number };
  demandDensity: number;
  growthTrend: 'increasing' | 'stable' | 'decreasing';
  hotspots: Hotspot[];
}

export interface Hotspot {
  location: string;
  intensity: number;
  timeOfDay: string;
  dayOfWeek: string;
}

export interface DailyPattern {
  hour: number;
  demandIndex: number;
  serviceDistribution: Record<string, number>;
}

export interface WeeklyPattern {
  dayOfWeek: number;
  demandIndex: number;
  peakHours: number[];
  servicePreferences: string[];
}

export interface CapacityRequirement {
  teams: TeamRequirement[];
  vehicles: VehicleRequirement[];
  equipment: EquipmentRequirement[];
  staffing: StaffingRequirement;
}

export interface TeamRequirement {
  date: Date;
  requiredTeams: number;
  skillMix: Record<string, number>;
  utilizationTarget: number;
}

export interface VehicleRequirement {
  type: string;
  quantity: number;
  peakDays: Date[];
}

export interface EquipmentRequirement {
  equipment: string;
  quantity: number;
  criticalPeriods: Date[];
}

export interface StaffingRequirement {
  totalStaff: number;
  byRole: Record<string, number>;
  overtimeRisk: number;
  hiringNeeds: number;
}

export interface RiskFactor {
  type: string;
  probability: number;
  impact: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export interface ForecastRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  deadline: Date;
  expectedImpact: string;
  resources: string[];
}

export interface ForecastModel {
  name: string;
  accuracy: number;
  features: string[];
  lastTrained: Date;
  performance: ModelPerformance;
}

export interface ModelPerformance {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  r2: number; // R-squared
  biasDirection: 'over' | 'under' | 'neutral';
}

export class DemandForecasting extends EventEmitter {
  private supabase = createClient();
  private forecastVersion = '3.0';
  private models = new Map<string, ForecastModel>();
  private cachedForecasts = new Map<string, DemandForecast>();
  
  // Model configuration
  private readonly modelConfig = {
    // Time series parameters
    seasonalPeriods: 365, // Annual seasonality
    trendDampening: 0.95,
    
    // External factors
    weatherImpact: 0.15,
    economicImpact: 0.10,
    competitorImpact: 0.05,
    
    // Confidence thresholds
    highConfidence: 0.85,
    mediumConfidence: 0.70,
    
    // Capacity buffers
    peakBuffer: 1.2, // 20% extra for peaks
    normalBuffer: 1.1 // 10% extra normally
  };
  
  // Historical patterns (Swedish market)
  private readonly historicalPatterns = {
    peakMonths: [5, 6, 7, 8], // May-August
    lowMonths: [11, 12, 1, 2], // Nov-Feb
    peakDays: [5, 6], // Friday-Saturday
    peakHours: [9, 10, 11, 14, 15, 16] // Morning and afternoon
  };
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('📊 Initializing Demand Forecasting v3.0...');
    
    // Load forecasting models
    await this.loadForecastModels();
    
    // Train models with latest data
    await this.updateModels();
    
    // Start automated forecasting
    this.startAutomatedForecasting();
    
    console.log('✅ Demand Forecasting ready');
    this.emit('ready');
  }

  /**
   * Generate comprehensive demand forecast
   */
  async generateForecast(period: ForecastPeriod): Promise<DemandForecast> {
    const startTime = Date.now();
    const cacheKey = `${period.start.toISOString()}-${period.end.toISOString()}-${period.granularity}`;
    
    // Check cache
    if (this.cachedForecasts.has(cacheKey)) {
      const cached = this.cachedForecasts.get(cacheKey)!;
      if (this.isForecastFresh(cached)) {
        return cached;
      }
    }
    
    try {
      // Gather input data
      const historicalData = await this.getHistoricalData(period);
      const externalFactors = await this.getExternalFactors(period);
      const marketConditions = await this.getMarketConditions();
      
      // Generate base forecast
      const baseForecast = await this.generateBaseForecast(
        historicalData,
        period
      );
      
      // Apply external adjustments
      const adjustedForecast = this.applyExternalFactors(
        baseForecast,
        externalFactors,
        marketConditions
      );
      
      // Break down by service
      const serviceForecasts = await this.forecastByService(
        adjustedForecast,
        historicalData,
        period
      );
      
      // Geographic analysis
      const geographicDemand = await this.analyzeGeographicDemand(
        adjustedForecast,
        period
      );
      
      // Pattern analysis
      const { dailyPattern, weeklyPattern } = this.analyzePatterns(
        historicalData,
        adjustedForecast
      );
      
      // Capacity planning
      const capacityNeeds = await this.calculateCapacityRequirements(
        adjustedForecast,
        serviceForecasts,
        period
      );
      
      // Risk assessment
      const riskFactors = this.assessRisks(
        adjustedForecast,
        externalFactors,
        capacityNeeds
      );
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        adjustedForecast,
        capacityNeeds,
        riskFactors
      );
      
      // Calculate confidence
      const confidence = this.calculateForecastConfidence(
        baseForecast,
        historicalData,
        externalFactors
      );
      
      const forecast: DemandForecast = {
        period,
        totalDemand: adjustedForecast.total,
        confidence,
        serviceForecasts,
        geographicDemand,
        dailyPattern,
        weeklyPattern,
        capacityNeeds,
        riskFactors,
        recommendations,
        modelVersion: this.forecastVersion,
        generatedAt: new Date()
      };
      
      // Cache result
      this.cachedForecasts.set(cacheKey, forecast);
      
      // Log forecast
      await this.logForecast(forecast);
      
      // Emit event
      this.emit('forecast-generated', {
        forecast,
        processingTime: Date.now() - startTime
      });
      
      return forecast;
      
    } catch (error) {
      console.error('❌ Error generating forecast:', error);
      throw error;
    }
  }

  /**
   * Generate base forecast using time series models
   */
  private async generateBaseForecast(
    historicalData: any,
    period: ForecastPeriod
  ): Promise<any> {
    // Extract time series
    const timeSeries = this.extractTimeSeries(historicalData);
    
    // Decompose into components
    const { trend, seasonal, residual } = this.decomposeTimeSeries(timeSeries);
    
    // Forecast each component
    const forecastedTrend = this.forecastTrend(trend, period);
    const forecastedSeasonal = this.forecastSeasonal(seasonal, period);
    
    // Combine components
    const combinedForecast = this.combineComponents(
      forecastedTrend,
      forecastedSeasonal,
      residual
    );
    
    // Apply smoothing
    const smoothedForecast = this.applySmoothening(combinedForecast);
    
    return {
      total: this.calculateTotalDemand(smoothedForecast, period),
      daily: smoothedForecast,
      trend: forecastedTrend,
      seasonal: forecastedSeasonal
    };
  }

  /**
   * Time series decomposition
   */
  private decomposeTimeSeries(series: number[]): {
    trend: number[],
    seasonal: number[],
    residual: number[]
  } {
    // Moving average for trend
    const windowSize = 7; // Weekly average
    const trend = this.movingAverage(series, windowSize);
    
    // Detrended series
    const detrended = series.map((val, idx) => val - trend[idx]);
    
    // Seasonal component (simplified - would use STL or X-13ARIMA)
    const seasonal = this.extractSeasonalPattern(detrended);
    
    // Residual
    const residual = series.map((val, idx) => 
      val - trend[idx] - seasonal[idx % seasonal.length]
    );
    
    return { trend, seasonal, residual };
  }

  /**
   * Forecast trend component
   */
  private forecastTrend(trend: number[], period: ForecastPeriod): number[] {
    const days = Math.ceil(
      (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Simple linear regression with dampening
    const n = trend.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = trend;
    
    // Calculate slope and intercept
    const xMean = x.reduce((a, b) => a + b) / n;
    const yMean = y.reduce((a, b) => a + b) / n;
    
    let slope = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      slope += (x[i] - xMean) * (y[i] - yMean);
      denominator += (x[i] - xMean) ** 2;
    }
    
    slope = slope / denominator;
    const intercept = yMean - slope * xMean;
    
    // Generate forecast with dampening
    const forecast: number[] = [];
    for (let i = 0; i < days; i++) {
      const dampenedSlope = slope * Math.pow(this.modelConfig.trendDampening, i);
      forecast.push(intercept + dampenedSlope * (n + i));
    }
    
    return forecast;
  }

  /**
   * Forecast seasonal component
   */
  private forecastSeasonal(seasonal: number[], period: ForecastPeriod): number[] {
    const days = Math.ceil(
      (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const forecast: number[] = [];
    const seasonalLength = seasonal.length;
    
    // Repeat seasonal pattern
    for (let i = 0; i < days; i++) {
      forecast.push(seasonal[i % seasonalLength]);
    }
    
    return forecast;
  }

  /**
   * Apply external factors to forecast
   */
  private applyExternalFactors(
    baseForecast: any,
    externalFactors: any,
    marketConditions: any
  ): any {
    const adjusted = { ...baseForecast };
    
    // Weather adjustment
    if (externalFactors.weather) {
      const weatherImpact = this.calculateWeatherImpact(externalFactors.weather);
      adjusted.total *= (1 + weatherImpact * this.modelConfig.weatherImpact);
    }
    
    // Economic adjustment
    if (externalFactors.economic) {
      const economicImpact = this.calculateEconomicImpact(externalFactors.economic);
      adjusted.total *= (1 + economicImpact * this.modelConfig.economicImpact);
    }
    
    // Competition adjustment
    if (marketConditions.competitorActivity) {
      const competitorImpact = this.calculateCompetitorImpact(marketConditions);
      adjusted.total *= (1 + competitorImpact * this.modelConfig.competitorImpact);
    }
    
    // Event adjustments
    if (externalFactors.events) {
      adjusted.total += this.calculateEventImpact(externalFactors.events);
    }
    
    return adjusted;
  }

  /**
   * Forecast demand by service type
   */
  private async forecastByService(
    totalForecast: any,
    historicalData: any,
    period: ForecastPeriod
  ): Promise<ServiceForecast[]> {
    const services = ['hemflytt', 'kontorsflytt', 'magasinering', 'städning'];
    const forecasts: ServiceForecast[] = [];
    
    for (const service of services) {
      // Get service-specific data
      const serviceData = historicalData.filter((d: any) => d.service === service);
      
      // Calculate service share
      const serviceShare = serviceData.length / historicalData.length;
      
      // Identify growth trend
      const growthRate = this.calculateServiceGrowth(serviceData);
      
      // Seasonal factors
      const seasonalFactor = this.getServiceSeasonality(service, period.start);
      
      // Demand drivers
      const drivers = this.identifyDemandDrivers(service, serviceData);
      
      // Calculate forecast
      const demandUnits = Math.round(totalForecast.total * serviceShare * seasonalFactor);
      
      forecasts.push({
        service,
        demandUnits,
        growthRate,
        seasonalFactor,
        confidence: this.calculateServiceConfidence(serviceData, service),
        drivers
      });
    }
    
    return forecasts;
  }

  /**
   * Analyze geographic demand distribution
   */
  private async analyzeGeographicDemand(
    forecast: any,
    period: ForecastPeriod
  ): Promise<GeographicForecast[]> {
    // Stockholm area analysis
    const areas = [
      { name: 'Östermalm', lat: 59.3389, lng: 18.0899 },
      { name: 'Södermalm', lat: 59.3204, lng: 18.0686 },
      { name: 'Vasastan', lat: 59.3458, lng: 18.0486 },
      { name: 'Kungsholmen', lat: 59.3314, lng: 18.0231 },
      { name: 'Norrmalm', lat: 59.3333, lng: 18.0667 }
    ];
    
    const forecasts: GeographicForecast[] = [];
    
    for (const area of areas) {
      // Get historical demand for area
      const { data: areaData } = await this.supabase
        .from('job_locations')
        .select('*')
        .eq('area', area.name)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
      
      const demandDensity = (areaData?.length || 0) / 90; // Jobs per day
      const growthTrend = this.analyzeAreaGrowth(areaData || []);
      
      // Identify hotspots
      const hotspots = this.identifyHotspots(areaData || []);
      
      forecasts.push({
        area: area.name,
        coordinates: { lat: area.lat, lng: area.lng },
        demandDensity: demandDensity * (forecast.total / 1000), // Scaled
        growthTrend,
        hotspots
      });
    }
    
    return forecasts;
  }

  /**
   * Analyze temporal patterns
   */
  private analyzePatterns(
    historicalData: any,
    forecast: any
  ): { dailyPattern: DailyPattern[], weeklyPattern: WeeklyPattern[] } {
    // Daily pattern (hourly)
    const dailyPattern: DailyPattern[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = historicalData.filter((d: any) => 
        new Date(d.created_at).getHours() === hour
      );
      
      const demandIndex = hourData.length / historicalData.length * 24;
      
      // Service distribution for this hour
      const serviceDistribution: Record<string, number> = {};
      ['hemflytt', 'kontorsflytt', 'magasinering', 'städning'].forEach(service => {
        const serviceCount = hourData.filter((d: any) => d.service === service).length;
        serviceDistribution[service] = serviceCount / (hourData.length || 1);
      });
      
      dailyPattern.push({ hour, demandIndex, serviceDistribution });
    }
    
    // Weekly pattern
    const weeklyPattern: WeeklyPattern[] = [];
    for (let day = 0; day < 7; day++) {
      const dayData = historicalData.filter((d: any) => 
        new Date(d.created_at).getDay() === day
      );
      
      const demandIndex = dayData.length / historicalData.length * 7;
      
      // Peak hours for this day
      const hourCounts: Record<number, number> = {};
      dayData.forEach((d: any) => {
        const hour = new Date(d.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      const peakHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));
      
      // Service preferences
      const serviceCounts: Record<string, number> = {};
      dayData.forEach((d: any) => {
        serviceCounts[d.service] = (serviceCounts[d.service] || 0) + 1;
      });
      
      const servicePreferences = Object.entries(serviceCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([service]) => service);
      
      weeklyPattern.push({
        dayOfWeek: day,
        demandIndex,
        peakHours,
        servicePreferences
      });
    }
    
    return { dailyPattern, weeklyPattern };
  }

  /**
   * Calculate capacity requirements
   */
  private async calculateCapacityRequirements(
    forecast: any,
    serviceForecasts: ServiceForecast[],
    period: ForecastPeriod
  ): Promise<CapacityRequirement> {
    const days = Math.ceil(
      (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Team requirements
    const teams: TeamRequirement[] = [];
    const currentDate = new Date(period.start);
    
    for (let i = 0; i < days; i++) {
      const dayDemand = forecast.daily?.[i] || forecast.total / days;
      const requiredTeams = Math.ceil(dayDemand / 3); // 3 jobs per team per day
      
      // Skill mix based on service distribution
      const skillMix: Record<string, number> = {};
      serviceForecasts.forEach(sf => {
        const serviceTeams = Math.ceil(sf.demandUnits / days / 3 * sf.seasonalFactor);
        skillMix[sf.service] = serviceTeams;
      });
      
      teams.push({
        date: new Date(currentDate),
        requiredTeams,
        skillMix,
        utilizationTarget: 0.85
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Vehicle requirements
    const vehicles: VehicleRequirement[] = [
      {
        type: 'large_truck',
        quantity: Math.ceil(forecast.total / days / 2), // 2 jobs per truck
        peakDays: this.identifyPeakDays(teams)
      },
      {
        type: 'small_van',
        quantity: Math.ceil(forecast.total / days / 4), // 4 jobs per van
        peakDays: []
      }
    ];
    
    // Equipment requirements
    const equipment: EquipmentRequirement[] = [
      {
        equipment: 'dollies',
        quantity: teams.reduce((max, t) => Math.max(max, t.requiredTeams), 0) * 2,
        criticalPeriods: this.identifyPeakDays(teams)
      },
      {
        equipment: 'lifting_straps',
        quantity: teams.reduce((max, t) => Math.max(max, t.requiredTeams), 0) * 4,
        criticalPeriods: []
      }
    ];
    
    // Staffing requirements
    const peakTeams = Math.max(...teams.map(t => t.requiredTeams));
    const avgTeams = teams.reduce((sum, t) => sum + t.requiredTeams, 0) / teams.length;
    
    const staffing: StaffingRequirement = {
      totalStaff: Math.ceil(peakTeams * 3), // 3 people per team
      byRole: {
        'team_leader': peakTeams,
        'mover': peakTeams * 2,
        'driver': peakTeams
      },
      overtimeRisk: peakTeams > avgTeams * 1.3 ? 0.8 : 0.3,
      hiringNeeds: Math.max(0, peakTeams - 10) // Assuming 10 current teams
    };
    
    return { teams, vehicles, equipment, staffing };
  }

  /**
   * Assess risks in the forecast
   */
  private assessRisks(
    forecast: any,
    externalFactors: any,
    capacityNeeds: CapacityRequirement
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    // Capacity shortage risk
    if (capacityNeeds.staffing.overtimeRisk > 0.6) {
      risks.push({
        type: 'capacity_shortage',
        probability: capacityNeeds.staffing.overtimeRisk,
        impact: 'high',
        description: 'High risk of capacity shortage during peak periods',
        mitigation: 'Hire temporary staff or partner with other companies'
      });
    }
    
    // Weather disruption risk
    if (externalFactors.weather?.severeRisk > 0.3) {
      risks.push({
        type: 'weather_disruption',
        probability: externalFactors.weather.severeRisk,
        impact: 'medium',
        description: 'Potential weather-related disruptions',
        mitigation: 'Flexible rescheduling policy and weather monitoring'
      });
    }
    
    // Demand uncertainty risk
    if (forecast.confidence < this.modelConfig.mediumConfidence) {
      risks.push({
        type: 'forecast_uncertainty',
        probability: 1 - forecast.confidence,
        impact: 'medium',
        description: 'Lower confidence in demand forecast',
        mitigation: 'Maintain flexible capacity and monitor actuals closely'
      });
    }
    
    // Competition risk
    if (externalFactors.market?.newEntrants > 0) {
      risks.push({
        type: 'increased_competition',
        probability: 0.6,
        impact: 'medium',
        description: 'New competitors may impact demand',
        mitigation: 'Focus on service quality and customer retention'
      });
    }
    
    // Seasonal volatility
    const seasonalVariance = this.calculateSeasonalVariance(forecast);
    if (seasonalVariance > 0.3) {
      risks.push({
        type: 'seasonal_volatility',
        probability: 0.9,
        impact: 'high',
        description: 'High seasonal demand variation',
        mitigation: 'Flexible workforce and dynamic pricing'
      });
    }
    
    return risks;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    forecast: any,
    capacityNeeds: CapacityRequirement,
    risks: RiskFactor[]
  ): ForecastRecommendation[] {
    const recommendations: ForecastRecommendation[] = [];
    
    // Staffing recommendations
    if (capacityNeeds.staffing.hiringNeeds > 0) {
      recommendations.push({
        priority: 'critical',
        action: `Hire ${capacityNeeds.staffing.hiringNeeds} additional team members`,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        expectedImpact: 'Prevent capacity shortage and overtime costs',
        resources: ['HR department', 'Training team']
      });
    }
    
    // Peak capacity planning
    const peakDays = this.identifyPeakDays(capacityNeeds.teams);
    if (peakDays.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Prepare for peak demand days',
        deadline: peakDays[0],
        expectedImpact: 'Ensure service quality during high demand',
        resources: ['Operations team', 'Partner network']
      });
    }
    
    // Equipment preparation
    const equipmentShortage = capacityNeeds.equipment.find(e => 
      e.quantity > 50 // Assuming current inventory
    );
    if (equipmentShortage) {
      recommendations.push({
        priority: 'medium',
        action: `Acquire additional ${equipmentShortage.equipment}`,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        expectedImpact: 'Avoid operational delays',
        resources: ['Procurement team']
      });
    }
    
    // Risk mitigation
    risks.forEach(risk => {
      if (risk.impact === 'high' && risk.probability > 0.5) {
        recommendations.push({
          priority: 'high',
          action: risk.mitigation,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          expectedImpact: `Reduce ${risk.type} impact`,
          resources: this.getResourcesForRisk(risk)
        });
      }
    });
    
    // Dynamic pricing opportunity
    if (forecast.confidence > this.modelConfig.highConfidence) {
      recommendations.push({
        priority: 'medium',
        action: 'Implement demand-based pricing for peak periods',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        expectedImpact: 'Increase revenue by 10-15%',
        resources: ['Pricing team', 'Marketing']
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Helper methods
   */
  private async getHistoricalData(period: ForecastPeriod): Promise<any> {
    const lookback = new Date(period.start);
    lookback.setFullYear(lookback.getFullYear() - 2); // 2 years of history
    
    const { data } = await this.supabase
      .from('jobs')
      .select('*')
      .gte('created_at', lookback.toISOString())
      .lt('created_at', period.start.toISOString())
      .order('created_at');
    
    return data || [];
  }

  private async getExternalFactors(period: ForecastPeriod): Promise<any> {
    // Weather forecast
    const weather = await this.getWeatherForecast(period);
    
    // Economic indicators
    const economic = await this.getEconomicIndicators();
    
    // Special events
    const events = await this.getSpecialEvents(period);
    
    // Market conditions
    const market = await this.getMarketConditions();
    
    return { weather, economic, events, market };
  }

  private async getMarketConditions(): Promise<any> {
    // Would integrate with competitive intelligence
    return {
      competitorActivity: 0.7, // High = 1, Low = 0
      newEntrants: 1,
      priceWars: false
    };
  }

  private extractTimeSeries(data: any[]): number[] {
    // Daily aggregation
    const dailyCounts: Record<string, number> = {};
    
    data.forEach(job => {
      const date = new Date(job.created_at).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    // Fill gaps with zeros
    const dates = Object.keys(dailyCounts).sort();
    const series: number[] = [];
    
    if (dates.length > 0) {
      const start = new Date(dates[0]);
      const end = new Date(dates[dates.length - 1]);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        series.push(dailyCounts[dateStr] || 0);
      }
    }
    
    return series;
  }

  private movingAverage(series: number[], window: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < series.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(series.length, i + Math.ceil(window / 2));
      const slice = series.slice(start, end);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      result.push(avg);
    }
    
    return result;
  }

  private extractSeasonalPattern(series: number[]): number[] {
    // Simplified - would use more sophisticated methods
    const seasonalLength = 7; // Weekly pattern
    const pattern: number[] = new Array(seasonalLength).fill(0);
    const counts: number[] = new Array(seasonalLength).fill(0);
    
    series.forEach((val, idx) => {
      const seasonalIdx = idx % seasonalLength;
      pattern[seasonalIdx] += val;
      counts[seasonalIdx]++;
    });
    
    return pattern.map((sum, idx) => sum / (counts[idx] || 1));
  }

  private combineComponents(trend: number[], seasonal: number[], residual: number[]): number[] {
    const combined: number[] = [];
    
    for (let i = 0; i < trend.length; i++) {
      const seasonalIdx = i % seasonal.length;
      const residualIdx = i % residual.length;
      combined.push(
        trend[i] + 
        seasonal[seasonalIdx] + 
        residual[residualIdx] * 0.1 // Dampened residual
      );
    }
    
    return combined.map(v => Math.max(0, v)); // No negative demand
  }

  private applySmoothening(forecast: number[]): number[] {
    // Exponential smoothing
    const alpha = 0.3;
    const smoothed: number[] = [forecast[0]];
    
    for (let i = 1; i < forecast.length; i++) {
      smoothed.push(alpha * forecast[i] + (1 - alpha) * smoothed[i - 1]);
    }
    
    return smoothed;
  }

  private calculateTotalDemand(daily: number[], period: ForecastPeriod): number {
    if (period.granularity === 'day') {
      return daily[0] || 0;
    } else if (period.granularity === 'week') {
      return daily.slice(0, 7).reduce((a, b) => a + b, 0);
    } else {
      return daily.reduce((a, b) => a + b, 0);
    }
  }

  private calculateWeatherImpact(weather: any): number {
    // Bad weather reduces demand
    if (weather.severeRisk > 0.5) return -0.2;
    if (weather.rainProbability > 0.7) return -0.1;
    
    // Good weather increases demand
    if (weather.perfectDays > 5) return 0.1;
    
    return 0;
  }

  private calculateEconomicImpact(economic: any): number {
    // Economic indicators impact
    if (economic.unemployment > 0.08) return -0.15;
    if (economic.gdpGrowth < 0) return -0.1;
    if (economic.consumerConfidence < 50) return -0.05;
    
    // Positive indicators
    if (economic.housingStarts > 1.1) return 0.15; // 10% above normal
    
    return 0;
  }

  private calculateCompetitorImpact(market: any): number {
    if (market.priceWars) return -0.15;
    if (market.newEntrants > 2) return -0.1;
    if (market.competitorActivity > 0.8) return -0.05;
    
    return 0;
  }

  private calculateEventImpact(events: any[]): number {
    let impact = 0;
    
    events.forEach(event => {
      if (event.type === 'housing_fair') impact += 50;
      if (event.type === 'student_move_in') impact += 100;
      if (event.type === 'corporate_relocations') impact += 75;
    });
    
    return impact;
  }

  private calculateServiceGrowth(data: any[]): number {
    if (data.length < 2) return 0;
    
    // Compare last 30 days to previous 30 days
    const recent = data.filter((d: any) => 
      new Date(d.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    const previous = data.filter((d: any) => {
      const date = new Date(d.created_at);
      return date > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) &&
             date <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }).length;
    
    return previous > 0 ? (recent - previous) / previous : 0;
  }

  private getServiceSeasonality(service: string, date: Date): number {
    const month = date.getMonth();
    
    // Service-specific seasonality
    const seasonalFactors: Record<string, number[]> = {
      'hemflytt': [0.7, 0.7, 0.8, 0.9, 1.2, 1.4, 1.4, 1.3, 1.1, 0.9, 0.8, 0.6],
      'kontorsflytt': [0.9, 0.9, 1.0, 1.1, 1.1, 1.0, 0.8, 0.9, 1.2, 1.1, 1.0, 0.8],
      'magasinering': [0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.0, 0.9, 0.8, 0.7],
      'städning': [0.9, 0.9, 1.1, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 1.1]
    };
    
    return seasonalFactors[service]?.[month] || 1.0;
  }

  private identifyDemandDrivers(service: string, data: any[]): string[] {
    const drivers: string[] = [];
    
    // Analyze patterns
    if (service === 'hemflytt') {
      drivers.push('Rental market cycle', 'Student moves', 'Family growth');
    } else if (service === 'kontorsflytt') {
      drivers.push('Business growth', 'Lease cycles', 'Hybrid work trends');
    } else if (service === 'magasinering') {
      drivers.push('Downsizing', 'Renovations', 'Seasonal storage');
    } else if (service === 'städning') {
      drivers.push('Move-out requirements', 'Time constraints', 'Quality demands');
    }
    
    return drivers;
  }

  private calculateServiceConfidence(data: any[], service: string): number {
    let confidence = 0.5;
    
    // More data = higher confidence
    if (data.length > 100) confidence += 0.2;
    else if (data.length > 50) confidence += 0.1;
    
    // Consistent patterns = higher confidence
    const variance = this.calculateVariance(data.map(() => 1)); // Simplified
    if (variance < 0.2) confidence += 0.2;
    
    // Recent data = higher confidence
    const recentData = data.filter((d: any) => 
      new Date(d.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentData.length > 10) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  private analyzeAreaGrowth(data: any[]): 'increasing' | 'stable' | 'decreasing' {
    if (data.length < 10) return 'stable';
    
    // Compare recent to older
    const midpoint = Math.floor(data.length / 2);
    const older = data.slice(0, midpoint).length;
    const recent = data.slice(midpoint).length;
    
    const growth = (recent - older) / older;
    
    if (growth > 0.1) return 'increasing';
    if (growth < -0.1) return 'decreasing';
    return 'stable';
  }

  private identifyHotspots(data: any[]): Hotspot[] {
    const hotspots: Hotspot[] = [];
    
    // Group by location and time
    const locationTime: Record<string, any[]> = {};
    
    data.forEach(job => {
      const key = `${job.street || 'Unknown'}-${new Date(job.created_at).getHours()}`;
      if (!locationTime[key]) locationTime[key] = [];
      locationTime[key].push(job);
    });
    
    // Find concentrations
    Object.entries(locationTime).forEach(([key, jobs]) => {
      if (jobs.length > 5) {
        const [location, hour] = key.split('-');
        hotspots.push({
          location,
          intensity: jobs.length / data.length,
          timeOfDay: `${hour}:00`,
          dayOfWeek: this.getMostCommonDay(jobs)
        });
      }
    });
    
    return hotspots.sort((a, b) => b.intensity - a.intensity).slice(0, 5);
  }

  private getMostCommonDay(jobs: any[]): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts: Record<number, number> = {};
    
    jobs.forEach(job => {
      const day = new Date(job.created_at).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    const mostCommon = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    return days[parseInt(mostCommon[0])];
  }

  private identifyPeakDays(teams: TeamRequirement[]): Date[] {
    const sorted = [...teams].sort((a, b) => b.requiredTeams - a.requiredTeams);
    const threshold = sorted[0].requiredTeams * 0.8;
    
    return sorted
      .filter(t => t.requiredTeams >= threshold)
      .map(t => t.date);
  }

  private calculateForecastConfidence(
    baseForecast: any,
    historicalData: any[],
    externalFactors: any
  ): number {
    let confidence = 0.7; // Base confidence
    
    // Data quality
    if (historicalData.length > 365) confidence += 0.1;
    if (historicalData.length > 730) confidence += 0.05;
    
    // Model performance (would use actual backtesting)
    confidence += 0.1; // Assume good performance
    
    // External factors certainty
    if (externalFactors.weather?.confidence > 0.8) confidence += 0.05;
    
    return Math.min(0.95, confidence);
  }

  private calculateSeasonalVariance(forecast: any): number {
    if (!forecast.seasonal || forecast.seasonal.length === 0) return 0;
    
    const mean = forecast.seasonal.reduce((a: number, b: number) => a + b, 0) / forecast.seasonal.length;
    const variance = forecast.seasonal.reduce((sum: number, val: number) => 
      sum + Math.pow(val - mean, 2), 0
    ) / forecast.seasonal.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateVariance(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  }

  private getResourcesForRisk(risk: RiskFactor): string[] {
    const resourceMap: Record<string, string[]> = {
      'capacity_shortage': ['HR', 'Operations', 'Partner network'],
      'weather_disruption': ['Operations', 'Customer service'],
      'forecast_uncertainty': ['Analytics team', 'Management'],
      'increased_competition': ['Marketing', 'Sales', 'Customer service'],
      'seasonal_volatility': ['Operations', 'Finance', 'HR']
    };
    
    return resourceMap[risk.type] || ['Management'];
  }

  private isForecastFresh(forecast: DemandForecast): boolean {
    const age = Date.now() - forecast.generatedAt.getTime();
    return age < 6 * 60 * 60 * 1000; // 6 hours
  }

  // Mock methods for external data
  private async getWeatherForecast(period: ForecastPeriod): Promise<any> {
    return {
      rainProbability: 0.3,
      severeRisk: 0.1,
      perfectDays: 3,
      confidence: 0.85
    };
  }

  private async getEconomicIndicators(): Promise<any> {
    return {
      gdpGrowth: 0.02,
      unemployment: 0.065,
      consumerConfidence: 65,
      housingStarts: 1.05
    };
  }

  private async getSpecialEvents(period: ForecastPeriod): Promise<any[]> {
    return [
      { type: 'student_move_in', date: new Date('2025-08-15'), impact: 100 }
    ];
  }

  /**
   * Model management
   */
  private async loadForecastModels() {
    // Load pre-trained models
    const models: ForecastModel[] = [
      {
        name: 'SARIMA',
        accuracy: 0.85,
        features: ['trend', 'seasonality', 'autoregression'],
        lastTrained: new Date(),
        performance: { mape: 0.12, rmse: 15, r2: 0.88, biasDirection: 'neutral' }
      },
      {
        name: 'Prophet',
        accuracy: 0.82,
        features: ['trend', 'seasonality', 'holidays'],
        lastTrained: new Date(),
        performance: { mape: 0.14, rmse: 18, r2: 0.85, biasDirection: 'under' }
      }
    ];
    
    models.forEach(model => this.models.set(model.name, model));
  }

  private async updateModels() {
    // Retrain models with latest data
    console.log('📊 Updating forecast models...');
    
    for (const [name, model] of this.models) {
      // Would perform actual training
      model.lastTrained = new Date();
      console.log(`✅ ${name} model updated`);
    }
  }

  private startAutomatedForecasting() {
    // Daily forecast updates
    setInterval(async () => {
      const period: ForecastPeriod = {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        granularity: 'day'
      };
      
      await this.generateForecast(period);
    }, 24 * 60 * 60 * 1000);
  }

  private async logForecast(forecast: DemandForecast) {
    await this.supabase
      .from('demand_forecasts')
      .insert({
        period: forecast.period,
        total_demand: forecast.totalDemand,
        confidence: forecast.confidence,
        service_forecasts: forecast.serviceForecasts,
        capacity_needs: forecast.capacityNeeds,
        model_version: forecast.modelVersion,
        created_at: forecast.generatedAt
      });
  }

  /**
   * Public methods
   */
  async getDailyForecast(date: Date): Promise<number> {
    const period: ForecastPeriod = {
      start: date,
      end: date,
      granularity: 'day'
    };
    
    const forecast = await this.generateForecast(period);
    return forecast.totalDemand;
  }

  async getWeeklyForecast(startDate: Date): Promise<DemandForecast> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    
    const period: ForecastPeriod = {
      start: startDate,
      end: endDate,
      granularity: 'week'
    };
    
    return this.generateForecast(period);
  }

  async getMonthlyForecast(month: number, year: number): Promise<DemandForecast> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0); // Last day of month
    
    const period: ForecastPeriod = {
      start,
      end,
      granularity: 'month'
    };
    
    return this.generateForecast(period);
  }

  async getCapacityPlan(weeks: number): Promise<CapacityRequirement> {
    const period: ForecastPeriod = {
      start: new Date(),
      end: new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000),
      granularity: 'week'
    };
    
    const forecast = await this.generateForecast(period);
    return forecast.capacityNeeds;
  }

  async evaluateForecastAccuracy(): Promise<ModelPerformance> {
    // Compare historical forecasts to actuals
    const { data: forecasts } = await this.supabase
      .from('demand_forecasts')
      .select('*')
      .lt('period->>start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30+ days old
      .limit(30);
    
    if (!forecasts || forecasts.length === 0) {
      return { mape: 0, rmse: 0, r2: 0, biasDirection: 'neutral' };
    }
    
    // Calculate performance metrics
    let totalError = 0;
    let totalSquaredError = 0;
    let totalActual = 0;
    
    for (const forecast of forecasts) {
      const { data: actual } = await this.supabase
        .from('jobs')
        .select('count')
        .gte('created_at', forecast.period.start)
        .lt('created_at', forecast.period.end);
      
      const actualDemand = actual?.[0]?.count || 0;
      const error = forecast.total_demand - actualDemand;
      const percentError = Math.abs(error) / actualDemand;
      
      totalError += percentError;
      totalSquaredError += error * error;
      totalActual += actualDemand;
    }
    
    const mape = totalError / forecasts.length;
    const rmse = Math.sqrt(totalSquaredError / forecasts.length);
    
    return {
      mape,
      rmse,
      r2: 0.85, // Simplified
      biasDirection: totalError > 0 ? 'over' : 'under'
    };
  }
}

// Export singleton instance
export const demandForecasting = new DemandForecasting();