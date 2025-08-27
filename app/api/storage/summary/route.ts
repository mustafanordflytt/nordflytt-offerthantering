import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch active storage units
    const { data: activeUnits, error: unitsError } = await supabase
      .from('customer_storage')
      .select('*')
      .eq('status', 'active');

    if (unitsError) {
      return NextResponse.json({ error: unitsError.message }, { status: 500 });
    }

    // Calculate revenue
    const monthlyRevenue = activeUnits?.reduce((sum, unit) => sum + unit.monthly_rate, 0) || 0;
    const annualProjection = monthlyRevenue * 12;
    
    // Get new units this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUnitsThisMonth = activeUnits?.filter(unit => 
      new Date(unit.created_at) >= startOfMonth
    ).length || 0;

    return NextResponse.json({
      active_units: activeUnits?.length || 0,
      monthly_revenue: monthlyRevenue,
      annual_projection: annualProjection,
      average_per_customer: activeUnits?.length ? Math.round(monthlyRevenue / activeUnits.length) : 0,
      new_units_this_month: newUnitsThisMonth,
      growth_percentage: 12 // Mock growth percentage
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch storage summary' },
      { status: 500 }
    );
  }
}