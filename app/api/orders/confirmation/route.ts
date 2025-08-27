import { NextRequest } from "next/server"
import { authenticateAPI, AuthLevel, apiError, apiResponse } from '@/lib/api-auth'
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  // Public endpoint - no auth required
  const auth = await authenticateAPI(request, AuthLevel.PUBLIC)
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const offerId = searchParams.get('offerId')
    
    if (!bookingId && !offerId) {
      return apiError('Booking ID or Offer ID is required', 400, 'MISSING_ID')
    }

    let bookingData = null

    // Try to fetch from bookings table first
    if (bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `)
        .eq('id', bookingId)
        .single()

      if (!bookingError && booking) {
        bookingData = booking
      }
    }

    // If not found in bookings, try offers/quotes
    if (!bookingData && offerId) {
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `)
        .eq('id', offerId)
        .single()

      if (!quoteError && quote) {
        // Transform quote data to match booking structure
        bookingData = {
          ...quote,
          move_date: quote.details?.moveDate || quote.move_date,
          move_time: quote.details?.moveTime || '08:00',
          start_address: quote.start_address || quote.details?.startAddress,
          end_address: quote.end_address || quote.details?.endAddress,
          total_price: quote.value || quote.details?.totalPrice
        }
      }
    }

    if (!bookingData) {
      // Return mock data for demo
      return apiResponse(getMockConfirmation(bookingId || offerId || 'demo-123'))
    }

    // Format the confirmation data
    const confirmation = {
      id: bookingData.id,
      reference: `NF-${bookingData.id.slice(0, 8).toUpperCase()}`,
      status: bookingData.status || 'confirmed',
      customer: {
        name: bookingData.customers?.name || bookingData.details?.customerName || 'Kund',
        email: bookingData.customers?.email || bookingData.details?.email || '',
        phone: bookingData.customers?.phone || bookingData.details?.phone || ''
      },
      moveDetails: {
        date: bookingData.move_date || bookingData.details?.moveDate,
        time: bookingData.move_time || bookingData.details?.moveTime || '08:00',
        from: bookingData.start_address || bookingData.details?.startAddress || '',
        to: bookingData.end_address || bookingData.details?.endAddress || ''
      },
      services: bookingData.details?.services || bookingData.service_types || ['Flyttjänst'],
      totalPrice: bookingData.total_price || bookingData.details?.totalPrice || 0,
      additionalServices: bookingData.details?.additionalServices || [],
      specialInstructions: bookingData.details?.specialInstructions || '',
      createdAt: bookingData.created_at,
      updatedAt: bookingData.updated_at
    }

    return apiResponse({
      confirmation,
      message: 'Bokningsbekräftelse hämtad'
    })

  } catch (error) {
    console.error('Error fetching confirmation:', error)
    return apiError('Could not fetch confirmation', 500, 'INTERNAL_ERROR')
  }
}

// Mock confirmation data for demo
function getMockConfirmation(id: string) {
  return {
    confirmation: {
      id,
      reference: `NF-${id.slice(0, 8).toUpperCase()}`,
      status: 'confirmed',
      customer: {
        name: 'Demo Kund',
        email: 'demo@example.com',
        phone: '+46 70 123 4567'
      },
      moveDetails: {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '09:00',
        from: 'Drottninggatan 10, Stockholm',
        to: 'Kungsgatan 25, Uppsala'
      },
      services: ['Flyttjänst', 'Packhjälp'],
      totalPrice: 8500,
      additionalServices: [
        { name: 'Flyttkartonger', quantity: 20, price: 1580 }
      ],
      specialInstructions: 'Ring 30 minuter innan ankomst',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    message: 'Bokningsbekräftelse hämtad (demo)'
  }
}