import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createFreshOffer() {
  try {
    // Skapa en helt ny bokning
    const timestamp = Date.now()
    const bookingData = {
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639', // Mustafa Test
      service_type: 'moving',
      service_types: ['moving'],
      move_date: '2025-03-01',
      move_time: '10:00',
      start_address: 'Storgatan 12, 11455 Stockholm',
      end_address: 'Drottninggatan 88, 11121 Stockholm',
      start_living_area: '75',
      end_living_area: '75',
      start_floor: '2',
      end_floor: '4',
      start_elevator: 'true',
      end_elevator: 'true',
      start_parking_distance: '5',
      end_parking_distance: '10',
      has_balcony: false,
      additional_services: [],
      special_instructions: 'Nyckel finns hos grannen på våning 2. Ring 0701234567 när ni är framme.',
      payment_method: 'invoice',
      status: 'pending',
      total_price: 5200,
      customer_email: 'mustafa@test.com',
      customer_phone: '070-999 88 77',
      details: {
        customerName: 'Mustafa Testsson',
        email: 'mustafa@test.com', 
        phone: '070-999 88 77',
        orderNumber: 'ORD-' + timestamp,
        moveVolume: '22',
        moveSize: '22',
        packingService: false,
        cleaningService: false,
        storageService: false,
        creditCheckStatus: 'approved',
        paymentMethod: 'invoice',
        startPropertyType: 'apartment',
        endPropertyType: 'apartment',
        startLivingArea: '75',
        endLivingArea: '75',
        startFloor: '2',
        endFloor: '4',
        startElevator: true,
        endElevator: true,
        startParkingDistance: '5',
        endParkingDistance: '10',
        moveDate: '2025-03-01',
        moveTime: '10:00',
        createdAt: new Date().toISOString(),
        // Viktigt: se till att alla datum är i rätt format
        bookingDate: new Date().toISOString().split('T')[0],
        scheduledDate: '2025-03-01',
        scheduledTime: '10:00:00'
      }
    }
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()
      
    if (bookingError) {
      console.error('❌ Fel vid skapande av bokning:', bookingError)
      return
    }
    
    console.log('✅ NY OFFERT SKAPAD!')
    console.log('')
    console.log('📋 OFFERTDETALJER:')
    console.log('   Booking ID:', booking.id)
    console.log('   Ordernummer:', bookingData.details.orderNumber)
    console.log('   Kund:', bookingData.details.customerName)
    console.log('   Flyttdatum:', booking.move_date + ' kl ' + booking.move_time)
    console.log('   Från:', booking.start_address)
    console.log('   Till:', booking.end_address)
    console.log('   Pris:', booking.total_price + ' kr')
    console.log('   Status:', booking.status)
    
    // Skapa ett jobb kopplat till bokningen
    const jobData = {
      title: `Flytt - ${bookingData.details.customerName}`,
      description: `Flytt från ${booking.start_address} till ${booking.end_address}`,
      scheduled_date: booking.move_date,
      scheduled_time: booking.move_time || '10:00:00',
      status: 'scheduled',
      customer_name: bookingData.details.customerName,
      customer_phone: booking.customer_phone,
      start_address: booking.start_address,
      end_address: booking.end_address,
      original_price: booking.total_price,
      final_price: booking.total_price,
      added_services_total: 0,
      notes: booking.special_instructions,
      service_type: 'moving',
      priority: 'medium',
      customer_id: booking.customer_id
    }
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single()
      
    if (!jobError && job) {
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
    console.log('🔗 OFFERTLÄNKAR:')
    console.log('')
    console.log('✅ Använd denna länk (med token):')
    console.log(`   http://localhost:3000/offer/${booking.id}?token=1234567890123456`)
    
    console.log('')
    console.log('💡 NÄSTA STEG:')
    console.log('   1. Klicka på länken ovan')
    console.log('   2. Acceptera offerten')
    console.log('   3. Bekräftelsesidan kommer visas automatiskt')
    console.log('   4. Du kan sedan lägga till tilläggstjänster via Staff App')
    
  } catch (error) {
    console.error('❌ Fel:', error)
  }
}

createFreshOffer()