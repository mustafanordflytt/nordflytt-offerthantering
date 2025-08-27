import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch assets that are at or below minimum stock level
    const { data: assets, error } = await supabase
      .from('company_assets')
      .select(`
        *,
        asset_categories (*),
        reorder_automation (*)
      `)
      .eq('status', 'active');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter low stock items
    const lowStockAssets = assets?.filter(asset => 
      asset.current_quantity <= asset.minimum_stock_level
    ) || [];

    // Create alerts
    const alerts = lowStockAssets.map(asset => ({
      asset_id: asset.id,
      asset_name: asset.asset_name,
      asset_code: asset.asset_code,
      current_quantity: asset.current_quantity,
      minimum_stock_level: asset.minimum_stock_level,
      reorder_quantity: asset.reorder_quantity || 
        (asset.maximum_stock_level - asset.current_quantity),
      supplier: asset.supplier,
      lead_time: asset.reorder_automation?.[0]?.lead_time_days || 7,
      auto_reorder_enabled: asset.reorder_automation?.[0]?.auto_reorder_enabled || false,
      urgency: calculateUrgency(asset.current_quantity, asset.minimum_stock_level),
      estimated_cost: (asset.reorder_quantity || 0) * asset.cost_per_unit
    }));

    return NextResponse.json({
      alerts,
      low_stock_count: lowStockAssets.length,
      critical_count: alerts.filter(a => a.urgency === 'critical').length,
      total_reorder_value: alerts.reduce((sum, alert) => sum + alert.estimated_cost, 0)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reorder alerts' },
      { status: 500 }
    );
  }
}

function calculateUrgency(current: number, minimum: number): string {
  const percentage = (current / minimum) * 100;
  
  if (percentage === 0) return 'critical';
  if (percentage < 25) return 'high';
  if (percentage < 50) return 'medium';
  return 'low';
}