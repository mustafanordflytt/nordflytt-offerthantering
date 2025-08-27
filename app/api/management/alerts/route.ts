import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved') === 'true';
    const level = searchParams.get('level'); // 'critical', 'warning', 'info'
    const apiName = searchParams.get('api');
    
    let query = supabase
      .from('api_alerts')
      .select('*')
      .eq('resolved', resolved)
      .order('created_at', { ascending: false });
    
    if (level) {
      query = query.eq('level', level);
    }
    
    if (apiName) {
      query = query.eq('api_name', apiName);
    }
    
    const { data: alerts, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Calculate summary metrics
    const totalAlerts = alerts?.length || 0;
    const criticalAlerts = alerts?.filter(a => a.level === 'critical').length || 0;
    const warningAlerts = alerts?.filter(a => a.level === 'warning').length || 0;
    const infoAlerts = alerts?.filter(a => a.level === 'info').length || 0;
    
    // Group alerts by API
    const alertsByAPI = alerts?.reduce((acc, alert) => {
      if (!acc[alert.api_name]) {
        acc[alert.api_name] = [];
      }
      acc[alert.api_name].push(alert);
      return acc;
    }, {} as Record<string, any[]>) || {};
    
    const summary = {
      totalAlerts,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      alertsByAPI: Object.keys(alertsByAPI).map(api => ({
        api,
        count: alertsByAPI[api].length,
        critical: alertsByAPI[api].filter(a => a.level === 'critical').length,
        warning: alertsByAPI[api].filter(a => a.level === 'warning').length,
        info: alertsByAPI[api].filter(a => a.level === 'info').length
      }))
    };
    
    return NextResponse.json({
      success: true,
      data: {
        alerts: alerts || [],
        summary
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Alerts fetch failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch alerts'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { apiName, level, message, impact, recommendedAction, alertType, thresholdValue, currentValue } = await request.json();
    
    // Check if similar alert already exists and is unresolved
    const { data: existing } = await supabase
      .from('api_alerts')
      .select('*')
      .eq('api_name', apiName)
      .eq('alert_type', alertType)
      .eq('resolved', false)
      .single();
    
    if (existing) {
      // Update existing alert
      const { error } = await supabase
        .from('api_alerts')
        .update({
          message: message,
          current_value: currentValue,
          created_at: new Date().toISOString() // Update timestamp
        })
        .eq('id', existing.id);
      
      if (error) throw error;
      
      return NextResponse.json({
        success: true,
        message: 'Alert updated successfully',
        alertId: existing.id
      });
    } else {
      // Create new alert
      const { data: newAlert, error } = await supabase
        .from('api_alerts')
        .insert({
          api_name: apiName,
          level: level,
          message: message,
          impact: impact,
          recommended_action: recommendedAction,
          alert_type: alertType,
          threshold_value: thresholdValue,
          current_value: currentValue
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return NextResponse.json({
        success: true,
        message: 'Alert created successfully',
        alertId: newAlert.id
      });
    }
  } catch (error) {
    console.error('Alert creation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create alert'
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { alertId, resolved, resolvedBy } = await request.json();
    
    const { error } = await supabase
      .from('api_alerts')
      .update({
        resolved: resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolved_by: resolvedBy || null
      })
      .eq('id', alertId);
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: resolved ? 'Alert resolved successfully' : 'Alert reopened successfully'
    });
  } catch (error) {
    console.error('Alert update failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update alert'
    }, { status: 500 });
  }
}