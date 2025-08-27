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
        procurements: [
          {
            id: 'proc-1',
            title: 'Ramavtal Flyttjänster - Stockholms Stad',
            reference: 'STH-2025-001',
            buyer: 'Stockholms stad',
            category: 'moving_services',
            status: 'open',
            submission_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            estimated_value: 5000000,
            duration_months: 24,
            requirements: ['ISO 9001', 'F-skatt', 'Miljöcertifiering'],
            created_at: new Date().toISOString()
          },
          {
            id: 'proc-2',
            title: 'Kontorsflytt - Region Skåne',
            reference: 'RS-2025-045',
            buyer: 'Region Skåne',
            category: 'office_moving',
            status: 'evaluation',
            submission_deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            estimated_value: 1200000,
            duration_months: 12,
            requirements: ['F-skatt', 'Referenser'],
            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        total: 2,
        open_procurements: 1,
        total_value: 6200000
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const buyer = searchParams.get('buyer');
    
    let query = supabase
      .from('public_procurements')
      .select('*')
      .order('deadline', { ascending: true });
    
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (buyer) query = query.ilike('organization', `%${buyer}%`);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching procurements:', error);
      throw error;
    }
    
    // Calculate aggregates
    const open_procurements = (data || []).filter(p => p.status === 'open').length;
    const total_value = (data || []).reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    
    return NextResponse.json({
      procurements: data || [],
      total: data?.length || 0,
      open_procurements,
      total_value
    });
    
  } catch (error: any) {
    console.error('Public procurements fetch error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch public procurements',
      procurements: [],
      total: 0,
      open_procurements: 0,
      total_value: 0
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
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Validate required fields
    const { title, reference, buyer, category, submission_deadline, estimated_value } = body;
    
    if (!title || !reference || !buyer || !category || !submission_deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('public_procurements')
      .insert([{
        ...body,
        status: body.status || 'draft',
        requirements: body.requirements || []
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating procurement:', error);
      throw error;
    }
    
    // Log procurement bid if submitting
    if (body.status === 'submitted') {
      await supabase
        .from('procurement_bids')
        .insert([{
          procurement_id: data.id,
          bid_amount: body.bid_amount,
          bid_status: 'submitted',
          submission_date: new Date().toISOString()
        }]);
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Procurement creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create procurement' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Procurement ID required' },
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
    
    const { data, error } = await supabase
      .from('public_procurements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating procurement:', error);
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Procurement update error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update procurement' 
    }, { status: 500 });
  }
}