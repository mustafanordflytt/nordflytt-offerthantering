import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const lowStock = searchParams.get('low_stock');
    
    let query = supabase
      .from('company_assets')
      .select(`
        *,
        asset_categories (
          category_name,
          category_description,
          standard_unit,
          requires_maintenance
        ),
        reorder_automation (
          auto_reorder_enabled,
          reorder_trigger_level,
          reorder_quantity,
          lead_time_days
        )
      `)
      .order('asset_name', { ascending: true });

    if (category && category !== 'all') {
      query = query.eq('asset_categories.category_name', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (lowStock === 'true') {
      // This would need a more complex query in production
      // For now, we'll filter client-side
    }

    const { data: assets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter low stock items if requested
    let filteredAssets = assets || [];
    if (lowStock === 'true') {
      filteredAssets = filteredAssets.filter(asset => 
        asset.current_quantity <= asset.minimum_stock_level
      );
    }

    return NextResponse.json({ assets: filteredAssets });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data: asset, error } = await supabase
      .from('company_assets')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const { data: asset, error } = await supabase
      .from('company_assets')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}