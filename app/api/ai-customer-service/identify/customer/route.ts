import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: NextRequest) {
  try {
    const { email, phone, customerId } = await request.json();
    
    if (!email && !phone && !customerId) {
      return NextResponse.json(
        { error: 'Email, phone, or customer ID required' },
        { status: 400 }
      );
    }
    
    if (!supabase) {
      // Return mock customer for demo
      return NextResponse.json({
        id: 'customer-123',
        name: 'Anna Andersson',
        email: email || 'anna@example.com',
        phone: phone || '+46701234567',
        preferredName: 'Anna',
        isVIP: true,
        lifetimeValue: 75000,
        customerSince: new Date('2023-01-15').toISOString(),
        totalMoves: 3,
        identified: true,
        confidence: 0.95
      });
    }
    
    // Build query
    let query = supabase.from('customers').select('*');
    
    if (customerId) {
      query = query.eq('id', customerId);
    } else if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      query = query.eq('phone', phone);
    }
    
    const { data: customer, error } = await query.single();
    
    if (error || !customer) {
      return NextResponse.json({
        identified: false,
        confidence: 0,
        message: 'Customer not found'
      });
    }
    
    // Calculate lifetime value and stats
    const { count: totalMoves } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id)
      .eq('status', 'completed');
    
    const lifetimeValue = customer.lifetime_value || 0;
    const isVIP = lifetimeValue > 50000;
    
    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      preferredName: customer.first_name || customer.name.split(' ')[0],
      isVIP,
      lifetimeValue,
      customerSince: customer.created_at,
      totalMoves: totalMoves || 0,
      identified: true,
      confidence: email ? 0.95 : 0.85 // Higher confidence with email
    });
    
  } catch (error: any) {
    console.error('Customer identification error:', error);
    return NextResponse.json(
      { error: error.message || 'Identification failed' },
      { status: 500 }
    );
  }
}