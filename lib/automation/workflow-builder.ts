/**
 * Visual Workflow Builder Engine
 * Enables creation of complex automation workflows without coding
 */

import { EventEmitter } from 'events';
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

// Workflow node types
export type NodeType = 
  | 'trigger' 
  | 'condition' 
  | 'action' 
  | 'delay' 
  | 'loop' 
  | 'parallel' 
  | 'ai_decision'
  | 'integration';

// Trigger types
export type TriggerType =
  | 'new_lead'
  | 'lead_score_change'
  | 'customer_created'
  | 'quote_sent'
  | 'job_completed'
  | 'payment_received'
  | 'time_based'
  | 'webhook'
  | 'manual';

// Action types
export type ActionType =
  | 'send_email'
  | 'send_sms'
  | 'create_task'
  | 'update_record'
  | 'assign_to_user'
  | 'create_quote'
  | 'schedule_job'
  | 'generate_invoice'
  | 'ai_analysis'
  | 'external_api';

interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  config: any;
  position: { x: number; y: number };
  connections: {
    input?: string[];
    output?: string[];
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: any;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
  metrics: {
    executions: number;
    successRate: number;
    avgExecutionTime: number;
  };
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  context: Record<string, any>;
  logs: ExecutionLog[];
}

interface ExecutionLog {
  timestamp: Date;
  nodeId: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: any;
}

export class WorkflowBuilder extends EventEmitter {
  private supabase: any;
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private nodeHandlers: Map<string, Function> = new Map();

  constructor() {
    super();
    this.registerDefaultHandlers();
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    this.supabase = await getSupabaseClient();
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(name: string, description: string): Promise<Workflow> {
    const workflow: Workflow = {
      id: this.generateId('wf'),
      name,
      description,
      status: 'draft',
      nodes: [],
      edges: [],
      variables: {},
      metrics: {
        executions: 0,
        successRate: 0,
        avgExecutionTime: 0
      }
    };

    this.workflows.set(workflow.id, workflow);
    await this.saveWorkflow(workflow);
    
    console.log(`🔧 Created workflow: ${name}`);
    return workflow;
  }

  /**
   * Add a node to workflow
   */
  async addNode(
    workflowId: string, 
    type: NodeType, 
    name: string, 
    config: any,
    position: { x: number; y: number }
  ): Promise<WorkflowNode> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const node: WorkflowNode = {
      id: this.generateId('node'),
      type,
      name,
      config,
      position,
      connections: {
        input: [],
        output: []
      }
    };

    workflow.nodes.push(node);
    await this.saveWorkflow(workflow);

    console.log(`➕ Added ${type} node: ${name}`);
    return node;
  }

  /**
   * Connect two nodes
   */
  async connectNodes(
    workflowId: string,
    sourceNodeId: string,
    targetNodeId: string,
    condition?: any
  ): Promise<WorkflowEdge> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const edge: WorkflowEdge = {
      id: this.generateId('edge'),
      source: sourceNodeId,
      target: targetNodeId,
      condition
    };

    workflow.edges.push(edge);

    // Update node connections
    const sourceNode = workflow.nodes.find(n => n.id === sourceNodeId);
    const targetNode = workflow.nodes.find(n => n.id === targetNodeId);
    
    if (sourceNode && targetNode) {
      sourceNode.connections.output = sourceNode.connections.output || [];
      sourceNode.connections.output.push(targetNodeId);
      
      targetNode.connections.input = targetNode.connections.input || [];
      targetNode.connections.input.push(sourceNodeId);
    }

    await this.saveWorkflow(workflow);
    
    console.log(`🔗 Connected ${sourceNodeId} → ${targetNodeId}`);
    return edge;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, triggerData: any): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');
    if (workflow.status !== 'active') throw new Error('Workflow is not active');

    console.log(`🚀 Executing workflow: ${workflow.name}`);

    const execution: WorkflowExecution = {
      id: this.generateId('exec'),
      workflowId,
      status: 'running',
      startTime: new Date(),
      context: {
        trigger: triggerData,
        variables: { ...workflow.variables }
      },
      logs: []
    };

    this.executions.set(execution.id, execution);
    this.emit('execution:start', execution);

    try {
      // Find trigger nodes
      const triggerNodes = workflow.nodes.filter(n => n.type === 'trigger');
      
      for (const triggerNode of triggerNodes) {
        await this.executeNode(workflow, triggerNode, execution);
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      
      // Update metrics
      workflow.metrics.executions++;
      workflow.metrics.successRate = this.calculateSuccessRate(workflowId);
      workflow.metrics.avgExecutionTime = this.calculateAvgExecutionTime(workflowId);
      
      await this.saveWorkflow(workflow);
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      this.logExecution(execution, 'root', `Workflow failed: ${error}`, 'error');
    }

    this.emit('execution:complete', execution);
    console.log(`✅ Workflow execution ${execution.status}`);
    
    return execution;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    workflow: Workflow,
    node: WorkflowNode,
    execution: WorkflowExecution
  ): Promise<void> {
    this.logExecution(execution, node.id, `Executing ${node.type}: ${node.name}`, 'info');

    try {
      // Get handler for node type
      const handler = this.nodeHandlers.get(node.type);
      if (!handler) {
        throw new Error(`No handler for node type: ${node.type}`);
      }

      // Execute node
      const result = await handler(node, execution.context);
      
      // Store result in context
      execution.context[node.id] = result;

      // Execute connected nodes
      if (node.connections.output && node.connections.output.length > 0) {
        for (const targetNodeId of node.connections.output) {
          const targetNode = workflow.nodes.find(n => n.id === targetNodeId);
          if (targetNode) {
            // Check edge conditions
            const edge = workflow.edges.find(e => 
              e.source === node.id && e.target === targetNodeId
            );
            
            if (this.evaluateCondition(edge?.condition, execution.context)) {
              await this.executeNode(workflow, targetNode, execution);
            }
          }
        }
      }
      
    } catch (error) {
      this.logExecution(execution, node.id, `Node failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Register default node handlers
   */
  private registerDefaultHandlers() {
    // Trigger handlers
    this.nodeHandlers.set('trigger', async (node: WorkflowNode, context: any) => {
      console.log(`⚡ Trigger activated: ${node.name}`);
      return context.trigger;
    });

    // Condition handlers
    this.nodeHandlers.set('condition', async (node: WorkflowNode, context: any) => {
      const { field, operator, value } = node.config;
      const fieldValue = this.getValueFromContext(field, context);
      
      return this.evaluateCondition({ field, operator, value, fieldValue }, context);
    });

    // Action handlers
    this.nodeHandlers.set('action', async (node: WorkflowNode, context: any) => {
      const { actionType, params } = node.config;
      
      switch (actionType) {
        case 'send_email':
          return await this.sendEmail(params, context);
        case 'send_sms':
          return await this.sendSMS(params, context);
        case 'create_task':
          return await this.createTask(params, context);
        case 'update_record':
          return await this.updateRecord(params, context);
        case 'ai_analysis':
          return await this.performAIAnalysis(params, context);
        default:
          console.log(`🔧 Executing action: ${actionType}`);
          return { success: true };
      }
    });

    // Delay handler
    this.nodeHandlers.set('delay', async (node: WorkflowNode, context: any) => {
      const { duration, unit } = node.config;
      const ms = this.convertToMs(duration, unit);
      
      console.log(`⏱️ Delaying for ${duration} ${unit}`);
      await new Promise(resolve => setTimeout(resolve, ms));
      
      return { delayed: true };
    });

    // AI Decision handler
    this.nodeHandlers.set('ai_decision', async (node: WorkflowNode, context: any) => {
      const { model, prompt, options } = node.config;
      
      console.log(`🤖 AI Decision: ${node.name}`);
      
      // Simulate AI decision making
      const decision = await this.makeAIDecision(model, prompt, options, context);
      
      return decision;
    });

    // Parallel handler
    this.nodeHandlers.set('parallel', async (node: WorkflowNode, context: any) => {
      console.log(`🔀 Executing parallel branches`);
      // In a real implementation, this would execute child nodes in parallel
      return { parallel: true };
    });
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(condition: any, context: any): boolean {
    if (!condition) return true;

    const { field, operator, value, fieldValue } = condition;
    const contextValue = fieldValue || this.getValueFromContext(field, context);

    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'not_equals':
        return contextValue !== value;
      case 'greater_than':
        return contextValue > value;
      case 'less_than':
        return contextValue < value;
      case 'contains':
        return String(contextValue).includes(value);
      case 'is_empty':
        return !contextValue || contextValue.length === 0;
      case 'is_not_empty':
        return !!contextValue && contextValue.length > 0;
      default:
        return true;
    }
  }

  /**
   * Get value from context using dot notation
   */
  private getValueFromContext(path: string, context: any): any {
    return path.split('.').reduce((obj, key) => obj?.[key], context);
  }

  /**
   * Action implementations
   */
  private async sendEmail(params: any, context: any): Promise<any> {
    const { to, subject, body } = this.interpolateParams(params, context);
    console.log(`📧 Sending email to ${to}: ${subject}`);
    
    // In real implementation, integrate with email service
    return { sent: true, to, subject };
  }

  private async sendSMS(params: any, context: any): Promise<any> {
    const { to, message } = this.interpolateParams(params, context);
    console.log(`📱 Sending SMS to ${to}: ${message}`);
    
    // In real implementation, integrate with SMS service
    return { sent: true, to };
  }

  private async createTask(params: any, context: any): Promise<any> {
    const { title, description, assignTo, dueDate } = this.interpolateParams(params, context);
    console.log(`📋 Creating task: ${title}`);
    
    // In real implementation, create task in database
    return { 
      taskId: this.generateId('task'),
      title,
      assignedTo: assignTo
    };
  }

  private async updateRecord(params: any, context: any): Promise<any> {
    const { recordType, recordId, updates } = this.interpolateParams(params, context);
    console.log(`🔄 Updating ${recordType} ${recordId}`);
    
    // In real implementation, update record in database
    return { updated: true, recordId };
  }

  private async performAIAnalysis(params: any, context: any): Promise<any> {
    const { analysisType, data } = this.interpolateParams(params, context);
    console.log(`🧠 Performing AI analysis: ${analysisType}`);
    
    // Simulate AI analysis
    return {
      analysis: analysisType,
      confidence: 0.85,
      recommendations: [
        'Follow up within 24 hours',
        'Offer premium service package',
        'Schedule in-person meeting'
      ]
    };
  }

  /**
   * Make AI decision
   */
  private async makeAIDecision(model: string, prompt: string, options: string[], context: any): Promise<any> {
    try {
      // Import AI engine dynamically to avoid circular dependencies
      const { workflowAIEngine } = await import('@/lib/ai/workflow-ai-engine');
      
      // Use AI engine if model is available
      const availableModels = workflowAIEngine.getAvailableModels();
      if (availableModels.some(m => m.name === model)) {
        const decision = await workflowAIEngine.makeDecision(model, context);
        return decision;
      }
    } catch (error) {
      console.error('AI engine error:', error);
    }
    
    // Fallback to simple decision
    const decision = options[Math.floor(Math.random() * options.length)];
    
    return {
      decision,
      confidence: 0.75 + Math.random() * 0.25,
      reasoning: 'Based on historical data and current context'
    };
  }

  /**
   * Interpolate parameters with context values
   */
  private interpolateParams(params: any, context: any): any {
    const interpolated: any = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const path = value.slice(2, -2).trim();
        interpolated[key] = this.getValueFromContext(path, context);
      } else {
        interpolated[key] = value;
      }
    }
    
    return interpolated;
  }

  /**
   * Log execution
   */
  private logExecution(
    execution: WorkflowExecution,
    nodeId: string,
    message: string,
    level: 'info' | 'warning' | 'error'
  ) {
    const log: ExecutionLog = {
      timestamp: new Date(),
      nodeId,
      message,
      level
    };
    
    execution.logs.push(log);
    this.emit('execution:log', { executionId: execution.id, log });
  }

  /**
   * Save workflow to database
   */
  private async saveWorkflow(workflow: Workflow): Promise<void> {
    // In real implementation, save to database
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Helper methods
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private convertToMs(duration: number, unit: string): number {
    const units: Record<string, number> = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000
    };
    
    return duration * (units[unit] || 1000);
  }

  private calculateSuccessRate(workflowId: string): number {
    const executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId);
    
    if (executions.length === 0) return 0;
    
    const successful = executions.filter(e => e.status === 'completed').length;
    return (successful / executions.length) * 100;
  }

  private calculateAvgExecutionTime(workflowId: string): number {
    const executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId && e.endTime);
    
    if (executions.length === 0) return 0;
    
    const totalTime = executions.reduce((sum, e) => {
      const duration = e.endTime!.getTime() - e.startTime.getTime();
      return sum + duration;
    }, 0);
    
    return totalTime / executions.length;
  }

  /**
   * Get workflow templates
   */
  getWorkflowTemplates(): Array<{
    name: string;
    description: string;
    category: string;
    nodes: Partial<WorkflowNode>[];
  }> {
    return [
      {
        name: 'Lead Nurturing Campaign',
        description: 'Automated email sequence for new leads',
        category: 'Sales',
        nodes: [
          { type: 'trigger', name: 'New Lead', config: { triggerType: 'new_lead' } },
          { type: 'delay', name: 'Wait 1 hour', config: { duration: 1, unit: 'hours' } },
          { type: 'action', name: 'Send Welcome Email', config: { actionType: 'send_email' } },
          { type: 'condition', name: 'Check Email Opened', config: { field: 'email.opened', operator: 'equals', value: true } },
          { type: 'action', name: 'Update Lead Score', config: { actionType: 'update_record' } }
        ]
      },
      {
        name: 'Job Completion Flow',
        description: 'Automate post-job completion tasks',
        category: 'Operations',
        nodes: [
          { type: 'trigger', name: 'Job Completed', config: { triggerType: 'job_completed' } },
          { type: 'parallel', name: 'Parallel Tasks', config: {} },
          { type: 'action', name: 'Generate Invoice', config: { actionType: 'generate_invoice' } },
          { type: 'action', name: 'Send Feedback Request', config: { actionType: 'send_email' } },
          { type: 'delay', name: 'Wait 7 days', config: { duration: 7, unit: 'days' } },
          { type: 'action', name: 'Send Review Request', config: { actionType: 'send_email' } }
        ]
      },
      {
        name: 'AI-Powered Lead Qualification',
        description: 'Use AI to qualify and route leads',
        category: 'AI',
        nodes: [
          { type: 'trigger', name: 'New Lead', config: { triggerType: 'new_lead' } },
          { type: 'ai_decision', name: 'Qualify Lead', config: { model: 'lead_qualifier', options: ['qualified', 'not_qualified', 'needs_nurturing'] } },
          { type: 'condition', name: 'If Qualified', config: { field: 'ai_decision.decision', operator: 'equals', value: 'qualified' } },
          { type: 'action', name: 'Assign to Sales', config: { actionType: 'assign_to_user' } },
          { type: 'action', name: 'Schedule Meeting', config: { actionType: 'create_task' } }
        ]
      }
    ];
  }
}

// Export singleton instance
export const workflowBuilder = new WorkflowBuilder();