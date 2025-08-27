import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch real bookings from database
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (bookingsError) {
      console.error('Database error:', bookingsError);
      throw bookingsError;
    }
    
    // Transform bookings to match expected format
    const transformedBookings = await Promise.all((bookings || []).map(async (booking) => {
      // Fetch customer details if needed
      let customerName = booking.details?.customerName || booking.details?.name || 'Okänd kund';
      
      if (booking.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('name')
          .eq('id', booking.customer_id)
          .single();
        
        if (customer) {
          customerName = customer.name;
        }
      }
      
      // Fetch associated job if exists
      const { data: job } = await supabase
        .from('jobs')
        .select('*')
        .eq('booking_id', booking.id)
        .single();
      
      return {
        id: booking.id,
        bookingNumber: booking.details?.reference || `BOOK${booking.id.slice(0, 8)}`,
        customerId: booking.customer_id,
        customerName: customerName,
        fromAddress: booking.start_address,
        toAddress: booking.end_address,
        moveDate: booking.move_date,
        moveTime: booking.move_time || '09:00',
        status: job?.status || booking.status || 'pending',
        priority: booking.metadata?.priority || 'medium',
        assignedStaff: job?.metadata?.teamMembers || [],
        estimatedHours: job?.estimated_hours || booking.details?.timeEstimation?.mlPrediction || 4,
        totalPrice: booking.total_price || booking.price_details?.slutpris || 0,
        services: booking.service_types || ['moving'],
        notes: booking.special_instructions || '',
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      };
    }));
    
    return NextResponse.json({
      success: true,
      bookings: transformedBookings
    });
  } catch (error: any) {
    console.error('Bookings API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error.message
    }, { status: 500 });
  }
}