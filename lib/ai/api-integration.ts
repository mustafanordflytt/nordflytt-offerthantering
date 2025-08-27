/**
 * API Integration Layer for AI System
 * Connects AI components with external services and CRM modules
 */

import { aiEngine } from './core/ai-engine';
import { dataPipeline } from './data-pipeline';
import { workflowAutomation } from './workflow-automation';
import { createClient } from '@/lib/supabase';

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: any) => Promise<any>;
  auth: boolean;
  rateLimit: number; // requests per minute
}

export interface IntegrationConfig {
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class APIIntegration {
  private supabase = createClient();
  private endpoints: Map<string, APIEndpoint> = new Map();
  private integrations: Map<string, IntegrationConfig> = new Map();
  private rateLimits: Map<string, number[]> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log('🔌 Initializing API Integration Layer...');
    
    // Register API endpoints
    this.registerEndpoints();
    
    // Configure external integrations
    await this.configureIntegrations();
    
    // Set up webhooks
    this.setupWebhooks();
    
    // Connect to AI customer service
    await this.connectAICustomerService();
    
    console.log('✅ API Integration Layer ready');
  }

  /**
   * Register internal API endpoints
   */
  private registerEndpoints() {
    // AI Engine endpoints
    this.registerEndpoint({
      path: '/api/ai/score-lead',
      method: 'POST',
      handler: async (req) => {
        const leadData = req.body;
        return await aiEngine.scoreCustomerLead(leadData);
      },
      auth: true,
      rateLimit: 100
    });

    this.registerEndpoint({
      path: '/api/ai/calculate-price',
      method: 'POST',
      handler: async (req) => {
        const serviceRequest = req.body;
        return await aiEngine.calculateDynamicPrice(serviceRequest);
      },
      auth: true,
      rateLimit: 200
    });

    this.registerEndpoint({
      path: '/api/ai/optimize-schedule',
      method: 'POST',
      handler: async (req) => {
        const job = req.body;
        return await aiEngine.optimizeJobSchedule(job);
      },
      auth: true,
      rateLimit: 100
    });

    this.registerEndpoint({
      path: '/api/ai/predict-churn',
      method: 'POST',
      handler: async (req) => {
        const { customerId } = req.body;
        return await aiEngine.predictChurnRisk(customerId);
      },
      auth: true,
      rateLimit: 50
    });

    // Workflow endpoints
    this.registerEndpoint({
      path: '/api/workflows/trigger',
      method: 'POST',
      handler: async (req) => {
        const { workflowId, data } = req.body;
        return await this.triggerWorkflow(workflowId, data);
      },
      auth: true,
      rateLimit: 100
    });

    // Analytics endpoints
    this.registerEndpoint({
      path: '/api/analytics/business-intelligence',
      method: 'GET',
      handler: async () => {
        return await aiEngine.generateBusinessIntelligence();
      },
      auth: true,
      rateLimit: 10
    });

    console.log(`📡 Registered ${this.endpoints.size} API endpoints`);
  }

  /**
   * Configure external service integrations
   */
  private async configureIntegrations() {
    // AI Customer Service integration
    this.integrations.set('ai-customer-service', {
      baseUrl: process.env.AI_CUSTOMER_SERVICE_URL || 'https://api.nordflytt.se',
      apiKey: process.env.AI_SERVICE_API_KEY,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Version': '96.6'
      },
      timeout: 30000
    });

    // Marketing Automation integration
    this.integrations.set('marketing', {
      baseUrl: process.env.MARKETING_API_URL || 'https://marketing.nordflytt.se',
      apiKey: process.env.MARKETING_API_KEY,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Financial System integration (Fortnox)
    this.integrations.set('financial', {
      baseUrl: 'https://api.fortnox.se/3',
      apiKey: process.env.FORTNOX_API_KEY,
      headers: {
        'Access-Token': process.env.FORTNOX_ACCESS_TOKEN || '',
        'Client-Secret': process.env.FORTNOX_CLIENT_SECRET || ''
      }
    });

    // SMS Service integration
    this.integrations.set('sms', {
      baseUrl: 'https://api.46elks.com',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SMS_API_USERNAME}:${process.env.SMS_API_PASSWORD}`
        ).toString('base64')}`
      }
    });

    // Email Service integration
    this.integrations.set('email', {
      baseUrl: 'https://api.sendgrid.com/v3',
      apiKey: process.env.SENDGRID_API_KEY,
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`🔧 Configured ${this.integrations.size} external integrations`);
  }

  /**
   * Connect to existing AI Customer Service
   */
  private async connectAICustomerService() {
    const config = this.integrations.get('ai-customer-service');
    if (!config) return;

    try {
      // Test connection
      const response = await this.makeRequest(config, {
        method: 'GET',
        path: '/health'
      });

      if (response.status === 'healthy') {
        console.log('✅ Connected to AI Customer Service (96.6/100)');
        
        // Subscribe to customer service events
        this.subscribeToCustomerServiceEvents();
      }
    } catch (error) {
      console.error('❌ Failed to connect to AI Customer Service:', error);
    }
  }

  /**
   * Set up webhooks for external events
   */
  private setupWebhooks() {
    // Customer service webhook
    this.registerEndpoint({
      path: '/api/webhooks/customer-service',
      method: 'POST',
      handler: async (req) => {
        const event = req.body;
        
        // Process customer service events
        if (event.type === 'new_conversation') {
          await this.handleNewConversation(event);
        } else if (event.type === 'lead_qualified') {
          await this.handleQualifiedLead(event);
        }
        
        return { received: true };
      },
      auth: false,
      rateLimit: 1000
    });

    // Marketing webhook
    this.registerEndpoint({
      path: '/api/webhooks/marketing',
      method: 'POST',
      handler: async (req) => {
        const event = req.body;
        
        // Feed marketing data to pipeline
        dataPipeline.emit('external-data', {
          source: 'marketing',
          type: 'lead',
          data: event
        });
        
        return { received: true };
      },
      auth: false,
      rateLimit: 500
    });
  }

  /**
   * Subscribe to customer service real-time events
   */
  private subscribeToCustomerServiceEvents() {
    // Set up EventSource or WebSocket connection
    console.log('📻 Subscribing to customer service events...');
    
    // Simulated event subscription
    setInterval(async () => {
      try {
        const events = await this.fetchCustomerServiceEvents();
        for (const event of events) {
          this.processCustomerServiceEvent(event);
        }
      } catch (error) {
        console.error('Error fetching customer service events:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Process events from customer service
   */
  private async processCustomerServiceEvent(event: any) {
    switch (event.type) {
      case 'conversation_started':
        // Feed to data pipeline
        dataPipeline.emit('external-data', {
          source: 'customer-service',
          type: 'lead',
          data: {
            ...event.data,
            aiScore: event.confidence,
            intent: event.intent
          }
        });
        break;

      case 'high_value_lead':
        // Trigger immediate workflow
        await this.triggerWorkflow('high-value-lead-nurture', event.data);
        break;

      case 'support_escalation':
        // Create urgent task
        await this.createSupportTask(event.data);
        break;
    }
  }

  /**
   * Make HTTP request to external service
   */
  private async makeRequest(config: IntegrationConfig, options: {
    method: string;
    path: string;
    body?: any;
    query?: Record<string, string>;
  }): Promise<any> {
    const url = new URL(config.baseUrl + options.path);
    
    // Add query parameters
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers = {
      ...config.headers,
      ...(config.apiKey && { 'X-API-Key': config.apiKey })
    };

    const response = await fetch(url.toString(), {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(config.timeout || 30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Register an API endpoint
   */
  private registerEndpoint(endpoint: APIEndpoint) {
    const key = `${endpoint.method} ${endpoint.path}`;
    this.endpoints.set(key, endpoint);
  }

  /**
   * Handle incoming API request
   */
  async handleRequest(method: string, path: string, req: any): Promise<any> {
    const key = `${method} ${path}`;
    const endpoint = this.endpoints.get(key);

    if (!endpoint) {
      throw new Error(`Endpoint not found: ${key}`);
    }

    // Check rate limit
    if (!this.checkRateLimit(key, endpoint.rateLimit)) {
      throw new Error('Rate limit exceeded');
    }

    // Check authentication if required
    if (endpoint.auth && !this.authenticateRequest(req)) {
      throw new Error('Unauthorized');
    }

    // Execute handler
    return await endpoint.handler(req);
  }

  /**
   * Check rate limit for endpoint
   */
  private checkRateLimit(key: string, limit: number): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get or create rate limit array
    let timestamps = this.rateLimits.get(key) || [];
    
    // Remove old timestamps
    timestamps = timestamps.filter(t => t > windowStart);
    
    // Check if under limit
    if (timestamps.length >= limit) {
      return false;
    }

    // Add current timestamp
    timestamps.push(now);
    this.rateLimits.set(key, timestamps);
    
    return true;
  }

  /**
   * Authenticate API request
   */
  private authenticateRequest(req: any): boolean {
    // Simplified authentication check
    const token = req.headers?.authorization?.replace('Bearer ', '');
    return !!token; // In production, validate JWT
  }

  /**
   * Trigger a workflow manually
   */
  private async triggerWorkflow(workflowId: string, data: any) {
    // Emit to workflow automation
    workflowAutomation.emit('manual-trigger', {
      workflowId,
      data
    });

    return { triggered: true, workflowId };
  }

  /**
   * Handle new conversation from AI customer service
   */
  private async handleNewConversation(event: any) {
    const { customerId, conversation, intent, confidence } = event.data;

    // Create or update lead
    const { data: lead } = await this.supabase
      .from('leads')
      .upsert({
        customer_id: customerId,
        source: 'ai-chat',
        initial_intent: intent,
        confidence_score: confidence,
        conversation_id: conversation.id,
        status: 'new'
      })
      .select()
      .single();

    // Score immediately
    const score = await aiEngine.scoreCustomerLead({
      ...lead,
      aiInteraction: conversation
    });

    // Update with score
    await this.supabase
      .from('leads')
      .update({ ai_score: score.leadScore })
      .eq('id', lead.id);
  }

  /**
   * Handle qualified lead from AI service
   */
  private async handleQualifiedLead(event: any) {
    const { leadId, qualification, recommendedActions } = event.data;

    // Update lead status
    await this.supabase
      .from('leads')
      .update({
        status: 'qualified',
        qualification_data: qualification,
        ai_recommendations: recommendedActions
      })
      .eq('id', leadId);

    // Trigger follow-up workflow
    await this.triggerWorkflow('qualified-lead-follow-up', {
      leadId,
      qualification,
      recommendedActions
    });
  }

  /**
   * Create support task from escalation
   */
  private async createSupportTask(data: any) {
    const task = {
      title: `Support Escalation: ${data.issue}`,
      description: data.conversation_summary,
      priority: 'high',
      assigned_to: 'support-team',
      customer_id: data.customerId,
      due_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      type: 'support-escalation',
      metadata: {
        conversation_id: data.conversationId,
        ai_summary: data.summary
      }
    };

    await this.supabase
      .from('tasks')
      .insert(task);
  }

  /**
   * Fetch recent events from customer service
   */
  private async fetchCustomerServiceEvents(): Promise<any[]> {
    const config = this.integrations.get('ai-customer-service');
    if (!config) return [];

    try {
      const response = await this.makeRequest(config, {
        method: 'GET',
        path: '/events',
        query: {
          since: new Date(Date.now() - 10000).toISOString(), // Last 10 seconds
          limit: '50'
        }
      });

      return response.events || [];
    } catch (error) {
      console.error('Failed to fetch customer service events:', error);
      return [];
    }
  }

  /**
   * Send data to marketing automation
   */
  async sendToMarketing(data: any) {
    const config = this.integrations.get('marketing');
    if (!config) return;

    try {
      await this.makeRequest(config, {
        method: 'POST',
        path: '/contacts',
        body: data
      });
    } catch (error) {
      console.error('Failed to send to marketing:', error);
    }
  }

  /**
   * Get financial data from Fortnox
   */
  async getFinancialData(customerId: string) {
    const config = this.integrations.get('financial');
    if (!config) return null;

    try {
      const response = await this.makeRequest(config, {
        method: 'GET',
        path: `/customers/${customerId}/invoices`
      });
      return response;
    } catch (error) {
      console.error('Failed to get financial data:', error);
      return null;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(to: string, message: string) {
    const config = this.integrations.get('sms');
    if (!config) return;

    try {
      await this.makeRequest(config, {
        method: 'POST',
        path: '/SMS',
        body: {
          from: 'Nordflytt',
          to: to.startsWith('+') ? to : `+46${to.replace(/^0/, '')}`,
          message
        }
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(to: string, subject: string, content: string) {
    const config = this.integrations.get('email');
    if (!config) return;

    try {
      await this.makeRequest(config, {
        method: 'POST',
        path: '/mail/send',
        body: {
          personalizations: [{ to: [{ email: to }] }],
          from: { email: 'noreply@nordflytt.se', name: 'Nordflytt' },
          subject,
          content: [{ type: 'text/html', value: content }]
        }
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}

// Export singleton instance
export const apiIntegration = new APIIntegration();