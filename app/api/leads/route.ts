import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// GET /api/leads - List all leads
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      // Return mock data if Supabase not configured
      return NextResponse.json({ data: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // Add filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // Return mock data if no leads exist yet
    if (!data || data.length === 0) {
      const mockData = [
        {
          id: '1',
          customer_id: '1',
          customer: {
            id: '1',
            name: 'Anna Andersson',
            email: 'anna@example.com',
            phone: '070-123-4567',
            address: 'Drottninggatan 50',
            city: 'Stockholm'
          },
          source: 'offertformulär',
          status: 'new',
          priority: 'high',
          estimated_value: 15000,
          notes: 'Flytt från 3:a i Stockholm till Göteborg',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          customer_id: '2',
          customer: {
            id: '2',
            name: 'Företaget AB',
            email: 'info@foretaget.se',
            phone: '08-123-4567',
            address: 'Kungsgatan 100',
            city: 'Stockholm'
          },
          source: 'phone',
          status: 'contacted',
          priority: 'medium',
          estimated_value: 45000,
          notes: 'Kontorsflytt, ca 20 arbetsplatser',
          follow_up_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      return NextResponse.json({ data: mockData });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.customer_id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', body.customer_id)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create lead
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        customer_id: body.customer_id,
        source: body.source || 'manual',
        status: body.status || 'new',
        priority: body.priority || 'medium',
        estimated_value: body.estimated_value || null,
        notes: body.notes || null,
        follow_up_date: body.follow_up_date || null,
        assigned_to: body.assigned_to || null
      }])
      .select(`
        *,
        customer:customers(id, name, email, phone)
      `)
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}