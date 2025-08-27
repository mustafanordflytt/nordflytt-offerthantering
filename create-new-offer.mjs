import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createNewOffer() {
  try {
    // Skapa ett jobb först
    const jobData = {
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639',
      title: 'Flytt Stockholm - Mustafa Test',
      description: 'Flytt från Kungsgatan till Vasagatan',
      scheduled_date: '2025-02-15',
      scheduled_time: '09:00',
      status: 'scheduled',
      customer_name: 'Mustafa Test',
      customer_phone: '070-123 45 67',
      customer_email: 'mustafa@nordflytt.se',
      start_address: 'Kungsgatan 55, 11122 Stockholm',
      end_address: 'Vasagatan 30, 11120 Stockholm',
      original_price: 6000,
      final_price: 6000,
      added_services_total: 0,
      notes: 'Portkod: 5678. Ring när ni är framme.',
      service_type: 'moving',
      priority: 'medium'
    }
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single()
      
    if (jobError) {
      console.error('Kunde inte skapa jobb:', jobError)
      // Fortsätt ändå utan jobb
    } else {
      console.log('✅ Jobb skapat med ID:', job.id)
    }
    
    // Skapa en ny bokning
    const bookingData = {
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639',
      service_type: 'moving',
      service_types: ['moving'],
      move_date: '2025-02-15',
      move_time: '09:00',
      start_address: 'Kungsgatan 55, 11122 Stockholm',
      end_address: 'Vasagatan 30, 11120 Stockholm',
      start_living_area: '95',
      end_living_area: '95',
      start_floor: '4',
      end_floor: '3',
      start_elevator: 'true',
      end_elevator: 'false', // Ingen hiss i mållägenhet
      start_parking_distance: '15',
      end_parking_distance: '20',
      has_balcony: true,
      additional_services: [],
      special_instructions: 'Portkod: 5678. Ring när ni är framme. Försiktig med tavlorna!',
      payment_method: 'invoice',
      status: 'pending',
      total_price: 6000,
      customer_email: 'mustafa@nordflytt.se',
      customer_phone: '070-123 45 67',
      details: {
        customerName: 'Mustafa Test',
        email: 'mustafa@nordflytt.se',
        phone: '070-123 45 67',
        orderNumber: 'NF-' + Date.now(),
        moveVolume: '25',
        moveSize: '25',
        packingService: false,
        cleaningService: false,
        storageService: false,
        creditCheckStatus: 'approved',
        paymentMethod: 'invoice',
        startPropertyType: 'apartment',
        endPropertyType: 'apartment',
        startLivingArea: '95',
        endLivingArea: '95',
        startFloor: '4',
        endFloor: '3',
        startElevator: true,
        endElevator: false,
        hasBalcony: true,
        startParkingDistance: '15',
        endParkingDistance: '20',
        moveDate: '2025-02-15',
        moveTime: '09:00',
        jobId: job?.id || null,
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
    
    console.log('\n✅ NY OFFERT SKAPAD!')
    console.log('   Booking ID:', booking.id)
    console.log('   Flyttdatum:', booking.move_date)
    console.log('   Flytttid:', booking.move_time)
    console.log('   Från:', booking.start_address)
    console.log('   Till:', booking.end_address)
    console.log('   Pris:', booking.total_price + ' kr')
    console.log('   Status:', booking.status)
    
    console.log('\n📄 OFFERTLÄNKAR:')
    console.log('\n1. Med token (rekommenderad):')
    console.log(`   http://localhost:3000/offer/${booking.id}?token=1234567890123456`)
    
    console.log('\n2. Utan token:')
    console.log(`   http://localhost:3000/offer/${booking.id}`)
    
    console.log('\n💡 Tips:')
    console.log('   - Använd länk #1 för att garanterat komma åt offerten')
    console.log('   - Efter godkännande kan du lägga till tilläggstjänster i Staff App')
    console.log('   - Tilläggstjänsterna kommer synas på bekräftelsesidan')
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

createNewOffer()