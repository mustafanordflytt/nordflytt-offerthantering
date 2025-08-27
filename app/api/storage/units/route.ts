import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');
    
    let query = supabase
      .from('customer_storage')
      .select(`
        *,
        kunder (
          namn,
          email,
          telefon
        ),
        storage_facilities (
          facility_name,
          address,
          climate_controlled,
          security_level
        )
      `)
      .order('storage_start_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: units, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format the response
    const formattedUnits = units?.map(unit => ({
      id: unit.id,
      customer_name: unit.kunder?.namn || 'Unknown',
      customer_email: unit.kunder?.email || '',
      storage_unit_id: unit.storage_unit_id,
      storage_start_date: unit.storage_start_date,
      total_volume: unit.total_volume,
      storage_type: unit.storage_type,
      monthly_rate: unit.monthly_rate,
      payment_status: unit.payment_status,
      last_access: unit.last_access,
      facility_name: unit.storage_facilities?.facility_name,
      status: unit.status
    })) || [];

    return NextResponse.json({ units: formattedUnits });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch storage units' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate storage unit ID
    const storageUnitId = `STG-${Date.now().toString(36).toUpperCase()}`;
    
    const { data: storage, error } = await supabase
      .from('customer_storage')
      .insert({
        ...body,
        storage_unit_id: storageUnitId,
        status: 'active',
        payment_status: 'current',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ storage });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create storage unit' },
      { status: 500 }
    );
  }
}