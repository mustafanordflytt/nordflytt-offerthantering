import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiName = searchParams.get('api');
    const months = parseInt(searchParams.get('months') || '12');
    
    // Get cost data for the specified period
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    let query = supabase
      .from('api_costs')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(months);
    
    if (apiName) {
      query = query.eq('api_name', apiName);
    }
    
    const { data: costs, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Calculate summary metrics
    const totalCost = costs?.reduce((sum, record) => sum + record.current_cost, 0) || 0;
    const totalBudget = costs?.reduce((sum, record) => sum + record.budget, 0) || 0;
    const totalProjection = costs?.reduce((sum, record) => sum + record.projection, 0) || 0;
    
    // Get current month data
    const currentMonthData = costs?.find(c => c.month === currentMonth && c.year === currentYear);
    
    const summary = {
      totalCost,
      totalBudget,
      totalProjection,
      budgetUtilization: totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0,
      currentMonth: {
        cost: currentMonthData?.current_cost || 0,
        budget: currentMonthData?.budget || 0,
        projection: currentMonthData?.projection || 0,
        status: currentMonthData?.status || 'good'
      },
      period: `${months} months`
    };
    
    return NextResponse.json({
      success: true,
      data: {
        costs: costs || [],
        summary
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cost data fetch failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cost data'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { apiName, month, year, cost, budget } = await request.json();
    
    // Check if record exists for this API, month, and year
    const { data: existing } = await supabase
      .from('api_costs')
      .select('*')
      .eq('api_name', apiName)
      .eq('month', month)
      .eq('year', year)
      .single();
    
    const percentage = budget > 0 ? (cost / budget) * 100 : 0;
    const status = percentage > 90 ? 'danger' : percentage > 75 ? 'warning' : 'good';
    
    // Calculate projection based on current usage and days passed in month
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = new Date().getDate();
    const projection = month === new Date().getMonth() + 1 && year === new Date().getFullYear()
      ? (cost / currentDay) * daysInMonth
      : cost;
    
    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('api_costs')
        .update({
          current_cost: cost,
          budget: budget,
          percentage: percentage,
          projection: projection,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('api_costs')
        .insert({
          api_name: apiName,
          month: month,
          year: year,
          current_cost: cost,
          budget: budget,
          percentage: percentage,
          projection: projection,
          status: status
        });
      
      if (error) throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cost data updated successfully'
    });
  } catch (error) {
    console.error('Cost data update failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update cost data'
    }, { status: 500 });
  }
}