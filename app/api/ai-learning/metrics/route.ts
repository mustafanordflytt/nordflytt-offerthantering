import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      // Return mock data if Supabase not configured
      return NextResponse.json({
        metrics: [
          {
            module: 'pricing',
            type: 'accuracy',
            values: [
              { value: 92.5, date: new Date().toISOString().split('T')[0], improvement: 8.8 }
            ],
            average: 92.5,
            improvement: 8.8,
            trend: 'improving'
          },
          {
            module: 'routing',
            type: 'efficiency',
            values: [
              { value: 87.3, date: new Date().toISOString().split('T')[0], improvement: 12.1 }
            ],
            average: 87.3,
            improvement: 12.1,
            trend: 'improving'
          }
        ],
        period_days: 30,
        last_updated: new Date().toISOString()
      });
    }

    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module');
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let query = supabase
      .from('ai_learning_metrics')
      .select('*')
      .gte('measurement_date', startDate.toISOString().split('T')[0])
      .order('measurement_date', { ascending: false });
    
    if (module) {
      query = query.eq('module', module);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching AI learning metrics:', error);
      throw error;
    }
    
    // Group metrics by type and calculate aggregates
    const groupedMetrics = (data || []).reduce((acc: any, metric: any) => {
      const key = `${metric.module}_${metric.metric_type}`;
      if (!acc[key]) {
        acc[key] = {
          module: metric.module,
          type: metric.metric_type,
          values: [],
          average: 0,
          improvement: 0,
          trend: 'stable'
        };
      }
      acc[key].values.push({
        value: metric.value,
        date: metric.measurement_date,
        improvement: metric.improvement_percentage
      });
      return acc;
    }, {});
    
    // Calculate aggregates
    Object.keys(groupedMetrics).forEach(key => {
      const metric = groupedMetrics[key];
      metric.average = metric.values.reduce((sum: number, v: any) => sum + (v.value || 0), 0) / metric.values.length;
      metric.improvement = metric.values.reduce((sum: number, v: any) => sum + (v.improvement || 0), 0) / metric.values.length;
      
      // Determine trend
      if (metric.values.length >= 2) {
        const recent = metric.values.slice(0, Math.floor(metric.values.length / 2));
        const older = metric.values.slice(Math.floor(metric.values.length / 2));
        const recentAvg = recent.reduce((sum: number, v: any) => sum + (v.value || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum: number, v: any) => sum + (v.value || 0), 0) / older.length;
        
        if (recentAvg > olderAvg * 1.05) metric.trend = 'improving';
        else if (recentAvg < olderAvg * 0.95) metric.trend = 'declining';
        else metric.trend = 'stable';
      }
    });
    
    return NextResponse.json({
      metrics: Object.values(groupedMetrics),
      period_days: days,
      last_updated: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('AI learning metrics error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch AI learning metrics',
      metrics: [],
      period_days: 30,
      last_updated: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({
        id: 'mock-' + Date.now(),
        status: 'recorded',
        message: 'Mock metric recorded'
      });
    }

    const { metric_type, module, value, baseline_value, metadata } = await request.json();
    
    const improvement_percentage = baseline_value 
      ? ((value - baseline_value) / baseline_value) * 100 
      : 0;
    
    const { data, error } = await supabase
      .from('ai_learning_metrics')
      .insert([{
        metric_type,
        module,
        value,
        improvement_percentage,
        baseline_value,
        metadata
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error recording AI learning metric:', error);
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('AI learning metric recording error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to record AI learning metric' 
    }, { status: 500 });
  }
}