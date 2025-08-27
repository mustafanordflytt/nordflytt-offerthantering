import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { APIHealthMonitor } from '@/lib/api-management/APIHealthMonitor';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiName = searchParams.get('api');
    const days = parseInt(searchParams.get('days') || '30');
    
    if (apiName) {
      // Get metrics for specific API
      const monitor = new APIHealthMonitor();
      const metrics = await monitor.getAPIMetrics(apiName, days);
      
      return NextResponse.json({
        success: true,
        data: {
          api: apiName,
          metrics,
          period: `${days} days`
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Get health data for all APIs
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const { data: healthHistory, error } = await supabase
        .from('api_health_history')
        .select('*')
        .gte('check_time', startDate.toISOString())
        .order('check_time', { ascending: true });
      
      if (error) throw error;
      
      // Group by API and calculate metrics
      const apiMetrics = healthHistory?.reduce((acc, record) => {
        if (!acc[record.api_name]) {
          acc[record.api_name] = {
            checks: [],
            uptime: 0,
            averageResponseTime: 0,
            incidents: 0
          };
        }
        
        acc[record.api_name].checks.push(record);
        
        return acc;
      }, {} as Record<string, any>) || {};
      
      // Calculate metrics for each API
      Object.keys(apiMetrics).forEach(api => {
        const checks = apiMetrics[api].checks;
        const healthyChecks = checks.filter((c: any) => c.status === 'healthy').length;
        const totalChecks = checks.length;
        
        apiMetrics[api].uptime = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;
        apiMetrics[api].averageResponseTime = checks.reduce((sum: number, c: any) => sum + (c.response_time || 0), 0) / totalChecks;
        apiMetrics[api].incidents = checks.filter((c: any) => c.status === 'failed').length;
        apiMetrics[api].totalChecks = totalChecks;
      });
      
      // Overall system health
      const totalChecks = healthHistory?.length || 0;
      const healthyChecks = healthHistory?.filter(h => h.status === 'healthy').length || 0;
      const systemUptime = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;
      
      const summary = {
        systemUptime,
        totalChecks,
        healthyChecks,
        totalIncidents: healthHistory?.filter(h => h.status === 'failed').length || 0,
        period: `${days} days`
      };
      
      return NextResponse.json({
        success: true,
        data: {
          apiMetrics,
          summary
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Health data fetch failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch health data'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { apiName, status, responseTime, uptime, errorMessage, metadata } = await request.json();
    
    // Store health check record
    const { error } = await supabase
      .from('api_health_history')
      .insert({
        api_name: apiName,
        check_time: new Date().toISOString(),
        status: status,
        response_time: responseTime,
        uptime: uptime,
        error_message: errorMessage,
        metadata: metadata
      });
    
    if (error) throw error;
    
    // Update current status
    await supabase
      .from('api_status')
      .upsert({
        api_name: apiName,
        status: status,
        uptime: uptime,
        response_time: responseTime,
        error_message: errorMessage,
        last_success: status === 'healthy' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      success: true,
      message: 'Health check recorded successfully'
    });
  } catch (error) {
    console.error('Health check recording failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to record health check'
    }, { status: 500 });
  }
}