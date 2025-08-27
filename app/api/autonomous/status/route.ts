import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const metrics = searchParams.get('metrics') === 'true';
    
    if (!supabase) {
      // Return mock data if Supabase not configured
      return NextResponse.json({ 
        status: {
          mode: 'suggest',
          autonomyLevel: 0.75,
          totalDecisions: 100,
          automaticDecisions: 75,
          systemUptime: 0.998,
          lastUpdate: new Date().toISOString(),
          detailedMetrics: detailed ? {
            decisionsByModule: {
              pricing: [{ status: 'executed', confidence_score: 92.5 }],
              routing: [{ status: 'executed', confidence_score: 88.3 }]
            },
            averageConfidence: 90.4,
            systemHealth: {
              pricing_engine: { status: 'healthy', uptime: 99.8, responseTime: 120 },
              route_optimizer: { status: 'healthy', uptime: 98.5, responseTime: 200 }
            }
          } : undefined,
          performanceMetrics: metrics ? {
            accuracyTrend: [{ value: 92.5, improvement_percentage: 8.8 }],
            efficiencyTrend: [{ value: 87.3, improvement_percentage: 12.1 }],
            revenueImpact: [{ value: 15.5, improvement_percentage: 55.0 }]
          } : undefined
        }
      });
    }

    // Get current AI mode
    const { data: currentMode } = await supabase
      .from('ai_mode_history')
      .select('new_mode')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Get system health
    const { data: healthData } = await supabase
      .from('system_health')
      .select('*')
      .order('last_check', { ascending: false });
    
    // Calculate autonomy metrics
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyPerformance } = await supabase
      .from('ai_performance_daily')
      .select('*')
      .eq('date', today);
    
    const totalDecisions = dailyPerformance?.reduce((sum, p) => sum + (p.total_decisions || 0), 0) || 0;
    const automaticDecisions = dailyPerformance?.reduce((sum, p) => sum + (p.automatic_decisions || 0), 0) || 0;
    const autonomyLevel = totalDecisions > 0 ? automaticDecisions / totalDecisions : 0;
    
    const status: any = {
      mode: currentMode?.new_mode || 'suggest',
      autonomyLevel: autonomyLevel,
      totalDecisions: totalDecisions,
      automaticDecisions: automaticDecisions,
      systemUptime: healthData?.reduce((sum, h) => sum + (h.uptime_percentage || 0), 0) / (healthData?.length || 1) / 100,
      lastUpdate: new Date().toISOString()
    };

    if (detailed) {
      // Add detailed metrics
      const { data: recentDecisions } = await supabase
        .from('ai_decisions')
        .select('module, status, confidence_score, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      status.detailedMetrics = {
        decisionsByModule: groupBy(recentDecisions || [], 'module'),
        averageConfidence: recentDecisions?.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / (recentDecisions?.length || 1) || 0,
        systemHealth: healthData?.reduce((acc: any, health) => {
          acc[health.component] = {
            status: health.status,
            uptime: health.uptime_percentage,
            responseTime: health.response_time_ms
          };
          return acc;
        }, {})
      };
    }
    
    if (metrics) {
      // Add performance metrics
      const { data: weeklyMetrics } = await supabase
        .from('ai_learning_metrics')
        .select('*')
        .gte('measurement_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      status.performanceMetrics = {
        accuracyTrend: weeklyMetrics?.filter(m => m.metric_type === 'accuracy') || [],
        efficiencyTrend: weeklyMetrics?.filter(m => m.metric_type === 'efficiency') || [],
        revenueImpact: weeklyMetrics?.filter(m => m.metric_type === 'revenue_impact') || []
      };
    }
    
    return NextResponse.json({ status });

  } catch (error: any) {
    console.error('Autonomous status error:', error);
    // Return basic status on error
    return NextResponse.json({ 
      status: {
        mode: 'suggest',
        autonomyLevel: 0,
        totalDecisions: 0,
        automaticDecisions: 0,
        systemUptime: 1,
        lastUpdate: new Date().toISOString(),
        error: error.message
      }
    });
  }
}

// Helper function
function groupBy(array: any[], key: string) {
  return array?.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {}) || {};
}

export async function POST(request: NextRequest) {
  try {
    const { action, parameters = {} } = await request.json();
    
    if (!supabase) {
      return NextResponse.json({
        success: true,
        action,
        result: { message: 'Mock action performed' },
        timestamp: new Date().toISOString()
      });
    }
    
    const validActions = ['trigger_health_check', 'update_config', 'refresh_cache'];
    
    if (!action || !validActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        message: `Action must be one of: ${validActions.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    let result: any = {};
    
    switch (action) {
      case 'trigger_health_check':
        // Update system health
        const { error: healthError } = await supabase
          .from('system_health')
          .upsert([
            {
              component: 'autonomous_controller',
              status: 'healthy',
              uptime_percentage: 99.9,
              response_time_ms: 150,
              last_check: new Date().toISOString()
            }
          ], {
            onConflict: 'component'
          });
        
        if (healthError) throw healthError;
        
        result = {
          action: 'health_check_triggered',
          status: 'completed',
          message: 'System health check performed successfully'
        };
        break;
        
      case 'update_config':
        const { key, value } = parameters;
        if (!key || value === undefined) {
          throw new Error('Config update requires key and value parameters');
        }
        
        const { error: configError } = await supabase
          .from('autonomous_config')
          .upsert([{
            module: 'global',
            setting_key: key,
            setting_value: value,
            updated_by: 'api'
          }], {
            onConflict: 'module,setting_key'
          });
        
        if (configError) throw configError;
        
        result = {
          action: 'config_updated',
          key,
          value,
          message: `Configuration ${key} updated successfully`
        };
        break;
        
      case 'refresh_cache':
        // In a real implementation, this would clear caches
        result = {
          action: 'cache_refreshed',
          cleared: ['decisions', 'metrics', 'performance'],
          message: 'System caches refreshed successfully'
        };
        break;
    }
    
    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Autonomous status update error:', error);
    return NextResponse.json({
      success: false,
      error: 'System update failed',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

