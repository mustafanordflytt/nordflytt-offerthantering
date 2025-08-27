import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { sendBookingNotifications } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    
    // Get booking data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !booking) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }
    
    // Send notification email
    const formData = {
      name: booking.customer_name || '',
      email: booking.customer_email || '',
      phone: booking.customer_phone || '',
      moveDate: booking.move_date,
      moveTime: booking.move_time,
      startAddress: booking.start_address,
      endAddress: booking.end_address,
      totalPrice: booking.total_price,
      ...booking.details
    }
    
    const notificationResult = await sendBookingNotifications(
      booking.id,
      formData,
      booking.reference || `NF-${booking.id.slice(0, 8).toUpperCase()}`
    )
    
    // Update status to sent
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', id)
    
    if (updateError) {
      console.error('Error updating offer status:', updateError)
    }
    
    return NextResponse.json({
      success: true,
      emailSent: notificationResult.emailSent,
      smsSent: notificationResult.smsSent
    })
    
  } catch (error) {
    console.error('Error sending offer:', error)
    return NextResponse.json(
      { error: 'Failed to send offer' },
      { status: 500 }
    )
  }
}