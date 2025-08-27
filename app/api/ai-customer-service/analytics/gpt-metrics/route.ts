import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // Calculate time filter
    let hoursAgo = 24;
    switch(timeRange) {
      case '1h': hoursAgo = 1; break;
      case '24h': hoursAgo = 24; break;
      case '7d': hoursAgo = 168; break;
      case '30d': hoursAgo = 720; break;
    }
    
    const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    
    if (!supabase) {
      // Return mock data if no database
      return NextResponse.json({
        summary: {
          total_calls: 156,
          successful_calls: 152,
          failed_calls: 4,
          success_rate: 97.4,
          avg_response_time: 287,
          unique_customers: 43
        },
        endpoints: [
          {
            endpoint: '/customer-lookup',
            calls: 72,
            success_rate: 98.6,
            avg_response_time: 245
          },
          {
            endpoint: '/booking-details',
            calls: 34,
            success_rate: 100,
            avg_response_time: 312
          },
          {
            endpoint: '/create-ticket',
            calls: 28,
            success_rate: 92.9,
            avg_response_time: 298
          },
          {
            endpoint: '/calculate-price',
            calls: 22,
            success_rate: 95.5,
            avg_response_time: 324
          }
        ],
        hourly_stats: generateHourlyStats(hoursAgo),
        recent_errors: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            endpoint: '/create-ticket',
            error: 'Database connection timeout',
            customer_email: 'test@example.com'
          }
        ],
        top_customers: [
          {
            email: 'anna.svensson@gmail.com',
            calls: 12,
            last_interaction: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          },
          {
            email: 'erik.larsson@hotmail.com',
            calls: 8,
            last_interaction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ]
      });
    }
    
    // Fetch real data from database
    const [analyticsResult, errorsResult, customersResult] = await Promise.all([
      // Overall analytics
      supabase
        .from('gpt_analytics')
        .select('*')
        .gte('timestamp', startTime),
      
      // Recent errors
      supabase
        .from('gpt_analytics')
        .select('*')
        .eq('success', false)
        .gte('timestamp', startTime)
        .order('timestamp', { ascending: false })
        .limit(10),
      
      // Top customers
      supabase
        .from('gpt_analytics')
        .select('customer_email, timestamp')
        .not('customer_email', 'is', null)
        .gte('timestamp', startTime)
    ]);
    
    const analytics = analyticsResult.data || [];
    const errors = errorsResult.data || [];
    const customerInteractions = customersResult.data || [];
    
    // Calculate summary statistics
    const totalCalls = analytics.length;
    const successfulCalls = analytics.filter(a => a.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const avgResponseTime = analytics.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / totalCalls || 0;
    
    // Group by endpoint
    const endpointStats = analytics.reduce((acc: any, call) => {
      const endpoint = call.endpoint.replace('/gpt-rag', '');
      if (!acc[endpoint]) {
        acc[endpoint] = { calls: 0, successful: 0, totalTime: 0 };
      }
      acc[endpoint].calls++;
      if (call.success) acc[endpoint].successful++;
      acc[endpoint].totalTime += call.response_time_ms || 0;
      return acc;
    }, {});
    
    // Group by customer
    const customerStats = customerInteractions.reduce((acc: any, interaction) => {
      if (!acc[interaction.customer_email]) {
        acc[interaction.customer_email] = { calls: 0, lastInteraction: interaction.timestamp };
      }
      acc[interaction.customer_email].calls++;
      if (new Date(interaction.timestamp) > new Date(acc[interaction.customer_email].lastInteraction)) {
        acc[interaction.customer_email].lastInteraction = interaction.timestamp;
      }
      return acc;
    }, {});
    
    // Format response
    return NextResponse.json({
      summary: {
        total_calls: totalCalls,
        successful_calls: successfulCalls,
        failed_calls: failedCalls,
        success_rate: totalCalls > 0 ? (successfulCalls / totalCalls * 100).toFixed(1) : 0,
        avg_response_time: Math.round(avgResponseTime),
        unique_customers: Object.keys(customerStats).length
      },
      endpoints: Object.entries(endpointStats).map(([endpoint, stats]: any) => ({
        endpoint,
        calls: stats.calls,
        success_rate: stats.calls > 0 ? (stats.successful / stats.calls * 100).toFixed(1) : 0,
        avg_response_time: Math.round(stats.totalTime / stats.calls)
      })),
      hourly_stats: generateHourlyStatsFromData(analytics, hoursAgo),
      recent_errors: errors.map(e => ({
        timestamp: e.timestamp,
        endpoint: e.endpoint.replace('/gpt-rag', ''),
        error: e.error_message || 'Unknown error',
        customer_email: e.customer_email
      })),
      top_customers: Object.entries(customerStats)
        .sort((a: any, b: any) => b[1].calls - a[1].calls)
        .slice(0, 10)
        .map(([email, stats]: any) => ({
          email,
          calls: stats.calls,
          last_interaction: stats.lastInteraction
        }))
    });
    
  } catch (error: any) {
    console.error('GPT metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GPT metrics' },
      { status: 500 }
    );
  }
}

function generateHourlyStats(hours: number) {
  const stats = [];
  const now = new Date();
  
  for (let i = hours - 1; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    stats.push({
      hour: hour.toISOString(),
      calls: Math.floor(Math.random() * 10) + 5,
      success_rate: 95 + Math.random() * 5
    });
  }
  
  return stats;
}

function generateHourlyStatsFromData(analytics: any[], hours: number) {
  const stats: any = {};
  const now = new Date();
  
  // Initialize all hours
  for (let i = hours - 1; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourKey = hour.toISOString().substring(0, 13);
    stats[hourKey] = { calls: 0, successful: 0 };
  }
  
  // Count calls per hour
  analytics.forEach(call => {
    const hourKey = call.timestamp.substring(0, 13);
    if (stats[hourKey]) {
      stats[hourKey].calls++;
      if (call.success) stats[hourKey].successful++;
    }
  });
  
  // Format response
  return Object.entries(stats).map(([hour, data]: any) => ({
    hour: hour + ':00:00.000Z',
    calls: data.calls,
    success_rate: data.calls > 0 ? (data.successful / data.calls * 100).toFixed(1) : 0
  }));
}