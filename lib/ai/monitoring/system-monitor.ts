/**
 * System Monitoring & Observability
 * Real-time monitoring of AI system health and performance
 */

import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase';

export interface SystemHealth {
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'critical';
  
  // Component health
  components: ComponentHealth[];
  
  // System metrics
  metrics: SystemMetrics;
  
  // Active issues
  issues: SystemIssue[];
  
  // Recent incidents
  incidents: Incident[];
  
  // Recommendations
  recommendations: HealthRecommendation[];
}

export interface ComponentHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  errorRate: number;
  
  // Detailed metrics
  metrics: {
    requests: number;
    successful: number;
    failed: number;
    avgDuration: number;
    p95Duration: number;
    p99Duration: number;
  };
  
  // Dependencies
  dependencies: DependencyStatus[];
  
  // Recent errors
  recentErrors: ComponentError[];
}

export interface SystemMetrics {
  // Performance
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  
  // Reliability
  uptime: number;
  availability: number;
  errorRate: number;
  
  // Resource utilization
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkBandwidth: number;
  
  // Business metrics
  activeUsers: number;
  jobsProcessed: number;
  revenue: number;
  customerSatisfaction: number;
}

export interface SystemIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  type: string;
  description: string;
  impact: string;
  detectedAt: Date;
  
  // Auto-resolution
  autoResolvable: boolean;
  resolutionSteps?: string[];
  estimatedResolutionTime?: number;
}

export interface Incident {
  id: string;
  title: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  
  // Timeline
  startedAt: Date;
  identifiedAt?: Date;
  resolvedAt?: Date;
  duration?: number;
  
  // Details
  affectedComponents: string[];
  impact: string;
  rootCause?: string;
  resolution?: string;
  
  // Metrics
  affectedUsers: number;
  lostRevenue: number;
}

export interface HealthRecommendation {
  priority: 'low' | 'medium' | 'high';
  category: string;
  issue: string;
  recommendation: string;
  estimatedImpact: string;
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  metric: string;
  
  // Condition
  condition: AlertCondition;
  currentValue: number;
  threshold: number;
  
  // Details
  message: string;
  context: Record<string, any>;
  
  // Actions
  autoResolve: boolean;
  notificationsSent: string[];
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration?: number; // seconds
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export class SystemMonitor extends EventEmitter {
  private supabase = createClient();
  private metrics: Map<string, MetricData[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Alert rules
  private alertRules: AlertRule[] = [
    {
      name: 'High Error Rate',
      condition: { metric: 'errorRate', operator: '>', threshold: 5, duration: 300 },
      severity: 'error'
    },
    {
      name: 'Critical Error Rate',
      condition: { metric: 'errorRate', operator: '>', threshold: 10, duration: 60 },
      severity: 'critical'
    },
    {
      name: 'Slow Response Time',
      condition: { metric: 'avgResponseTime', operator: '>', threshold: 1000, duration: 300 },
      severity: 'warning'
    },
    {
      name: 'High CPU Usage',
      condition: { metric: 'cpuUsage', operator: '>', threshold: 80, duration: 600 },
      severity: 'warning'
    },
    {
      name: 'Critical CPU Usage',
      condition: { metric: 'cpuUsage', operator: '>', threshold: 95, duration: 300 },
      severity: 'critical'
    },
    {
      name: 'Low Availability',
      condition: { metric: 'availability', operator: '<', threshold: 99.5, duration: 300 },
      severity: 'error'
    }
  ];
  
  constructor() {
    super();
    this.initializeMonitoring();
  }
  
  private async initializeMonitoring() {
    // Start continuous monitoring
    this.startMonitoring();
    
    // Set up real-time subscriptions
    this.setupRealtimeSubscriptions();
  }
  
  /**
   * Get current system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Collect component health
      const components = await this.collectComponentHealth();
      
      // Aggregate system metrics
      const metrics = await this.aggregateSystemMetrics();
      
      // Identify active issues
      const issues = await this.identifySystemIssues(components, metrics);
      
      // Get recent incidents
      const incidents = Array.from(this.incidents.values())
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, 10);
      
      // Generate recommendations
      const recommendations = this.generateHealthRecommendations(components, metrics, issues);
      
      // Determine overall status
      const status = this.determineSystemStatus(components, issues);
      
      const health: SystemHealth = {
        timestamp: new Date(),
        status,
        components,
        metrics,
        issues,
        incidents,
        recommendations
      };
      
      this.emit('health-check', health);
      return health;
      
    } catch (error) {
      console.error('System health check error:', error);
      throw error;
    }
  }
  
  /**
   * Record metric data point
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const dataPoint: MetricData = {
      timestamp: new Date(),
      value,
      tags: tags || {}
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricData = this.metrics.get(name)!;
    metricData.push(dataPoint);
    
    // Keep only last hour of data
    const oneHourAgo = Date.now() - 3600000;
    const filtered = metricData.filter(d => d.timestamp.getTime() > oneHourAgo);
    this.metrics.set(name, filtered);
    
    // Check alert conditions
    this.checkAlertConditions(name, value);
  }
  
  /**
   * Create incident
   */
  async createIncident(params: {
    title: string;
    severity: 'minor' | 'major' | 'critical';
    affectedComponents: string[];
    impact: string;
  }): Promise<Incident> {
    const incident: Incident = {
      id: `incident-${Date.now()}`,
      title: params.title,
      severity: params.severity,
      status: 'investigating',
      startedAt: new Date(),
      affectedComponents: params.affectedComponents,
      impact: params.impact,
      affectedUsers: 0,
      lostRevenue: 0
    };
    
    this.incidents.set(incident.id, incident);
    this.emit('incident-created', incident);
    
    // Auto-investigate
    this.investigateIncident(incident);
    
    return incident;
  }
  
  /**
   * Start continuous monitoring
   */
  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      try {
        // Collect metrics from all components
        await this.collectSystemMetrics();
        
        // Check system health
        const health = await this.getSystemHealth();
        
        // Store metrics for historical analysis
        await this.storeMetrics();
        
        // Clean up old data
        this.cleanupOldData();
        
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Collect health data from all components
   */
  private async collectComponentHealth(): Promise<ComponentHealth[]> {
    const components = [
      'AIEngine',
      'LeadScoringModel',
      'CLVPredictionModel',
      'ChurnPredictionModel',
      'SmartJobScheduler',
      'DynamicPricingEngine',
      'AutomatedAssignment',
      'CompetitiveIntelligence',
      'DemandForecasting',
      'PerformanceAnalytics'
    ];
    
    const healthData: ComponentHealth[] = [];
    
    for (const component of components) {
      const health = await this.checkComponentHealth(component);
      healthData.push(health);
    }
    
    return healthData;
  }
  
  /**
   * Check individual component health
   */
  private async checkComponentHealth(componentName: string): Promise<ComponentHealth> {
    // Simulate health check (would ping actual component in production)
    const metrics = this.getComponentMetrics(componentName);
    
    const health: ComponentHealth = {
      name: componentName,
      status: 'operational',
      uptime: 99.9,
      responseTime: metrics.avgDuration || 50,
      errorRate: metrics.errorRate || 0,
      metrics: {
        requests: metrics.requests || 1000,
        successful: metrics.successful || 990,
        failed: metrics.failed || 10,
        avgDuration: metrics.avgDuration || 50,
        p95Duration: metrics.p95Duration || 100,
        p99Duration: metrics.p99Duration || 200
      },
      dependencies: [],
      recentErrors: []
    };
    
    // Determine status based on metrics
    if (health.errorRate > 10) {
      health.status = 'down';
    } else if (health.errorRate > 5 || health.responseTime > 1000) {
      health.status = 'degraded';
    }
    
    return health;
  }
  
  /**
   * Aggregate system-wide metrics
   */
  private async aggregateSystemMetrics(): Promise<SystemMetrics> {
    const componentMetrics = await this.collectComponentHealth();
    
    return {
      // Performance
      avgResponseTime: this.average(componentMetrics.map(c => c.metrics.avgDuration)),
      p95ResponseTime: this.average(componentMetrics.map(c => c.metrics.p95Duration)),
      p99ResponseTime: this.average(componentMetrics.map(c => c.metrics.p99Duration)),
      throughput: componentMetrics.reduce((sum, c) => sum + c.metrics.requests, 0) / 60, // per second
      
      // Reliability
      uptime: this.average(componentMetrics.map(c => c.uptime)),
      availability: this.calculateAvailability(componentMetrics),
      errorRate: this.average(componentMetrics.map(c => c.errorRate)),
      
      // Resource utilization (simulated)
      cpuUsage: 45 + Math.random() * 20,
      memoryUsage: 60 + Math.random() * 15,
      diskUsage: 35 + Math.random() * 10,
      networkBandwidth: 100 + Math.random() * 50,
      
      // Business metrics (simulated)
      activeUsers: 250 + Math.floor(Math.random() * 50),
      jobsProcessed: 847 + Math.floor(Math.random() * 100),
      revenue: 145000 + Math.random() * 20000,
      customerSatisfaction: 4.5 + Math.random() * 0.3
    };
  }
  
  /**
   * Identify system issues
   */
  private async identifySystemIssues(
    components: ComponentHealth[],
    metrics: SystemMetrics
  ): Promise<SystemIssue[]> {
    const issues: SystemIssue[] = [];
    
    // Check component issues
    for (const component of components) {
      if (component.status === 'down') {
        issues.push({
          id: `issue-${Date.now()}-${Math.random()}`,
          severity: 'critical',
          component: component.name,
          type: 'component-down',
          description: `${component.name} is not responding`,
          impact: 'Service degradation for dependent features',
          detectedAt: new Date(),
          autoResolvable: true,
          resolutionSteps: [
            'Restart component service',
            'Check database connections',
            'Review recent deployments'
          ],
          estimatedResolutionTime: 300
        });
      } else if (component.status === 'degraded') {
        issues.push({
          id: `issue-${Date.now()}-${Math.random()}`,
          severity: 'medium',
          component: component.name,
          type: 'performance-degradation',
          description: `${component.name} is experiencing performance issues`,
          impact: 'Slower response times',
          detectedAt: new Date(),
          autoResolvable: true,
          resolutionSteps: [
            'Scale up resources',
            'Clear cache',
            'Optimize queries'
          ],
          estimatedResolutionTime: 600
        });
      }
    }
    
    // Check system-wide issues
    if (metrics.errorRate > 5) {
      issues.push({
        id: `issue-${Date.now()}-${Math.random()}`,
        severity: 'high',
        component: 'System',
        type: 'high-error-rate',
        description: `System error rate is ${metrics.errorRate.toFixed(2)}%`,
        impact: 'Poor user experience',
        detectedAt: new Date(),
        autoResolvable: false
      });
    }
    
    if (metrics.cpuUsage > 80) {
      issues.push({
        id: `issue-${Date.now()}-${Math.random()}`,
        severity: 'medium',
        component: 'Infrastructure',
        type: 'high-cpu-usage',
        description: `CPU usage is ${metrics.cpuUsage.toFixed(1)}%`,
        impact: 'Potential performance degradation',
        detectedAt: new Date(),
        autoResolvable: true,
        resolutionSteps: [
          'Scale horizontally',
          'Optimize CPU-intensive operations',
          'Review background jobs'
        ]
      });
    }
    
    return issues;
  }
  
  /**
   * Generate health recommendations
   */
  private generateHealthRecommendations(
    components: ComponentHealth[],
    metrics: SystemMetrics,
    issues: SystemIssue[]
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];
    
    // Performance recommendations
    if (metrics.avgResponseTime > 500) {
      recommendations.push({
        priority: 'high',
        category: 'Performance',
        issue: 'High average response time',
        recommendation: 'Implement caching for frequently accessed data',
        estimatedImpact: '40% reduction in response time'
      });
    }
    
    // Reliability recommendations
    if (metrics.availability < 99.9) {
      recommendations.push({
        priority: 'high',
        category: 'Reliability',
        issue: 'Below target availability',
        recommendation: 'Implement redundancy and failover mechanisms',
        estimatedImpact: 'Increase availability to 99.95%'
      });
    }
    
    // Capacity recommendations
    if (metrics.cpuUsage > 70 || metrics.memoryUsage > 80) {
      recommendations.push({
        priority: 'medium',
        category: 'Capacity',
        issue: 'High resource utilization',
        recommendation: 'Plan for capacity expansion in next quarter',
        estimatedImpact: 'Prevent performance degradation during peak times'
      });
    }
    
    // Component-specific recommendations
    const degradedComponents = components.filter(c => c.status === 'degraded');
    if (degradedComponents.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Components',
        issue: `${degradedComponents.length} components degraded`,
        recommendation: 'Review and optimize degraded components',
        estimatedImpact: 'Improve overall system stability'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Check alert conditions
   */
  private checkAlertConditions(metric: string, value: number) {
    for (const rule of this.alertRules) {
      if (rule.condition.metric === metric) {
        const triggered = this.evaluateCondition(value, rule.condition);
        
        if (triggered) {
          const alert: Alert = {
            id: `alert-${Date.now()}`,
            timestamp: new Date(),
            severity: rule.severity,
            component: 'System',
            metric,
            condition: rule.condition,
            currentValue: value,
            threshold: rule.condition.threshold,
            message: `${rule.name}: ${metric} is ${value} (threshold: ${rule.condition.operator} ${rule.condition.threshold})`,
            context: {},
            autoResolve: rule.severity !== 'critical',
            notificationsSent: []
          };
          
          this.alerts.set(alert.id, alert);
          this.emit('alert-triggered', alert);
          
          // Send notifications
          this.sendAlertNotifications(alert);
        }
      }
    }
  }
  
  /**
   * Helper methods
   */
  private evaluateCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case '>': return value > condition.threshold;
      case '<': return value < condition.threshold;
      case '>=': return value >= condition.threshold;
      case '<=': return value <= condition.threshold;
      case '==': return value === condition.threshold;
      case '!=': return value !== condition.threshold;
      default: return false;
    }
  }
  
  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
  
  private calculateAvailability(components: ComponentHealth[]): number {
    const operational = components.filter(c => c.status === 'operational').length;
    return (operational / components.length) * 100;
  }
  
  private determineSystemStatus(
    components: ComponentHealth[],
    issues: SystemIssue[]
  ): 'healthy' | 'degraded' | 'critical' {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const downComponents = components.filter(c => c.status === 'down');
    
    if (criticalIssues.length > 0 || downComponents.length > 0) {
      return 'critical';
    }
    
    const highIssues = issues.filter(i => i.severity === 'high');
    const degradedComponents = components.filter(c => c.status === 'degraded');
    
    if (highIssues.length > 0 || degradedComponents.length > 2) {
      return 'degraded';
    }
    
    return 'healthy';
  }
  
  private getComponentMetrics(componentName: string): any {
    // Simulate getting metrics (would query actual metrics in production)
    return {
      requests: 1000 + Math.floor(Math.random() * 500),
      successful: 950 + Math.floor(Math.random() * 40),
      failed: Math.floor(Math.random() * 10),
      avgDuration: 30 + Math.random() * 70,
      p95Duration: 80 + Math.random() * 120,
      p99Duration: 150 + Math.random() * 150,
      errorRate: Math.random() * 2
    };
  }
  
  private async investigateIncident(incident: Incident) {
    // Simulate investigation
    setTimeout(() => {
      incident.status = 'identified';
      incident.identifiedAt = new Date();
      incident.rootCause = 'Database connection pool exhaustion';
      this.emit('incident-updated', incident);
      
      // Simulate resolution
      setTimeout(() => {
        incident.status = 'resolved';
        incident.resolvedAt = new Date();
        incident.duration = incident.resolvedAt.getTime() - incident.startedAt.getTime();
        incident.resolution = 'Increased connection pool size and optimized queries';
        this.emit('incident-resolved', incident);
      }, 300000); // 5 minutes
    }, 60000); // 1 minute
  }
  
  private async sendAlertNotifications(alert: Alert) {
    // Simulate sending notifications
    const channels = [];
    
    if (alert.severity === 'critical') {
      channels.push('sms', 'email', 'slack');
    } else if (alert.severity === 'error') {
      channels.push('email', 'slack');
    } else {
      channels.push('slack');
    }
    
    alert.notificationsSent = channels;
    this.emit('notifications-sent', { alert, channels });
  }
  
  private async collectSystemMetrics() {
    // Collect metrics from various sources
    // This would integrate with actual monitoring tools in production
  }
  
  private async storeMetrics() {
    // Store metrics for historical analysis
    // This would write to time-series database in production
  }
  
  private cleanupOldData() {
    // Clean up old metrics data
    const oneHourAgo = Date.now() - 3600000;
    
    for (const [metric, data] of this.metrics.entries()) {
      const filtered = data.filter(d => d.timestamp.getTime() > oneHourAgo);
      this.metrics.set(metric, filtered);
    }
    
    // Clean up resolved alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.timestamp.getTime() < oneHourAgo && alert.autoResolve) {
        this.alerts.delete(id);
      }
    }
  }
  
  private setupRealtimeSubscriptions() {
    // Set up real-time subscriptions for monitoring events
    // This would connect to actual event streams in production
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Interfaces for helper types
interface MetricData {
  timestamp: Date;
  value: number;
  tags: Record<string, string>;
}

interface AlertRule {
  name: string;
  condition: AlertCondition;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface DependencyStatus {
  name: string;
  status: 'healthy' | 'unhealthy';
  latency: number;
}

interface ComponentError {
  timestamp: Date;
  message: string;
  stack?: string;
  count: number;
}

// Export singleton instance
export const systemMonitor = new SystemMonitor();