import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking job structure in database...');

    // Get the most recent confirmed bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .in('status', ['confirmed', 'in_progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching bookings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to show the exact structure
    const jobStructures = bookings?.map(booking => ({
      // Database fields
      database: {
        id: booking.id,
        reference: booking.reference,
        customer_id: booking.customer_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        customer_type: booking.customer_type,
        start_address: booking.start_address,
        end_address: booking.end_address,
        move_date: booking.move_date,
        move_time: booking.move_time,
        status: booking.status,
        total_price: booking.total_price,
        service_type: booking.service_type,
        service_types: booking.service_types
      },
      // How it appears as a job
      asJob: {
        bookingNumber: booking.reference || `NF-${booking.id.slice(0, 8).toUpperCase()}`,
        customerName: booking.customer_name || 'Unknown',
        fromAddress: booking.start_address,
        toAddress: booking.end_address,
        moveDate: booking.move_date,
        status: booking.status === 'confirmed' ? 'scheduled' : booking.status
      }
    }));

    // Check if jobs table exists
    const { data: jobsExist } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Job structure analysis',
      jobsTableExists: !!jobsExist,
      totalConfirmedBookings: bookings?.length || 0,
      structures: jobStructures,
      summary: {
        correctFieldNames: [
          'bookingNumber (not reference in UI)',
          'fromAddress (not address_from)',
          'toAddress (not address_to)',
          'customerName, customerEmail, customerPhone'
        ],
        dataFlow: 'bookings table → /api/crm/jobs → transform to job structure → display in UI'
      }
    });
  } catch (error) {
    console.error('💥 Fatal error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}