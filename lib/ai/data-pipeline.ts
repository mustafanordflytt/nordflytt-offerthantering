/**
 * Real-time Data Pipeline for AI Engine
 * Manages data flow from all sources to AI processing
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';
import { aiEngine } from './core/ai-engine';

export interface DataStream {
  source: string;
  type: 'customer' | 'lead' | 'job' | 'market' | 'financial';
  data: any;
  timestamp: Date;
}

export interface ProcessedData {
  id: string;
  originalData: any;
  enrichedData: any;
  aiInsights: any;
  processingTime: number;
}

export class DataPipeline extends EventEmitter {
  private supabase = createClient();
  private streams: Map<string, any> = new Map();
  private buffer: DataStream[] = [];
  private processing = false;
  private batchSize = 10;
  private processingInterval = 1000; // 1 second

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('🚰 Initializing Data Pipeline...');
    
    // Set up real-time subscriptions
    await this.setupRealtimeSubscriptions();
    
    // Start processing loop
    this.startProcessingLoop();
    
    // Connect to external data sources
    await this.connectExternalSources();
    
    console.log('✅ Data Pipeline operational');
    this.emit('ready');
  }

  /**
   * Setup Supabase real-time subscriptions
   */
  private async setupRealtimeSubscriptions() {
    // Subscribe to customer changes
    const customerChannel = this.supabase
      .channel('customer-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => this.handleDataChange('customer', payload)
      )
      .subscribe();

    // Subscribe to booking changes
    const bookingChannel = this.supabase
      .channel('booking-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => this.handleDataChange('job', payload)
      )
      .subscribe();

    // Subscribe to lead changes
    const leadChannel = this.supabase
      .channel('lead-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => this.handleDataChange('lead', payload)
      )
      .subscribe();

    this.streams.set('customers', customerChannel);
    this.streams.set('bookings', bookingChannel);
    this.streams.set('leads', leadChannel);

    console.log('📡 Real-time subscriptions active');
  }

  /**
   * Handle incoming data changes
   */
  private handleDataChange(type: DataStream['type'], payload: any) {
    const stream: DataStream = {
      source: 'supabase',
      type,
      data: payload,
      timestamp: new Date()
    };

    // Add to buffer for batch processing
    this.buffer.push(stream);
    
    // Emit for immediate processing if critical
    if (this.isCriticalData(stream)) {
      this.processSingleStream(stream);
    }
  }

  /**
   * Process data in batches for efficiency
   */
  private startProcessingLoop() {
    setInterval(async () => {
      if (this.processing || this.buffer.length === 0) return;

      this.processing = true;
      const batch = this.buffer.splice(0, this.batchSize);
      
      try {
        await this.processBatch(batch);
      } catch (error) {
        console.error('❌ Batch processing error:', error);
      } finally {
        this.processing = false;
      }
    }, this.processingInterval);
  }

  /**
   * Process a batch of data streams
   */
  private async processBatch(batch: DataStream[]) {
    const startTime = Date.now();
    const results: ProcessedData[] = [];

    for (const stream of batch) {
      try {
        const processed = await this.processStream(stream);
        results.push(processed);
      } catch (error) {
        console.error(`Error processing stream from ${stream.source}:`, error);
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`⚡ Processed ${results.length} items in ${processingTime}ms`);

    // Emit batch results
    this.emit('batch-processed', results);
  }

  /**
   * Process individual data stream
   */
  private async processStream(stream: DataStream): Promise<ProcessedData> {
    const startTime = Date.now();

    // Enrich data based on type
    const enrichedData = await this.enrichData(stream);

    // Get AI insights
    const aiInsights = await this.getAIInsights(stream.type, enrichedData);

    // Store processed data
    const processed: ProcessedData = {
      id: `proc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalData: stream.data,
      enrichedData,
      aiInsights,
      processingTime: Date.now() - startTime
    };

    // Trigger automated actions if needed
    await this.triggerAutomatedActions(processed);

    return processed;
  }

  /**
   * Process critical data immediately
   */
  private async processSingleStream(stream: DataStream) {
    try {
      const processed = await this.processStream(stream);
      this.emit('critical-processed', processed);
    } catch (error) {
      console.error('Error processing critical stream:', error);
    }
  }

  /**
   * Enrich data with additional context
   */
  private async enrichData(stream: DataStream): Promise<any> {
    const enriched = { ...stream.data };

    switch (stream.type) {
      case 'customer':
        // Add customer history and preferences
        enriched.history = await this.getCustomerHistory(stream.data.id);
        enriched.preferences = await this.getCustomerPreferences(stream.data.id);
        enriched.totalValue = await this.calculateCustomerTotalValue(stream.data.id);
        break;

      case 'lead':
        // Add lead scoring data
        enriched.sourceQuality = this.assessLeadSource(stream.data.source);
        enriched.marketTiming = await this.assessMarketTiming();
        enriched.competitorActivity = await this.getCompetitorActivity();
        break;

      case 'job':
        // Add operational context
        enriched.teamAvailability = await this.getTeamAvailability(stream.data.move_date);
        enriched.routeOptimization = await this.calculateOptimalRoute(stream.data);
        enriched.profitability = this.calculateJobProfitability(stream.data);
        break;

      case 'financial':
        // Add financial insights
        enriched.cashFlowImpact = this.calculateCashFlowImpact(stream.data);
        enriched.marginAnalysis = this.analyzeMargins(stream.data);
        break;
    }

    return enriched;
  }

  /**
   * Get AI insights for enriched data
   */
  private async getAIInsights(type: DataStream['type'], data: any): Promise<any> {
    const insights: any = {};

    switch (type) {
      case 'customer':
        insights.score = await aiEngine.scoreCustomerLead(data);
        insights.churnRisk = await aiEngine.predictChurnRisk(data.id);
        break;

      case 'lead':
        insights.score = await aiEngine.scoreCustomerLead(data);
        insights.conversionProbability = this.calculateConversionProbability(data);
        insights.optimalFollowUp = this.determineOptimalFollowUp(data);
        break;

      case 'job':
        insights.schedule = await aiEngine.optimizeJobSchedule(data);
        insights.pricing = await aiEngine.calculateDynamicPrice(data);
        break;

      case 'financial':
        insights.forecast = this.generateFinancialForecast(data);
        insights.optimization = this.identifyFinancialOptimizations(data);
        break;
    }

    return insights;
  }

  /**
   * Trigger automated actions based on insights
   */
  private async triggerAutomatedActions(processed: ProcessedData) {
    const { aiInsights, enrichedData } = processed;

    // High-value lead auto-response
    if (aiInsights.score?.leadScore > 80) {
      await this.triggerHighValueLeadWorkflow(enrichedData);
    }

    // Churn prevention
    if (aiInsights.churnRisk?.risk > 0.7) {
      await this.triggerChurnPreventionWorkflow(enrichedData);
    }

    // Optimal scheduling
    if (aiInsights.schedule?.efficiency > 0.9) {
      await this.autoAssignJob(enrichedData, aiInsights.schedule);
    }

    // Dynamic pricing application
    if (aiInsights.pricing?.confidence > 0.85) {
      await this.applyDynamicPricing(enrichedData, aiInsights.pricing);
    }
  }

  /**
   * Connect to external data sources
   */
  private async connectExternalSources() {
    // Connect to marketing automation
    this.connectMarketingAutomation();
    
    // Connect to financial systems
    this.connectFinancialSystems();
    
    // Connect to competitive intelligence
    this.connectCompetitiveIntelligence();
  }

  // Data enrichment helpers
  private async getCustomerHistory(customerId: string) {
    const { data } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    return data || [];
  }

  private async getCustomerPreferences(customerId: string) {
    // Analyze past bookings for preferences
    const history = await this.getCustomerHistory(customerId);
    return {
      preferredTime: this.analyzePreferredTimes(history),
      servicePreferences: this.analyzeServicePreferences(history),
      communicationPreference: 'email' // Could be derived from interactions
    };
  }

  private async calculateCustomerTotalValue(customerId: string) {
    const { data } = await this.supabase
      .from('bookings')
      .select('total_price')
      .eq('customer_id', customerId);
    
    return data?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
  }

  private assessLeadSource(source: string): number {
    const sourceQuality: Record<string, number> = {
      'organic': 0.9,
      'referral': 0.85,
      'direct': 0.8,
      'paid': 0.6,
      'social': 0.5
    };
    return sourceQuality[source] || 0.5;
  }

  private async assessMarketTiming() {
    const now = new Date();
    const month = now.getMonth();
    // Moving season peaks in summer
    const seasonality = [0.6, 0.7, 0.8, 0.9, 1.0, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5];
    return seasonality[month];
  }

  private async getCompetitorActivity() {
    // Placeholder - would integrate with competitive intelligence
    return {
      averagePrice: 16000,
      campaignsActive: 3,
      marketShare: 0.15
    };
  }

  private async getTeamAvailability(moveDate: string) {
    const { data } = await this.supabase
      .from('team_schedules')
      .select('*')
      .eq('date', moveDate);
    
    return data || [];
  }

  private async calculateOptimalRoute(jobData: any) {
    // Placeholder for route optimization
    return {
      distance: 15,
      duration: 45,
      efficiency: 0.85
    };
  }

  private calculateJobProfitability(jobData: any) {
    const revenue = jobData.total_price || 0;
    const estimatedCost = revenue * 0.6; // 40% margin target
    return {
      revenue,
      cost: estimatedCost,
      margin: revenue - estimatedCost,
      marginPercent: 0.4
    };
  }

  private calculateCashFlowImpact(financialData: any) {
    return {
      immediate: financialData.amount,
      projected30Days: financialData.amount * 0.9,
      projected60Days: financialData.amount * 0.1
    };
  }

  private analyzeMargins(financialData: any) {
    return {
      gross: 0.4,
      net: 0.25,
      trend: 'improving'
    };
  }

  private isCriticalData(stream: DataStream): boolean {
    // Define what constitutes critical data
    return (
      stream.type === 'lead' ||
      (stream.type === 'customer' && stream.data.event === 'INSERT') ||
      (stream.type === 'job' && stream.data.new?.priority === 'urgent')
    );
  }

  private calculateConversionProbability(data: any): number {
    // Simplified probability calculation
    const factors = [
      data.sourceQuality * 0.3,
      data.marketTiming * 0.2,
      (data.budget ? 0.5 : 0.2)
    ];
    return factors.reduce((a, b) => a + b, 0);
  }

  private determineOptimalFollowUp(data: any) {
    const score = data.score?.leadScore || 0;
    if (score > 80) return { timing: 'immediate', method: 'phone' };
    if (score > 60) return { timing: '1hour', method: 'email' };
    return { timing: '24hours', method: 'email' };
  }

  private generateFinancialForecast(data: any) {
    return {
      next30Days: data.amount * 1.1,
      next60Days: data.amount * 1.2,
      next90Days: data.amount * 1.35
    };
  }

  private identifyFinancialOptimizations(data: any) {
    return [
      'Optimize payment terms for better cash flow',
      'Consider dynamic pricing for 15% margin improvement'
    ];
  }

  // Automated action triggers
  private async triggerHighValueLeadWorkflow(leadData: any) {
    console.log('🎯 Triggering high-value lead workflow:', leadData.id);
    // Implementation would trigger actual workflow
    this.emit('workflow-triggered', {
      type: 'high-value-lead',
      data: leadData
    });
  }

  private async triggerChurnPreventionWorkflow(customerData: any) {
    console.log('🛡️ Triggering churn prevention:', customerData.id);
    this.emit('workflow-triggered', {
      type: 'churn-prevention',
      data: customerData
    });
  }

  private async autoAssignJob(jobData: any, schedule: any) {
    console.log('📅 Auto-assigning job:', jobData.id);
    // Update job with optimal assignment
    await this.supabase
      .from('bookings')
      .update({
        assigned_team: schedule.assignedTeam,
        scheduled_time: schedule.scheduledTime
      })
      .eq('id', jobData.id);
  }

  private async applyDynamicPricing(jobData: any, pricing: any) {
    console.log('💰 Applying dynamic pricing:', jobData.id);
    await this.supabase
      .from('bookings')
      .update({
        total_price: pricing.optimizedPrice,
        price_factors: pricing.factors
      })
      .eq('id', jobData.id);
  }

  // Helper analysis methods
  private analyzePreferredTimes(history: any[]) {
    // Analyze historical booking times
    const times = history.map(h => h.move_time);
    // Return most common time slot
    return 'morning'; // Simplified
  }

  private analyzeServicePreferences(history: any[]) {
    // Analyze service usage patterns
    const services = history.flatMap(h => h.services || []);
    return [...new Set(services)];
  }

  // External connections
  private connectMarketingAutomation() {
    console.log('🔌 Connecting to marketing automation...');
    // Would connect to actual marketing systems
  }

  private connectFinancialSystems() {
    console.log('🔌 Connecting to financial systems...');
    // Would connect to Fortnox etc
  }

  private connectCompetitiveIntelligence() {
    console.log('🔌 Connecting to competitive intelligence...');
    // Would connect to market monitoring tools
  }
}

// Export singleton instance
export const dataPipeline = new DataPipeline();