import { NextRequest, NextResponse } from 'next/server';
import { confirmBookingFromEmail } from '@/lib/crm-sync';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('id');
    const token = searchParams.get('token');

    if (!bookingId || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing booking ID or token' },
        { status: 400 }
      );
    }

    console.log('📧 Confirming booking from email link:', { bookingId });

    const result = await confirmBookingFromEmail(bookingId, token);

    if (result.success) {
      console.log('✅ Booking confirmed successfully');
      
      // Redirect to a confirmation page
      return NextResponse.redirect(
        new URL(`/booking-confirmed?id=${bookingId}`, request.url)
      );
    } else {
      console.error('❌ Booking confirmation failed:', result.errors);
      
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      );
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, token } = body;

    if (!bookingId || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing booking ID or token' },
        { status: 400 }
      );
    }

    console.log('📱 Confirming booking from API call:', { bookingId });

    const result = await confirmBookingFromEmail(bookingId, token);

    return NextResponse.json({
      success: result.success,
      customerId: result.customerId,
      bookingId: result.bookingId,
      errors: result.errors
    });
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