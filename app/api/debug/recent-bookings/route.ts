import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Checking recent bookings and CRM sync status...');

    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const bookingRef = searchParams.get('ref'); // e.g., NF-23857BDE
    const email = searchParams.get('email');
    
    // Query recent bookings
    let bookingsQuery = supabase
      .from('bookings')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          customer_type,
          notes
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Filter by reference if provided
    if (bookingRef) {
      bookingsQuery = bookingsQuery.eq('reference', bookingRef);
    }

    // Filter by customer email if provided
    if (email) {
      bookingsQuery = bookingsQuery.eq('customer_email', email);
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError);
      throw bookingsError;
    }

    // Get recent quotes
    let quotesQuery = supabase
      .from('quotes')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (email) {
      // Need to join through customers table for email filter
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single();
      
      if (customer) {
        quotesQuery = quotesQuery.eq('customer_id', customer.id);
      }
    }

    const { data: quotes, error: quotesError } = await quotesQuery;

    if (quotesError) {
      console.error('❌ Error fetching quotes:', quotesError);
    }

    // Check for specific booking NF-23857BDE
    const targetBooking = bookings?.find(b => 
      b.reference === 'NF-23857BDE' || 
      b.id === 'NF-23857BDE' ||
      b.customer_email === 'mustafa.abdulkarim@hotmail.com'
    );

    // Analyze CRM sync status
    const syncAnalysis = {
      targetBookingFound: !!targetBooking,
      bookingDetails: targetBooking ? {
        id: targetBooking.id,
        reference: targetBooking.reference,
        customer_id: targetBooking.customer_id,
        customer_email: targetBooking.customer_email,
        customer_phone: targetBooking.customer_phone,
        status: targetBooking.status,
        created_at: targetBooking.created_at,
        move_date: targetBooking.move_date,
        start_address: targetBooking.start_address,
        end_address: targetBooking.end_address,
        total_price: targetBooking.total_price,
        hasCustomerLink: !!targetBooking.customer_id,
        customerData: targetBooking.customers
      } : null,
      recentBookingsCount: bookings?.length || 0,
      recentQuotesCount: quotes?.length || 0
    };

    // Check AI system logs (simulated - would need actual log access)
    const aiSystemCheck = {
      note: "AI system logs would be in your logging service",
      expectedTriggers: [
        "POST /api/ai-customer-service/identify/customer",
        "POST /api/ai-customer-service/analytics/track"
      ],
      checkLocations: [
        "Browser console logs",
        "Server logs",
        "Supabase logs"
      ]
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      searchCriteria: {
        bookingRef: bookingRef || 'NF-23857BDE',
        email: email || 'mustafa.abdulkarim@hotmail.com'
      },
      syncAnalysis,
      recentBookings: bookings?.map(b => ({
        id: b.id,
        reference: b.reference,
        customer_email: b.customer_email,
        status: b.status,
        created_at: b.created_at,
        synced_to_crm: !!b.customer_id,
        customer_name: b.customers?.name || b.customer_name || 'Not linked'
      })),
      recentQuotes: quotes?.map(q => ({
        id: q.id,
        customer_id: q.customer_id,
        customer_name: q.customers?.name,
        value: q.value,
        status: q.status,
        created_at: q.created_at
      })),
      aiSystemCheck,
      debugInfo: {
        totalBookingsChecked: bookings?.length || 0,
        totalQuotesChecked: quotes?.length || 0,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('💥 Debug endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also support POST for more complex queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, status, customerEmail } = body;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        customers (*)
      `)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (customerEmail) {
      query = query.eq('customer_email', customerEmail);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      bookings: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}