import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiName = searchParams.get('api');
    const days = parseInt(searchParams.get('days') || '30');
    
    // Get usage data for the specified period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    let query = supabase
      .from('api_usage')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (apiName) {
      query = query.eq('api_name', apiName);
    }
    
    const { data: usage, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Calculate summary metrics
    const totalCalls = usage?.reduce((sum, record) => sum + record.calls, 0) || 0;
    const totalSuccessful = usage?.reduce((sum, record) => sum + record.successful_calls, 0) || 0;
    const totalFailed = usage?.reduce((sum, record) => sum + record.failed_calls, 0) || 0;
    const totalCost = usage?.reduce((sum, record) => sum + record.total_cost, 0) || 0;
    
    const summary = {
      totalCalls,
      totalSuccessful,
      totalFailed,
      successRate: totalCalls > 0 ? (totalSuccessful / totalCalls) * 100 : 0,
      totalCost,
      period: `${days} days`
    };
    
    return NextResponse.json({
      success: true,
      data: {
        usage: usage || [],
        summary
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Usage data fetch failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch usage data'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { apiName, date, calls, successful, failed, cost } = await request.json();
    
    // Check if record exists for this API and date
    const { data: existing } = await supabase
      .from('api_usage')
      .select('*')
      .eq('api_name', apiName)
      .eq('date', date)
      .single();
    
    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('api_usage')
        .update({
          calls: existing.calls + calls,
          successful_calls: existing.successful_calls + successful,
          failed_calls: existing.failed_calls + failed,
          total_cost: existing.total_cost + cost,
          percentage: ((existing.calls + calls) / existing.usage_limit) * 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('api_usage')
        .insert({
          api_name: apiName,
          date: date,
          calls: calls,
          successful_calls: successful,
          failed_calls: failed,
          total_cost: cost,
          percentage: (calls / 1000) * 100, // Default limit
          usage_limit: 1000
        });
      
      if (error) throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Usage data updated successfully'
    });
  } catch (error) {
    console.error('Usage data update failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update usage data'
    }, { status: 500 });
  }
}