/**
 * Personalization Engine
 * AI-powered personalization for customer experiences
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';
import { leadScoringModel } from './lead-scoring-model';
import { clvPredictionModel } from './clv-prediction-model';
import { churnPredictionModel } from './churn-prediction-model';

export interface PersonalizationContext {
  customerId: string;
  sessionId: string;
  timestamp: Date;
  
  // Current context
  channel: 'web' | 'mobile' | 'email' | 'chat' | 'phone';
  page?: string;
  intent?: string;
  mood?: 'positive' | 'neutral' | 'frustrated';
  
  // Customer profile
  segment: string;
  preferences: CustomerPreferences;
  history: InteractionHistory;
  
  // Real-time signals
  currentBehavior: {
    timeOnSite: number;
    pagesViewed: string[];
    actionsToken: string[];
    searchQueries?: string[];
  };
}

export interface CustomerPreferences {
  communicationChannel: string;
  contactTime: string;
  language: string;
  services: string[];
  topics: string[];
  contentType: 'detailed' | 'concise';
  visualPreference: 'text' | 'visual' | 'mixed';
}

export interface InteractionHistory {
  lastInteraction: Date;
  totalInteractions: number;
  channels: string[];
  satisfactionAvg: number;
  purchaseHistory: any[];
  supportHistory: any[];
}

export interface PersonalizationRecommendation {
  customerId: string;
  timestamp: Date;
  
  // Content recommendations
  content: ContentRecommendation[];
  
  // Offer recommendations
  offers: OfferRecommendation[];
  
  // Communication recommendations
  communication: CommunicationRecommendation;
  
  // UI/UX recommendations
  experience: ExperienceRecommendation;
  
  // Next best actions
  nextBestActions: NextBestAction[];
  
  // Timing recommendations
  timing: TimingRecommendation;
}

export interface ContentRecommendation {
  type: 'article' | 'guide' | 'video' | 'case-study' | 'testimonial';
  title: string;
  description: string;
  relevanceScore: number;
  personalizedMessage: string;
  callToAction: string;
}

export interface OfferRecommendation {
  type: 'discount' | 'bundle' | 'upgrade' | 'loyalty' | 'referral';
  service: string;
  value: number;
  message: string;
  validity: number; // days
  probability: number;
  expectedRevenue: number;
}

export interface CommunicationRecommendation {
  channel: string;
  tone: 'formal' | 'friendly' | 'urgent' | 'informative';
  length: 'brief' | 'standard' | 'detailed';
  personalization: {
    useFirstName: boolean;
    referenceHistory: boolean;
    mentionPreferences: boolean;
  };
  suggestedGreeting: string;
  suggestedClosing: string;
}

export interface ExperienceRecommendation {
  layout: 'simple' | 'standard' | 'advanced';
  emphasis: string[];
  hideElements: string[];
  shortcuts: string[];
  colorScheme?: 'default' | 'high-contrast' | 'dark';
  assistanceLevel: 'minimal' | 'standard' | 'guided';
}

export interface NextBestAction {
  action: string;
  priority: number;
  channel: string;
  timing: 'immediate' | 'today' | 'this-week' | 'scheduled';
  expectedOutcome: string;
  successProbability: number;
}

export interface TimingRecommendation {
  bestContactTime: string;
  avoidTimes: string[];
  responseExpectation: string;
  followUpSchedule: Date[];
}

export class PersonalizationEngine extends EventEmitter {
  private supabase = createClient();
  private modelVersion = '2.0';
  private personalizations = new Map<string, PersonalizationRecommendation>();
  
  // Personalization rules and patterns
  private readonly patterns = {
    highValue: {
      minCLV: 100000,
      preferredChannels: ['phone', 'video'],
      offerTypes: ['premium', 'exclusive'],
      contentDepth: 'detailed'
    },
    priceConscious: {
      indicators: ['price_inquiry', 'discount_search', 'comparison'],
      offerTypes: ['discount', 'bundle'],
      emphasis: ['value', 'savings', 'roi']
    },
    timeConstrained: {
      indicators: ['urgent', 'asap', 'quick'],
      communication: 'brief',
      channels: ['chat', 'phone'],
      shortcuts: ['instant-quote', 'quick-booking']
    },
    research: {
      indicators: ['multiple_visits', 'guide_downloads', 'long_sessions'],
      contentTypes: ['detailed', 'educational'],
      nurturePace: 'gradual'
    }
  };
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('🎯 Initializing Personalization Engine v2.0...');
    
    // Load personalization models
    await this.loadPersonalizationModels();
    
    // Start real-time personalization
    this.startRealtimePersonalization();
    
    console.log('✅ Personalization Engine ready');
    this.emit('ready');
  }

  /**
   * Generate personalized recommendations
   */
  async personalize(context: PersonalizationContext): Promise<PersonalizationRecommendation> {
    const startTime = Date.now();
    
    // Get customer intelligence
    const intelligence = await this.gatherCustomerIntelligence(context.customerId);
    
    // Analyze current context
    const contextAnalysis = this.analyzeContext(context, intelligence);
    
    // Generate content recommendations
    const content = await this.recommendContent(context, intelligence, contextAnalysis);
    
    // Generate offer recommendations
    const offers = await this.recommendOffers(context, intelligence, contextAnalysis);
    
    // Determine communication style
    const communication = this.recommendCommunication(context, intelligence);
    
    // Customize experience
    const experience = this.recommendExperience(context, intelligence, contextAnalysis);
    
    // Identify next best actions
    const nextBestActions = await this.identifyNextBestActions(context, intelligence, contextAnalysis);
    
    // Optimize timing
    const timing = this.recommendTiming(context, intelligence);
    
    const recommendation: PersonalizationRecommendation = {
      customerId: context.customerId,
      timestamp: new Date(),
      content,
      offers,
      communication,
      experience,
      nextBestActions,
      timing
    };
    
    // Cache personalization
    this.personalizations.set(context.customerId, recommendation);
    
    // Log personalization
    await this.logPersonalization(context, recommendation);
    
    // Emit event
    this.emit('personalized', {
      context,
      recommendation,
      processingTime: Date.now() - startTime
    });
    
    return recommendation;
  }

  /**
   * Gather comprehensive customer intelligence
   */
  private async gatherCustomerIntelligence(customerId: string): Promise<any> {
    // Fetch from ML models
    const [leadScore, clv, churnRisk] = await Promise.all([
      this.getLeadScore(customerId),
      this.getCLV(customerId),
      this.getChurnRisk(customerId)
    ]);
    
    // Fetch customer data
    const { data: customer } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    // Fetch interaction history
    const { data: interactions } = await this.supabase
      .from('customer_interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    // Analyze patterns
    const patterns = this.analyzeCustomerPatterns(interactions || []);
    
    return {
      customer,
      leadScore,
      clv,
      churnRisk,
      interactions,
      patterns
    };
  }

  /**
   * Analyze current context
   */
  private analyzeContext(context: PersonalizationContext, intelligence: any): any {
    const analysis = {
      intent: this.detectIntent(context),
      urgency: this.assessUrgency(context),
      stage: this.determineCustomerStage(context, intelligence),
      mood: context.mood || this.detectMood(context),
      needs: this.identifyNeeds(context, intelligence)
    };
    
    return analysis;
  }

  /**
   * Recommend personalized content
   */
  private async recommendContent(
    context: PersonalizationContext,
    intelligence: any,
    analysis: any
  ): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];
    
    // Stage-based content
    switch (analysis.stage) {
      case 'research':
        recommendations.push({
          type: 'guide',
          title: 'Complete Moving Guide 2025',
          description: 'Everything you need to know about planning your move',
          relevanceScore: 0.95,
          personalizedMessage: `Hi ${intelligence.customer?.first_name || 'there'}, we noticed you're researching moving options. This guide answers the most common questions.`,
          callToAction: 'Download Free Guide'
        });
        break;
      
      case 'evaluation':
        recommendations.push({
          type: 'case-study',
          title: `How ${this.getSimilarCompany(intelligence)} Saved 30% on Their Office Move`,
          description: 'Learn from a success story similar to your situation',
          relevanceScore: 0.90,
          personalizedMessage: 'See how companies like yours optimize their moving process',
          callToAction: 'Read Case Study'
        });
        break;
      
      case 'decision':
        recommendations.push({
          type: 'testimonial',
          title: 'What Our Customers Say',
          description: 'Real experiences from verified customers',
          relevanceScore: 0.85,
          personalizedMessage: 'Join hundreds of satisfied customers',
          callToAction: 'See Reviews'
        });
        break;
    }
    
    // Need-based content
    if (analysis.needs.includes('pricing')) {
      recommendations.push({
        type: 'article',
        title: 'Transparent Pricing Explained',
        description: 'Understand exactly what you\'re paying for',
        relevanceScore: 0.92,
        personalizedMessage: 'Get clarity on our pricing structure',
        callToAction: 'View Pricing Guide'
      });
    }
    
    // Interest-based content
    if (context.preferences.services.includes('international')) {
      recommendations.push({
        type: 'guide',
        title: 'International Relocation Checklist',
        description: 'Step-by-step guide for moving abroad',
        relevanceScore: 0.88,
        personalizedMessage: 'Simplify your international move',
        callToAction: 'Get Checklist'
      });
    }
    
    // Sort by relevance
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
  }

  /**
   * Recommend personalized offers
   */
  private async recommendOffers(
    context: PersonalizationContext,
    intelligence: any,
    analysis: any
  ): Promise<OfferRecommendation[]> {
    const offers: OfferRecommendation[] = [];
    
    // CLV-based offers
    if (intelligence.clv?.clvTotal > this.patterns.highValue.minCLV) {
      offers.push({
        type: 'loyalty',
        service: 'vip-program',
        value: 20,
        message: 'Exclusive VIP benefits for our valued customers',
        validity: 365,
        probability: 0.8,
        expectedRevenue: intelligence.clv.clv12Months * 0.2
      });
    }
    
    // Churn prevention offers
    if (intelligence.churnRisk?.riskLevel === 'high') {
      offers.push({
        type: 'discount',
        service: 'retention-offer',
        value: 25,
        message: 'Special offer just for you - we value your business',
        validity: 30,
        probability: 0.6,
        expectedRevenue: intelligence.clv.clv6Months * 0.75
      });
    }
    
    // Bundle offers
    if (context.preferences.services.length === 1) {
      const complementaryService = this.getComplementaryService(context.preferences.services[0]);
      offers.push({
        type: 'bundle',
        service: complementaryService,
        value: 15,
        message: `Add ${complementaryService} and save 15%`,
        validity: 14,
        probability: 0.4,
        expectedRevenue: 5000
      });
    }
    
    // Urgency-based offers
    if (analysis.urgency === 'high') {
      offers.push({
        type: 'discount',
        service: 'express-booking',
        value: 10,
        message: 'Book today and get 10% off + priority scheduling',
        validity: 1,
        probability: 0.7,
        expectedRevenue: intelligence.customer?.avg_order_value * 0.9 || 15000
      });
    }
    
    // Referral offers for satisfied customers
    if (intelligence.customer?.satisfaction_avg >= 4.5) {
      offers.push({
        type: 'referral',
        service: 'referral-program',
        value: 1000,
        message: 'Earn 1000 kr for each friend you refer',
        validity: 90,
        probability: 0.3,
        expectedRevenue: 3000
      });
    }
    
    // Sort by expected value
    return offers.sort((a, b) => 
      (b.expectedRevenue * b.probability) - (a.expectedRevenue * a.probability)
    ).slice(0, 3);
  }

  /**
   * Recommend communication style
   */
  private recommendCommunication(
    context: PersonalizationContext,
    intelligence: any
  ): CommunicationRecommendation {
    // Determine tone based on context and history
    let tone: CommunicationRecommendation['tone'] = 'friendly';
    if (context.channel === 'email' && intelligence.customer?.type === 'company') {
      tone = 'formal';
    } else if (context.mood === 'frustrated' || intelligence.patterns?.hasComplaints) {
      tone = 'urgent';
    } else if (context.intent === 'research') {
      tone = 'informative';
    }
    
    // Determine length preference
    let length: CommunicationRecommendation['length'] = 'standard';
    if (context.preferences.contentType === 'concise' || context.channel === 'chat') {
      length = 'brief';
    } else if (context.preferences.contentType === 'detailed') {
      length = 'detailed';
    }
    
    // Personalization level
    const personalization = {
      useFirstName: intelligence.customer?.first_name && tone === 'friendly',
      referenceHistory: intelligence.interactions?.length > 3,
      mentionPreferences: context.preferences.services.length > 0
    };
    
    // Generate greetings
    const suggestedGreeting = this.generateGreeting(tone, intelligence, personalization);
    const suggestedClosing = this.generateClosing(tone, context.channel);
    
    return {
      channel: context.preferences.communicationChannel,
      tone,
      length,
      personalization,
      suggestedGreeting,
      suggestedClosing
    };
  }

  /**
   * Recommend experience customization
   */
  private recommendExperience(
    context: PersonalizationContext,
    intelligence: any,
    analysis: any
  ): ExperienceRecommendation {
    // Determine layout complexity
    let layout: ExperienceRecommendation['layout'] = 'standard';
    if (intelligence.patterns?.techSavvy) {
      layout = 'advanced';
    } else if (intelligence.customer?.age > 65 || context.preferences.visualPreference === 'text') {
      layout = 'simple';
    }
    
    // Determine emphasis areas
    const emphasis: string[] = [];
    if (analysis.needs.includes('pricing')) emphasis.push('pricing-calculator');
    if (analysis.urgency === 'high') emphasis.push('quick-booking');
    if (intelligence.churnRisk?.riskLevel === 'high') emphasis.push('support-chat');
    
    // Elements to hide
    const hideElements: string[] = [];
    if (context.channel === 'mobile') hideElements.push('detailed-tables');
    if (analysis.stage === 'research') hideElements.push('checkout-pressure');
    
    // Shortcuts for power users
    const shortcuts: string[] = [];
    if (intelligence.customer?.order_count > 5) {
      shortcuts.push('repeat-last-order', 'quick-quote', 'direct-booking');
    }
    
    // Assistance level
    let assistanceLevel: ExperienceRecommendation['assistanceLevel'] = 'standard';
    if (analysis.stage === 'research' || !intelligence.patterns?.experienced) {
      assistanceLevel = 'guided';
    } else if (intelligence.patterns?.powerUser) {
      assistanceLevel = 'minimal';
    }
    
    return {
      layout,
      emphasis,
      hideElements,
      shortcuts,
      assistanceLevel
    };
  }

  /**
   * Identify next best actions
   */
  private async identifyNextBestActions(
    context: PersonalizationContext,
    intelligence: any,
    analysis: any
  ): Promise<NextBestAction[]> {
    const actions: NextBestAction[] = [];
    
    // Stage-specific actions
    switch (analysis.stage) {
      case 'research':
        actions.push({
          action: 'Offer consultation',
          priority: 8,
          channel: 'chat',
          timing: 'immediate',
          expectedOutcome: 'Qualify lead and build trust',
          successProbability: 0.7
        });
        break;
      
      case 'evaluation':
        actions.push({
          action: 'Send personalized quote',
          priority: 9,
          channel: 'email',
          timing: 'today',
          expectedOutcome: 'Move to decision stage',
          successProbability: 0.6
        });
        break;
      
      case 'decision':
        actions.push({
          action: 'Call to close',
          priority: 10,
          channel: 'phone',
          timing: 'immediate',
          expectedOutcome: 'Convert to customer',
          successProbability: 0.8
        });
        break;
    }
    
    // Risk-based actions
    if (intelligence.churnRisk?.riskLevel === 'high') {
      actions.push({
        action: 'Retention intervention',
        priority: 10,
        channel: 'phone',
        timing: 'immediate',
        expectedOutcome: 'Prevent churn',
        successProbability: 0.65
      });
    }
    
    // Opportunity-based actions
    if (intelligence.clv?.growthOpportunities?.length > 0) {
      const topOpportunity = intelligence.clv.growthOpportunities[0];
      actions.push({
        action: `Upsell ${topOpportunity.service}`,
        priority: 7,
        channel: context.preferences.communicationChannel,
        timing: 'this-week',
        expectedOutcome: `Generate ${topOpportunity.potentialValue} kr`,
        successProbability: topOpportunity.probability
      });
    }
    
    // Engagement-based actions
    if (context.currentBehavior.timeOnSite > 300 && !context.currentBehavior.actionsToken.includes('quote')) {
      actions.push({
        action: 'Proactive chat offer',
        priority: 8,
        channel: 'chat',
        timing: 'immediate',
        expectedOutcome: 'Assist with questions',
        successProbability: 0.75
      });
    }
    
    // Sort by priority
    return actions.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }

  /**
   * Recommend optimal timing
   */
  private recommendTiming(
    context: PersonalizationContext,
    intelligence: any
  ): TimingRecommendation {
    // Analyze historical interaction patterns
    const interactionTimes = intelligence.interactions?.map((i: any) => 
      new Date(i.created_at).getHours()
    ) || [];
    
    // Find most common interaction hours
    const hourCounts: Record<number, number> = {};
    interactionTimes.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const bestHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '10';
    
    // Determine best contact time
    let bestContactTime = `${bestHour}:00-${parseInt(bestHour) + 1}:00`;
    if (context.preferences.contactTime) {
      bestContactTime = context.preferences.contactTime;
    }
    
    // Times to avoid
    const avoidTimes: string[] = [];
    if (intelligence.customer?.type === 'individual') {
      avoidTimes.push('Before 9 AM', 'After 8 PM');
    }
    if (intelligence.patterns?.lowEngagementTimes) {
      avoidTimes.push(...intelligence.patterns.lowEngagementTimes);
    }
    
    // Response expectation
    let responseExpectation = 'Within 24 hours';
    if (context.intent === 'urgent' || intelligence.customer?.segment === 'vip') {
      responseExpectation = 'Within 2 hours';
    } else if (context.channel === 'chat') {
      responseExpectation = 'Within 5 minutes';
    }
    
    // Follow-up schedule
    const followUpSchedule = this.generateFollowUpSchedule(
      context,
      intelligence,
      bestContactTime
    );
    
    return {
      bestContactTime,
      avoidTimes,
      responseExpectation,
      followUpSchedule
    };
  }

  /**
   * Utility methods
   */
  private detectIntent(context: PersonalizationContext): string {
    if (context.intent) return context.intent;
    
    // Infer from behavior
    if (context.currentBehavior.searchQueries?.some(q => q.includes('pris'))) {
      return 'pricing';
    }
    if (context.currentBehavior.pagesViewed.includes('/services')) {
      return 'service-exploration';
    }
    if (context.currentBehavior.actionsToken.includes('calculator')) {
      return 'quote-generation';
    }
    
    return 'general-browsing';
  }

  private assessUrgency(context: PersonalizationContext): string {
    if (context.currentBehavior.searchQueries?.some(q => 
      q.includes('akut') || q.includes('snabb') || q.includes('idag')
    )) {
      return 'high';
    }
    
    if (context.currentBehavior.timeOnSite < 60) {
      return 'high'; // Quick decision maker
    }
    
    return 'normal';
  }

  private determineCustomerStage(context: PersonalizationContext, intelligence: any): string {
    if (!intelligence.customer) return 'research';
    if (intelligence.customer.order_count > 0) return 'repeat';
    if (context.currentBehavior.actionsToken.includes('quote')) return 'decision';
    if (context.currentBehavior.pagesViewed.length > 5) return 'evaluation';
    return 'research';
  }

  private detectMood(context: PersonalizationContext): PersonalizationContext['mood'] {
    // Simple mood detection based on behavior
    if (context.currentBehavior.timeOnSite < 30 && 
        context.currentBehavior.pagesViewed.length > 3) {
      return 'frustrated'; // Can't find what they need
    }
    
    return 'neutral';
  }

  private identifyNeeds(context: PersonalizationContext, intelligence: any): string[] {
    const needs: string[] = [];
    
    if (context.currentBehavior.searchQueries?.some(q => q.includes('pris'))) {
      needs.push('pricing');
    }
    
    if (context.currentBehavior.pagesViewed.includes('/contact')) {
      needs.push('human-contact');
    }
    
    if (intelligence.churnRisk?.riskLevel === 'high') {
      needs.push('retention');
    }
    
    return needs;
  }

  private analyzeCustomerPatterns(interactions: any[]): any {
    return {
      hasComplaints: interactions.some(i => i.type === 'complaint'),
      techSavvy: interactions.some(i => i.channel === 'api' || i.channel === 'mobile'),
      experienced: interactions.length > 10,
      powerUser: interactions.filter(i => i.type === 'self-service').length > 5,
      lowEngagementTimes: [] // Would analyze actual times
    };
  }

  private getSimilarCompany(intelligence: any): string {
    // Return similar company for case studies
    if (intelligence.customer?.industry === 'tech') return 'TechCorp';
    if (intelligence.customer?.size > 100) return 'MegaCorp';
    return 'SmartBusiness AB';
  }

  private getComplementaryService(service: string): string {
    const complements: Record<string, string> = {
      'hemflytt': 'städning',
      'kontorsflytt': 'arkivering',
      'städning': 'fönsterputsning'
    };
    return complements[service] || 'packtjänst';
  }

  private generateGreeting(
    tone: string, 
    intelligence: any, 
    personalization: any
  ): string {
    const name = personalization.useFirstName ? intelligence.customer?.first_name : '';
    
    const greetings = {
      formal: `Dear ${name || 'Valued Customer'}`,
      friendly: `Hi ${name || 'there'}! 👋`,
      urgent: `${name ? name + ', ' : ''}We need to address this immediately`,
      informative: `${name ? 'Hello ' + name : 'Welcome'}, here's what you need to know`
    };
    
    return greetings[tone as keyof typeof greetings] || greetings.friendly;
  }

  private generateClosing(tone: string, channel: string): string {
    const closings = {
      formal: 'Best regards,\nThe Nordflytt Team',
      friendly: 'Looking forward to helping you!\n- Team Nordflytt',
      urgent: 'Please contact us immediately at 08-123 456',
      informative: 'Questions? We\'re here to help!'
    };
    
    if (channel === 'chat') {
      return 'How else can I help you today?';
    }
    
    return closings[tone as keyof typeof closings] || closings.friendly;
  }

  private generateFollowUpSchedule(
    context: PersonalizationContext,
    intelligence: any,
    bestTime: string
  ): Date[] {
    const schedule: Date[] = [];
    const hour = parseInt(bestTime.split(':')[0]);
    
    if (context.intent === 'urgent') {
      // Follow up same day
      const today = new Date();
      today.setHours(hour + 4, 0, 0, 0);
      schedule.push(today);
    } else {
      // Standard follow-up schedule
      [1, 3, 7, 14].forEach(days => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setHours(hour, 0, 0, 0);
        schedule.push(date);
      });
    }
    
    return schedule;
  }

  /**
   * Model management
   */
  private async loadPersonalizationModels() {
    // Load personalization patterns from database
    const { data: patterns } = await this.supabase
      .from('personalization_patterns')
      .select('*')
      .eq('active', true);
    
    if (patterns) {
      // Update patterns based on successful personalizations
      patterns.forEach(pattern => {
        if (pattern.success_rate > 0.7) {
          // Incorporate successful patterns
          Object.assign(this.patterns, { [pattern.name]: pattern.config });
        }
      });
    }
  }

  private startRealtimePersonalization() {
    // Monitor active sessions for personalization opportunities
    setInterval(async () => {
      await this.checkActiveSessionsForPersonalization();
    }, 30000); // Every 30 seconds
  }

  private async checkActiveSessionsForPersonalization() {
    const { data: sessions } = await this.supabase
      .from('active_sessions')
      .select('*')
      .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000)); // Active in last 5 min
    
    if (sessions) {
      for (const session of sessions) {
        if (this.shouldPersonalize(session)) {
          // Trigger personalization
          this.emit('personalization-opportunity', session);
        }
      }
    }
  }

  private shouldPersonalize(session: any): boolean {
    // Personalize if significant behavior change or milestone reached
    return session.pages_viewed > 3 || 
           session.time_on_site > 180 ||
           session.actions_taken.includes('calculator');
  }

  private async logPersonalization(
    context: PersonalizationContext,
    recommendation: PersonalizationRecommendation
  ) {
    await this.supabase
      .from('personalization_log')
      .insert({
        customer_id: context.customerId,
        session_id: context.sessionId,
        context,
        recommendations: recommendation,
        model_version: this.modelVersion,
        created_at: new Date()
      });
  }

  /**
   * Helper methods for ML model integration
   */
  private async getLeadScore(customerId: string): Promise<any> {
    // Mock - would integrate with actual lead scoring model
    return { leadScore: 75, confidence: 0.85 };
  }

  private async getCLV(customerId: string): Promise<any> {
    // Mock - would integrate with actual CLV model
    return { 
      clvTotal: 125000, 
      clv12Months: 45000,
      growthOpportunities: []
    };
  }

  private async getChurnRisk(customerId: string): Promise<any> {
    // Mock - would integrate with actual churn model
    return { 
      riskLevel: 'low', 
      churnProbability: { day90: 0.15 }
    };
  }

  /**
   * Public methods
   */
  async getPersonalization(customerId: string): Promise<PersonalizationRecommendation | null> {
    return this.personalizations.get(customerId) || null;
  }

  async testPersonalization(customerId: string, scenario: string): Promise<PersonalizationRecommendation> {
    // Test personalization with specific scenarios
    const testContext: PersonalizationContext = {
      customerId,
      sessionId: `test-${Date.now()}`,
      timestamp: new Date(),
      channel: 'web',
      segment: 'standard',
      preferences: {
        communicationChannel: 'email',
        contactTime: '10:00-12:00',
        language: 'sv',
        services: ['hemflytt'],
        topics: ['pricing', 'timing'],
        contentType: 'concise',
        visualPreference: 'mixed'
      },
      history: {
        lastInteraction: new Date(),
        totalInteractions: 5,
        channels: ['web', 'email'],
        satisfactionAvg: 4.2,
        purchaseHistory: [],
        supportHistory: []
      },
      currentBehavior: {
        timeOnSite: 240,
        pagesViewed: ['/services', '/pricing', '/about'],
        actionsToken: ['view-services', 'calculator-start'],
        searchQueries: ['flyttfirma stockholm', 'pris hemflytt']
      }
    };
    
    // Modify context based on scenario
    switch (scenario) {
      case 'urgent':
        testContext.currentBehavior.searchQueries = ['akut flytt', 'flytta idag'];
        break;
      case 'research':
        testContext.currentBehavior.pagesViewed = ['/guide', '/faq', '/blog'];
        break;
      case 'high-value':
        testContext.segment = 'enterprise';
        break;
    }
    
    return await this.personalize(testContext);
  }
}

// Export singleton instance
export const personalizationEngine = new PersonalizationEngine();