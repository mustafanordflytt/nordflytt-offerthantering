import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // First try to get offers from the offers table
    let { data: offers, error: offersError } = await supabase
      .from('offers')
      .select(`
        *,
        customer:customers(*)
      `)
      .order('created_at', { ascending: false });

    if (offersError || !offers || offers.length === 0) {
      console.log('No offers found in offers table, checking bookings table...');
      
      // Fallback to bookings table for backward compatibility
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Database error:', bookingsError);
        throw bookingsError;
      }

      // Transform bookings to offer format
      offers = (bookings || []).map(booking => ({
        id: booking.id,
        reference: booking.reference || booking.details?.reference || `BOOK${booking.id?.slice(0, 6)}`,
        customerName: booking.details?.customerName || booking.customer?.name || booking.details?.name || 'Unknown',
        customerEmail: booking.customer_email || booking.customer?.email || '',
        customerPhone: booking.customer_phone || booking.customer?.phone || '',
        service: booking.service_type || 'Flytt',
        movingDate: booking.move_date || booking.moving_date,
        movingTime: booking.move_time || '08:00',
        from: booking.start_address || '',
        to: booking.end_address || '',
        totalPrice: booking.total_price || 0,
        status: booking.status || 'pending',
        createdAt: booking.created_at,
        priceDetails: booking.price_details || {},
        services: booking.service_types || ['Flytt'],
        additionalServices: booking.additional_services || [],
        volume: booking.details?.estimatedVolume || 0,
        distance: booking.details?.calculatedDistance || 0,
        notes: booking.special_instructions || ''
      }));
    } else {
      // Transform offers to consistent format
      offers = offers.map(offer => ({
        id: offer.id,
        reference: offer.reference || offer.offer_id || `OFFER${offer.id?.slice(0, 6)}`,
        customerName: offer.name || offer.customer?.name || 'Unknown',
        customerEmail: offer.email || offer.customer?.email || '',
        customerPhone: offer.phone || offer.customer?.phone || '',
        service: offer.service_type || 'Flytt',
        movingDate: offer.move_date || offer.moving_date,
        movingTime: offer.move_time || '08:00',
        from: offer.from_address || '',
        to: offer.to_address || '',
        totalPrice: offer.total_price || 0,
        status: offer.status || 'active',
        createdAt: offer.created_at,
        priceDetails: offer.pricing_breakdown || offer.metadata?.priceDetails || {},
        services: offer.service_types || offer.services || ['Flytt'],
        additionalServices: offer.additional_services || [],
        volume: offer.volume || offer.metadata?.formData?.estimatedVolume || 0,
        distance: offer.metadata?.formData?.calculatedDistance || 0,
        notes: offer.notes || ''
      }));
    }

    console.log(`Found ${offers.length} offers`);

    return NextResponse.json({
      success: true,
      offers,
      count: offers.length
    });

  } catch (error) {
    console.error('Error fetching offers:', error);
    
    // Return empty array instead of error to prevent UI crashes
    return NextResponse.json({
      success: true,
      offers: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch offers'
    });
  }
}