import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSimpleOffer() {
  try {
    // Skapa en enkel bokning utan komplicerade datum
    const bookingData = {
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639',
      service_type: 'moving',
      service_types: ['moving'],
      move_date: '2025-04-01',
      move_time: '10:00',
      start_address: 'Testgatan 1, Stockholm',
      end_address: 'Målgatan 2, Stockholm', 
      start_living_area: '50',
      end_living_area: '50',
      start_floor: '1',
      end_floor: '1',
      start_elevator: 'true',
      end_elevator: 'true',
      start_parking_distance: '5',
      end_parking_distance: '5',
      has_balcony: false,
      additional_services: [],
      special_instructions: 'Enkel test',
      payment_method: 'invoice',
      status: 'pending',
      total_price: 3500,
      customer_email: 'simple@test.com',
      customer_phone: '0701234567',
      details: {
        customerName: 'Enkel Test',
        email: 'simple@test.com',
        phone: '0701234567',
        orderNumber: 'SIMPLE-' + Date.now(),
        creditCheckStatus: 'approved'
      }
    }
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()
      
    if (error) {
      console.error('Fel:', error)
      return
    }
    
    console.log('✅ ENKEL OFFERT SKAPAD!')
    console.log('Booking ID:', booking.id)
    console.log('\n🔗 ÖPPNA OFFERTEN:')
    console.log(`http://localhost:3000/offer/${booking.id}?token=1234567890123456`)
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

createSimpleOffer()