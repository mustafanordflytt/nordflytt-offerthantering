import { supabase } from '@/lib/supabase';

interface APIConfig {
  api_name: string;
  display_name: string;
  endpoint: string;
  auth_type: string;
  api_type: string;
  usage_threshold: number;
  cost_threshold: number;
  response_time_threshold: number;
  uptime_threshold: number;
  enabled: boolean;
  critical: boolean;
  backup_api?: string;
}

interface APIStatus {
  status: 'healthy' | 'warning' | 'failed';
  uptime: number;
  response_time: number;
  usage: {
    calls: number;
    percentage: number;
    limit: number;
    resetTime: string;
  };
  cost: {
    current: number;
    budget: number;
    percentage: number;
    projection: number;
    status: 'good' | 'warning' | 'danger';
  };
  error?: string;
  lastSuccess?: string;
  lastCheck: string;
}

export class APIHealthMonitor {
  private apis: Record<string, APIConfig> = {};
  private alertSystem: AlertSystem;

  constructor() {
    this.alertSystem = new AlertSystem();
    this.loadAPIConfigs();
  }

  private async loadAPIConfigs() {
    const { data: configs } = await supabase
      .from('api_config')
      .select('*')
      .eq('enabled', true);

    if (configs) {
      this.apis = configs.reduce((acc, config) => {
        acc[config.api_name] = config;
        return acc;
      }, {} as Record<string, APIConfig>);
    }
  }

  async checkAllAPIs(): Promise<Record<string, APIStatus>> {
    const results: Record<string, APIStatus> = {};
    
    for (const [name, config] of Object.entries(this.apis)) {
      try {
        const startTime = Date.now();
        const healthCheck = await this.checkAPI(config);
        const responseTime = Date.now() - startTime;
        
        const usage = await this.getAPIUsage(name);
        const cost = await this.getAPICost(name);
        
        results[name] = {
          status: 'healthy',
          uptime: healthCheck.uptime || 99.9,
          response_time: responseTime,
          usage: usage,
          cost: cost,
          lastCheck: new Date().toISOString()
        };

        // Store health check in database
        await this.storeHealthCheck(name, results[name]);
        
      } catch (error) {
        const lastSuccess = await this.getLastSuccess(name);
        
        results[name] = {
          status: 'failed',
          uptime: 0,
          response_time: 0,
          usage: await this.getAPIUsage(name),
          cost: await this.getAPICost(name),
          error: error instanceof Error ? error.message : 'Unknown error',
          lastSuccess: lastSuccess,
          lastCheck: new Date().toISOString()
        };

        // Store failed health check
        await this.storeHealthCheck(name, results[name]);
      }
    }

    // Check for alerts
    await this.alertSystem.checkAlerts(results);
    
    return results;
  }

  private async checkAPI(config: APIConfig): Promise<{ uptime: number }> {
    if (config.endpoint === 'internal') {
      return await this.checkInternalService(config);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Nordflytt-API-Monitor/1.0'
    };

    // Add authentication based on type
    if (config.auth_type === 'bearer' && process.env[`${config.api_name.toUpperCase().replace(/\s+/g, '_')}_API_KEY`]) {
      headers['Authorization'] = `Bearer ${process.env[`${config.api_name.toUpperCase().replace(/\s+/g, '_')}_API_KEY`]}`;
    } else if (config.auth_type === 'api_key' && process.env[`${config.api_name.toUpperCase().replace(/\s+/g, '_')}_API_KEY`]) {
      // For Google Maps API
      const apiKey = process.env[`${config.api_name.toUpperCase().replace(/\s+/g, '_')}_API_KEY`];
      const testEndpoint = `${config.endpoint}/geocode/json?address=Stockholm&key=${apiKey}`;
      
      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: headers,
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      return { uptime: 99.9 };
    }

    // Default health check
    let testEndpoint = config.endpoint;
    
    // Customize test endpoints for specific APIs
    switch (config.api_name) {
      case 'SendGrid':
        testEndpoint = 'https://api.sendgrid.com/v3/user/profile';
        break;
      case 'Mailgun':
        testEndpoint = 'https://api.mailgun.net/v3/domains';
        break;
      case 'Twilio':
        testEndpoint = 'https://api.twilio.com/2010-04-01/Accounts.json';
        break;
      case 'SMHI Weather':
        testEndpoint = 'https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/16.158/lat/58.5812/data.json';
        break;
      case 'Fortnox':
        testEndpoint = 'https://api.fortnox.se/3/companyinformation';
        break;
      default:
        if (config.api_name.includes('OpenAI')) {
          testEndpoint = 'https://api.openai.com/v1/models';
        }
    }

    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers: headers,
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    return { uptime: 99.9 };
  }

  private async checkInternalService(config: APIConfig): Promise<{ uptime: number }> {
    // Check internal services like Hemnet scraping
    switch (config.api_name) {
      case 'Hemnet Scraping':
        // Check if scraping service is responsive
        try {
          const response = await fetch('http://localhost:3000/api/hemnet/health', {
            method: 'GET',
            timeout: 5000
          });
          
          if (response.ok) {
            return { uptime: 99.9 };
          } else {
            throw new Error('Hemnet scraping service not responding');
          }
        } catch (error) {
          throw new Error('Hemnet scraping service unavailable');
        }
      default:
        return { uptime: 99.9 };
    }
  }

  private async getAPIUsage(apiName: string): Promise<APIStatus['usage']> {
    const { data: usage } = await supabase
      .from('api_usage')
      .select('*')
      .eq('api_name', apiName)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if (!usage) {
      return {
        calls: 0,
        percentage: 0,
        limit: 1000,
        resetTime: 'Daily'
      };
    }

    return {
      calls: usage.calls || 0,
      percentage: usage.percentage || 0,
      limit: usage.usage_limit || 1000,
      resetTime: usage.reset_time || 'Daily'
    };
  }

  private async getAPICost(apiName: string): Promise<APIStatus['cost']> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const { data: cost } = await supabase
      .from('api_costs')
      .select('*')
      .eq('api_name', apiName)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    if (!cost) {
      return {
        current: 0,
        budget: 500,
        percentage: 0,
        projection: 0,
        status: 'good'
      };
    }

    return {
      current: cost.current_cost || 0,
      budget: cost.budget || 500,
      percentage: cost.percentage || 0,
      projection: cost.projection || 0,
      status: cost.status || 'good'
    };
  }

  private async getLastSuccess(apiName: string): Promise<string> {
    const { data: lastSuccess } = await supabase
      .from('api_health_history')
      .select('check_time')
      .eq('api_name', apiName)
      .eq('status', 'healthy')
      .order('check_time', { ascending: false })
      .limit(1)
      .single();

    return lastSuccess?.check_time || 'Never';
  }

  private async storeHealthCheck(apiName: string, result: APIStatus) {
    // Store in api_status table
    await supabase
      .from('api_status')
      .upsert({
        api_name: apiName,
        status: result.status,
        uptime: result.uptime,
        response_time: result.response_time,
        error_message: result.error,
        last_success: result.status === 'healthy' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      });

    // Store in history table
    await supabase
      .from('api_health_history')
      .insert({
        api_name: apiName,
        check_time: new Date().toISOString(),
        status: result.status,
        response_time: result.response_time,
        uptime: result.uptime,
        error_message: result.error,
        metadata: {
          usage: result.usage,
          cost: result.cost
        }
      });
  }

  async updateAPIUsage(apiName: string, calls: number, successful: boolean = true) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from('api_usage')
      .select('*')
      .eq('api_name', apiName)
      .eq('date', today)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('api_usage')
        .update({
          calls: existing.calls + calls,
          successful_calls: successful ? existing.successful_calls + calls : existing.successful_calls,
          failed_calls: successful ? existing.failed_calls : existing.failed_calls + calls,
          percentage: ((existing.calls + calls) / existing.usage_limit) * 100,
          total_cost: existing.total_cost + (calls * existing.cost_per_call),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      const { data: config } = await supabase
        .from('api_config')
        .select('*')
        .eq('api_name', apiName)
        .single();

      await supabase
        .from('api_usage')
        .insert({
          api_name: apiName,
          date: today,
          calls: calls,
          successful_calls: successful ? calls : 0,
          failed_calls: successful ? 0 : calls,
          percentage: (calls / 1000) * 100, // Default limit
          usage_limit: 1000,
          cost_per_call: this.getCostPerCall(apiName),
          total_cost: calls * this.getCostPerCall(apiName)
        });
    }
  }

  private getCostPerCall(apiName: string): number {
    const costs: Record<string, number> = {
      'SendGrid': 0.001, // ~0.1 öre per email
      'Mailgun': 0.0008,
      'Twilio': 0.75, // ~75 öre per SMS
      'Google Maps': 0.005, // ~0.5 öre per geocoding request
      'SMHI Weather': 0, // Free
      'Fortnox': 0.01, // ~1 öre per API call
      'OpenAI Pricing Expert': 0.30, // ~30 öre per request
      'OpenAI Logistics Expert': 0.25,
      'OpenAI Customer Service Expert': 0.20,
      'OpenAI Business Intelligence Expert': 0.25,
      'Google Cloud ML': 0.15,
      'Hemnet Scraping': 0.02
    };

    return costs[apiName] || 0.01;
  }

  async getAPIMetrics(apiName: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: metrics } = await supabase
      .from('api_health_history')
      .select('*')
      .eq('api_name', apiName)
      .gte('check_time', startDate.toISOString())
      .order('check_time', { ascending: true });

    if (!metrics || metrics.length === 0) {
      return {
        uptime: 0,
        averageResponseTime: 0,
        totalCalls: 0,
        successRate: 0,
        incidents: 0
      };
    }

    const healthyChecks = metrics.filter(m => m.status === 'healthy').length;
    const totalChecks = metrics.length;
    const uptime = (healthyChecks / totalChecks) * 100;

    const averageResponseTime = metrics.reduce((sum, m) => sum + (m.response_time || 0), 0) / metrics.length;
    const incidents = metrics.filter(m => m.status === 'failed').length;

    return {
      uptime: uptime,
      averageResponseTime: averageResponseTime,
      totalCalls: metrics.length,
      successRate: uptime,
      incidents: incidents,
      trend: this.calculateTrend(metrics)
    };
  }

  private calculateTrend(metrics: any[]): 'up' | 'down' | 'stable' {
    if (metrics.length < 2) return 'stable';

    const recent = metrics.slice(-Math.floor(metrics.length / 3));
    const older = metrics.slice(0, Math.floor(metrics.length / 3));

    const recentUptime = recent.filter(m => m.status === 'healthy').length / recent.length;
    const olderUptime = older.filter(m => m.status === 'healthy').length / older.length;

    if (recentUptime > olderUptime + 0.05) return 'up';
    if (recentUptime < olderUptime - 0.05) return 'down';
    return 'stable';
  }
}

class AlertSystem {
  async checkAlerts(apiResults: Record<string, APIStatus>) {
    for (const [apiName, result] of Object.entries(apiResults)) {
      await this.checkAPIAlerts(apiName, result);
    }
  }

  private async checkAPIAlerts(apiName: string, result: APIStatus) {
    const { data: config } = await supabase
      .from('api_config')
      .select('*')
      .eq('api_name', apiName)
      .single();

    if (!config) return;

    const alerts = [];

    // Check for API failures
    if (result.status === 'failed') {
      alerts.push({
        level: config.critical ? 'critical' : 'warning',
        message: `${apiName} API is down`,
        impact: this.getAPIImpact(apiName),
        recommended_action: 'Check API credentials and endpoint status',
        alert_type: 'failure',
        current_value: 0,
        threshold_value: 100
      });
    }

    // Check usage thresholds
    if (result.usage.percentage > config.usage_threshold) {
      alerts.push({
        level: 'warning',
        message: `${apiName} usage at ${result.usage.percentage}%`,
        impact: 'API may hit rate limits',
        recommended_action: 'Consider upgrading plan or optimizing usage',
        alert_type: 'usage_threshold',
        current_value: result.usage.percentage,
        threshold_value: config.usage_threshold
      });
    }

    // Check cost thresholds
    if (result.cost.percentage > config.cost_threshold) {
      alerts.push({
        level: 'warning',
        message: `${apiName} cost at ${result.cost.percentage}% of budget`,
        impact: 'API may be disabled when budget exceeded',
        recommended_action: 'Top up account or reduce usage',
        alert_type: 'cost_threshold',
        current_value: result.cost.percentage,
        threshold_value: config.cost_threshold
      });
    }

    // Check response time
    if (result.response_time > config.response_time_threshold) {
      alerts.push({
        level: 'warning',
        message: `${apiName} response time ${result.response_time}ms`,
        impact: 'Slow system performance',
        recommended_action: 'Check API performance or switch to backup',
        alert_type: 'response_time',
        current_value: result.response_time,
        threshold_value: config.response_time_threshold
      });
    }

    // Save alerts to database
    for (const alert of alerts) {
      await this.saveAlert(apiName, alert);
    }

    // Send notifications if needed
    if (alerts.length > 0) {
      await this.sendNotifications(apiName, alerts);
    }
  }

  private async saveAlert(apiName: string, alert: any) {
    // Check if similar alert already exists and is unresolved
    const { data: existing } = await supabase
      .from('api_alerts')
      .select('*')
      .eq('api_name', apiName)
      .eq('alert_type', alert.alert_type)
      .eq('resolved', false)
      .single();

    if (existing) {
      // Update existing alert
      await supabase
        .from('api_alerts')
        .update({
          message: alert.message,
          current_value: alert.current_value,
          created_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new alert
      await supabase
        .from('api_alerts')
        .insert({
          api_name: apiName,
          level: alert.level,
          message: alert.message,
          impact: alert.impact,
          recommended_action: alert.recommended_action,
          alert_type: alert.alert_type,
          threshold_value: alert.threshold_value,
          current_value: alert.current_value
        });
    }
  }

  private async sendNotifications(apiName: string, alerts: any[]) {
    const criticalAlerts = alerts.filter(a => a.level === 'critical');
    const warningAlerts = alerts.filter(a => a.level === 'warning');

    // Critical alerts - SMS + Email
    if (criticalAlerts.length > 0) {
      await this.sendSMSAlert(apiName, criticalAlerts);
      await this.sendEmailAlert(apiName, criticalAlerts);
    }

    // Warning alerts - Email only
    if (warningAlerts.length > 0) {
      await this.sendEmailAlert(apiName, warningAlerts);
    }
  }

  private async sendSMSAlert(apiName: string, alerts: any[]) {
    // Implementation for SMS alerts via Twilio
    console.log(`SMS Alert: ${apiName} - ${alerts.length} critical alerts`);
  }

  private async sendEmailAlert(apiName: string, alerts: any[]) {
    // Implementation for email alerts via SendGrid
    console.log(`Email Alert: ${apiName} - ${alerts.length} alerts`);
  }

  private getAPIImpact(apiName: string): string {
    const impacts: Record<string, string> = {
      'SendGrid': 'Email notifications will fail',
      'Mailgun': 'Backup email system affected',
      'Twilio': 'SMS notifications will fail',
      'Google Maps': 'Route optimization disabled',
      'SMHI Weather': 'Weather-based planning unavailable',
      'Fortnox': 'Accounting integration broken',
      'OpenAI Pricing Expert': 'Automatic pricing disabled',
      'OpenAI Logistics Expert': 'Route optimization intelligence lost',
      'OpenAI Customer Service Expert': 'AI customer service unavailable',
      'OpenAI Business Intelligence Expert': 'Business analytics disabled',
      'Google Cloud ML': 'Advanced analytics unavailable',
      'Hemnet Scraping': 'Market intelligence updates stopped'
    };

    return impacts[apiName] || 'System functionality affected';
  }
}