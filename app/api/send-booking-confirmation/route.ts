import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationNotifications } from '@/lib/notifications';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, paymentMethod, creditCheckResult } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing booking ID' },
        { status: 400 }
      );
    }

    console.log('📧 Sending booking confirmation for:', { bookingId, paymentMethod });

    // Hämta bokningsdata från databasen
    const supabase = createServerSupabaseClient();
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (*)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      console.error('Error fetching booking:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Skicka bekräftelse-meddelanden
    try {
      const result = await sendOrderConfirmationNotifications(
        booking.id,
        booking.reference || booking.id,
        booking.customers?.name || booking.details?.customerName || 'Kund',
        booking.customers?.email || booking.details?.email || '',
        booking.customers?.phone || booking.details?.phone || '',
        booking.move_date || '',
        booking.move_time || '08:00',
        booking.start_address || '',
        booking.end_address || '',
        booking.service_types || [],
        String(booking.total_price || 0),
        String(booking.details?.estimatedVolume || 0)
      );

      console.log('✅ Confirmation notifications sent:', result);

      return NextResponse.json({
        success: true,
        emailSent: result.emailSent,
        smsSent: result.smsSent
      });
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      return NextResponse.json({
        success: false,
        error: 'Failed to send notifications'
      });
    }
  } catch (error) {
    console.error('💥 Fatal error in booking confirmation:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}