/**
 * AI System Main Entry Point
 * Initializes and coordinates all AI components
 */

import { aiEngine } from './core/ai-engine';
import { dataPipeline } from './data-pipeline';
import { workflowAutomation } from './workflow-automation';
import { apiIntegration } from './api-integration';
import { connectorManager } from './connectors';
import { EventEmitter } from 'events';

export interface AISystemStatus {
  initialized: boolean;
  components: {
    engine: boolean;
    pipeline: boolean;
    automation: boolean;
    integration: boolean;
    connectors: boolean;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    decisionsPerMinute: number;
    avgConfidence: number;
    activeWorkflows: number;
    dataBacklog: number;
    activeConversations: number;
    activeCampaigns: number;
  };
}

export class AISystem extends EventEmitter {
  private status: AISystemStatus = {
    initialized: false,
    components: {
      engine: false,
      pipeline: false,
      automation: false,
      integration: false,
      connectors: false
    },
    health: {
      status: 'unhealthy',
      decisionsPerMinute: 0,
      avgConfidence: 0,
      activeWorkflows: 0,
      dataBacklog: 0,
      activeConversations: 0,
      activeCampaigns: 0
    }
  };

  private healthCheckInterval?: NodeJS.Timer;

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Nordflytt AI System...\n');

    try {
      // Initialize components in order
      await this.initializeComponents();
      
      // Set up inter-component communication
      this.setupCommunication();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Mark as initialized
      this.status.initialized = true;
      this.updateHealthStatus();
      
      console.log('\n✅ AI System fully initialized and operational!');
      console.log('📊 Status:', this.status);
      
      this.emit('ready', this.status);
      
    } catch (error) {
      console.error('❌ AI System initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Initialize all AI components
   */
  private async initializeComponents(): Promise<void> {
    // Wait for each component to be ready
    const initPromises = [];

    // AI Engine
    const engineReady = new Promise((resolve) => {
      aiEngine.once('ready', () => {
        this.status.components.engine = true;
        console.log('✓ AI Engine initialized');
        resolve(true);
      });
    });
    initPromises.push(engineReady);

    // Data Pipeline
    const pipelineReady = new Promise((resolve) => {
      dataPipeline.once('ready', () => {
        this.status.components.pipeline = true;
        console.log('✓ Data Pipeline initialized');
        resolve(true);
      });
    });
    initPromises.push(pipelineReady);

    // Workflow Automation
    const automationReady = new Promise((resolve) => {
      workflowAutomation.once('ready', () => {
        this.status.components.automation = true;
        console.log('✓ Workflow Automation initialized');
        resolve(true);
      });
    });
    initPromises.push(automationReady);

    // API Integration - initialize last as it depends on others
    setTimeout(() => {
      this.status.components.integration = true;
      console.log('✓ API Integration initialized');
    }, 1000);

    // Connector Manager
    const connectorsReady = new Promise((resolve) => {
      connectorManager.once('ready', () => {
        this.status.components.connectors = true;
        console.log('✓ Connector Manager initialized');
        resolve(true);
      });
    });
    initPromises.push(connectorsReady);

    // Wait for all components
    await Promise.race([
      Promise.all(initPromises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Component initialization timeout')), 30000)
      )
    ]);
  }

  /**
   * Set up communication between components
   */
  private setupCommunication(): void {
    console.log('\n🔗 Setting up inter-component communication...');

    // Data Pipeline → Workflow Automation
    dataPipeline.on('batch-processed', (results) => {
      // Workflow automation already subscribed in its own init
      this.emit('data-processed', results);
    });

    // Workflow Automation → AI Engine
    workflowAutomation.on('workflow-started', (execution) => {
      this.emit('workflow-started', execution);
    });

    // AI Engine → Data Pipeline (feedback loop)
    aiEngine.on('lead-scored', (score) => {
      // Could trigger additional data collection
      this.emit('lead-scored', score);
    });

    // Health events
    aiEngine.on('health-check', (health) => {
      this.status.health.decisionsPerMinute = health.decisionsPerMinute;
      this.status.health.avgConfidence = health.averageConfidence;
    });

    aiEngine.on('anomalies-detected', (anomalies) => {
      console.warn('⚠️ AI Anomalies detected:', anomalies);
      this.emit('anomalies', anomalies);
    });

    // Connector Manager events
    connectorManager.on('status-update', (status) => {
      this.status.health.activeConversations = status.customerService.activeConversations;
      this.status.health.activeCampaigns = status.marketing.activeCampaigns;
    });

    connectorManager.on('unified-alert', (alert) => {
      this.emit('unified-alert', alert);
    });

    connectorManager.on('insights-generated', (insights) => {
      this.emit('cross-channel-insights', insights);
    });

    console.log('✓ Inter-component communication established');
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    console.log('\n🏥 Starting health monitoring...');

    this.healthCheckInterval = setInterval(() => {
      this.updateHealthStatus();
      this.emit('health-update', this.status.health);
    }, 30000); // Every 30 seconds

    // Initial health check
    this.updateHealthStatus();
  }

  /**
   * Update system health status
   */
  private updateHealthStatus(): void {
    const allComponentsHealthy = Object.values(this.status.components).every(v => v);
    
    if (!allComponentsHealthy) {
      this.status.health.status = 'unhealthy';
    } else if (this.status.health.avgConfidence < 0.7) {
      this.status.health.status = 'degraded';
    } else {
      this.status.health.status = 'healthy';
    }
  }

  /**
   * Get current system status
   */
  getStatus(): AISystemStatus {
    return { ...this.status };
  }

  /**
   * Shutdown the AI system gracefully
   */
  async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down AI System...');

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Remove all listeners
    this.removeAllListeners();

    // Update status
    this.status.initialized = false;
    this.status.health.status = 'unhealthy';

    console.log('✓ AI System shutdown complete');
  }

  /**
   * Get AI recommendations for a specific context
   */
  async getRecommendations(context: {
    type: 'lead' | 'customer' | 'job' | 'pricing';
    data: any;
  }): Promise<any> {
    switch (context.type) {
      case 'lead':
        return await aiEngine.scoreCustomerLead(context.data);
      
      case 'pricing':
        return await aiEngine.calculateDynamicPrice(context.data);
      
      case 'job':
        return await aiEngine.optimizeJobSchedule(context.data);
      
      case 'customer':
        return await aiEngine.predictChurnRisk(context.data.id);
      
      default:
        throw new Error(`Unknown recommendation type: ${context.type}`);
    }
  }

  /**
   * Get business intelligence insights
   */
  async getBusinessIntelligence(): Promise<any> {
    return await aiEngine.generateBusinessIntelligence();
  }

  /**
   * Manually trigger a workflow
   */
  async triggerWorkflow(workflowId: string, data: any): Promise<any> {
    return await apiIntegration.handleRequest('POST', '/api/workflows/trigger', {
      body: { workflowId, data }
    });
  }

  /**
   * Send notification through appropriate channel
   */
  async sendNotification(to: string, message: string, channel: 'sms' | 'email' = 'email'): Promise<void> {
    if (channel === 'sms') {
      await apiIntegration.sendSMS(to, message);
    } else {
      await apiIntegration.sendEmail(
        to,
        'Nordflytt Notification',
        message
      );
    }
  }
}

// Create and export singleton instance
export const aiSystem = new AISystem();

// Export all components for direct access when needed
export { aiEngine } from './core/ai-engine';
export { dataPipeline } from './data-pipeline';
export { workflowAutomation } from './workflow-automation';
export { apiIntegration } from './api-integration';
export { connectorManager, customerServiceConnector, marketingConnector } from './connectors';

// Export types
export type { CustomerScore, AIDecision, MarketIntelligence } from './core/ai-engine';
export type { DataStream, ProcessedData } from './data-pipeline';
export type { WorkflowTrigger, WorkflowExecution } from './workflow-automation';
export type { APIEndpoint } from './api-integration';