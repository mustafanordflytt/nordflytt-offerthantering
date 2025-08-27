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
        storage_units: [
          {
            id: 'storage-1',
            customer_id: 'cust-123',
            customer_name: 'Anders Andersson',
            unit_number: 'A-101',
            location: 'Stockholm Lager',
            size_sqm: 10,
            monthly_rate: 1200,
            status: 'active',
            start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            items_count: 42,
            access_code: '1234',
            last_access: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'storage-2',
            customer_id: 'cust-456',
            customer_name: 'Eva Eriksson',
            unit_number: 'B-205',
            location: 'Göteborg Lager',
            size_sqm: 5,
            monthly_rate: 600,
            status: 'active',
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            items_count: 18,
            access_code: '5678',
            last_access: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        total_units: 2,
        active_units: 2,
        total_revenue: 1800,
        occupancy_rate: 0.85
      });
    }

    const { searchParams } = new URL(request.url);
    const customer_id = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const location = searchParams.get('location');
    
    let query = supabase
      .from('customer_storage')
      .select(`
        *,
        customers (
          name,
          email,
          phone
        )
      `)
      .order('start_date', { ascending: false });
    
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (status) query = query.eq('status', status);
    if (location) query = query.eq('location', location);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching storage units:', error);
      throw error;
    }
    
    // Calculate aggregates
    const active_units = (data || []).filter(u => u.status === 'active').length;
    const total_revenue = (data || [])
      .filter(u => u.status === 'active')
      .reduce((sum, u) => sum + (u.monthly_rate || 0), 0);
    
    // Get total capacity for occupancy calculation
    const { data: locations } = await supabase
      .from('storage_locations')
      .select('total_units');
    
    const total_capacity = locations?.reduce((sum, l) => sum + (l.total_units || 0), 0) || 100;
    const occupancy_rate = active_units / total_capacity;
    
    return NextResponse.json({
      storage_units: data || [],
      total_units: data?.length || 0,
      active_units,
      total_revenue,
      occupancy_rate
    });
    
  } catch (error: any) {
    console.error('Customer storage fetch error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch storage units',
      storage_units: [],
      total_units: 0,
      active_units: 0,
      total_revenue: 0,
      occupancy_rate: 0
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!supabase) {
      return NextResponse.json({
        id: 'mock-' + Date.now(),
        ...body,
        status: 'active',
        access_code: Math.floor(1000 + Math.random() * 9000).toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Validate required fields
    const { customer_id, unit_number, location, size_sqm, monthly_rate } = body;
    
    if (!customer_id || !unit_number || !location || !size_sqm || !monthly_rate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate access code
    const access_code = Math.floor(1000 + Math.random() * 9000).toString();
    
    const { data, error } = await supabase
      .from('customer_storage')
      .insert([{
        ...body,
        status: 'active',
        access_code,
        start_date: body.start_date || new Date().toISOString(),
        items_count: body.items_count || 0
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating storage unit:', error);
      throw error;
    }
    
    // Send notification to customer
    try {
      await fetch('/api/send-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'storage_activated',
          customer_id,
          data: {
            unit_number,
            location,
            access_code
          }
        })
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Storage unit creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create storage unit' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Storage unit ID required' },
        { status: 400 }
      );
    }
    
    const updates = await request.json();
    
    if (!supabase) {
      return NextResponse.json({
        id,
        ...updates,
        updated_at: new Date().toISOString()
      });
    }
    
    // If terminating storage, set end date
    if (updates.status === 'terminated' && !updates.end_date) {
      updates.end_date = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('customer_storage')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating storage unit:', error);
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Storage unit update error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update storage unit' 
    }, { status: 500 });
  }
}