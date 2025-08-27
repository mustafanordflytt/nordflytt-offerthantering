/**
 * Performance Analytics System
 * Real-time performance monitoring and optimization insights
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';
import { aiEngine } from '../core/ai-engine';

export interface PerformanceAnalytics {
  period: AnalyticsPeriod;
  timestamp: Date;
  
  // Business performance
  businessMetrics: BusinessMetrics;
  
  // Operational performance
  operationalMetrics: OperationalMetrics;
  
  // Team performance
  teamPerformance: TeamPerformance[];
  
  // Service performance
  servicePerformance: ServicePerformance[];
  
  // Customer metrics
  customerMetrics: CustomerMetrics;
  
  // Financial performance
  financialMetrics: FinancialMetrics;
  
  // AI system performance
  aiPerformance: AISystemMetrics;
  
  // Benchmarks and comparisons
  benchmarks: PerformanceBenchmark[];
  
  // Insights and recommendations
  insights: PerformanceInsight[];
  recommendations: ActionableRecommendation[];
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  comparison?: AnalyticsPeriod; // For YoY, MoM comparisons
}

export interface BusinessMetrics {
  revenue: MetricValue;
  orders: MetricValue;
  averageOrderValue: MetricValue;
  marketShare: MetricValue;
  growthRate: MetricValue;
  
  // Detailed breakdowns
  revenueByService: Record<string, MetricValue>;
  revenueBySegment: Record<string, MetricValue>;
  revenueByChannel: Record<string, MetricValue>;
}

export interface MetricValue {
  current: number;
  previous?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  variance?: number;
}

export interface OperationalMetrics {
  efficiency: EfficiencyMetrics;
  quality: QualityMetrics;
  productivity: ProductivityMetrics;
  utilization: UtilizationMetrics;
}

export interface EfficiencyMetrics {
  jobCompletionTime: MetricValue;
  routeOptimization: MetricValue;
  fuelEfficiency: MetricValue;
  scheduleAdherence: MetricValue;
  firstTimeResolution: MetricValue;
}

export interface QualityMetrics {
  customerSatisfaction: MetricValue;
  serviceQualityScore: MetricValue;
  defectRate: MetricValue;
  complaintRate: MetricValue;
  repeatBusinessRate: MetricValue;
}

export interface ProductivityMetrics {
  jobsPerTeam: MetricValue;
  revenuePerEmployee: MetricValue;
  averageJobValue: MetricValue;
  crossSellRate: MetricValue;
  conversionRate: MetricValue;
}

export interface UtilizationMetrics {
  teamUtilization: MetricValue;
  vehicleUtilization: MetricValue;
  equipmentUtilization: MetricValue;
  warehouseUtilization: MetricValue;
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  
  // Performance scores
  overallScore: number;
  efficiencyScore: number;
  qualityScore: number;
  reliabilityScore: number;
  
  // Detailed metrics
  jobsCompleted: number;
  revenue: number;
  customerRating: number;
  onTimeRate: number;
  
  // Rankings
  rank: number;
  previousRank?: number;
  
  // Strengths and improvements
  strengths: string[];
  improvementAreas: string[];
}

export interface ServicePerformance {
  service: string;
  
  // Volume and revenue
  volume: MetricValue;
  revenue: MetricValue;
  profitMargin: MetricValue;
  
  // Quality and efficiency
  completionTime: MetricValue;
  customerSatisfaction: MetricValue;
  defectRate: MetricValue;
  
  // Market position
  marketShare: MetricValue;
  competitivePosition: string;
  
  // Growth
  growthRate: MetricValue;
  demandTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface CustomerMetrics {
  // Acquisition
  newCustomers: MetricValue;
  acquisitionCost: MetricValue;
  leadConversionRate: MetricValue;
  
  // Retention
  retentionRate: MetricValue;
  churnRate: MetricValue;
  lifetimeValue: MetricValue;
  
  // Satisfaction
  nps: MetricValue;
  csat: MetricValue;
  customerEffortScore: MetricValue;
  
  // Engagement
  repeatPurchaseRate: MetricValue;
  referralRate: MetricValue;
  reviewRate: MetricValue;
}

export interface FinancialMetrics {
  // Revenue metrics
  totalRevenue: MetricValue;
  recurringRevenue: MetricValue;
  revenueGrowth: MetricValue;
  
  // Profitability
  grossProfit: MetricValue;
  grossMargin: MetricValue;
  operatingProfit: MetricValue;
  netMargin: MetricValue;
  
  // Efficiency
  costPerJob: MetricValue;
  overheadRatio: MetricValue;
  laborCostRatio: MetricValue;
  
  // Cash flow
  cashFlow: MetricValue;
  daysOutstanding: MetricValue;
  workingCapital: MetricValue;
}

export interface AISystemMetrics {
  // Decision making
  decisionsAutomated: MetricValue;
  automationRate: MetricValue;
  decisionAccuracy: MetricValue;
  
  // Model performance
  leadScoringAccuracy: MetricValue;
  demandForecastAccuracy: MetricValue;
  pricingOptimization: MetricValue;
  
  // System efficiency
  averageResponseTime: MetricValue;
  systemUptime: MetricValue;
  errorRate: MetricValue;
  
  // Business impact
  revenueImpact: MetricValue;
  efficiencyGains: MetricValue;
  costSavings: MetricValue;
}

export interface PerformanceBenchmark {
  metric: string;
  ourValue: number;
  industryAverage: number;
  topPerformer: number;
  percentile: number;
  gap: number;
  recommendation: string;
}

export interface PerformanceInsight {
  type: 'achievement' | 'warning' | 'opportunity' | 'risk';
  category: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  metrics: string[];
  evidence: any[];
}

export interface ActionableRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  action: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  owner: string;
  kpis: string[];
}

export class PerformanceAnalytics extends EventEmitter {
  private supabase = createClient();
  private analyticsVersion = '2.5';
  private metricsCache = new Map<string, any>();
  
  // Analytics configuration
  private readonly config = {
    // Thresholds
    excellentThreshold: 0.9,
    goodThreshold: 0.75,
    warningThreshold: 0.6,
    criticalThreshold: 0.5,
    
    // Benchmarking
    industryComparison: true,
    internalComparison: true,
    
    // Real-time monitoring
    updateInterval: 5 * 60 * 1000, // 5 minutes
    alertThresholds: {
      revenue: -0.1, // 10% drop
      satisfaction: -0.05, // 5% drop
      efficiency: -0.15 // 15% drop
    }
  };
  
  // Industry benchmarks (Swedish moving industry)
  private readonly industryBenchmarks = {
    customerSatisfaction: 4.2,
    onTimeDelivery: 0.92,
    profitMargin: 0.12,
    employeeTurnover: 0.15,
    conversionRate: 0.18,
    repeatCustomerRate: 0.35
  };
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('📈 Initializing Performance Analytics v2.5...');
    
    // Start real-time monitoring
    this.startRealtimeMonitoring();
    
    // Initialize dashboards
    this.initializeDashboards();
    
    // Load historical data
    await this.loadHistoricalData();
    
    console.log('✅ Performance Analytics ready');
    this.emit('ready');
  }

  /**
   * Generate comprehensive performance analytics
   */
  async generateAnalytics(period: AnalyticsPeriod): Promise<PerformanceAnalytics> {
    const startTime = Date.now();
    
    try {
      // Gather all metrics
      const [
        businessMetrics,
        operationalMetrics,
        teamPerformance,
        servicePerformance,
        customerMetrics,
        financialMetrics,
        aiPerformance
      ] = await Promise.all([
        this.calculateBusinessMetrics(period),
        this.calculateOperationalMetrics(period),
        this.analyzeTeamPerformance(period),
        this.analyzeServicePerformance(period),
        this.calculateCustomerMetrics(period),
        this.calculateFinancialMetrics(period),
        this.analyzeAIPerformance(period)
      ]);
      
      // Generate benchmarks
      const benchmarks = await this.generateBenchmarks({
        businessMetrics,
        operationalMetrics,
        customerMetrics,
        financialMetrics
      });
      
      // Generate insights
      const insights = this.generateInsights({
        businessMetrics,
        operationalMetrics,
        teamPerformance,
        servicePerformance,
        customerMetrics,
        financialMetrics,
        aiPerformance
      });
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(insights, benchmarks);
      
      const analytics: PerformanceAnalytics = {
        period,
        timestamp: new Date(),
        businessMetrics,
        operationalMetrics,
        teamPerformance,
        servicePerformance,
        customerMetrics,
        financialMetrics,
        aiPerformance,
        benchmarks,
        insights,
        recommendations
      };
      
      // Cache results
      this.cacheAnalytics(period, analytics);
      
      // Log analytics
      await this.logAnalytics(analytics);
      
      // Check for alerts
      this.checkAlerts(analytics);
      
      // Emit event
      this.emit('analytics-generated', {
        analytics,
        processingTime: Date.now() - startTime
      });
      
      return analytics;
      
    } catch (error) {
      console.error('❌ Error generating analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate business metrics
   */
  private async calculateBusinessMetrics(period: AnalyticsPeriod): Promise<BusinessMetrics> {
    // Current period data
    const { data: currentData } = await this.supabase
      .from('jobs')
      .select('*, invoices(*)')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    // Previous period data for comparison
    const previousPeriod = this.getPreviousPeriod(period);
    const { data: previousData } = await this.supabase
      .from('jobs')
      .select('*, invoices(*)')
      .gte('created_at', previousPeriod.start.toISOString())
      .lte('created_at', previousPeriod.end.toISOString());
    
    // Calculate metrics
    const currentRevenue = this.sumRevenue(currentData || []);
    const previousRevenue = this.sumRevenue(previousData || []);
    const currentOrders = currentData?.length || 0;
    const previousOrders = previousData?.length || 0;
    
    // Revenue by dimensions
    const revenueByService = this.groupRevenueBy(currentData || [], 'service_type');
    const revenueBySegment = this.groupRevenueBy(currentData || [], 'customer_segment');
    const revenueByChannel = this.groupRevenueBy(currentData || [], 'acquisition_channel');
    
    return {
      revenue: this.createMetricValue(currentRevenue, previousRevenue),
      orders: this.createMetricValue(currentOrders, previousOrders),
      averageOrderValue: this.createMetricValue(
        currentOrders > 0 ? currentRevenue / currentOrders : 0,
        previousOrders > 0 ? previousRevenue / previousOrders : 0
      ),
      marketShare: await this.calculateMarketShare(currentRevenue),
      growthRate: this.createMetricValue(
        this.calculateGrowthRate(currentRevenue, previousRevenue),
        0
      ),
      revenueByService: this.createMetricValueMap(revenueByService),
      revenueBySegment: this.createMetricValueMap(revenueBySegment),
      revenueByChannel: this.createMetricValueMap(revenueByChannel)
    };
  }

  /**
   * Calculate operational metrics
   */
  private async calculateOperationalMetrics(period: AnalyticsPeriod): Promise<OperationalMetrics> {
    // Efficiency metrics
    const efficiency = await this.calculateEfficiencyMetrics(period);
    
    // Quality metrics
    const quality = await this.calculateQualityMetrics(period);
    
    // Productivity metrics
    const productivity = await this.calculateProductivityMetrics(period);
    
    // Utilization metrics
    const utilization = await this.calculateUtilizationMetrics(period);
    
    return {
      efficiency,
      quality,
      productivity,
      utilization
    };
  }

  /**
   * Analyze team performance
   */
  private async analyzeTeamPerformance(period: AnalyticsPeriod): Promise<TeamPerformance[]> {
    const { data: teams } = await this.supabase
      .from('teams')
      .select('*')
      .eq('active', true);
    
    if (!teams) return [];
    
    const performances = await Promise.all(
      teams.map(async team => {
        // Get team metrics
        const { data: jobs } = await this.supabase
          .from('job_assignments')
          .select('*, jobs(*), customer_feedback(*)')
          .eq('team_id', team.id)
          .gte('scheduled_start', period.start.toISOString())
          .lte('scheduled_start', period.end.toISOString());
        
        const jobsCompleted = jobs?.filter(j => j.jobs?.status === 'completed').length || 0;
        const revenue = this.sumRevenue(jobs?.map(j => j.jobs) || []);
        const ratings = jobs?.map(j => j.customer_feedback?.rating).filter(r => r) || [];
        const customerRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;
        
        const onTimeJobs = jobs?.filter(j => {
          const scheduled = new Date(j.scheduled_start);
          const actual = new Date(j.jobs?.actual_start || scheduled);
          return Math.abs(scheduled.getTime() - actual.getTime()) < 30 * 60 * 1000; // 30 min
        }).length || 0;
        
        const onTimeRate = jobsCompleted > 0 ? onTimeJobs / jobsCompleted : 0;
        
        // Calculate scores
        const efficiencyScore = this.calculateEfficiencyScore(team, jobs || []);
        const qualityScore = customerRating / 5;
        const reliabilityScore = onTimeRate;
        const overallScore = (efficiencyScore + qualityScore + reliabilityScore) / 3;
        
        // Identify strengths and improvements
        const { strengths, improvementAreas } = this.analyzeTeamStrengths({
          efficiencyScore,
          qualityScore,
          reliabilityScore,
          customerRating,
          onTimeRate
        });
        
        return {
          teamId: team.id,
          teamName: team.name,
          overallScore,
          efficiencyScore,
          qualityScore,
          reliabilityScore,
          jobsCompleted,
          revenue,
          customerRating,
          onTimeRate,
          rank: 0, // Will be set after sorting
          strengths,
          improvementAreas
        };
      })
    );
    
    // Rank teams
    const ranked = performances
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((team, index) => ({ ...team, rank: index + 1 }));
    
    // Add previous ranks if available
    const previousRanks = await this.getPreviousTeamRanks(period);
    ranked.forEach(team => {
      team.previousRank = previousRanks[team.teamId];
    });
    
    return ranked;
  }

  /**
   * Analyze service performance
   */
  private async analyzeServicePerformance(period: AnalyticsPeriod): Promise<ServicePerformance[]> {
    const services = ['hemflytt', 'kontorsflytt', 'magasinering', 'städning'];
    
    return Promise.all(
      services.map(async service => {
        // Get service data
        const { data: currentJobs } = await this.supabase
          .from('jobs')
          .select('*, invoices(*), customer_feedback(*)')
          .eq('service_type', service)
          .gte('created_at', period.start.toISOString())
          .lte('created_at', period.end.toISOString());
        
        const previousPeriod = this.getPreviousPeriod(period);
        const { data: previousJobs } = await this.supabase
          .from('jobs')
          .select('*, invoices(*)')
          .eq('service_type', service)
          .gte('created_at', previousPeriod.start.toISOString())
          .lte('created_at', previousPeriod.end.toISOString());
        
        // Calculate metrics
        const currentVolume = currentJobs?.length || 0;
        const previousVolume = previousJobs?.length || 0;
        const currentRevenue = this.sumRevenue(currentJobs || []);
        const previousRevenue = this.sumRevenue(previousJobs || []);
        
        // Profit margin
        const costs = await this.calculateServiceCosts(service, currentJobs || []);
        const profit = currentRevenue - costs;
        const margin = currentRevenue > 0 ? profit / currentRevenue : 0;
        
        // Quality metrics
        const completionTimes = currentJobs
          ?.map(j => j.actual_duration || j.estimated_duration)
          .filter(t => t) || [];
        const avgCompletionTime = completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0;
        
        const ratings = currentJobs
          ?.map(j => j.customer_feedback?.rating)
          .filter(r => r) || [];
        const satisfaction = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;
        
        const defects = currentJobs?.filter(j => j.customer_feedback?.has_issues).length || 0;
        const defectRate = currentVolume > 0 ? defects / currentVolume : 0;
        
        // Market analysis
        const marketShare = await this.calculateServiceMarketShare(service, currentRevenue);
        const competitivePosition = this.assessCompetitivePosition(marketShare);
        
        // Growth analysis
        const growthRate = this.calculateGrowthRate(currentVolume, previousVolume);
        const demandTrend = this.analyzeDemandTrend(currentJobs || [], previousJobs || []);
        
        return {
          service,
          volume: this.createMetricValue(currentVolume, previousVolume),
          revenue: this.createMetricValue(currentRevenue, previousRevenue),
          profitMargin: this.createMetricValue(margin, 0),
          completionTime: this.createMetricValue(avgCompletionTime, 0),
          customerSatisfaction: this.createMetricValue(satisfaction, 0),
          defectRate: this.createMetricValue(defectRate, 0),
          marketShare: this.createMetricValue(marketShare.current, marketShare.previous),
          competitivePosition,
          growthRate: this.createMetricValue(growthRate, 0),
          demandTrend
        };
      })
    );
  }

  /**
   * Calculate customer metrics
   */
  private async calculateCustomerMetrics(period: AnalyticsPeriod): Promise<CustomerMetrics> {
    // Acquisition metrics
    const { data: newCustomers } = await this.supabase
      .from('customers')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const { data: leads } = await this.supabase
      .from('leads')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
    const conversionRate = leads && leads.length > 0 ? convertedLeads / leads.length : 0;
    
    // Retention metrics
    const retentionData = await this.calculateRetentionMetrics(period);
    
    // Satisfaction metrics
    const { data: feedback } = await this.supabase
      .from('customer_feedback')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const npsData = this.calculateNPS(feedback || []);
    const csatData = this.calculateCSAT(feedback || []);
    const cesData = this.calculateCES(feedback || []);
    
    // Engagement metrics
    const engagementData = await this.calculateEngagementMetrics(period);
    
    // Previous period for comparison
    const previousPeriod = this.getPreviousPeriod(period);
    const previousMetrics = await this.getPreviousCustomerMetrics(previousPeriod);
    
    return {
      newCustomers: this.createMetricValue(
        newCustomers?.length || 0,
        previousMetrics.newCustomers
      ),
      acquisitionCost: this.createMetricValue(
        await this.calculateCAC(period),
        previousMetrics.acquisitionCost
      ),
      leadConversionRate: this.createMetricValue(conversionRate, previousMetrics.conversionRate),
      retentionRate: this.createMetricValue(retentionData.rate, previousMetrics.retentionRate),
      churnRate: this.createMetricValue(retentionData.churn, previousMetrics.churnRate),
      lifetimeValue: this.createMetricValue(retentionData.ltv, previousMetrics.lifetimeValue),
      nps: this.createMetricValue(npsData.score, previousMetrics.nps),
      csat: this.createMetricValue(csatData.score, previousMetrics.csat),
      customerEffortScore: this.createMetricValue(cesData.score, previousMetrics.ces),
      repeatPurchaseRate: this.createMetricValue(
        engagementData.repeatRate,
        previousMetrics.repeatRate
      ),
      referralRate: this.createMetricValue(
        engagementData.referralRate,
        previousMetrics.referralRate
      ),
      reviewRate: this.createMetricValue(
        engagementData.reviewRate,
        previousMetrics.reviewRate
      )
    };
  }

  /**
   * Calculate financial metrics
   */
  private async calculateFinancialMetrics(period: AnalyticsPeriod): Promise<FinancialMetrics> {
    // Revenue data
    const { data: invoices } = await this.supabase
      .from('invoices')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
    const recurringRevenue = invoices
      ?.filter(inv => inv.type === 'recurring')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
    
    // Cost data
    const { data: expenses } = await this.supabase
      .from('expenses')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const totalCosts = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    const laborCosts = expenses
      ?.filter(exp => exp.category === 'labor')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    const overheadCosts = expenses
      ?.filter(exp => exp.category === 'overhead')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    
    // Calculate margins
    const grossProfit = totalRevenue - (totalCosts * 0.6); // Simplified
    const operatingProfit = grossProfit - overheadCosts;
    const netProfit = operatingProfit * 0.75; // After tax simplified
    
    // Job costs
    const { data: jobs } = await this.supabase
      .from('jobs')
      .select('count')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const jobCount = jobs?.[0]?.count || 1;
    const costPerJob = totalCosts / jobCount;
    
    // Previous period
    const previousPeriod = this.getPreviousPeriod(period);
    const previousFinancials = await this.getPreviousFinancialMetrics(previousPeriod);
    
    return {
      totalRevenue: this.createMetricValue(totalRevenue, previousFinancials.revenue),
      recurringRevenue: this.createMetricValue(recurringRevenue, previousFinancials.recurring),
      revenueGrowth: this.createMetricValue(
        this.calculateGrowthRate(totalRevenue, previousFinancials.revenue),
        0
      ),
      grossProfit: this.createMetricValue(grossProfit, previousFinancials.grossProfit),
      grossMargin: this.createMetricValue(
        totalRevenue > 0 ? grossProfit / totalRevenue : 0,
        previousFinancials.grossMargin
      ),
      operatingProfit: this.createMetricValue(operatingProfit, previousFinancials.operatingProfit),
      netMargin: this.createMetricValue(
        totalRevenue > 0 ? netProfit / totalRevenue : 0,
        previousFinancials.netMargin
      ),
      costPerJob: this.createMetricValue(costPerJob, previousFinancials.costPerJob),
      overheadRatio: this.createMetricValue(
        totalRevenue > 0 ? overheadCosts / totalRevenue : 0,
        previousFinancials.overheadRatio
      ),
      laborCostRatio: this.createMetricValue(
        totalRevenue > 0 ? laborCosts / totalRevenue : 0,
        previousFinancials.laborCostRatio
      ),
      cashFlow: this.createMetricValue(0, 0), // Simplified
      daysOutstanding: this.createMetricValue(30, 30), // Simplified
      workingCapital: this.createMetricValue(0, 0) // Simplified
    };
  }

  /**
   * Analyze AI system performance
   */
  private async analyzeAIPerformance(period: AnalyticsPeriod): Promise<AISystemMetrics> {
    // Decision metrics
    const { data: decisions } = await this.supabase
      .from('ai_decisions')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const totalDecisions = decisions?.length || 0;
    const automatedDecisions = decisions?.filter(d => d.automated).length || 0;
    const accurateDecisions = decisions?.filter(d => d.outcome === 'success').length || 0;
    
    // Model performance
    const leadScoringAccuracy = await this.getModelAccuracy('lead_scoring', period);
    const forecastAccuracy = await this.getModelAccuracy('demand_forecast', period);
    const pricingOptimization = await this.getPricingOptimization(period);
    
    // System metrics
    const { data: systemLogs } = await this.supabase
      .from('system_logs')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const responseTimes = systemLogs?.map(log => log.response_time).filter(t => t) || [];
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const errors = systemLogs?.filter(log => log.level === 'error').length || 0;
    const totalLogs = systemLogs?.length || 1;
    
    // Business impact
    const revenueImpact = await this.calculateAIRevenueImpact(period);
    const efficiencyGains = await this.calculateAIEfficiencyGains(period);
    const costSavings = await this.calculateAICostSavings(period);
    
    // Previous period
    const previousPeriod = this.getPreviousPeriod(period);
    const previousAI = await this.getPreviousAIMetrics(previousPeriod);
    
    return {
      decisionsAutomated: this.createMetricValue(automatedDecisions, previousAI.decisions),
      automationRate: this.createMetricValue(
        totalDecisions > 0 ? automatedDecisions / totalDecisions : 0,
        previousAI.automationRate
      ),
      decisionAccuracy: this.createMetricValue(
        automatedDecisions > 0 ? accurateDecisions / automatedDecisions : 0,
        previousAI.accuracy
      ),
      leadScoringAccuracy: this.createMetricValue(leadScoringAccuracy, previousAI.leadScoring),
      demandForecastAccuracy: this.createMetricValue(forecastAccuracy, previousAI.forecast),
      pricingOptimization: this.createMetricValue(pricingOptimization, previousAI.pricing),
      averageResponseTime: this.createMetricValue(avgResponseTime, previousAI.responseTime),
      systemUptime: this.createMetricValue(0.998, 0.995), // Simplified
      errorRate: this.createMetricValue(errors / totalLogs, previousAI.errorRate),
      revenueImpact: this.createMetricValue(revenueImpact, previousAI.revenueImpact),
      efficiencyGains: this.createMetricValue(efficiencyGains, previousAI.efficiency),
      costSavings: this.createMetricValue(costSavings, previousAI.costSavings)
    };
  }

  /**
   * Generate performance benchmarks
   */
  private async generateBenchmarks(metrics: any): Promise<PerformanceBenchmark[]> {
    const benchmarks: PerformanceBenchmark[] = [];
    
    // Customer satisfaction benchmark
    benchmarks.push({
      metric: 'Customer Satisfaction',
      ourValue: metrics.customerMetrics.csat.current,
      industryAverage: this.industryBenchmarks.customerSatisfaction,
      topPerformer: 4.8,
      percentile: this.calculatePercentile(
        metrics.customerMetrics.csat.current,
        this.industryBenchmarks.customerSatisfaction,
        4.8
      ),
      gap: metrics.customerMetrics.csat.current - this.industryBenchmarks.customerSatisfaction,
      recommendation: this.generateBenchmarkRecommendation(
        'satisfaction',
        metrics.customerMetrics.csat.current,
        this.industryBenchmarks.customerSatisfaction
      )
    });
    
    // On-time delivery benchmark
    const onTimeRate = metrics.operationalMetrics.efficiency.scheduleAdherence.current;
    benchmarks.push({
      metric: 'On-Time Delivery',
      ourValue: onTimeRate,
      industryAverage: this.industryBenchmarks.onTimeDelivery,
      topPerformer: 0.98,
      percentile: this.calculatePercentile(onTimeRate, 0.92, 0.98),
      gap: onTimeRate - this.industryBenchmarks.onTimeDelivery,
      recommendation: this.generateBenchmarkRecommendation('delivery', onTimeRate, 0.92)
    });
    
    // Profit margin benchmark
    const margin = metrics.financialMetrics.netMargin.current;
    benchmarks.push({
      metric: 'Net Profit Margin',
      ourValue: margin,
      industryAverage: this.industryBenchmarks.profitMargin,
      topPerformer: 0.18,
      percentile: this.calculatePercentile(margin, 0.12, 0.18),
      gap: margin - this.industryBenchmarks.profitMargin,
      recommendation: this.generateBenchmarkRecommendation('margin', margin, 0.12)
    });
    
    // Conversion rate benchmark
    const conversion = metrics.customerMetrics.leadConversionRate.current;
    benchmarks.push({
      metric: 'Lead Conversion Rate',
      ourValue: conversion,
      industryAverage: this.industryBenchmarks.conversionRate,
      topPerformer: 0.25,
      percentile: this.calculatePercentile(conversion, 0.18, 0.25),
      gap: conversion - this.industryBenchmarks.conversionRate,
      recommendation: this.generateBenchmarkRecommendation('conversion', conversion, 0.18)
    });
    
    return benchmarks;
  }

  /**
   * Generate performance insights
   */
  private generateInsights(metrics: any): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];
    
    // Revenue insights
    if (metrics.businessMetrics.revenue.changePercent > 0.2) {
      insights.push({
        type: 'achievement',
        category: 'Revenue',
        title: 'Strong Revenue Growth',
        description: `Revenue increased by ${(metrics.businessMetrics.revenue.changePercent * 100).toFixed(0)}% compared to previous period`,
        impact: 'high',
        metrics: ['revenue', 'growth_rate'],
        evidence: [{
          current: metrics.businessMetrics.revenue.current,
          previous: metrics.businessMetrics.revenue.previous
        }]
      });
    }
    
    // Efficiency warnings
    if (metrics.operationalMetrics.efficiency.scheduleAdherence.current < 0.8) {
      insights.push({
        type: 'warning',
        category: 'Operations',
        title: 'Schedule Adherence Below Target',
        description: 'Only 80% of jobs starting on time, impacting customer satisfaction',
        impact: 'high',
        metrics: ['schedule_adherence', 'customer_satisfaction'],
        evidence: [{
          adherence: metrics.operationalMetrics.efficiency.scheduleAdherence.current,
          target: 0.92
        }]
      });
    }
    
    // Team performance insights
    const topTeam = metrics.teamPerformance[0];
    if (topTeam && topTeam.overallScore > 0.9) {
      insights.push({
        type: 'achievement',
        category: 'Team',
        title: `${topTeam.teamName} Achieving Excellence`,
        description: `Top performing team with ${(topTeam.overallScore * 100).toFixed(0)}% performance score`,
        impact: 'medium',
        metrics: ['team_performance', 'customer_rating'],
        evidence: [{
          team: topTeam.teamName,
          score: topTeam.overallScore,
          rating: topTeam.customerRating
        }]
      });
    }
    
    // Service opportunities
    const growingService = metrics.servicePerformance.find((s: any) => 
      s.growthRate.current > 0.3
    );
    if (growingService) {
      insights.push({
        type: 'opportunity',
        category: 'Service',
        title: `${growingService.service} Showing Strong Growth`,
        description: `Service growing at ${(growingService.growthRate.current * 100).toFixed(0)}% - opportunity to expand capacity`,
        impact: 'high',
        metrics: ['service_growth', 'revenue_potential'],
        evidence: [{
          service: growingService.service,
          growth: growingService.growthRate.current,
          revenue: growingService.revenue.current
        }]
      });
    }
    
    // Customer risk
    if (metrics.customerMetrics.churnRate.current > 0.15) {
      insights.push({
        type: 'risk',
        category: 'Customer',
        title: 'Elevated Churn Rate',
        description: 'Customer churn above industry average, requiring retention focus',
        impact: 'critical',
        metrics: ['churn_rate', 'lifetime_value'],
        evidence: [{
          churn: metrics.customerMetrics.churnRate.current,
          benchmark: 0.12,
          impact: metrics.customerMetrics.lifetimeValue.current * 
                  metrics.customerMetrics.churnRate.current * 100
        }]
      });
    }
    
    // AI impact
    if (metrics.aiPerformance.revenueImpact.current > 50000) {
      insights.push({
        type: 'achievement',
        category: 'Technology',
        title: 'AI Driving Significant Revenue',
        description: `AI systems generated ${metrics.aiPerformance.revenueImpact.current.toLocaleString()} kr in additional revenue`,
        impact: 'high',
        metrics: ['ai_revenue', 'automation_rate'],
        evidence: [{
          revenue: metrics.aiPerformance.revenueImpact.current,
          automation: metrics.aiPerformance.automationRate.current
        }]
      });
    }
    
    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    insights: PerformanceInsight[],
    benchmarks: PerformanceBenchmark[]
  ): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];
    
    // Address critical issues first
    insights
      .filter(i => i.type === 'risk' || i.type === 'warning')
      .forEach(insight => {
        if (insight.category === 'Customer' && insight.title.includes('Churn')) {
          recommendations.push({
            priority: 'critical',
            category: 'Customer Retention',
            action: 'Launch immediate retention campaign for at-risk customers',
            expectedImpact: 'Reduce churn by 20%, saving 500k kr annually',
            effort: 'medium',
            timeline: '1 week',
            owner: 'Customer Success Manager',
            kpis: ['churn_rate', 'customer_lifetime_value']
          });
        }
        
        if (insight.category === 'Operations') {
          recommendations.push({
            priority: 'high',
            category: 'Operational Excellence',
            action: 'Implement real-time schedule monitoring and alerts',
            expectedImpact: 'Improve on-time performance to 95%',
            effort: 'low',
            timeline: '2 weeks',
            owner: 'Operations Manager',
            kpis: ['schedule_adherence', 'customer_satisfaction']
          });
        }
      });
    
    // Capitalize on opportunities
    insights
      .filter(i => i.type === 'opportunity')
      .forEach(insight => {
        if (insight.category === 'Service') {
          recommendations.push({
            priority: 'high',
            category: 'Growth',
            action: `Expand ${insight.evidence[0].service} capacity by 30%`,
            expectedImpact: 'Capture additional 2M kr revenue',
            effort: 'high',
            timeline: '1 month',
            owner: 'Service Manager',
            kpis: ['service_revenue', 'capacity_utilization']
          });
        }
      });
    
    // Benchmark improvements
    benchmarks
      .filter(b => b.percentile < 50)
      .forEach(benchmark => {
        recommendations.push({
          priority: 'medium',
          category: 'Performance Improvement',
          action: benchmark.recommendation,
          expectedImpact: `Reach industry average for ${benchmark.metric}`,
          effort: 'medium',
          timeline: '3 months',
          owner: 'Performance Manager',
          kpis: [benchmark.metric.toLowerCase().replace(/ /g, '_')]
        });
      });
    
    // Team excellence
    const underperformingTeams = insights
      .filter(i => i.category === 'Team' && i.type === 'warning');
    
    if (underperformingTeams.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Team Development',
        action: 'Implement peer mentoring program with top performers',
        expectedImpact: 'Improve bottom quartile team performance by 25%',
        effort: 'low',
        timeline: '2 weeks',
        owner: 'HR Manager',
        kpis: ['team_performance', 'training_completion']
      });
    }
    
    // Technology optimization
    if (insights.some(i => i.category === 'Technology')) {
      recommendations.push({
        priority: 'medium',
        category: 'Technology',
        action: 'Expand AI to cover remaining 30% of decisions',
        expectedImpact: 'Additional 1M kr revenue, 20% efficiency gain',
        effort: 'high',
        timeline: '2 months',
        owner: 'CTO',
        kpis: ['automation_rate', 'ai_revenue_impact']
      });
    }
    
    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  /**
   * Helper methods
   */
  private createMetricValue(current: number, previous?: number): MetricValue {
    const change = previous !== undefined ? current - previous : 0;
    const changePercent = previous && previous !== 0 ? change / previous : 0;
    
    return {
      current,
      previous,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }

  private createMetricValueMap(data: Record<string, number>): Record<string, MetricValue> {
    const result: Record<string, MetricValue> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      result[key] = this.createMetricValue(value);
    });
    
    return result;
  }

  private getPreviousPeriod(period: AnalyticsPeriod): AnalyticsPeriod {
    const duration = period.end.getTime() - period.start.getTime();
    
    return {
      start: new Date(period.start.getTime() - duration),
      end: new Date(period.start),
      granularity: period.granularity
    };
  }

  private sumRevenue(jobs: any[]): number {
    return jobs.reduce((sum, job) => {
      const invoice = job.invoices?.[0];
      return sum + (invoice?.amount || job.estimated_price || 0);
    }, 0);
  }

  private groupRevenueBy(jobs: any[], field: string): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    jobs.forEach(job => {
      const key = job[field] || 'unknown';
      const revenue = job.invoices?.[0]?.amount || job.estimated_price || 0;
      grouped[key] = (grouped[key] || 0) + revenue;
    });
    
    return grouped;
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 1 : 0;
    return (current - previous) / previous;
  }

  private async calculateMarketShare(revenue: number): Promise<MetricValue> {
    // Simplified - would use real market data
    const marketSize = 500000000; // 500M SEK Stockholm moving market
    const share = revenue / marketSize * 12; // Annualized
    
    return this.createMetricValue(share, share * 0.9);
  }

  private async calculateEfficiencyMetrics(period: AnalyticsPeriod): Promise<EfficiencyMetrics> {
    const { data: jobs } = await this.supabase
      .from('jobs')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    // Calculate metrics
    const completionTimes = jobs?.map(j => j.actual_duration || 0).filter(t => t > 0) || [];
    const avgCompletion = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b) / completionTimes.length
      : 0;
    
    const onTimeJobs = jobs?.filter(j => {
      if (!j.scheduled_start || !j.actual_start) return false;
      const diff = new Date(j.actual_start).getTime() - new Date(j.scheduled_start).getTime();
      return Math.abs(diff) < 30 * 60 * 1000; // 30 minutes
    }).length || 0;
    
    const scheduleAdherence = jobs && jobs.length > 0 ? onTimeJobs / jobs.length : 0;
    
    return {
      jobCompletionTime: this.createMetricValue(avgCompletion),
      routeOptimization: this.createMetricValue(0.85), // Simplified
      fuelEfficiency: this.createMetricValue(8.5), // L/100km
      scheduleAdherence: this.createMetricValue(scheduleAdherence),
      firstTimeResolution: this.createMetricValue(0.92) // Simplified
    };
  }

  private async calculateQualityMetrics(period: AnalyticsPeriod): Promise<QualityMetrics> {
    const { data: feedback } = await this.supabase
      .from('customer_feedback')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const ratings = feedback?.map(f => f.rating).filter(r => r) || [];
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b) / ratings.length
      : 0;
    
    const complaints = feedback?.filter(f => f.has_complaint).length || 0;
    const complaintRate = feedback && feedback.length > 0 ? complaints / feedback.length : 0;
    
    return {
      customerSatisfaction: this.createMetricValue(avgRating / 5),
      serviceQualityScore: this.createMetricValue(0.88), // Simplified
      defectRate: this.createMetricValue(0.02), // 2%
      complaintRate: this.createMetricValue(complaintRate),
      repeatBusinessRate: this.createMetricValue(0.35) // Simplified
    };
  }

  private async calculateProductivityMetrics(period: AnalyticsPeriod): Promise<ProductivityMetrics> {
    const { data: teams } = await this.supabase
      .from('teams')
      .select('count')
      .eq('active', true);
    
    const { data: jobs } = await this.supabase
      .from('jobs')
      .select('*, invoices(*)')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
    
    const teamCount = teams?.[0]?.count || 1;
    const jobCount = jobs?.length || 0;
    const revenue = this.sumRevenue(jobs || []);
    
    const { data: employees } = await this.supabase
      .from('employees')
      .select('count')
      .eq('active', true);
    
    const employeeCount = employees?.[0]?.count || 1;
    
    return {
      jobsPerTeam: this.createMetricValue(jobCount / teamCount),
      revenuePerEmployee: this.createMetricValue(revenue / employeeCount),
      averageJobValue: this.createMetricValue(jobCount > 0 ? revenue / jobCount : 0),
      crossSellRate: this.createMetricValue(0.15), // Simplified
      conversionRate: this.createMetricValue(0.22) // Simplified
    };
  }

  private async calculateUtilizationMetrics(period: AnalyticsPeriod): Promise<UtilizationMetrics> {
    return {
      teamUtilization: this.createMetricValue(0.85),
      vehicleUtilization: this.createMetricValue(0.78),
      equipmentUtilization: this.createMetricValue(0.72),
      warehouseUtilization: this.createMetricValue(0.65)
    };
  }

  private calculateEfficiencyScore(team: any, jobs: any[]): number {
    // Simplified efficiency calculation
    const completedOnTime = jobs.filter(j => j.on_time).length;
    const totalJobs = jobs.length || 1;
    
    return completedOnTime / totalJobs;
  }

  private analyzeTeamStrengths(metrics: any): {
    strengths: string[],
    improvementAreas: string[]
  } {
    const strengths: string[] = [];
    const improvementAreas: string[] = [];
    
    if (metrics.efficiencyScore > 0.9) strengths.push('Excellent efficiency');
    else if (metrics.efficiencyScore < 0.7) improvementAreas.push('Improve job completion time');
    
    if (metrics.customerRating > 4.5) strengths.push('Outstanding customer service');
    else if (metrics.customerRating < 4) improvementAreas.push('Enhance customer satisfaction');
    
    if (metrics.onTimeRate > 0.95) strengths.push('Exceptional punctuality');
    else if (metrics.onTimeRate < 0.85) improvementAreas.push('Improve schedule adherence');
    
    return { strengths, improvementAreas };
  }

  private async getPreviousTeamRanks(period: AnalyticsPeriod): Promise<Record<string, number>> {
    // Simplified - would fetch from historical data
    return {};
  }

  private async calculateServiceCosts(service: string, jobs: any[]): Promise<number> {
    // Simplified cost calculation
    const baseCost = {
      'hemflytt': 8000,
      'kontorsflytt': 15000,
      'magasinering': 3000,
      'städning': 2000
    };
    
    return jobs.length * (baseCost[service as keyof typeof baseCost] || 5000);
  }

  private async calculateServiceMarketShare(
    service: string,
    revenue: number
  ): Promise<{ current: number, previous: number }> {
    // Simplified market share calculation
    const marketSizes = {
      'hemflytt': 200000000,
      'kontorsflytt': 150000000,
      'magasinering': 100000000,
      'städning': 50000000
    };
    
    const marketSize = marketSizes[service as keyof typeof marketSizes] || 100000000;
    const current = revenue / marketSize * 12; // Annualized
    
    return { current, previous: current * 0.9 };
  }

  private assessCompetitivePosition(marketShare: { current: number }): string {
    if (marketShare.current > 0.2) return 'Market Leader';
    if (marketShare.current > 0.1) return 'Strong Position';
    if (marketShare.current > 0.05) return 'Competitive';
    return 'Challenger';
  }

  private analyzeDemandTrend(current: any[], previous: any[]): 'increasing' | 'stable' | 'decreasing' {
    const growth = this.calculateGrowthRate(current.length, previous.length);
    
    if (growth > 0.1) return 'increasing';
    if (growth < -0.1) return 'decreasing';
    return 'stable';
  }

  private async calculateRetentionMetrics(period: AnalyticsPeriod): Promise<any> {
    // Simplified retention calculation
    return {
      rate: 0.88,
      churn: 0.12,
      ltv: 125000
    };
  }

  private calculateNPS(feedback: any[]): { score: number } {
    const scores = feedback.map(f => f.nps_score).filter(s => s !== undefined);
    if (scores.length === 0) return { score: 0 };
    
    const promoters = scores.filter(s => s >= 9).length;
    const detractors = scores.filter(s => s <= 6).length;
    
    return { score: (promoters - detractors) / scores.length };
  }

  private calculateCSAT(feedback: any[]): { score: number } {
    const ratings = feedback.map(f => f.rating).filter(r => r);
    if (ratings.length === 0) return { score: 0 };
    
    const satisfied = ratings.filter(r => r >= 4).length;
    return { score: satisfied / ratings.length };
  }

  private calculateCES(feedback: any[]): { score: number } {
    const efforts = feedback.map(f => f.effort_score).filter(e => e);
    if (efforts.length === 0) return { score: 5 };
    
    return { score: efforts.reduce((a, b) => a + b) / efforts.length };
  }

  private async calculateEngagementMetrics(period: AnalyticsPeriod): Promise<any> {
    // Simplified engagement metrics
    return {
      repeatRate: 0.35,
      referralRate: 0.12,
      reviewRate: 0.28
    };
  }

  private async calculateCAC(period: AnalyticsPeriod): Promise<number> {
    // Simplified CAC calculation
    return 850; // SEK per customer
  }

  private async getPreviousCustomerMetrics(period: AnalyticsPeriod): Promise<any> {
    // Simplified - would fetch real historical data
    return {
      newCustomers: 45,
      acquisitionCost: 900,
      conversionRate: 0.18,
      retentionRate: 0.85,
      churnRate: 0.15,
      lifetimeValue: 115000,
      nps: 35,
      csat: 0.82,
      ces: 3.2,
      repeatRate: 0.32,
      referralRate: 0.10,
      reviewRate: 0.25
    };
  }

  private async getPreviousFinancialMetrics(period: AnalyticsPeriod): Promise<any> {
    // Simplified - would fetch real historical data
    return {
      revenue: 4500000,
      recurring: 500000,
      grossProfit: 2000000,
      grossMargin: 0.44,
      operatingProfit: 800000,
      netMargin: 0.13,
      costPerJob: 9500,
      overheadRatio: 0.25,
      laborCostRatio: 0.35
    };
  }

  private async getModelAccuracy(model: string, period: AnalyticsPeriod): Promise<number> {
    // Simplified - would calculate real accuracy
    const accuracies = {
      'lead_scoring': 0.89,
      'demand_forecast': 0.85
    };
    
    return accuracies[model as keyof typeof accuracies] || 0.8;
  }

  private async getPricingOptimization(period: AnalyticsPeriod): Promise<number> {
    // Simplified - percentage of optimal pricing achieved
    return 0.92;
  }

  private async calculateAIRevenueImpact(period: AnalyticsPeriod): Promise<number> {
    // Simplified - would calculate actual impact
    return 125000; // SEK
  }

  private async calculateAIEfficiencyGains(period: AnalyticsPeriod): Promise<number> {
    // Simplified - percentage efficiency improvement
    return 0.35;
  }

  private async calculateAICostSavings(period: AnalyticsPeriod): Promise<number> {
    // Simplified - would calculate actual savings
    return 85000; // SEK
  }

  private async getPreviousAIMetrics(period: AnalyticsPeriod): Promise<any> {
    // Simplified - would fetch real historical data
    return {
      decisions: 750,
      automationRate: 0.85,
      accuracy: 0.88,
      leadScoring: 0.87,
      forecast: 0.83,
      pricing: 0.90,
      responseTime: 125,
      errorRate: 0.02,
      revenueImpact: 95000,
      efficiency: 0.30,
      costSavings: 65000
    };
  }

  private calculatePercentile(value: number, average: number, top: number): number {
    if (value >= top) return 95;
    if (value <= average) return 50 * (value / average);
    
    const range = top - average;
    const position = value - average;
    return 50 + (45 * position / range);
  }

  private generateBenchmarkRecommendation(
    type: string,
    current: number,
    benchmark: number
  ): string {
    const gap = ((benchmark - current) / benchmark * 100).toFixed(0);
    
    const recommendations: Record<string, string> = {
      'satisfaction': `Implement customer feedback loops to improve satisfaction by ${gap}%`,
      'delivery': `Optimize scheduling to improve on-time delivery by ${gap}%`,
      'margin': `Reduce operational costs to improve margin by ${gap}%`,
      'conversion': `Enhance sales process to improve conversion by ${gap}%`
    };
    
    return recommendations[type] || 'Analyze gap and implement improvement plan';
  }

  /**
   * Real-time monitoring
   */
  private startRealtimeMonitoring() {
    setInterval(async () => {
      const period: AnalyticsPeriod = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
        granularity: 'hour'
      };
      
      const analytics = await this.generateAnalytics(period);
      
      // Check for significant changes
      this.detectAnomalies(analytics);
    }, this.config.updateInterval);
  }

  private initializeDashboards() {
    // Initialize real-time dashboards
    console.log('📊 Dashboards initialized');
  }

  private async loadHistoricalData() {
    // Load and cache historical performance data
    console.log('📈 Historical data loaded');
  }

  private cacheAnalytics(period: AnalyticsPeriod, analytics: PerformanceAnalytics) {
    const key = `${period.start.toISOString()}-${period.end.toISOString()}-${period.granularity}`;
    this.metricsCache.set(key, {
      analytics,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (this.metricsCache.size > 100) {
      const oldest = Array.from(this.metricsCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
      this.metricsCache.delete(oldest[0]);
    }
  }

  private async logAnalytics(analytics: PerformanceAnalytics) {
    await this.supabase
      .from('performance_analytics')
      .insert({
        period: analytics.period,
        metrics: analytics,
        version: this.analyticsVersion,
        created_at: analytics.timestamp
      });
  }

  private checkAlerts(analytics: PerformanceAnalytics) {
    // Revenue alert
    if (analytics.businessMetrics.revenue.changePercent < this.config.alertThresholds.revenue) {
      this.emit('alert', {
        type: 'revenue_drop',
        severity: 'high',
        message: `Revenue dropped by ${Math.abs(analytics.businessMetrics.revenue.changePercent * 100).toFixed(0)}%`,
        metrics: analytics.businessMetrics.revenue
      });
    }
    
    // Satisfaction alert
    if (analytics.customerMetrics.csat.changePercent < this.config.alertThresholds.satisfaction) {
      this.emit('alert', {
        type: 'satisfaction_drop',
        severity: 'critical',
        message: 'Customer satisfaction declining',
        metrics: analytics.customerMetrics.csat
      });
    }
  }

  private detectAnomalies(analytics: PerformanceAnalytics) {
    // Detect unusual patterns
    analytics.insights
      .filter(i => i.type === 'warning' || i.type === 'risk')
      .forEach(insight => {
        this.emit('anomaly', insight);
      });
  }

  /**
   * Public methods
   */
  async getDashboard(period: 'day' | 'week' | 'month' | 'quarter'): Promise<PerformanceAnalytics> {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
    }
    
    return this.generateAnalytics({
      start,
      end,
      granularity: period === 'day' ? 'hour' : 'day'
    });
  }

  async getTeamRankings(): Promise<TeamPerformance[]> {
    const period: AnalyticsPeriod = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
      granularity: 'month'
    };
    
    return this.analyzeTeamPerformance(period);
  }

  async getServiceTrends(service: string): Promise<any> {
    const periods = [1, 3, 6, 12]; // months
    const trends = [];
    
    for (const months of periods) {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - months);
      
      const period: AnalyticsPeriod = { start, end, granularity: 'month' };
      const performance = await this.analyzeServicePerformance(period);
      const serviceData = performance.find(s => s.service === service);
      
      if (serviceData) {
        trends.push({
          period: `${months} months`,
          revenue: serviceData.revenue.current,
          volume: serviceData.volume.current,
          satisfaction: serviceData.customerSatisfaction.current,
          growth: serviceData.growthRate.current
        });
      }
    }
    
    return trends;
  }

  async generateExecutiveReport(): Promise<any> {
    const period: AnalyticsPeriod = {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end: new Date(),
      granularity: 'month'
    };
    
    const analytics = await this.generateAnalytics(period);
    
    return {
      summary: {
        revenue: analytics.businessMetrics.revenue,
        growth: analytics.businessMetrics.growthRate,
        satisfaction: analytics.customerMetrics.csat,
        efficiency: analytics.operationalMetrics.efficiency.scheduleAdherence
      },
      highlights: analytics.insights.filter(i => i.type === 'achievement'),
      concerns: analytics.insights.filter(i => i.type === 'warning' || i.type === 'risk'),
      recommendations: analytics.recommendations.filter(r => r.priority === 'critical' || r.priority === 'high')
    };
  }
}

// Export singleton instance
export const performanceAnalytics = new PerformanceAnalytics();