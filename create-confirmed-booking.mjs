import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Jobbet med tilläggstjänster
const jobId = '000b8cc1-dabd-4283-9cbf-e6851aec302d'

async function createConfirmedBooking() {
  try {
    // Först, uppdatera den befintliga bokningen till confirmed
    const { data: existingBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        payment_method: 'invoice',
        updated_at: new Date().toISOString()
      })
      .eq('id', '3fa6a931-964e-431b-b3d1-61a6d09c7cb7')
      .select()
      .single()
      
    if (!updateError && existingBooking) {
      console.log('✅ Befintlig bokning uppdaterad till confirmed!')
      console.log(`   http://localhost:3000/order-confirmation/${existingBooking.id}`)
      return
    }
    
    // Om det inte fungerade, skapa en ny bekräftad bokning
    const testBooking = {
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639',
      service_type: 'moving',
      service_types: ['moving'],
      move_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
      special_instructions: 'Test för tilläggstjänster - BEKRÄFTAD',
      payment_method: 'invoice',
      status: 'confirmed', // VIKTIGT: confirmed status
      total_price: 5000,
      customer_email: 'mustafa@test.se',
      customer_phone: '070-123 45 67',
      details: {
        customerName: 'Mustafa Test',
        jobId: jobId,
        orderNumber: 'DB-' + Date.now(),
        creditCheckStatus: 'approved', // För att undvika kreditkontroll-problem
        paymentMethod: 'invoice',
        bookingConfirmed: true
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
    
    console.log('✅ Ny bekräftad bokning skapad!')
    console.log('   Booking ID:', booking.id)
    console.log('   Status:', booking.status)
    console.log('')
    console.log('📄 Öppna bekräftelsesidan:')
    console.log(`   http://localhost:3000/order-confirmation/${booking.id}`)
    console.log('')
    console.log('🔐 Eller med token för att komma förbi middleware:')
    console.log(`   http://localhost:3000/order-confirmation/${booking.id}?token=1234567890123456`)
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

createConfirmedBooking()