import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch all assets with their categories
    const { data: assets, error } = await supabase
      .from('company_assets')
      .select('*, asset_categories(*)')
      .eq('status', 'active');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate total value and category breakdown
    let totalValue = 0;
    const categoryBreakdown: Record<string, number> = {};
    
    assets?.forEach(asset => {
      const value = asset.current_quantity * asset.cost_per_unit;
      totalValue += value;
      
      const categoryName = asset.asset_categories?.category_name || 'Uncategorized';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = 0;
      }
      categoryBreakdown[categoryName] += value;
    });

    return NextResponse.json({
      total_value: totalValue,
      category_breakdown: categoryBreakdown,
      asset_count: assets?.length || 0,
      valuation_date: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate inventory valuation' },
      { status: 500 }
    );
  }
}