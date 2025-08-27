import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request);
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const customerId = resolvedParams.id;

    // Fetch bookings for this customer
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('move_date', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Transform bookings to match frontend format
    const transformedBookings = (bookings || []).map(booking => ({
      id: booking.id,
      customer_id: booking.customer_id,
      booking_number: booking.id.slice(0, 8).toUpperCase(),
      move_date: booking.move_date || booking.moving_date,
      move_time: booking.move_time || '08:00',
      start_address: booking.start_address || '',
      end_address: booking.end_address || '',
      status: booking.status || 'pending',
      total_price: booking.total_price || 0,
      payment_status: booking.payment_status || 'pending',
      service_type: booking.service_type || 'moving',
      created_at: booking.created_at,
      // Additional fields
      start_living_area: booking.start_living_area,
      end_living_area: booking.end_living_area,
      start_floor: booking.start_floor,
      end_floor: booking.end_floor,
      start_elevator: booking.start_elevator,
      end_elevator: booking.end_elevator,
      start_parking_distance: booking.start_parking_distance,
      end_parking_distance: booking.end_parking_distance,
      has_balcony: booking.has_balcony,
      additional_services: booking.additional_services || [],
      special_instructions: booking.special_instructions,
      details: booking.details,
      price_details: booking.price_details
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