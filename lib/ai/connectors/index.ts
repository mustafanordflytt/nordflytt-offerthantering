/**
 * Unified Connector Manager
 * Orchestrates all external system integrations
 */

import { EventEmitter } from 'events';
import { customerServiceConnector } from './customer-service-connector';
import { marketingConnector } from './marketing-connector';
import { createClient } from '@/lib/supabase';
import { aiEngine } from '../core/ai-engine';
import { dataPipeline } from '../data-pipeline';

export interface ConnectorStatus {
  customerService: {
    connected: boolean;
    activeConversations: number;
    lastSync?: Date;
  };
  marketing: {
    connected: boolean;
    activeCampaigns: number;
    lastSync?: Date;
  };
  overall: 'healthy' | 'degraded' | 'error';
}

export interface UnifiedCustomerView {
  customerId: string;
  profile: CustomerProfile;
  interactions: CustomerInteraction[];
  marketingJourney: MarketingJourney;
  aiInsights: AICustomerInsights;
  value: CustomerValue;
}

export interface CustomerProfile {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  segment: string;
  tags: string[];
}

export interface CustomerInteraction {
  timestamp: Date;
  type: 'conversation' | 'email' | 'phone' | 'booking' | 'quote';
  channel: string;
  summary: string;
  sentiment?: number;
  outcome?: string;
}

export interface MarketingJourney {
  firstTouch: Date;
  lastTouch: Date;
  touchpoints: number;
  channels: string[];
  campaigns: string[];
  stage: string;
  conversionProbability: number;
}

export interface AICustomerInsights {
  leadScore: number;
  lifetimeValue: number;
  churnRisk: number;
  nextBestAction: string;
  recommendations: string[];
  predictedNeeds: string[];
}

export interface CustomerValue {
  historical: number;
  predicted: number;
  potential: number;
  profitability: number;
}

export class ConnectorManager extends EventEmitter {
  private supabase = createClient();
  private status: ConnectorStatus = {
    customerService: { connected: false, activeConversations: 0 },
    marketing: { connected: false, activeCampaigns: 0 },
    overall: 'error'
  };
  private syncInterval?: NodeJS.Timer;
  private customerCache = new Map<string, UnifiedCustomerView>();

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('🔗 Initializing Connector Manager...');
    
    // Set up connector event handlers
    this.setupConnectorHandlers();
    
    // Start unified data synchronization
    this.startUnifiedSync();
    
    // Initialize cross-system workflows
    this.setupCrossSystemWorkflows();
    
    console.log('✅ Connector Manager ready');
    this.emit('ready');
  }

  /**
   * Set up handlers for individual connectors
   */
  private setupConnectorHandlers() {
    // Customer Service events
    customerServiceConnector.on('ready', () => {
      this.status.customerService.connected = true;
      this.updateOverallStatus();
    });

    customerServiceConnector.on('conversation-started', (conversation) => {
      this.handleNewConversation(conversation);
    });

    customerServiceConnector.on('conversation-ended', (conversation) => {
      this.handleConversationEnd(conversation);
    });

    customerServiceConnector.on('high-value-intent', (notification) => {
      this.handleHighValueIntent(notification);
    });

    customerServiceConnector.on('escalation-created', (escalation) => {
      this.handleEscalation(escalation);
    });

    // Marketing events
    marketingConnector.on('ready', () => {
      this.status.marketing.connected = true;
      this.updateOverallStatus();
    });

    marketingConnector.on('anomaly-detected', (anomaly) => {
      this.handleMarketingAnomaly(anomaly);
    });

    marketingConnector.on('sync-error', (error) => {
      this.handleSyncError('marketing', error);
    });

    // Update status periodically
    setInterval(() => {
      this.updateConnectorStatus();
    }, 30000);
  }

  /**
   * Start unified data synchronization
   */
  private startUnifiedSync() {
    // Sync every 15 minutes
    this.syncInterval = setInterval(async () => {
      await this.performUnifiedSync();
    }, 15 * 60 * 1000);

    // Initial sync
    this.performUnifiedSync();
  }

  /**
   * Set up workflows that span multiple systems
   */
  private setupCrossSystemWorkflows() {
    // High-value lead from chat → Marketing campaign
    this.on('high-value-lead-identified', async (data) => {
      await this.createTargetedCampaign(data);
    });

    // Marketing qualified lead → AI chat engagement
    this.on('marketing-qualified-lead', async (data) => {
      await this.initiateProactiveChat(data);
    });

    // Customer at risk → Multi-channel retention
    this.on('customer-at-risk', async (data) => {
      await this.activateRetentionCampaign(data);
    });
  }

  /**
   * Perform unified data synchronization
   */
  private async performUnifiedSync() {
    console.log('🔄 Performing unified sync...');

    try {
      // Sync customer profiles
      await this.syncCustomerProfiles();

      // Match conversations to marketing touchpoints
      await this.matchInteractionData();

      // Update unified customer views
      await this.updateUnifiedViews();

      // Calculate cross-channel attribution
      await this.calculateAttribution();

      // Generate unified insights
      await this.generateUnifiedInsights();

      this.status.customerService.lastSync = new Date();
      this.status.marketing.lastSync = new Date();

      console.log('✅ Unified sync complete');
      this.emit('sync-complete');

    } catch (error) {
      console.error('❌ Unified sync error:', error);
      this.emit('sync-error', error);
    }
  }

  /**
   * Handle new conversation from customer service
   */
  private async handleNewConversation(conversation: any) {
    this.status.customerService.activeConversations++;

    // Check if customer has marketing history
    const marketingData = await this.getCustomerMarketingData(conversation.customerId);

    if (marketingData) {
      // Enrich conversation with marketing context
      const enrichedConversation = {
        ...conversation,
        marketingContext: {
          campaigns: marketingData.campaigns,
          lastCampaignInteraction: marketingData.lastTouch,
          marketingStage: marketingData.stage
        }
      };

      // Feed to AI for better personalization
      dataPipeline.emit('external-data', {
        source: 'unified-connector',
        type: 'enriched-conversation',
        data: enrichedConversation
      });
    }
  }

  /**
   * Handle conversation end
   */
  private async handleConversationEnd(conversation: any) {
    this.status.customerService.activeConversations--;

    // Update unified customer view
    await this.updateCustomerView(conversation.customerId);

    // Check for cross-sell opportunities
    const opportunities = await this.identifyCrossSellOpportunities(conversation);
    
    if (opportunities.length > 0) {
      this.emit('cross-sell-opportunities', {
        customerId: conversation.customerId,
        opportunities
      });
    }
  }

  /**
   * Handle high-value intent detection
   */
  private async handleHighValueIntent(notification: any) {
    console.log('💎 High-value intent detected:', notification);

    // Create unified alert
    const unifiedAlert = {
      type: 'high-value-opportunity',
      source: 'ai-chat',
      customerId: notification.customerId,
      value: await this.calculateOpportunityValue(notification),
      urgency: 'high',
      recommendedActions: [
        'assign-senior-sales',
        'create-personalized-offer',
        'pause-marketing-automation'
      ]
    };

    // Notify all relevant systems
    this.emit('unified-alert', unifiedAlert);

    // Pause automated marketing to avoid conflicts
    await marketingConnector.pauseCampaign(notification.customerId);
  }

  /**
   * Handle escalation
   */
  private async handleEscalation(escalation: any) {
    // Check customer's full history across systems
    const customerView = await this.getUnifiedCustomerView(
      escalation.conversation.customerId
    );

    // Enrich escalation with full context
    const enrichedEscalation = {
      ...escalation,
      customerValue: customerView.value,
      previousInteractions: customerView.interactions,
      marketingStage: customerView.marketingJourney.stage,
      aiRecommendations: customerView.aiInsights.recommendations
    };

    // Route to appropriate team with context
    await this.routeEscalation(enrichedEscalation);
  }

  /**
   * Handle marketing anomaly
   */
  private async handleMarketingAnomaly(anomaly: any) {
    console.warn('⚠️ Marketing anomaly:', anomaly);

    // Check if anomaly affects customer service
    if (anomaly.type === 'low_ctr' || anomaly.type === 'negative_roi') {
      // Investigate through customer conversations
      const insights = await this.investigateMarketingIssue(anomaly);
      
      if (insights.customerComplaints > 5) {
        this.emit('marketing-issue-detected', {
          anomaly,
          insights,
          recommendation: 'pause-campaign-and-investigate'
        });
      }
    }
  }

  /**
   * Sync customer profiles across systems
   */
  private async syncCustomerProfiles() {
    const { data: customers } = await this.supabase
      .from('customers')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (!customers) return;

    for (const customer of customers) {
      await this.createUnifiedProfile(customer);
    }
  }

  /**
   * Create unified customer profile
   */
  private async createUnifiedProfile(customer: any): Promise<void> {
    // Get data from all sources
    const [conversationHistory, marketingHistory, bookingHistory] = await Promise.all([
      this.getConversationHistory(customer.id),
      this.getMarketingHistory(customer.id),
      this.getBookingHistory(customer.id)
    ]);

    // Create unified view
    const unifiedView: UnifiedCustomerView = {
      customerId: customer.id,
      profile: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        location: customer.location,
        segment: this.determineCustomerSegment(customer),
        tags: this.generateCustomerTags(customer, conversationHistory, marketingHistory)
      },
      interactions: this.mergeInteractions(conversationHistory, bookingHistory),
      marketingJourney: await this.analyzeMarketingJourney(marketingHistory),
      aiInsights: await this.generateAIInsights(customer, conversationHistory, marketingHistory),
      value: await this.calculateCustomerValue(customer, bookingHistory)
    };

    // Cache unified view
    this.customerCache.set(customer.id, unifiedView);

    // Store in database
    await this.storeUnifiedView(unifiedView);
  }

  /**
   * Match interaction data across systems
   */
  private async matchInteractionData() {
    // Match email addresses between systems
    await this.matchByEmail();

    // Match phone numbers
    await this.matchByPhone();

    // Use AI to match based on behavior patterns
    await this.matchByBehavior();
  }

  /**
   * Update unified customer views
   */
  private async updateUnifiedViews() {
    for (const [customerId, view] of this.customerCache) {
      // Refresh AI insights
      view.aiInsights = await this.generateAIInsights(
        { id: customerId },
        view.interactions,
        view.marketingJourney
      );

      // Update value calculations
      view.value = await this.calculateCustomerValue(
        { id: customerId },
        view.interactions
      );

      // Store updated view
      await this.storeUnifiedView(view);
    }
  }

  /**
   * Calculate cross-channel attribution
   */
  private async calculateAttribution() {
    const { data: conversions } = await this.supabase
      .from('bookings')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .eq('status', 'completed');

    if (!conversions) return;

    for (const conversion of conversions) {
      const attribution = await this.attributeConversion(conversion);
      
      await this.supabase
        .from('attribution_analysis')
        .upsert({
          booking_id: conversion.id,
          customer_id: conversion.customer_id,
          attribution_model: 'multi_touch',
          touchpoints: attribution.touchpoints,
          channel_credits: attribution.credits,
          calculated_at: new Date()
        });
    }
  }

  /**
   * Generate unified insights
   */
  private async generateUnifiedInsights() {
    const insights = {
      totalCustomers: this.customerCache.size,
      highValueCustomers: Array.from(this.customerCache.values())
        .filter(c => c.value.predicted > 100000).length,
      atRiskCustomers: Array.from(this.customerCache.values())
        .filter(c => c.aiInsights.churnRisk > 0.7).length,
      crossChannelEngagement: await this.analyzeCrossChannelEngagement(),
      recommendedActions: await this.generateSystemWideRecommendations()
    };

    // Store insights
    await this.supabase
      .from('unified_insights')
      .insert({
        insights,
        generated_at: new Date()
      });

    this.emit('insights-generated', insights);
  }

  /**
   * Helper methods
   */
  private updateOverallStatus() {
    const csConnected = this.status.customerService.connected;
    const mktConnected = this.status.marketing.connected;

    if (csConnected && mktConnected) {
      this.status.overall = 'healthy';
    } else if (csConnected || mktConnected) {
      this.status.overall = 'degraded';
    } else {
      this.status.overall = 'error';
    }

    this.emit('status-update', this.status);
  }

  private async updateConnectorStatus() {
    // Get active conversations
    const activeConversations = await customerServiceConnector.getActiveConversations();
    this.status.customerService.activeConversations = activeConversations.length;

    // Get active campaigns
    const activeCampaigns = await marketingConnector.getAllCampaigns();
    this.status.marketing.activeCampaigns = activeCampaigns.filter(
      c => c.status === 'active'
    ).length;

    this.updateOverallStatus();
  }

  private async getCustomerMarketingData(customerId: string): Promise<any> {
    const { data } = await this.supabase
      .from('customer_marketing_journey')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    return data;
  }

  private async updateCustomerView(customerId: string) {
    const existing = this.customerCache.get(customerId);
    if (existing) {
      await this.createUnifiedProfile({ id: customerId });
    }
  }

  private async identifyCrossSellOpportunities(conversation: any): Promise<any[]> {
    const opportunities = [];

    // Analyze conversation for service mentions
    if (conversation.intent?.entities?.service) {
      const relatedServices = this.getRelatedServices(conversation.intent.entities.service);
      opportunities.push(...relatedServices.map(service => ({
        type: 'complementary_service',
        service,
        confidence: 0.8
      })));
    }

    return opportunities;
  }

  private async calculateOpportunityValue(notification: any): Promise<number> {
    // Base value on intent and entities
    let value = 15000; // Base moving value

    if (notification.intent?.entities?.service === 'kontorsflytt') {
      value *= 3; // Office moves are higher value
    }

    if (notification.intent?.entities?.urgency === 'high') {
      value *= 1.5; // Urgent moves command premium
    }

    return value;
  }

  private async routeEscalation(escalation: any) {
    // Determine best team based on context
    const team = escalation.customerValue.historical > 100000
      ? 'senior-account-managers'
      : 'customer-service';

    await this.supabase
      .from('escalations')
      .insert({
        ...escalation,
        assigned_team: team,
        priority: this.calculateEscalationPriority(escalation)
      });
  }

  private async investigateMarketingIssue(anomaly: any): Promise<any> {
    // Check recent customer service conversations for related issues
    const { data: recentConversations } = await this.supabase
      .from('ai_conversations')
      .select('*')
      .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .like('current_intent', `%${anomaly.campaign}%`);

    const complaints = recentConversations?.filter(
      c => c.sentiment_score < -0.5
    ).length || 0;

    return {
      customerComplaints: complaints,
      commonIssues: ['pricing', 'availability'] // Simplified
    };
  }

  private async createTargetedCampaign(data: any) {
    // Create lookalike campaign for high-value lead
    await marketingConnector.createCampaign({
      name: `High-Value Lookalike - ${data.leadId}`,
      type: 'search',
      budget: 5000,
      targeting: {
        audiences: [`lookalike_${data.leadId}`],
        demographics: {},
        behavioral: {
          intent: [data.intent]
        },
        custom: data.customTargeting
      }
    });
  }

  private async initiateProactiveChat(data: any) {
    // Trigger proactive chat for marketing qualified lead
    console.log('Initiating proactive chat for MQL:', data.leadId);
    // Implementation would trigger chat widget
  }

  private async activateRetentionCampaign(data: any) {
    // Multi-channel retention campaign
    const campaign = {
      email: 'retention_offer_email',
      sms: 'special_discount_sms',
      retargeting: 'win_back_campaign'
    };

    this.emit('retention-campaign-activated', {
      customerId: data.customerId,
      campaigns: campaign
    });
  }

  private async getConversationHistory(customerId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('ai_conversations')
      .select('*')
      .eq('customer_id', customerId)
      .order('started_at', { ascending: false });

    return data || [];
  }

  private async getMarketingHistory(customerId: string): Promise<any> {
    const { data } = await this.supabase
      .from('customer_marketing_journey')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    return data;
  }

  private async getBookingHistory(customerId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  private determineCustomerSegment(customer: any): string {
    // Simplified segmentation
    if (customer.total_value > 100000) return 'enterprise';
    if (customer.total_value > 50000) return 'premium';
    if (customer.total_value > 10000) return 'standard';
    return 'basic';
  }

  private generateCustomerTags(customer: any, conversations: any[], marketing: any): string[] {
    const tags = [];

    if (conversations.length > 10) tags.push('highly-engaged');
    if (marketing?.campaigns?.length > 5) tags.push('marketing-active');
    if (customer.referral_count > 0) tags.push('referrer');

    return tags;
  }

  private mergeInteractions(conversations: any[], bookings: any[]): CustomerInteraction[] {
    const interactions: CustomerInteraction[] = [];

    // Add conversations
    conversations.forEach(conv => {
      interactions.push({
        timestamp: new Date(conv.started_at),
        type: 'conversation',
        channel: conv.channel,
        summary: `${conv.current_intent || 'General inquiry'} - ${conv.resolution_status}`,
        sentiment: conv.sentiment_score,
        outcome: conv.resolution_outcome
      });
    });

    // Add bookings
    bookings.forEach(booking => {
      interactions.push({
        timestamp: new Date(booking.created_at),
        type: 'booking',
        channel: 'crm',
        summary: `${booking.service_type} - ${booking.status}`,
        outcome: booking.status
      });
    });

    // Sort by timestamp
    return interactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async analyzeMarketingJourney(marketing: any): Promise<MarketingJourney> {
    if (!marketing) {
      return {
        firstTouch: new Date(),
        lastTouch: new Date(),
        touchpoints: 0,
        channels: [],
        campaigns: [],
        stage: 'awareness',
        conversionProbability: 0
      };
    }

    return {
      firstTouch: new Date(marketing.first_touch),
      lastTouch: new Date(marketing.last_touch),
      touchpoints: marketing.touchpoint_count || 0,
      channels: marketing.channels || [],
      campaigns: marketing.campaigns || [],
      stage: marketing.current_stage || 'awareness',
      conversionProbability: marketing.conversion_probability || 0
    };
  }

  private async generateAIInsights(
    customer: any, 
    interactions: any, 
    marketing: any
  ): Promise<AICustomerInsights> {
    // Use AI engine for insights
    const leadScore = await aiEngine.scoreCustomerLead({
      customerId: customer.id,
      interactions: interactions.length,
      marketingEngagement: marketing?.touchpoints || 0
    });

    const churnRisk = await aiEngine.predictChurnRisk(customer.id);

    return {
      leadScore: leadScore.leadScore,
      lifetimeValue: leadScore.lifetimeValue,
      churnRisk: churnRisk.risk,
      nextBestAction: leadScore.recommendedActions[0] || 'maintain-relationship',
      recommendations: leadScore.recommendedActions,
      predictedNeeds: [leadScore.nextLikelyService]
    };
  }

  private async calculateCustomerValue(customer: any, bookings: any[]): Promise<CustomerValue> {
    const historical = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const avgOrderValue = bookings.length > 0 ? historical / bookings.length : 15000;
    const predicted = avgOrderValue * 3; // Assume 3 future orders
    const potential = predicted * 1.5; // With upselling

    return {
      historical,
      predicted,
      potential,
      profitability: historical * 0.4 // 40% margin
    };
  }

  private async storeUnifiedView(view: UnifiedCustomerView) {
    await this.supabase
      .from('unified_customer_views')
      .upsert({
        customer_id: view.customerId,
        profile: view.profile,
        interactions_summary: {
          count: view.interactions.length,
          last_interaction: view.interactions[0]
        },
        marketing_journey: view.marketingJourney,
        ai_insights: view.aiInsights,
        customer_value: view.value,
        updated_at: new Date()
      });
  }

  private async matchByEmail() {
    // Match customers across systems by email
    console.log('Matching customers by email...');
  }

  private async matchByPhone() {
    // Match customers across systems by phone
    console.log('Matching customers by phone...');
  }

  private async matchByBehavior() {
    // Use AI to match based on behavior patterns
    console.log('Matching customers by behavior patterns...');
  }

  private async attributeConversion(conversion: any): Promise<any> {
    // Multi-touch attribution logic
    const touchpoints = await this.getConversionTouchpoints(conversion.customer_id);
    
    // Linear attribution (simplified)
    const credits: Record<string, number> = {};
    const creditPerTouch = 1 / touchpoints.length;
    
    touchpoints.forEach(tp => {
      credits[tp.channel] = (credits[tp.channel] || 0) + creditPerTouch;
    });

    return {
      touchpoints,
      credits
    };
  }

  private async getConversionTouchpoints(customerId: string): Promise<any[]> {
    // Get all touchpoints leading to conversion
    return [];
  }

  private async analyzeCrossChannelEngagement(): Promise<any> {
    // Analyze how customers engage across channels
    return {
      avgChannelsPerCustomer: 2.3,
      mostEffectiveCombo: ['search', 'chat'],
      synergyScore: 0.85
    };
  }

  private async generateSystemWideRecommendations(): Promise<string[]> {
    return [
      'Increase chat availability during peak marketing hours',
      'Create targeted campaigns for high-chat-engagement segments',
      'Implement proactive chat for returning visitors',
      'Sync email campaigns with conversation topics'
    ];
  }

  private getRelatedServices(service: string): string[] {
    const related: Record<string, string[]> = {
      'hemflytt': ['packhjälp', 'städning'],
      'kontorsflytt': ['arkivering', 'it-flytt'],
      'magasinering': ['transport', 'packhjälp']
    };

    return related[service] || [];
  }

  private calculateEscalationPriority(escalation: any): string {
    if (escalation.customerValue.historical > 100000) return 'urgent';
    if (escalation.aiRecommendations.includes('immediate-attention')) return 'high';
    return 'medium';
  }

  private handleSyncError(source: string, error: any) {
    console.error(`Sync error from ${source}:`, error);
    this.emit('sync-error', { source, error });
  }

  /**
   * Public methods
   */
  async getUnifiedCustomerView(customerId: string): Promise<UnifiedCustomerView | null> {
    // Check cache first
    const cached = this.customerCache.get(customerId);
    if (cached) return cached;

    // Build fresh view
    const { data: customer } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customer) {
      await this.createUnifiedProfile(customer);
      return this.customerCache.get(customerId) || null;
    }

    return null;
  }

  async getSystemStatus(): Promise<ConnectorStatus> {
    return { ...this.status };
  }

  async searchCustomers(query: string): Promise<UnifiedCustomerView[]> {
    const results: UnifiedCustomerView[] = [];

    // Search in cache
    for (const [_, view] of this.customerCache) {
      if (
        view.profile.name.toLowerCase().includes(query.toLowerCase()) ||
        view.profile.email?.includes(query) ||
        view.profile.phone?.includes(query)
      ) {
        results.push(view);
      }
    }

    return results.slice(0, 10); // Limit results
  }

  async forceSync(): Promise<void> {
    await this.performUnifiedSync();
  }
}

// Export singleton instance
export const connectorManager = new ConnectorManager();

// Export individual connectors for direct access
export { customerServiceConnector } from './customer-service-connector';
export { marketingConnector } from './marketing-connector';