import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createCompleteOffer() {
  try {
    // 1. Skapa eller hämta kund
    let customerId = '64cb61e7-16bd-4fe1-8552-8331523a0639' // Mustafa Test
    
    // 2. Skapa en komplett bokning med all nödvändig information
    const bookingData = {
      customer_id: customerId,
      service_type: 'moving',
      service_types: ['moving'],
      move_date: '2025-01-30', // Framtida datum
      move_time: '10:00',
      start_address: 'Kungsgatan 10, 11143 Stockholm',
      end_address: 'Vasagatan 25, 11120 Stockholm',
      start_living_area: '85',
      end_living_area: '85',
      start_floor: '3',
      end_floor: '2',
      start_elevator: 'true',
      end_elevator: 'true',
      start_parking_distance: '10',
      end_parking_distance: '5',
      has_balcony: false,
      additional_services: [],
      special_instructions: 'Ring på dörren när ni kommer. Kod till porten: 1234',
      payment_method: 'invoice',
      status: 'pending',
      total_price: 5500,
      customer_email: 'mustafa@nordflytt.se',
      customer_phone: '070-123 45 67',
      details: {
        customerName: 'Mustafa Abdulkarim',
        email: 'mustafa@nordflytt.se',
        phone: '070-123 45 67',
        orderNumber: 'OFF-' + Date.now(),
        moveVolume: '20',
        moveSize: '20',
        packingService: false,
        cleaningService: false,
        storageService: false,
        creditCheckStatus: 'approved',
        paymentMethod: 'invoice',
        startPropertyType: 'apartment',
        endPropertyType: 'apartment',
        startLivingArea: '85',
        endLivingArea: '85',
        startFloor: '3',
        endFloor: '2',
        startElevator: true,
        endElevator: true,
        startParkingDistance: '10',
        endParkingDistance: '5',
        moveDate: '2025-01-30',
        moveTime: '10:00',
        createdAt: new Date().toISOString()
      }
    }
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()
      
    if (bookingError) {
      console.error('Fel vid skapande av bokning:', bookingError)
      return
    }
    
    console.log('✅ Ny offert skapad!')
    console.log('   Booking ID:', booking.id)
    console.log('   Kundnamn:', booking.customer_name)
    console.log('   Flyttdatum:', booking.move_date)
    console.log('   Pris:', booking.total_price + ' kr')
    
    // 3. Skapa ett jobb för bokningen
    const jobData = {
      booking_id: booking.id,
      customer_id: customerId,
      title: `Flytt - ${booking.customer_name}`,
      description: `Flytt från ${booking.start_address} till ${booking.end_address}`,
      scheduled_date: booking.move_date,
      scheduled_time: booking.move_time,
      status: 'scheduled',
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email,
      start_address: booking.start_address,
      end_address: booking.end_address,
      original_price: booking.total_price,
      final_price: booking.total_price,
      added_services_total: 0,
      notes: booking.special_instructions,
      service_type: 'moving',
      priority: 'medium'
    }
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single()
      
    if (jobError) {
      console.error('Fel vid skapande av jobb:', jobError)
    } else {
      console.log('   Job ID:', job.id)
      
      // Uppdatera booking med jobId
      await supabase
        .from('bookings')
        .update({ 
          details: {
            ...booking.details,
            jobId: job.id
          }
        })
        .eq('id', booking.id)
    }
    
    console.log('')
    console.log('📄 Visa offerten:')
    console.log(`   http://localhost:3000/offer/${booking.id}`)
    console.log('')
    console.log('💡 Du kan nu:')
    console.log('   1. Acceptera offerten')
    console.log('   2. Se bekräftelsesidan med tilläggstjänster')
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

createCompleteOffer()