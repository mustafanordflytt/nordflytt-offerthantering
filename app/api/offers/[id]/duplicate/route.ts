import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    
    // Get original booking
    const { data: original, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !original) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }
    
    // Create duplicate with new ID and reset status
    const duplicate = {
      ...original,
      id: undefined, // Let database generate new ID
      reference: undefined, // Generate new reference
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Insert duplicate
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert([duplicate])
      .select()
      .single()
    
    if (insertError) {
      console.error('Error duplicating offer:', insertError)
      return NextResponse.json(
        { error: 'Failed to duplicate offer' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      newOfferId: newBooking.id,
      newReference: newBooking.reference || `NF-${newBooking.id.slice(0, 8).toUpperCase()}`
    })
    
  } catch (error) {
    console.error('Error duplicating offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}