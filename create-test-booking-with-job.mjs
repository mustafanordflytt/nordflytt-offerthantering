import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Jobbet vi skapade tidigare där vi la till tilläggstjänster
const jobId = '000b8cc1-dabd-4283-9cbf-e6851aec302d'

async function createTestBooking() {
  try {
    // Skapa en test-bokning
    const testBooking = {
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639',
      service_type: 'moving',
      service_types: ['moving'],
      move_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Imorgon
      move_time: '10:00:00',
      start_address: 'Testgatan 1, Stockholm',
      end_address: 'Målgatan 2, Stockholm',
      start_living_area: '70',
      end_living_area: '70',
      start_floor: '3',
      end_floor: '2',
      start_elevator: 'true',
      end_elevator: 'true',
      start_parking_distance: '10',
      end_parking_distance: '5',
      has_balcony: false,
      additional_services: [],
      special_instructions: 'Test för tilläggstjänster',
      payment_method: 'invoice',
      status: 'confirmed',
      total_price: 5000,
      customer_email: 'mustafa@test.se',
      customer_phone: '070-123 45 67',
      details: {
        customerName: 'Mustafa Test',
        jobId: jobId,
        orderNumber: 'DB-' + Date.now()
      }
    }
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(testBooking)
      .select()
      .single()
      
    if (error) {
      console.error('Fel vid skapande av bokning:', error)
      return
    }
    
    console.log('✅ Bokning skapad!')
    console.log('   Booking ID:', booking.id)
    console.log('   Customer:', booking.details.customerName)
    console.log('   Job ID (i details):', booking.details.jobId)
    console.log('')
    console.log('📄 Öppna bekräftelsesidan här:')
    console.log(`   http://localhost:3000/order-confirmation/${booking.id}`)
    console.log('')
    console.log('💡 Denna bokning är kopplad till jobbet där vi la till Specialemballering!')
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

createTestBooking()