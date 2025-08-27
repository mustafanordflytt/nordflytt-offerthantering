/**
 * AI-CRM Integration Module
 * Connects all AI systems with the CRM for seamless operation
 */

import { aiEngine } from './core/ai-engine';
import { leadScoringModel } from './ml-models/lead-scoring-model';
import { clvPredictionModel } from './ml-models/clv-prediction-model';
import { churnPredictionModel } from './ml-models/churn-prediction-model';
import { personalizationEngine } from './ml-models/personalization-engine';
import { smartJobScheduler } from './workflow/smart-job-scheduler';
import { dynamicPricingEngine } from './workflow/dynamic-pricing-engine';
import { automatedAssignment } from './workflow/automated-assignment';
import { createClient } from '@/lib/supabase';

export class CRMIntegration {
  private supabase = createClient();
  private initialized = false;

  /**
   * Initialize AI integration with CRM
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🤖 Initializing AI-CRM Integration...');
      
      // Check if AI features are enabled
      if (process.env.ENABLE_AI_FEATURES !== 'true') {
        console.warn('⚠️ AI features are disabled in environment');
        return;
      }

      // AI engine initializes itself on construction
      // Wait a bit to ensure it's ready
      await new Promise(resolve => {
        if (aiEngine.listenerCount('ready') > 0) {
          aiEngine.once('ready', resolve);
        } else {
          // Already initialized
          resolve(undefined);
        }
      });
      
      // Set up real-time listeners
      this.setupRealtimeListeners();
      
      // Start background processes
      this.startBackgroundProcesses();
      
      this.initialized = true;
      console.log('✅ AI-CRM Integration initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize AI-CRM integration:', error);
      throw error;
    }
  }

  /**
   * Enhance customer data with AI intelligence
   */
  async enhanceCustomerData(customerId: string) {
    try {
      // Get customer data
      const { data: customer, error } = await this.supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error || !customer) {
        throw new Error('Customer not found');
      }

      // Get customer history
      const { data: jobs } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      // Run AI analysis
      const [leadScore, clvPrediction, churnRisk, personalization] = await Promise.all([
        leadScoringModel.scoreLead({
          source: customer.source || 'organic',
          budget: customer.estimated_budget || 0,
          urgency: customer.urgency || 'normal',
          serviceType: customer.service_type || 'moving',
          previousCustomer: jobs && jobs.length > 0,
          responseTime: 0,
          engagementScore: customer.engagement_score || 5,
          marketingQualified: true,
          industry: customer.industry || 'unknown',
          companySize: customer.company_size || 'small',
          decisionTimeframe: 'immediate',
          competitorMentioned: false,
          referralSource: customer.referral_source || 'direct',
          websiteBehavior: {
            pageViews: customer.page_views || 1,
            timeOnSite: customer.time_on_site || 60,
            downloadsCompleted: 0
          },
          emailEngagement: {
            opensRate: 0.5,
            clickRate: 0.2,
            responseRate: 0.1
          }
        }),
        clvPredictionModel.predictCLV({
          customerId,
          acquisitionCost: 1000,
          services: jobs?.map(j => j.service_type) || [],
          averageOrderValue: jobs?.reduce((sum, j) => sum + (j.total_price || 0), 0) / (jobs?.length || 1) || 0,
          orderFrequency: jobs?.length || 0,
          lastOrderDays: jobs && jobs[0] ? Math.floor((Date.now() - new Date(jobs[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) : 365,
          totalOrders: jobs?.length || 0,
          customerSince: new Date(customer.created_at),
          satisfactionScore: customer.satisfaction_score || 4.0,
          referrals: customer.referral_count || 0
        }),
        churnPredictionModel.predictChurn({
          customerId,
          lastInteractionDays: Math.floor((Date.now() - new Date(customer.last_interaction || customer.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          totalOrders: jobs?.length || 0,
          averageOrderValue: jobs?.reduce((sum, j) => sum + (j.total_price || 0), 0) / (jobs?.length || 1) || 0,
          lastOrderValue: jobs && jobs[0] ? jobs[0].total_price || 0 : 0,
          customerLifetimeDays: Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          supportTickets: customer.support_tickets || 0,
          complaintRate: customer.complaint_rate || 0,
          paymentDelays: customer.payment_delays || 0,
          competitorInteractions: 0,
          satisfactionTrend: 'stable',
          serviceTypes: [...new Set(jobs?.map(j => j.service_type) || [])],
          seasonality: this.getCurrentSeason()
        }),
        personalizationEngine.generatePersonalization({
          customerId,
          preferences: customer.preferences || {},
          behavior: {
            browsingHistory: [],
            searchQueries: [],
            clickPatterns: {},
            timeSpentByCategory: {}
          },
          demographics: {
            age: customer.age,
            location: customer.location,
            segment: customer.segment || 'standard'
          },
          transactionHistory: jobs?.map(j => ({
            service: j.service_type,
            value: j.total_price || 0,
            date: new Date(j.created_at),
            satisfaction: j.satisfaction_score
          })) || []
        })
      ]);

      // Store AI insights in database
      await this.supabase
        .from('customer_intelligence')
        .upsert({
          customer_id: customerId,
          lead_score: leadScore.score,
          lead_confidence: leadScore.confidence,
          lifetime_value_prediction: clvPrediction.predictedCLV,
          churn_risk_score: churnRisk.churnProbability,
          upsell_potential: clvPrediction.upsellPotential,
          next_likely_service: personalization.recommendations.nextService,
          personalization_profile: personalization,
          ai_recommendations: [
            ...leadScore.recommendations,
            ...clvPrediction.recommendations,
            ...churnRisk.preventionStrategies.map(s => s.description)
          ],
          last_ai_analysis: new Date()
        }, {
          onConflict: 'customer_id'
        });

      // Return enhanced data
      return {
        customer,
        aiInsights: {
          leadScore,
          clvPrediction,
          churnRisk,
          personalization,
          summary: {
            score: leadScore.score,
            value: clvPrediction.predictedCLV,
            risk: churnRisk.churnProbability,
            priority: leadScore.priority,
            segment: leadScore.segment
          }
        }
      };

    } catch (error) {
      console.error('Error enhancing customer data:', error);
      throw error;
    }
  }

  /**
   * Create AI-optimized job
   */
  async createOptimizedJob(params: {
    customerId: string;
    serviceType: string;
    requirements: any;
  }) {
    try {
      // Get customer intelligence
      const { data: intelligence } = await this.supabase
        .from('customer_intelligence')
        .select('*')
        .eq('customer_id', params.customerId)
        .single();

      // Generate optimal schedule
      const schedule = await smartJobScheduler.scheduleJob({
        jobId: `job-${Date.now()}`,
        customerId: params.customerId,
        serviceType: params.serviceType,
        estimatedDuration: 4,
        requiredSkills: ['moving', 'packing'],
        equipmentNeeded: ['truck', 'dolly'],
        teamSize: 2,
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        preferredTimeSlot: 'morning',
        flexibilityDays: 7,
        pickupLocation: params.requirements.pickupLocation || {
          address: 'Stockholm',
          coordinates: { lat: 59.3293, lng: 18.0686 },
          floor: 2,
          elevator: true,
          parkingDistance: 10
        },
        deliveryLocation: params.requirements.deliveryLocation || {
          address: 'Uppsala',
          coordinates: { lat: 59.8586, lng: 17.6389 },
          floor: 1,
          elevator: false,
          parkingDistance: 20
        },
        distance: 70,
        urgency: intelligence?.lead_score > 80 ? 'high' : 'normal',
        specialInstructions: params.requirements.specialInstructions
      });

      // Calculate dynamic pricing
      const pricing = await dynamicPricingEngine.calculatePrice({
        baseService: params.serviceType,
        volume: params.requirements.volume || 30,
        distance: 70,
        floors: { pickup: 2, delivery: 1 },
        hasElevator: { pickup: true, delivery: false },
        parkingDistance: { pickup: 10, delivery: 20 },
        date: schedule.scheduledDate,
        urgency: intelligence?.lead_score > 80 ? 'high' : 'normal',
        customerSegment: intelligence?.lifetime_value_prediction > 100000 ? 'vip' : 'standard'
      });

      // Auto-assign best team
      const assignment = await automatedAssignment.assignJob({
        jobId: schedule.jobId,
        jobType: params.serviceType,
        requirements: {
          skills: ['moving', 'packing'],
          teamSize: 2,
          equipment: ['truck', 'dolly'],
          languages: ['swedish', 'english']
        },
        location: schedule.route.startPoint,
        scheduledDate: schedule.scheduledDate,
        estimatedDuration: 4,
        customerSegment: intelligence?.lifetime_value_prediction > 100000 ? 'vip' : 'standard',
        priority: intelligence?.lead_score > 80 ? 'high' : 'normal'
      });

      // Create job in database
      const { data: job, error } = await this.supabase
        .from('jobs')
        .insert({
          customer_id: params.customerId,
          service_type: params.serviceType,
          status: 'scheduled',
          scheduled_date: schedule.scheduledDate,
          assigned_team: assignment.team.id,
          total_price: pricing.totalPrice,
          ai_optimized: true,
          optimization_score: (schedule.utilizationScore + assignment.matchScore) / 2,
          estimated_duration: schedule.estimatedCompletion,
          route_data: schedule.route,
          pricing_data: pricing
        })
        .select()
        .single();

      if (error) throw error;

      // Store automation details
      await this.supabase
        .from('workflow_automation')
        .insert({
          job_id: job.id,
          automation_type: 'full_optimization',
          ai_assigned_team: [assignment.team.id],
          optimization_score: (schedule.utilizationScore + assignment.matchScore) / 2,
          predicted_completion_time: `${schedule.estimatedCompletion} hours`,
          dynamic_price: pricing.totalPrice,
          base_price: pricing.basePrice,
          price_adjustments: pricing.adjustments,
          automation_confidence: assignment.confidence,
          performance_metrics: {
            scheduling_score: schedule.utilizationScore,
            assignment_score: assignment.matchScore,
            pricing_confidence: pricing.confidence
          }
        });

      return {
        success: true,
        job,
        aiOptimizations: {
          schedule,
          pricing,
          assignment,
          confidence: (schedule.confidence + pricing.confidence + assignment.confidence) / 3
        }
      };

    } catch (error) {
      console.error('Error creating optimized job:', error);
      throw error;
    }
  }

  /**
   * Get AI-enhanced lead scores
   */
  async getLeadScores(limit: number = 50) {
    try {
      const { data: leads, error } = await this.supabase
        .from('leads')
        .select(`
          *,
          customer_intelligence (
            lead_score,
            lead_confidence,
            lifetime_value_prediction,
            ai_recommendations
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Score any unscored leads
      const unscoredLeads = leads?.filter(l => !l.customer_intelligence) || [];
      
      for (const lead of unscoredLeads) {
        await this.enhanceCustomerData(lead.id);
      }

      // Re-fetch with scores
      const { data: scoredLeads } = await this.supabase
        .from('leads')
        .select(`
          *,
          customer_intelligence (
            lead_score,
            lead_confidence,
            lifetime_value_prediction,
            ai_recommendations
          )
        `)
        .order('customer_intelligence.lead_score', { ascending: false, nullsFirst: false })
        .limit(limit);

      return scoredLeads?.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        ai_score: lead.customer_intelligence?.lead_score || 0,
        ai_confidence: Math.round((lead.customer_intelligence?.lead_confidence || 0) * 100),
        ai_value: lead.customer_intelligence?.lifetime_value_prediction || 0,
        ai_insights: lead.customer_intelligence?.ai_recommendations?.[0] || 'Analyzing...',
        created_at: lead.created_at
      })) || [];

    } catch (error) {
      console.error('Error getting lead scores:', error);
      throw error;
    }
  }

  /**
   * Get AI performance metrics
   */
  async getPerformanceMetrics() {
    try {
      // Get automation metrics
      const { data: automationData } = await this.supabase
        .from('workflow_automation')
        .select('automation_confidence, optimization_score, human_override')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const automationRate = automationData
        ? (automationData.filter(a => !a.human_override).length / automationData.length) * 100
        : 0;

      const avgOptimizationScore = automationData
        ? automationData.reduce((sum, a) => sum + (a.optimization_score || 0), 0) / automationData.length * 100
        : 0;

      // Get AI accuracy from decision log
      const { data: decisions } = await this.supabase
        .from('ai_decision_log')
        .select('confidence_score, execution_status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const aiAccuracy = decisions
        ? decisions.filter(d => d.execution_status === 'success').length / decisions.length * 100
        : 95;

      // Calculate ROI (simplified)
      const { data: jobs } = await this.supabase
        .from('jobs')
        .select('total_price, ai_optimized')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const aiRevenue = jobs
        ?.filter(j => j.ai_optimized)
        .reduce((sum, j) => sum + (j.total_price || 0), 0) || 0;

      const totalRevenue = jobs
        ?.reduce((sum, j) => sum + (j.total_price || 0), 0) || 1;

      const roiPercent = ((aiRevenue / totalRevenue) - 1) * 100;

      // Store metrics
      const metrics = [
        { metric_type: 'automation_rate', value: automationRate },
        { metric_type: 'ai_accuracy', value: aiAccuracy },
        { metric_type: 'roi_percent', value: roiPercent },
        { metric_type: 'efficiency_gain', value: avgOptimizationScore }
      ];

      for (const metric of metrics) {
        await this.supabase
          .from('ai_performance_metrics')
          .insert({
            ...metric,
            metric_name: metric.metric_type,
            unit: 'percent',
            confidence: 0.85,
            source: 'crm_integration',
            component: 'ai_system'
          });
      }

      return {
        automation_rate: Math.round(automationRate),
        ai_accuracy: Math.round(aiAccuracy),
        roi_percent: Math.round(roiPercent),
        efficiency_gain: Math.round(avgOptimizationScore),
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        automation_rate: 0,
        ai_accuracy: 0,
        roi_percent: 0,
        efficiency_gain: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Set up real-time listeners for AI triggers
   */
  private setupRealtimeListeners() {
    // Listen for new customers
    this.supabase
      .channel('new-customers')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'customers'
      }, async (payload) => {
        console.log('🤖 New customer detected, running AI analysis...');
        await this.enhanceCustomerData(payload.new.id);
      })
      .subscribe();

    // Listen for new leads
    this.supabase
      .channel('new-leads')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads'
      }, async (payload) => {
        console.log('🤖 New lead detected, scoring...');
        await this.enhanceCustomerData(payload.new.id);
      })
      .subscribe();
  }

  /**
   * Start background AI processes
   */
  private startBackgroundProcesses() {
    // Update lead scores every hour
    setInterval(async () => {
      console.log('🤖 Running scheduled lead score updates...');
      const { data: leads } = await this.supabase
        .from('leads')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(100);

      for (const lead of leads || []) {
        await this.enhanceCustomerData(lead.id);
      }
    }, 60 * 60 * 1000);

    // Update performance metrics every 5 minutes
    setInterval(async () => {
      console.log('🤖 Updating AI performance metrics...');
      await this.getPerformanceMetrics();
    }, 5 * 60 * 1000);
  }

  /**
   * Helper method to get current season
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

// Export singleton instance
export const crmIntegration = new CRMIntegration();