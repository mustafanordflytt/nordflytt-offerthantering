/**
 * AI Decision Engine for Workflow Automation
 * Provides intelligent decision-making capabilities for automated workflows
 */

import { EventEmitter } from 'events';
import { leadScoringEngine } from './lead-scoring-engine';
import { smartSchedulingEngine } from './smart-scheduling-engine';
import { dynamicPricingEngine } from './workflow/dynamic-pricing-engine';
// Import createClient dynamically to avoid build-time errors
const getSupabaseClient = async () => {
  try {
    const { createClient } = await import('@/lib/supabase');
    return createClient();
  } catch (error) {
    console.warn('Supabase not configured, using mock client');
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
      })
    };
  }
};

export interface AIDecision {
  decision: string;
  confidence: number;
  reasoning: string;
  recommendations: string[];
  data?: any;
}

export interface WorkflowContext {
  trigger: any;
  variables: Record<string, any>;
  history: any[];
  metadata?: any;
}

export class WorkflowAIEngine extends EventEmitter {
  private supabase: any;
  private decisionModels: Map<string, Function> = new Map();
  private learningData: Map<string, any[]> = new Map();
  private modelAccuracy: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeModels();
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    this.supabase = await getSupabaseClient();
  }

  /**
   * Initialize AI decision models
   */
  private initializeModels() {
    // Lead qualification model
    this.decisionModels.set('lead_qualifier', async (context: WorkflowContext) => {
      const lead = context.trigger;
      const score = await leadScoringEngine.scoreLead(lead);
      
      if (score.score >= 80) {
        return {
          decision: 'qualified',
          confidence: score.confidence,
          reasoning: 'High lead score indicates strong potential',
          recommendations: score.recommendations
        };
      } else if (score.score >= 50) {
        return {
          decision: 'needs_nurturing',
          confidence: score.confidence,
          reasoning: 'Medium score suggests lead needs nurturing',
          recommendations: [
            'Send educational content',
            'Schedule follow-up in 2 weeks',
            'Add to nurture campaign'
          ]
        };
      } else {
        return {
          decision: 'not_qualified',
          confidence: score.confidence,
          reasoning: 'Low score indicates poor fit',
          recommendations: ['Archive lead', 'Remove from active pipeline']
        };
      }
    });

    // Pricing decision model
    this.decisionModels.set('pricing_optimizer', async (context: WorkflowContext) => {
      const { service, customer, date } = context.trigger;
      
      const pricing = await dynamicPricingEngine.calculateOptimalPrice(
        service,
        customer,
        new Date(date)
      );
      
      return {
        decision: 'optimal_price',
        confidence: pricing.confidence,
        reasoning: pricing.explanation,
        recommendations: pricing.suggestions,
        data: {
          basePrice: pricing.basePrice,
          finalPrice: pricing.finalPrice,
          discount: pricing.discount
        }
      };
    });

    // Scheduling optimizer model
    this.decisionModels.set('schedule_optimizer', async (context: WorkflowContext) => {
      const { job, availableTeams } = context.trigger;
      
      const result = await smartSchedulingEngine.scheduleJob(job, availableTeams);
      
      if (result.success) {
        return {
          decision: 'schedule_confirmed',
          confidence: result.confidence || 0.85,
          reasoning: 'Optimal schedule found based on team availability and route',
          recommendations: result.suggestions || [],
          data: {
            team: result.team,
            timeSlot: result.timeSlot,
            estimatedDuration: result.estimatedDuration
          }
        };
      } else {
        return {
          decision: 'schedule_conflict',
          confidence: 0.9,
          reasoning: result.reason || 'No available teams for requested time',
          recommendations: [
            'Offer alternative time slots',
            'Check for cancellations',
            'Consider hiring temporary staff'
          ]
        };
      }
    });

    // Customer retention model
    this.decisionModels.set('retention_predictor', async (context: WorkflowContext) => {
      const customer = context.trigger;
      const riskScore = await this.calculateChurnRisk(customer);
      
      if (riskScore < 0.3) {
        return {
          decision: 'low_risk',
          confidence: 0.8,
          reasoning: 'Customer shows strong engagement and satisfaction',
          recommendations: ['Continue standard service']
        };
      } else if (riskScore < 0.7) {
        return {
          decision: 'medium_risk',
          confidence: 0.75,
          reasoning: 'Some risk indicators detected',
          recommendations: [
            'Schedule check-in call',
            'Offer loyalty discount',
            'Send satisfaction survey'
          ]
        };
      } else {
        return {
          decision: 'high_risk',
          confidence: 0.85,
          reasoning: 'Multiple churn indicators present',
          recommendations: [
            'Immediate manager intervention',
            'Offer significant retention incentive',
            'Review service history for issues'
          ]
        };
      }
    });

    // Service upgrade model
    this.decisionModels.set('upsell_predictor', async (context: WorkflowContext) => {
      const { customer, currentService } = context.trigger;
      const opportunity = await this.predictUpsellOpportunity(customer, currentService);
      
      return {
        decision: opportunity.shouldUpsell ? 'recommend_upgrade' : 'maintain_current',
        confidence: opportunity.confidence,
        reasoning: opportunity.reasoning,
        recommendations: opportunity.recommendations,
        data: {
          suggestedServices: opportunity.suggestedServices,
          estimatedRevenue: opportunity.estimatedRevenue
        }
      };
    });

    // Resource allocation model
    this.decisionModels.set('resource_allocator', async (context: WorkflowContext) => {
      const { jobType, urgency, resources } = context.trigger;
      const allocation = await this.optimizeResourceAllocation(jobType, urgency, resources);
      
      return {
        decision: 'allocation_optimized',
        confidence: allocation.confidence,
        reasoning: 'Resources allocated based on priority and efficiency',
        recommendations: allocation.recommendations,
        data: {
          assignedResources: allocation.assigned,
          efficiency: allocation.efficiency
        }
      };
    });

    console.log('🤖 Workflow AI Engine initialized with', this.decisionModels.size, 'models');
  }

  /**
   * Make an AI decision
   */
  async makeDecision(
    modelName: string,
    context: WorkflowContext
  ): Promise<AIDecision> {
    const model = this.decisionModels.get(modelName);
    
    if (!model) {
      throw new Error(`AI model '${modelName}' not found`);
    }

    try {
      // Record decision request
      this.emit('decision:start', { model: modelName, context });
      
      // Execute model
      const decision = await model(context);
      
      // Learn from decision
      await this.recordDecision(modelName, context, decision);
      
      // Emit decision made event
      this.emit('decision:complete', { model: modelName, decision });
      
      return decision;
    } catch (error) {
      console.error(`AI decision error in ${modelName}:`, error);
      
      // Fallback decision
      return {
        decision: 'error',
        confidence: 0,
        reasoning: 'AI model encountered an error',
        recommendations: ['Review manually', 'Check system logs']
      };
    }
  }

  /**
   * Calculate churn risk for a customer
   */
  private async calculateChurnRisk(customer: any): Promise<number> {
    const factors = {
      lastInteraction: this.daysSince(customer.lastContactDate),
      complaintsCount: customer.complaints || 0,
      paymentDelays: customer.latePayments || 0,
      serviceUsage: customer.monthlyJobs || 0,
      customerLifetime: this.daysSince(customer.createdAt) / 365
    };

    // Simple risk calculation (can be enhanced with ML)
    let risk = 0;
    
    if (factors.lastInteraction > 90) risk += 0.3;
    if (factors.complaintsCount > 2) risk += 0.2;
    if (factors.paymentDelays > 1) risk += 0.2;
    if (factors.serviceUsage < 1) risk += 0.2;
    if (factors.customerLifetime < 0.5) risk += 0.1;
    
    return Math.min(risk, 1);
  }

  /**
   * Predict upsell opportunity
   */
  private async predictUpsellOpportunity(
    customer: any,
    currentService: string
  ): Promise<any> {
    // Analyze customer data
    const monthlySpend = customer.avgMonthlySpend || 0;
    const serviceHistory = customer.serviceHistory || [];
    const businessType = customer.type;
    
    const opportunity = {
      shouldUpsell: false,
      confidence: 0,
      reasoning: '',
      recommendations: [],
      suggestedServices: [],
      estimatedRevenue: 0
    };

    // Business customers with regular moves
    if (businessType === 'business' && serviceHistory.length > 3) {
      opportunity.shouldUpsell = true;
      opportunity.confidence = 0.8;
      opportunity.reasoning = 'Regular business customer with consistent service usage';
      opportunity.suggestedServices = [
        'Monthly retainer package',
        'Priority scheduling',
        'Dedicated account manager'
      ];
      opportunity.estimatedRevenue = monthlySpend * 1.3;
      opportunity.recommendations = [
        'Offer 3-month trial of premium service',
        'Schedule business review meeting',
        'Present cost savings analysis'
      ];
    }
    // Growing usage pattern
    else if (this.detectGrowthPattern(serviceHistory)) {
      opportunity.shouldUpsell = true;
      opportunity.confidence = 0.7;
      opportunity.reasoning = 'Customer shows increasing service usage';
      opportunity.suggestedServices = [
        'Volume discount package',
        'Additional services bundle'
      ];
      opportunity.estimatedRevenue = monthlySpend * 1.2;
      opportunity.recommendations = [
        'Highlight volume benefits',
        'Offer complementary service trial'
      ];
    }

    return opportunity;
  }

  /**
   * Optimize resource allocation
   */
  private async optimizeResourceAllocation(
    jobType: string,
    urgency: string,
    availableResources: any[]
  ): Promise<any> {
    const priorityScore = urgency === 'urgent' ? 10 : urgency === 'high' ? 7 : 5;
    
    // Sort resources by capability match and availability
    const rankedResources = availableResources
      .map(resource => ({
        ...resource,
        score: this.calculateResourceScore(resource, jobType, priorityScore)
      }))
      .sort((a, b) => b.score - a.score);

    const assigned = rankedResources.slice(0, this.getRequiredResourceCount(jobType));
    const efficiency = assigned.reduce((sum, r) => sum + r.score, 0) / assigned.length;

    return {
      assigned: assigned.map(r => ({ id: r.id, name: r.name, role: r.role })),
      efficiency: efficiency / 10,
      confidence: Math.min(efficiency / 8, 1),
      recommendations: this.getResourceRecommendations(jobType, assigned, availableResources)
    };
  }

  /**
   * Calculate resource score
   */
  private calculateResourceScore(
    resource: any,
    jobType: string,
    priorityScore: number
  ): number {
    let score = priorityScore;
    
    // Skill match
    if (resource.skills?.includes(jobType)) score += 3;
    
    // Experience
    if (resource.experience > 2) score += 2;
    
    // Availability
    if (resource.availability === 'immediate') score += 2;
    
    // Performance rating
    score += (resource.rating || 3) * 0.5;
    
    return score;
  }

  /**
   * Get required resource count based on job type
   */
  private getRequiredResourceCount(jobType: string): number {
    const requirements: Record<string, number> = {
      'small_move': 2,
      'large_move': 4,
      'office_move': 6,
      'storage': 2,
      'packing': 3
    };
    
    return requirements[jobType] || 3;
  }

  /**
   * Get resource allocation recommendations
   */
  private getResourceRecommendations(
    jobType: string,
    assigned: any[],
    available: any[]
  ): string[] {
    const recommendations = [];
    
    // Check if we have enough resources
    const required = this.getRequiredResourceCount(jobType);
    if (assigned.length < required) {
      recommendations.push(`Need ${required - assigned.length} more resources`);
      recommendations.push('Consider overtime or temporary staff');
    }
    
    // Check skill coverage
    const hasSpecialist = assigned.some(r => r.skills?.includes(jobType));
    if (!hasSpecialist) {
      recommendations.push(`Assign at least one ${jobType} specialist`);
    }
    
    // Optimization suggestions
    if (available.length > assigned.length * 2) {
      recommendations.push('Consider load balancing across teams');
    }
    
    return recommendations;
  }

  /**
   * Record decision for learning
   */
  private async recordDecision(
    modelName: string,
    context: WorkflowContext,
    decision: AIDecision
  ) {
    const record = {
      timestamp: new Date(),
      model: modelName,
      context,
      decision,
      outcome: null // Will be updated when outcome is known
    };
    
    // Store in learning data
    if (!this.learningData.has(modelName)) {
      this.learningData.set(modelName, []);
    }
    this.learningData.get(modelName)!.push(record);
    
    // Keep only recent data (last 1000 decisions)
    const data = this.learningData.get(modelName)!;
    if (data.length > 1000) {
      this.learningData.set(modelName, data.slice(-1000));
    }
    
    // Update model accuracy if we have enough data
    if (data.length >= 100) {
      this.updateModelAccuracy(modelName);
    }
  }

  /**
   * Update model accuracy based on outcomes
   */
  private updateModelAccuracy(modelName: string) {
    const data = this.learningData.get(modelName) || [];
    const withOutcomes = data.filter(d => d.outcome !== null);
    
    if (withOutcomes.length < 50) return;
    
    const correct = withOutcomes.filter(d => d.outcome === 'success').length;
    const accuracy = correct / withOutcomes.length;
    
    this.modelAccuracy.set(modelName, accuracy);
    
    console.log(`📊 Model ${modelName} accuracy: ${(accuracy * 100).toFixed(1)}%`);
  }

  /**
   * Update decision outcome for learning
   */
  async updateOutcome(
    modelName: string,
    decisionId: string,
    outcome: 'success' | 'failure' | 'partial'
  ) {
    const data = this.learningData.get(modelName);
    if (!data) return;
    
    const record = data.find(d => 
      d.timestamp.toISOString() === decisionId ||
      d.decision.decision === decisionId
    );
    
    if (record) {
      record.outcome = outcome;
      this.updateModelAccuracy(modelName);
    }
  }

  /**
   * Get model performance metrics
   */
  getModelMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    for (const [model, accuracy] of this.modelAccuracy.entries()) {
      const data = this.learningData.get(model) || [];
      metrics[model] = {
        accuracy: accuracy,
        totalDecisions: data.length,
        recentDecisions: data.slice(-10).map(d => ({
          timestamp: d.timestamp,
          decision: d.decision.decision,
          confidence: d.decision.confidence,
          outcome: d.outcome
        }))
      };
    }
    
    return metrics;
  }

  /**
   * Detect growth pattern in service history
   */
  private detectGrowthPattern(history: any[]): boolean {
    if (history.length < 3) return false;
    
    // Check if usage is increasing over time
    const recentMonths = history.slice(-6);
    let increasingTrend = 0;
    
    for (let i = 1; i < recentMonths.length; i++) {
      if (recentMonths[i].count > recentMonths[i-1].count) {
        increasingTrend++;
      }
    }
    
    return increasingTrend >= recentMonths.length * 0.6;
  }

  /**
   * Calculate days since a date
   */
  private daysSince(date: string | Date): number {
    const then = new Date(date);
    const now = new Date();
    return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get available AI models
   */
  getAvailableModels(): Array<{ name: string; description: string }> {
    return [
      { name: 'lead_qualifier', description: 'Qualify leads based on scoring' },
      { name: 'pricing_optimizer', description: 'Optimize pricing for services' },
      { name: 'schedule_optimizer', description: 'Find optimal scheduling' },
      { name: 'retention_predictor', description: 'Predict customer churn risk' },
      { name: 'upsell_predictor', description: 'Identify upsell opportunities' },
      { name: 'resource_allocator', description: 'Optimize resource allocation' }
    ];
  }
}

// Export singleton instance
export const workflowAIEngine = new WorkflowAIEngine();