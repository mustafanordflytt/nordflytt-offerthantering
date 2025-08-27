/**
 * Intelligent Workflow Automation System
 * Automates business processes with AI-driven decision making
 */

import { EventEmitter } from 'events';
import { aiEngine } from './core/ai-engine';
import { dataPipeline } from './data-pipeline';
import { createClient } from '@/lib/supabase';

export interface WorkflowTrigger {
  id: string;
  name: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  priority: number;
  enabled: boolean;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'in';
  value: any;
}

export interface WorkflowAction {
  type: string;
  params: any;
  timing: 'immediate' | 'delayed';
  delay?: number; // minutes
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  triggeredBy: any;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  actions: ActionResult[];
}

export interface ActionResult {
  action: WorkflowAction;
  status: 'success' | 'failed';
  result?: any;
  error?: string;
  executedAt: Date;
}

export class WorkflowAutomation extends EventEmitter {
  private supabase = createClient();
  private workflows: Map<string, WorkflowTrigger> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private scheduledActions: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    console.log('🤖 Initializing Workflow Automation...');
    
    // Load workflow definitions
    await this.loadWorkflows();
    
    // Subscribe to data pipeline events
    this.subscribeToDataEvents();
    
    // Start execution monitor
    this.startExecutionMonitor();
    
    console.log('✅ Workflow Automation ready');
    this.emit('ready');
  }

  /**
   * Load predefined intelligent workflows
   */
  private async loadWorkflows() {
    const workflows: WorkflowTrigger[] = [
      {
        id: 'high-value-lead-nurture',
        name: 'High Value Lead Nurture',
        conditions: [
          { field: 'leadScore', operator: 'greater', value: 80 },
          { field: 'type', operator: 'equals', value: 'lead' }
        ],
        actions: [
          {
            type: 'send-personalized-offer',
            params: { template: 'high-value', discount: 10 },
            timing: 'immediate'
          },
          {
            type: 'assign-senior-sales',
            params: { priority: 'high' },
            timing: 'immediate'
          },
          {
            type: 'schedule-follow-up',
            params: { method: 'phone', message: 'Premium lead follow-up' },
            timing: 'delayed',
            delay: 60 // 1 hour
          }
        ],
        priority: 1,
        enabled: true
      },
      {
        id: 'churn-prevention',
        name: 'Churn Prevention Workflow',
        conditions: [
          { field: 'churnRisk', operator: 'greater', value: 0.7 },
          { field: 'customerValue', operator: 'greater', value: 50000 }
        ],
        actions: [
          {
            type: 'send-retention-offer',
            params: { discount: 20, services: ['free-packing', 'priority-scheduling'] },
            timing: 'immediate'
          },
          {
            type: 'alert-account-manager',
            params: { urgency: 'high', reason: 'churn-risk' },
            timing: 'immediate'
          },
          {
            type: 'create-retention-task',
            params: { assignTo: 'customer-success' },
            timing: 'immediate'
          }
        ],
        priority: 1,
        enabled: true
      },
      {
        id: 'smart-job-assignment',
        name: 'Smart Job Assignment',
        conditions: [
          { field: 'type', operator: 'equals', value: 'job' },
          { field: 'status', operator: 'equals', value: 'unassigned' }
        ],
        actions: [
          {
            type: 'optimize-schedule',
            params: { objectives: ['efficiency', 'skills', 'location'] },
            timing: 'immediate'
          },
          {
            type: 'auto-assign-team',
            params: { confirmationRequired: false },
            timing: 'immediate'
          },
          {
            type: 'notify-customer',
            params: { template: 'job-scheduled' },
            timing: 'immediate'
          }
        ],
        priority: 2,
        enabled: true
      },
      {
        id: 'dynamic-pricing-optimization',
        name: 'Dynamic Pricing Optimization',
        conditions: [
          { field: 'type', operator: 'equals', value: 'quote-request' },
          { field: 'autoPrice', operator: 'equals', value: true }
        ],
        actions: [
          {
            type: 'calculate-optimal-price',
            params: { factors: ['demand', 'competition', 'capacity', 'customer-value'] },
            timing: 'immediate'
          },
          {
            type: 'generate-quote',
            params: { includeUpsells: true },
            timing: 'immediate'
          },
          {
            type: 'send-quote',
            params: { followUpSchedule: [1, 3, 7] }, // days
            timing: 'immediate'
          }
        ],
        priority: 2,
        enabled: true
      },
      {
        id: 'post-job-optimization',
        name: 'Post Job Optimization',
        conditions: [
          { field: 'type', operator: 'equals', value: 'job' },
          { field: 'status', operator: 'equals', value: 'completed' }
        ],
        actions: [
          {
            type: 'request-review',
            params: { incentive: 'discount-next-service' },
            timing: 'delayed',
            delay: 1440 // 24 hours
          },
          {
            type: 'analyze-profitability',
            params: { updatePricing: true },
            timing: 'immediate'
          },
          {
            type: 'identify-upsell',
            params: { services: ['storage', 'cleaning'] },
            timing: 'delayed',
            delay: 10080 // 1 week
          }
        ],
        priority: 3,
        enabled: true
      }
    ];

    // Load workflows into memory
    workflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });

    console.log(`📋 Loaded ${workflows.length} intelligent workflows`);
  }

  /**
   * Subscribe to data pipeline events
   */
  private subscribeToDataEvents() {
    dataPipeline.on('batch-processed', (results) => {
      this.evaluateWorkflows(results);
    });

    dataPipeline.on('critical-processed', (result) => {
      this.evaluateWorkflows([result]);
    });
  }

  /**
   * Evaluate which workflows should be triggered
   */
  private async evaluateWorkflows(processedData: any[]) {
    for (const data of processedData) {
      const triggeredWorkflows = [];

      // Check each workflow's conditions
      for (const [id, workflow] of this.workflows) {
        if (!workflow.enabled) continue;

        if (this.checkConditions(workflow.conditions, data)) {
          triggeredWorkflows.push(workflow);
        }
      }

      // Sort by priority and execute
      triggeredWorkflows.sort((a, b) => a.priority - b.priority);
      
      for (const workflow of triggeredWorkflows) {
        await this.executeWorkflow(workflow, data);
      }
    }
  }

  /**
   * Check if all conditions are met
   */
  private checkConditions(conditions: WorkflowCondition[], data: any): boolean {
    return conditions.every(condition => {
      const value = this.getNestedValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'greater':
          return value > condition.value;
        case 'less':
          return value < condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'in':
          return condition.value.includes(value);
        default:
          return false;
      }
    });
  }

  /**
   * Execute a workflow
   */
  private async executeWorkflow(workflow: WorkflowTrigger, triggerData: any) {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id,
      triggeredBy: triggerData,
      startTime: new Date(),
      status: 'running',
      actions: []
    };

    this.executions.set(execution.id, execution);
    console.log(`🚀 Executing workflow: ${workflow.name}`);
    this.emit('workflow-started', execution);

    // Execute actions
    for (const action of workflow.actions) {
      if (action.timing === 'immediate') {
        await this.executeAction(execution, action);
      } else {
        this.scheduleAction(execution, action);
      }
    }

    // Update execution status if all immediate actions are done
    const hasDelayedActions = workflow.actions.some(a => a.timing === 'delayed');
    if (!hasDelayedActions) {
      execution.status = 'completed';
      execution.endTime = new Date();
      this.emit('workflow-completed', execution);
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(execution: WorkflowExecution, action: WorkflowAction) {
    const startTime = Date.now();
    let result: ActionResult;

    try {
      const actionResult = await this.performAction(action, execution.triggeredBy);
      
      result = {
        action,
        status: 'success',
        result: actionResult,
        executedAt: new Date()
      };
    } catch (error) {
      result = {
        action,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date()
      };
    }

    execution.actions.push(result);
    
    const duration = Date.now() - startTime;
    console.log(`✓ Action ${action.type} ${result.status} (${duration}ms)`);
    
    this.emit('action-executed', { execution, result });
  }

  /**
   * Schedule a delayed action
   */
  private scheduleAction(execution: WorkflowExecution, action: WorkflowAction) {
    const delay = (action.delay || 0) * 60 * 1000; // Convert to milliseconds
    
    const timeout = setTimeout(async () => {
      await this.executeAction(execution, action);
      
      // Check if all actions are complete
      const allActionsComplete = execution.actions.length === 
        this.workflows.get(execution.workflowId)?.actions.length;
      
      if (allActionsComplete) {
        execution.status = 'completed';
        execution.endTime = new Date();
        this.emit('workflow-completed', execution);
      }
    }, delay);

    this.scheduledActions.set(`${execution.id}-${action.type}`, timeout);
    console.log(`⏰ Scheduled ${action.type} for ${action.delay} minutes`);
  }

  /**
   * Perform the actual action
   */
  private async performAction(action: WorkflowAction, data: any): Promise<any> {
    switch (action.type) {
      case 'send-personalized-offer':
        return await this.sendPersonalizedOffer(data, action.params);
      
      case 'assign-senior-sales':
        return await this.assignSeniorSales(data, action.params);
      
      case 'schedule-follow-up':
        return await this.scheduleFollowUp(data, action.params);
      
      case 'send-retention-offer':
        return await this.sendRetentionOffer(data, action.params);
      
      case 'alert-account-manager':
        return await this.alertAccountManager(data, action.params);
      
      case 'create-retention-task':
        return await this.createRetentionTask(data, action.params);
      
      case 'optimize-schedule':
        return await this.optimizeSchedule(data, action.params);
      
      case 'auto-assign-team':
        return await this.autoAssignTeam(data, action.params);
      
      case 'notify-customer':
        return await this.notifyCustomer(data, action.params);
      
      case 'calculate-optimal-price':
        return await this.calculateOptimalPrice(data, action.params);
      
      case 'generate-quote':
        return await this.generateQuote(data, action.params);
      
      case 'send-quote':
        return await this.sendQuote(data, action.params);
      
      case 'request-review':
        return await this.requestReview(data, action.params);
      
      case 'analyze-profitability':
        return await this.analyzeProfitability(data, action.params);
      
      case 'identify-upsell':
        return await this.identifyUpsell(data, action.params);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Action implementations
  private async sendPersonalizedOffer(data: any, params: any) {
    const offer = {
      customerId: data.enrichedData.id,
      template: params.template,
      discount: params.discount,
      personalizedContent: await this.generatePersonalizedContent(data),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    // Create offer in database
    const { data: offerData } = await this.supabase
      .from('offers')
      .insert(offer)
      .select()
      .single();

    // Send via email/SMS
    await this.sendCommunication(data.enrichedData, 'offer', offer);

    return offerData;
  }

  private async assignSeniorSales(data: any, params: any) {
    // Find available senior sales person
    const { data: salesPerson } = await this.supabase
      .from('employees')
      .select('*')
      .eq('role', 'senior_sales')
      .eq('available', true)
      .limit(1)
      .single();

    if (salesPerson) {
      // Assign lead
      await this.supabase
        .from('leads')
        .update({ assigned_to: salesPerson.id, priority: params.priority })
        .eq('id', data.enrichedData.id);

      // Notify sales person
      await this.notifyEmployee(salesPerson, 'new-high-value-lead', data);
    }

    return salesPerson;
  }

  private async scheduleFollowUp(data: any, params: any) {
    const followUp = {
      customerId: data.enrichedData.id,
      method: params.method,
      message: params.message,
      scheduledFor: new Date(Date.now() + (params.delay || 60) * 60 * 1000),
      status: 'scheduled'
    };

    const { data: task } = await this.supabase
      .from('tasks')
      .insert(followUp)
      .select()
      .single();

    return task;
  }

  private async sendRetentionOffer(data: any, params: any) {
    const retentionOffer = {
      customerId: data.enrichedData.id,
      discount: params.discount,
      additionalServices: params.services,
      message: 'Vi värdesätter dig som kund och vill erbjuda något extra',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    await this.sendCommunication(data.enrichedData, 'retention', retentionOffer);
    return retentionOffer;
  }

  private async optimizeSchedule(data: any, params: any) {
    const schedule = await aiEngine.optimizeJobSchedule(data.enrichedData);
    
    // Update job with optimized schedule
    await this.supabase
      .from('bookings')
      .update({
        assigned_team: schedule.assignedTeam,
        scheduled_time: schedule.scheduledTime,
        route_data: schedule.route
      })
      .eq('id', data.enrichedData.id);

    return schedule;
  }

  private async calculateOptimalPrice(data: any, params: any) {
    const pricing = await aiEngine.calculateDynamicPrice(data.enrichedData);
    
    // Store pricing decision
    await this.supabase
      .from('pricing_decisions')
      .insert({
        entity_id: data.enrichedData.id,
        entity_type: 'quote',
        base_price: pricing.basePrice,
        optimized_price: pricing.optimizedPrice,
        factors: pricing.factors,
        confidence: pricing.confidence
      });

    return pricing;
  }

  // Helper methods
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value;
  }

  private async generatePersonalizedContent(data: any) {
    // Use AI to generate personalized message
    const { aiInsights, enrichedData } = data;
    return `Baserat på dina behov har vi skapat ett specialerbjudande just för dig`;
  }

  private async sendCommunication(customer: any, type: string, content: any) {
    // Integration with communication service
    console.log(`📧 Sending ${type} to ${customer.email}`);
    // Actual implementation would use email/SMS service
  }

  private async notifyEmployee(employee: any, type: string, data: any) {
    console.log(`👤 Notifying ${employee.name} about ${type}`);
    // Would send push notification or email
  }

  private async alertAccountManager(data: any, params: any) {
    // Find account manager
    const { data: manager } = await this.supabase
      .from('customer_managers')
      .select('*, employees(*)')
      .eq('customer_id', data.enrichedData.id)
      .single();

    if (manager) {
      await this.notifyEmployee(manager.employees, 'churn-alert', {
        customer: data.enrichedData,
        urgency: params.urgency,
        reason: params.reason
      });
    }

    return manager;
  }

  private async createRetentionTask(data: any, params: any) {
    const task = {
      title: `Retention action for ${data.enrichedData.name}`,
      description: `High churn risk detected. Immediate action required.`,
      assignedTo: params.assignTo,
      priority: 'high',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      customerId: data.enrichedData.id,
      type: 'retention'
    };

    const { data: createdTask } = await this.supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    return createdTask;
  }

  private async autoAssignTeam(data: any, params: any) {
    const schedule = data.enrichedData.schedule || 
      await aiEngine.optimizeJobSchedule(data.enrichedData);

    if (!params.confirmationRequired) {
      // Direct assignment
      await this.supabase
        .from('bookings')
        .update({
          assigned_team: schedule.assignedTeam,
          status: 'assigned'
        })
        .eq('id', data.enrichedData.id);

      // Notify team
      await this.notifyTeam(schedule.assignedTeam, 'new-assignment', data.enrichedData);
    }

    return schedule;
  }

  private async notifyCustomer(data: any, params: any) {
    const template = params.template;
    const customerData = data.enrichedData;

    // Generate message based on template
    const message = this.generateCustomerMessage(template, customerData);

    await this.sendCommunication(customerData, 'notification', message);
    return { sent: true, template, message };
  }

  private async generateQuote(data: any, params: any) {
    const pricing = data.enrichedData.pricing || 
      await aiEngine.calculateDynamicPrice(data.enrichedData);

    const quote = {
      customerId: data.enrichedData.customerId,
      serviceRequest: data.enrichedData,
      basePrice: pricing.basePrice,
      finalPrice: pricing.optimizedPrice,
      includedServices: data.enrichedData.services,
      additionalServices: params.includeUpsells ? 
        await this.getRecommendedUpsells(data) : [],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'draft'
    };

    const { data: createdQuote } = await this.supabase
      .from('quotes')
      .insert(quote)
      .select()
      .single();

    return createdQuote;
  }

  private async sendQuote(data: any, params: any) {
    const quote = data.enrichedData.quote || 
      await this.generateQuote(data, { includeUpsells: true });

    // Send quote
    await this.sendCommunication(data.enrichedData, 'quote', quote);

    // Schedule follow-ups
    if (params.followUpSchedule) {
      for (const days of params.followUpSchedule) {
        await this.scheduleFollowUp(data, {
          method: 'email',
          message: `Follow-up on quote ${quote.id}`,
          delay: days * 24 * 60 // Convert days to minutes
        });
      }
    }

    return { sent: true, quoteId: quote.id };
  }

  private async requestReview(data: any, params: any) {
    const reviewRequest = {
      customerId: data.enrichedData.customerId,
      bookingId: data.enrichedData.id,
      incentive: params.incentive,
      message: 'Vi hoppas du var nöjd med flytten! Dela din upplevelse.',
      sentAt: new Date()
    };

    await this.sendCommunication(data.enrichedData, 'review-request', reviewRequest);
    return reviewRequest;
  }

  private async analyzeProfitability(data: any, params: any) {
    const booking = data.enrichedData;
    const actualCosts = await this.calculateActualCosts(booking);
    
    const analysis = {
      revenue: booking.total_price,
      costs: actualCosts,
      profit: booking.total_price - actualCosts,
      margin: (booking.total_price - actualCosts) / booking.total_price,
      efficiency: booking.actualTime / booking.estimatedTime
    };

    // Update pricing model if needed
    if (params.updatePricing && analysis.margin < 0.3) {
      await aiEngine.learnFromOutcome(booking.id, {
        type: 'pricing',
        expected: 0.4,
        actual: analysis.margin
      });
    }

    return analysis;
  }

  private async identifyUpsell(data: any, params: any) {
    const customer = data.enrichedData;
    const score = await aiEngine.scoreCustomerLead(customer);
    
    const upsellOpportunities = [];
    
    if (score.upsellPotential > 60) {
      for (const service of params.services) {
        if (!customer.previousServices?.includes(service)) {
          upsellOpportunities.push({
            service,
            probability: score.upsellPotential / 100,
            recommendedOffer: await this.generateUpsellOffer(customer, service)
          });
        }
      }
    }

    return upsellOpportunities;
  }

  // Utility methods
  private async notifyTeam(teamId: string, type: string, data: any) {
    console.log(`👥 Notifying team ${teamId} about ${type}`);
  }

  private generateCustomerMessage(template: string, data: any): string {
    const templates: Record<string, string> = {
      'job-scheduled': `Din flytt är bokad för ${data.scheduledTime}. Team ${data.assignedTeam} kommer att hjälpa dig.`,
      'offer': `Vi har ett specialerbjudande för dig!`,
      'review-request': `Hur var din upplevelse med oss?`
    };
    return templates[template] || 'Meddelande från Nordflytt';
  }

  private async getRecommendedUpsells(data: any) {
    return ['Packtjänst', 'Flyttstädning'];
  }

  private async calculateActualCosts(booking: any) {
    // Simplified cost calculation
    return booking.total_price * 0.6;
  }

  private async generateUpsellOffer(customer: any, service: string) {
    return {
      service,
      discount: 15,
      message: `Prova vår ${service} med 15% rabatt!`
    };
  }

  /**
   * Monitor execution status
   */
  private startExecutionMonitor() {
    setInterval(() => {
      const activeExecutions = Array.from(this.executions.values())
        .filter(e => e.status === 'running');
      
      if (activeExecutions.length > 0) {
        console.log(`⚙️  ${activeExecutions.length} workflows running`);
      }
      
      // Clean up old executions
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      for (const [id, execution] of this.executions) {
        if (execution.endTime && execution.endTime.getTime() < oneHourAgo) {
          this.executions.delete(id);
        }
      }
    }, 30000); // Every 30 seconds
  }
}

// Export singleton instance
export const workflowAutomation = new WorkflowAutomation();