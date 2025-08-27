import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// API Key validation
async function validateApiKey(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const validApiKey = process.env.NORDFLYTT_GPT_API_KEY || 'nordflytt_gpt_api_key_2025';
  return token === validApiKey;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!await validateApiKey(request)) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid API key for Custom GPT access'
        },
        { status: 401 }
      );
    }

    const { email, phone, query_context } = await request.json();
    
    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone required' },
        { status: 400 }
      );
    }
    
    // Mock data for testing
    if (!supabase) {
      return NextResponse.json(getMockCustomerData(email));
    }
    
    // Build query
    let query = supabase.from('customers').select(`
      *,
      jobs (
        id,
        created_at,
        scheduled_date,
        total_amount,
        status,
        services,
        packed_by_nordflytt
      )
    `);
    
    if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      query = query.eq('phone', phone);
    }
    
    const { data: customer, error } = await query.single();
    
    if (error || !customer) {
      return NextResponse.json({
        customer_found: false,
        response_context: "new_customer",
        suggested_greeting: "Hej och välkommen till Nordflytt! Vad kan jag hjälpa dig med idag?"
      });
    }
    
    // Process customer data
    const jobs = customer.jobs || [];
    const completedJobs = jobs.filter((j: any) => j.status === 'completed');
    const totalBookings = completedJobs.length;
    const lifetimeValue = customer.lifetime_value || 
      completedJobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0);
    
    const isVip = totalBookings >= 3 || lifetimeValue > 50000;
    const isReturning = totalBookings > 1;
    
    // Get last booking
    const sortedJobs = jobs.sort((a: any, b: any) => 
      new Date(b.scheduled_date || b.created_at).getTime() - 
      new Date(a.scheduled_date || a.created_at).getTime()
    );
    const lastBooking = sortedJobs[0];
    
    // Generate personalized greeting based on context
    let suggestedGreeting = `Hej ${customer.first_name || customer.name.split(' ')[0]}! `;
    
    if (query_context?.includes('complaint') || query_context?.includes('damage')) {
      suggestedGreeting += "Jag förstår att du har haft problem. Låt mig hjälpa dig direkt.";
    } else if (lastBooking && isWithinDays(lastBooking.scheduled_date, 7)) {
      suggestedGreeting += `Jag ser din senaste bokning från ${formatDate(lastBooking.scheduled_date)}. Hur kan jag hjälpa dig?`;
    } else if (isVip) {
      suggestedGreeting += "⭐ Som VIP-kund får du alltid prioriterad service! Vad kan jag göra för dig idag?";
    } else if (isReturning) {
      suggestedGreeting += "Kul att höra från dig igen! Vad kan jag hjälpa dig med denna gång?";
    } else {
      suggestedGreeting += "Vad kan jag hjälpa dig med idag?";
    }
    
    return NextResponse.json({
      customer_found: true,
      customer_data: {
        name: customer.name,
        is_vip: isVip,
        total_bookings: totalBookings,
        last_booking: lastBooking ? {
          date: lastBooking.scheduled_date || lastBooking.created_at,
          services: lastBooking.services || []
        } : null,
        is_returning: isReturning
      },
      response_context: isVip ? "vip_customer" : (isReturning ? "returning_customer" : "first_time_customer"),
      suggested_greeting: suggestedGreeting
    });
    
  } catch (error: any) {
    console.error('Customer lookup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to lookup customer' },
      { status: 500 }
    );
  }
}

function getMockCustomerData(email: string) {
  // Mock responses for testing
  const mockCustomers: { [key: string]: any } = {
    'anna.svensson@gmail.com': {
      customer_found: true,
      customer_data: {
        name: 'Anna Svensson',
        is_vip: false,
        total_bookings: 3,
        last_booking: {
          date: '2024-12-15',
          services: ['flytt', 'packning']
        },
        is_returning: true
      },
      response_context: 'returning_customer',
      suggested_greeting: 'Hej Anna! Jag ser din senaste bokning från 15 december. Hur kan jag hjälpa dig?'
    }
  };
  
  return mockCustomers[email] || {
    customer_found: false,
    response_context: "new_customer",
    suggested_greeting: "Hej och välkommen till Nordflytt! Vad kan jag hjälpa dig med idag?"
  };
}

function isWithinDays(date: string, days: number): boolean {
  const checkDate = new Date(date);
  const today = new Date();
  const diffTime = Math.abs(checkDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long'
  });
}