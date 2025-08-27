/**
 * AI Customer Service Connector
 * Integrates the 96.6/100 AI Customer Service with CRM
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';
import { aiEngine } from '../core/ai-engine';
import { dataPipeline } from '../data-pipeline';

export interface CustomerServiceConversation {
  id: string;
  customerId?: string;
  startTime: Date;
  endTime?: Date;
  channel: 'web' | 'mobile' | 'phone' | 'email';
  language: string;
  messages: ConversationMessage[];
  intent: CustomerIntent;
  sentiment: SentimentAnalysis;
  aiConfidence: number;
  resolution: ConversationResolution;
}

export interface ConversationMessage {
  id: string;
  timestamp: Date;
  sender: 'customer' | 'ai' | 'agent';
  content: string;
  intent?: string;
  entities?: Record<string, any>;
}

export interface CustomerIntent {
  primary: string;
  secondary?: string[];
  confidence: number;
  entities: {
    service?: string;
    moveDate?: Date;
    fromLocation?: string;
    toLocation?: string;
    budget?: number;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface SentimentAnalysis {
  overall: number; // -1 to 1
  trend: 'improving' | 'stable' | 'declining';
  emotions: {
    happy: number;
    frustrated: number;
    confused: number;
    satisfied: number;
  };
}

export interface ConversationResolution {
  status: 'ongoing' | 'resolved' | 'escalated' | 'abandoned';
  outcome?: 'lead_created' | 'booking_made' | 'support_provided' | 'information_given';
  satisfactionScore?: number;
  nextActions?: string[];
}

export class CustomerServiceConnector extends EventEmitter {
  private supabase = createClient();
  private wsConnection?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private conversationCache = new Map<string, CustomerServiceConversation>();
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('🤖 Initializing AI Customer Service Connector...');
    
    // Connect to customer service WebSocket
    await this.connectWebSocket();
    
    // Set up conversation monitoring
    this.setupConversationMonitoring();
    
    // Initialize historical data sync
    await this.syncHistoricalConversations();
    
    console.log('✅ Customer Service Connector ready');
    this.emit('ready');
  }

  /**
   * Connect to AI Customer Service WebSocket
   */
  private async connectWebSocket() {
    const wsUrl = process.env.NEXT_PUBLIC_AI_SERVICE_WS_URL || 'wss://ai.nordflytt.se/ws';
    
    try {
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        console.log('✅ Connected to AI Customer Service WebSocket');
        this.reconnectAttempts = 0;
        
        // Authenticate
        this.wsConnection?.send(JSON.stringify({
          type: 'auth',
          token: process.env.AI_SERVICE_API_KEY
        }));
        
        // Subscribe to events
        this.wsConnection?.send(JSON.stringify({
          type: 'subscribe',
          events: ['conversation.started', 'conversation.updated', 'conversation.ended']
        }));
      };

      this.wsConnection.onmessage = (event) => {
        this.handleWebSocketMessage(JSON.parse(event.data));
      };

      this.wsConnection.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.wsConnection.onclose = () => {
        console.warn('⚠️ WebSocket connection closed');
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('❌ Failed to connect to AI Customer Service:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'conversation.started':
        await this.handleConversationStarted(message.data);
        break;
      
      case 'conversation.updated':
        await this.handleConversationUpdated(message.data);
        break;
      
      case 'conversation.ended':
        await this.handleConversationEnded(message.data);
        break;
      
      case 'intent.detected':
        await this.handleIntentDetected(message.data);
        break;
      
      case 'escalation.required':
        await this.handleEscalationRequired(message.data);
        break;
    }
  }

  /**
   * Handle new conversation start
   */
  private async handleConversationStarted(data: any) {
    console.log('💬 New conversation started:', data.conversationId);
    
    const conversation: CustomerServiceConversation = {
      id: data.conversationId,
      customerId: data.customerId,
      startTime: new Date(data.timestamp),
      channel: data.channel,
      language: data.language || 'sv',
      messages: [],
      intent: {
        primary: 'unknown',
        confidence: 0,
        entities: {}
      },
      sentiment: {
        overall: 0,
        trend: 'stable',
        emotions: { happy: 0, frustrated: 0, confused: 0, satisfied: 0 }
      },
      aiConfidence: data.aiScore || 0.966, // 96.6%
      resolution: {
        status: 'ongoing'
      }
    };
    
    // Cache conversation
    this.conversationCache.set(conversation.id, conversation);
    
    // Create CRM entry
    await this.createCRMEntry(conversation);
    
    // Emit for real-time processing
    this.emit('conversation-started', conversation);
  }

  /**
   * Handle conversation updates
   */
  private async handleConversationUpdated(data: any) {
    const conversation = this.conversationCache.get(data.conversationId);
    if (!conversation) return;
    
    // Update conversation data
    if (data.message) {
      conversation.messages.push({
        id: data.messageId,
        timestamp: new Date(data.timestamp),
        sender: data.sender,
        content: data.content,
        intent: data.intent,
        entities: data.entities
      });
    }
    
    if (data.intent) {
      conversation.intent = this.mergeIntentData(conversation.intent, data.intent);
    }
    
    if (data.sentiment) {
      conversation.sentiment = data.sentiment;
    }
    
    // Process through AI engine for insights
    await this.processConversationUpdate(conversation);
    
    // Update CRM
    await this.updateCRMEntry(conversation);
    
    this.emit('conversation-updated', conversation);
  }

  /**
   * Handle conversation end
   */
  private async handleConversationEnded(data: any) {
    const conversation = this.conversationCache.get(data.conversationId);
    if (!conversation) return;
    
    conversation.endTime = new Date(data.timestamp);
    conversation.resolution = data.resolution;
    
    // Final AI analysis
    const analysis = await this.analyzeCompletedConversation(conversation);
    
    // Update CRM with final data
    await this.finalizeCRMEntry(conversation, analysis);
    
    // Trigger appropriate workflows
    await this.triggerPostConversationWorkflows(conversation, analysis);
    
    // Clean up cache after delay
    setTimeout(() => {
      this.conversationCache.delete(conversation.id);
    }, 300000); // 5 minutes
    
    this.emit('conversation-ended', conversation);
  }

  /**
   * Handle detected intent
   */
  private async handleIntentDetected(data: any) {
    console.log('🎯 Intent detected:', data.intent, 'Confidence:', data.confidence);
    
    const conversation = this.conversationCache.get(data.conversationId);
    if (!conversation) return;
    
    // Update intent
    conversation.intent = {
      primary: data.intent,
      secondary: data.secondaryIntents,
      confidence: data.confidence,
      entities: data.entities
    };
    
    // Check if this is a high-value intent
    if (this.isHighValueIntent(data.intent, data.entities)) {
      await this.handleHighValueIntent(conversation);
    }
    
    // Feed to AI engine for scoring
    if (data.entities.service || data.entities.moveDate) {
      const leadScore = await aiEngine.scoreCustomerLead({
        source: 'ai-chat',
        intent: data.intent,
        ...data.entities,
        conversationId: conversation.id
      });
      
      // Store score
      await this.supabase
        .from('conversation_scores')
        .upsert({
          conversation_id: conversation.id,
          lead_score: leadScore.leadScore,
          lifetime_value: leadScore.lifetimeValue,
          next_likely_service: leadScore.nextLikelyService
        });
    }
  }

  /**
   * Handle escalation requirements
   */
  private async handleEscalationRequired(data: any) {
    console.log('🚨 Escalation required:', data.reason);
    
    const conversation = this.conversationCache.get(data.conversationId);
    if (!conversation) return;
    
    // Create urgent task
    const task = {
      title: `AI Escalation: ${data.reason}`,
      description: `Customer needs human assistance. AI confidence: ${conversation.aiConfidence}`,
      priority: 'urgent',
      type: 'ai-escalation',
      customer_id: conversation.customerId,
      conversation_id: conversation.id,
      assigned_to: this.determineEscalationTarget(data.reason),
      due_date: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      metadata: {
        conversation_summary: this.summarizeConversation(conversation),
        customer_intent: conversation.intent,
        sentiment: conversation.sentiment
      }
    };
    
    const { data: createdTask } = await this.supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    // Notify appropriate team
    this.emit('escalation-created', {
      task: createdTask,
      conversation
    });
  }

  /**
   * Create CRM entry for new conversation
   */
  private async createCRMEntry(conversation: CustomerServiceConversation) {
    // Check if customer exists
    let customerId = conversation.customerId;
    
    if (!customerId && conversation.messages.length > 0) {
      // Try to identify customer from conversation
      customerId = await this.identifyCustomer(conversation);
    }
    
    // Create or update lead
    const leadData = {
      source: 'ai-chat',
      channel: conversation.channel,
      conversation_id: conversation.id,
      language: conversation.language,
      initial_timestamp: conversation.startTime,
      ai_confidence: conversation.aiConfidence,
      status: 'active',
      customer_id: customerId
    };
    
    const { data: lead } = await this.supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();
    
    // Create conversation record
    await this.supabase
      .from('ai_conversations')
      .insert({
        id: conversation.id,
        lead_id: lead.id,
        customer_id: customerId,
        started_at: conversation.startTime,
        channel: conversation.channel,
        language: conversation.language,
        ai_confidence: conversation.aiConfidence,
        status: 'active'
      });
  }

  /**
   * Update CRM entry with conversation progress
   */
  private async updateCRMEntry(conversation: CustomerServiceConversation) {
    // Update conversation record
    await this.supabase
      .from('ai_conversations')
      .update({
        last_message_at: new Date(),
        message_count: conversation.messages.length,
        current_intent: conversation.intent.primary,
        intent_confidence: conversation.intent.confidence,
        sentiment_score: conversation.sentiment.overall,
        entities: conversation.intent.entities
      })
      .eq('id', conversation.id);
    
    // Feed to data pipeline for real-time processing
    dataPipeline.emit('external-data', {
      source: 'ai-customer-service',
      type: 'lead',
      data: {
        conversationId: conversation.id,
        customerId: conversation.customerId,
        intent: conversation.intent,
        sentiment: conversation.sentiment,
        messages: conversation.messages.length
      }
    });
  }

  /**
   * Finalize CRM entry when conversation ends
   */
  private async finalizeCRMEntry(conversation: CustomerServiceConversation, analysis: any) {
    // Update conversation record
    await this.supabase
      .from('ai_conversations')
      .update({
        ended_at: conversation.endTime,
        duration_seconds: Math.floor(
          (conversation.endTime!.getTime() - conversation.startTime.getTime()) / 1000
        ),
        resolution_status: conversation.resolution.status,
        resolution_outcome: conversation.resolution.outcome,
        satisfaction_score: conversation.resolution.satisfactionScore,
        final_analysis: analysis,
        status: 'completed'
      })
      .eq('id', conversation.id);
    
    // Update lead status if applicable
    if (conversation.resolution.outcome === 'lead_created') {
      await this.supabase
        .from('leads')
        .update({
          status: 'qualified',
          qualification_score: analysis.qualificationScore,
          next_actions: conversation.resolution.nextActions
        })
        .eq('conversation_id', conversation.id);
    }
  }

  /**
   * Analyze completed conversation
   */
  private async analyzeCompletedConversation(conversation: CustomerServiceConversation) {
    // Extract key metrics
    const duration = conversation.endTime 
      ? (conversation.endTime.getTime() - conversation.startTime.getTime()) / 1000 
      : 0;
    
    const customerMessages = conversation.messages.filter(m => m.sender === 'customer');
    const aiMessages = conversation.messages.filter(m => m.sender === 'ai');
    
    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(conversation);
    
    // Determine qualification
    const qualificationScore = this.calculateQualificationScore(conversation);
    
    // Extract valuable insights
    const insights = {
      duration,
      messageCount: conversation.messages.length,
      customerMessageCount: customerMessages.length,
      aiMessageCount: aiMessages.length,
      averageResponseTime: this.calculateAverageResponseTime(conversation),
      engagementScore,
      qualificationScore,
      intentEvolution: this.trackIntentEvolution(conversation),
      sentimentJourney: this.analyzeSentimentJourney(conversation),
      keyTopics: this.extractKeyTopics(conversation),
      recommendedFollowUp: this.recommendFollowUp(conversation)
    };
    
    return insights;
  }

  /**
   * Trigger post-conversation workflows
   */
  private async triggerPostConversationWorkflows(
    conversation: CustomerServiceConversation, 
    analysis: any
  ) {
    // High-value lead workflow
    if (analysis.qualificationScore > 80) {
      dataPipeline.emit('external-data', {
        source: 'ai-customer-service',
        type: 'lead',
        data: {
          conversationId: conversation.id,
          customerId: conversation.customerId,
          leadScore: analysis.qualificationScore,
          intent: conversation.intent,
          analysis
        }
      });
    }
    
    // Follow-up workflow
    if (analysis.recommendedFollowUp.required) {
      await this.scheduleFollowUp(conversation, analysis.recommendedFollowUp);
    }
    
    // Feedback collection workflow
    if (conversation.resolution.status === 'resolved' && !conversation.resolution.satisfactionScore) {
      await this.scheduleFeedbackCollection(conversation);
    }
  }

  /**
   * Setup conversation monitoring dashboard
   */
  private setupConversationMonitoring() {
    // Monitor active conversations
    setInterval(() => {
      const activeConversations = Array.from(this.conversationCache.values())
        .filter(c => !c.endTime);
      
      if (activeConversations.length > 0) {
        console.log(`📊 Active conversations: ${activeConversations.length}`);
        
        // Check for stuck conversations
        activeConversations.forEach(conversation => {
          const duration = (Date.now() - conversation.startTime.getTime()) / 1000 / 60;
          if (duration > 30) { // 30 minutes
            this.handleStuckConversation(conversation);
          }
        });
      }
    }, 60000); // Every minute
  }

  /**
   * Sync historical conversations from AI service
   */
  private async syncHistoricalConversations() {
    try {
      const response = await fetch(`${process.env.AI_SERVICE_API_URL}/conversations/history`, {
        headers: {
          'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY}`
        }
      });
      
      if (response.ok) {
        const { conversations } = await response.json();
        console.log(`📥 Syncing ${conversations.length} historical conversations`);
        
        for (const conv of conversations) {
          await this.processHistoricalConversation(conv);
        }
      }
    } catch (error) {
      console.error('Failed to sync historical conversations:', error);
    }
  }

  /**
   * Helper methods
   */
  private isHighValueIntent(intent: string, entities: any): boolean {
    const highValueIntents = [
      'kontorsflytt_large',
      'international_move',
      'corporate_contract',
      'urgent_booking'
    ];
    
    return highValueIntents.includes(intent) || 
           entities.budget > 50000 ||
           entities.urgency === 'high';
  }

  private async handleHighValueIntent(conversation: CustomerServiceConversation) {
    // Notify sales team immediately
    const notification = {
      type: 'high-value-lead',
      conversationId: conversation.id,
      intent: conversation.intent,
      channel: conversation.channel,
      timestamp: new Date()
    };
    
    this.emit('high-value-intent', notification);
    
    // Prioritize in system
    await this.supabase
      .from('ai_conversations')
      .update({ priority: 'high' })
      .eq('id', conversation.id);
  }

  private mergeIntentData(existing: CustomerIntent, update: any): CustomerIntent {
    return {
      primary: update.primary || existing.primary,
      secondary: update.secondary || existing.secondary,
      confidence: update.confidence || existing.confidence,
      entities: { ...existing.entities, ...update.entities }
    };
  }

  private async identifyCustomer(conversation: CustomerServiceConversation): Promise<string | undefined> {
    // Try to extract customer info from messages
    for (const message of conversation.messages) {
      if (message.entities?.email || message.entities?.phone) {
        const { data: customer } = await this.supabase
          .from('customers')
          .select('id')
          .or(`email.eq.${message.entities.email},phone.eq.${message.entities.phone}`)
          .single();
        
        if (customer) return customer.id;
      }
    }
    
    return undefined;
  }

  private calculateEngagementScore(conversation: CustomerServiceConversation): number {
    const factors = {
      messageCount: Math.min(conversation.messages.length / 20, 1) * 0.3,
      sentiment: (conversation.sentiment.overall + 1) / 2 * 0.3,
      intentClarity: conversation.intent.confidence * 0.2,
      responseRate: this.calculateResponseRate(conversation) * 0.2
    };
    
    return Object.values(factors).reduce((a, b) => a + b, 0) * 100;
  }

  private calculateQualificationScore(conversation: CustomerServiceConversation): number {
    const hasService = !!conversation.intent.entities.service;
    const hasDate = !!conversation.intent.entities.moveDate;
    const hasBudget = !!conversation.intent.entities.budget;
    const hasLocation = !!conversation.intent.entities.fromLocation;
    
    const dataCompleteness = [hasService, hasDate, hasBudget, hasLocation]
      .filter(Boolean).length / 4;
    
    const score = (
      dataCompleteness * 0.4 +
      conversation.intent.confidence * 0.3 +
      (conversation.sentiment.overall + 1) / 2 * 0.3
    ) * 100;
    
    return Math.round(score);
  }

  private calculateAverageResponseTime(conversation: CustomerServiceConversation): number {
    const responseTimes: number[] = [];
    
    for (let i = 1; i < conversation.messages.length; i++) {
      const prev = conversation.messages[i - 1];
      const curr = conversation.messages[i];
      
      if (prev.sender === 'customer' && curr.sender === 'ai') {
        const time = curr.timestamp.getTime() - prev.timestamp.getTime();
        responseTimes.push(time);
      }
    }
    
    return responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000
      : 0;
  }

  private calculateResponseRate(conversation: CustomerServiceConversation): number {
    const customerMessages = conversation.messages.filter(m => m.sender === 'customer').length;
    const aiResponses = conversation.messages.filter(m => m.sender === 'ai').length;
    
    return customerMessages > 0 ? aiResponses / customerMessages : 0;
  }

  private trackIntentEvolution(conversation: CustomerServiceConversation): any[] {
    const evolution: any[] = [];
    let currentIntent: string | undefined;
    
    conversation.messages.forEach(message => {
      if (message.intent && message.intent !== currentIntent) {
        evolution.push({
          from: currentIntent,
          to: message.intent,
          timestamp: message.timestamp
        });
        currentIntent = message.intent;
      }
    });
    
    return evolution;
  }

  private analyzeSentimentJourney(conversation: CustomerServiceConversation): any {
    // Simplified - would track sentiment changes over time
    return {
      start: 0,
      end: conversation.sentiment.overall,
      trend: conversation.sentiment.trend,
      volatility: 'low'
    };
  }

  private extractKeyTopics(conversation: CustomerServiceConversation): string[] {
    const topics = new Set<string>();
    
    // Add intent
    topics.add(conversation.intent.primary);
    
    // Add entities
    Object.keys(conversation.intent.entities).forEach(entity => {
      if (conversation.intent.entities[entity]) {
        topics.add(entity);
      }
    });
    
    // Add from messages
    conversation.messages.forEach(message => {
      if (message.intent) topics.add(message.intent);
    });
    
    return Array.from(topics);
  }

  private recommendFollowUp(conversation: CustomerServiceConversation): any {
    const score = this.calculateQualificationScore(conversation);
    
    if (score > 80) {
      return {
        required: true,
        timing: 'within_1_hour',
        method: 'phone',
        priority: 'high'
      };
    } else if (score > 60) {
      return {
        required: true,
        timing: 'within_24_hours',
        method: 'email',
        priority: 'medium'
      };
    } else {
      return {
        required: false
      };
    }
  }

  private determineEscalationTarget(reason: string): string {
    const escalationMap: Record<string, string> = {
      'technical_issue': 'tech-support',
      'billing_complaint': 'finance-team',
      'urgent_request': 'operations-team',
      'complex_quote': 'sales-team',
      'general': 'customer-service'
    };
    
    return escalationMap[reason] || 'customer-service';
  }

  private summarizeConversation(conversation: CustomerServiceConversation): string {
    const messageCount = conversation.messages.length;
    const duration = conversation.endTime 
      ? Math.floor((conversation.endTime.getTime() - conversation.startTime.getTime()) / 1000 / 60)
      : Math.floor((Date.now() - conversation.startTime.getTime()) / 1000 / 60);
    
    return `Conversation ${conversation.id}: ${messageCount} messages over ${duration} minutes. ` +
           `Intent: ${conversation.intent.primary} (${Math.round(conversation.intent.confidence * 100)}% confidence). ` +
           `Sentiment: ${conversation.sentiment.overall > 0 ? 'Positive' : 'Negative'}`;
  }

  private async scheduleFollowUp(conversation: CustomerServiceConversation, followUp: any) {
    const task = {
      title: `Follow up: ${conversation.intent.primary}`,
      description: `AI conversation follow-up required. ${this.summarizeConversation(conversation)}`,
      type: 'ai-followup',
      priority: followUp.priority,
      method: followUp.method,
      conversation_id: conversation.id,
      customer_id: conversation.customerId,
      due_date: this.calculateFollowUpTime(followUp.timing),
      metadata: {
        conversation_summary: this.summarizeConversation(conversation),
        intent: conversation.intent,
        qualification_score: this.calculateQualificationScore(conversation)
      }
    };
    
    await this.supabase
      .from('tasks')
      .insert(task);
  }

  private calculateFollowUpTime(timing: string): Date {
    const now = Date.now();
    const timingMap: Record<string, number> = {
      'within_1_hour': 60 * 60 * 1000,
      'within_24_hours': 24 * 60 * 60 * 1000,
      'within_3_days': 3 * 24 * 60 * 60 * 1000,
      'within_1_week': 7 * 24 * 60 * 60 * 1000
    };
    
    return new Date(now + (timingMap[timing] || timingMap['within_24_hours']));
  }

  private async scheduleFeedbackCollection(conversation: CustomerServiceConversation) {
    const task = {
      title: 'Collect customer feedback',
      description: `Request feedback for AI conversation ${conversation.id}`,
      type: 'feedback-collection',
      priority: 'low',
      conversation_id: conversation.id,
      customer_id: conversation.customerId,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      metadata: {
        channel: conversation.channel,
        resolution: conversation.resolution
      }
    };
    
    await this.supabase
      .from('tasks')
      .insert(task);
  }

  private async handleStuckConversation(conversation: CustomerServiceConversation) {
    console.warn(`⚠️ Stuck conversation detected: ${conversation.id}`);
    
    // Create escalation
    await this.handleEscalationRequired({
      conversationId: conversation.id,
      reason: 'conversation_timeout',
      duration: (Date.now() - conversation.startTime.getTime()) / 1000 / 60
    });
  }

  private async processHistoricalConversation(conv: any) {
    // Create historical record
    const { data: existing } = await this.supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conv.id)
      .single();
    
    if (!existing) {
      await this.supabase
        .from('ai_conversations')
        .insert({
          id: conv.id,
          customer_id: conv.customerId,
          started_at: conv.startTime,
          ended_at: conv.endTime,
          channel: conv.channel,
          status: 'completed',
          resolution_status: conv.resolution?.status,
          resolution_outcome: conv.resolution?.outcome,
          message_count: conv.messageCount,
          ai_confidence: conv.aiConfidence || 0.966
        });
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('connection-failed');
    }
  }

  /**
   * Public methods
   */
  async getConversation(conversationId: string): Promise<CustomerServiceConversation | null> {
    // Check cache first
    const cached = this.conversationCache.get(conversationId);
    if (cached) return cached;
    
    // Fetch from API
    try {
      const response = await fetch(
        `${process.env.AI_SERVICE_API_URL}/conversations/${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY}`
          }
        }
      );
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    }
    
    return null;
  }

  async getActiveConversations(): Promise<CustomerServiceConversation[]> {
    return Array.from(this.conversationCache.values())
      .filter(c => !c.endTime);
  }

  async getConversationStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    const stats = {
      total: 0,
      active: 0,
      completed: 0,
      escalated: 0,
      averageDuration: 0,
      averageSatisfaction: 0,
      topIntents: [] as any[],
      resolutionRate: 0
    };
    
    // Would fetch from database for production
    return stats;
  }
}

// Export singleton instance
export const customerServiceConnector = new CustomerServiceConnector();