import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          customer_type
        )
      `)
      .eq('id', id)
      .single()
    
    if (error || !booking) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }
    
    // Transform to offer format
    const offer = {
      id: booking.id,
      reference: booking.reference || `NF-${booking.id.slice(0, 8).toUpperCase()}`,
      customer_name: booking.customers?.name || booking.customer_name || 'Okänd kund',
      customer_email: booking.customers?.email || booking.customer_email || '',
      customer_phone: booking.customers?.phone || booking.customer_phone || '',
      service_type: booking.service_type || 'Hemflytt',
      move_date: booking.move_date,
      move_time: booking.move_time || '13:00',
      from_address: booking.start_address || booking.details?.startAddress || '',
      to_address: booking.end_address || booking.details?.endAddress || '',
      total_price: booking.total_price || 0,
      services: booking.service_types || booking.additional_services || [],
      status: mapOfferStatus(booking.status),
      created_at: booking.created_at,
      details: {
        squareMeters: booking.details?.startLivingArea || booking.details?.livingArea,
        roomCount: booking.details?.roomCount,
        fromFloor: booking.details?.startFloor,
        toFloor: booking.details?.endFloor,
        fromElevator: booking.details?.startElevator,
        toElevator: booking.details?.endElevator,
        heavyItems: booking.details?.largeItems || [],
        packingService: booking.details?.packingService,
        cleaningService: booking.details?.cleaningService,
        message: booking.details?.specialInstructions || booking.details?.notes
      }
    }
    
    return NextResponse.json(offer)
    
  } catch (error) {
    console.error('Error fetching offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete offer' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to map booking status to offer status
function mapOfferStatus(bookingStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'draft',
    'confirmed': 'sent',
    'accepted': 'accepted',
    'rejected': 'rejected',
    'cancelled': 'rejected',
    'completed': 'accepted'
  }
  return statusMap[bookingStatus] || 'draft'
}