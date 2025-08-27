import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled') === 'true';
    const apiType = searchParams.get('type'); // 'email', 'sms', 'maps', 'ai', etc.
    
    let query = supabase
      .from('api_config')
      .select('*')
      .order('api_name', { ascending: true });
    
    if (enabled) {
      query = query.eq('enabled', true);
    }
    
    if (apiType) {
      query = query.eq('api_type', apiType);
    }
    
    const { data: configs, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Group configs by type
    const configsByType = configs?.reduce((acc, config) => {
      if (!acc[config.api_type]) {
        acc[config.api_type] = [];
      }
      acc[config.api_type].push(config);
      return acc;
    }, {} as Record<string, any[]>) || {};
    
    const summary = {
      totalAPIs: configs?.length || 0,
      enabledAPIs: configs?.filter(c => c.enabled).length || 0,
      criticalAPIs: configs?.filter(c => c.critical).length || 0,
      configsByType: Object.keys(configsByType).map(type => ({
        type,
        count: configsByType[type].length,
        enabled: configsByType[type].filter(c => c.enabled).length,
        critical: configsByType[type].filter(c => c.critical).length
      }))
    };
    
    return NextResponse.json({
      success: true,
      data: {
        configs: configs || [],
        summary
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Config fetch failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch API configurations'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const config = await request.json();
    
    const { data: newConfig, error } = await supabase
      .from('api_config')
      .insert({
        api_name: config.apiName,
        display_name: config.displayName,
        endpoint: config.endpoint,
        auth_type: config.authType,
        api_type: config.apiType,
        usage_threshold: config.usageThreshold || 80,
        cost_threshold: config.costThreshold || 500,
        response_time_threshold: config.responseTimeThreshold || 5000,
        uptime_threshold: config.uptimeThreshold || 95,
        enabled: config.enabled || true,
        critical: config.critical || false,
        backup_api: config.backupApi,
        documentation_url: config.documentationUrl,
        support_contact: config.supportContact
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: 'API configuration created successfully',
      data: newConfig
    });
  } catch (error) {
    console.error('Config creation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create API configuration'
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { configId, updates } = await request.json();
    
    const { error } = await supabase
      .from('api_config')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId);
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: 'API configuration updated successfully'
    });
  } catch (error) {
    console.error('Config update failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update API configuration'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('id');
    
    if (!configId) {
      return NextResponse.json({
        success: false,
        error: 'Configuration ID is required'
      }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('api_config')
      .delete()
      .eq('id', configId);
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: 'API configuration deleted successfully'
    });
  } catch (error) {
    console.error('Config deletion failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete API configuration'
    }, { status: 500 });
  }
}