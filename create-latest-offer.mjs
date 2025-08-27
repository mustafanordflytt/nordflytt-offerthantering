import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createLatestOffer() {
  try {
    const timestamp = Date.now()
    
    // Först, skapa ett jobb
    const jobData = {
      title: 'Flytt - Test Bekräftelse',
      description: 'Test av bekräftelsesida med tilläggstjänster',
      scheduled_date: '2025-03-15',
      scheduled_time: '14:00:00',
      status: 'scheduled',
      customer_name: 'Test Användare',
      customer_phone: '070-555 44 33',
      start_address: 'Testvägen 1, 12345 Stockholm',
      end_address: 'Målvägen 2, 12346 Stockholm',
      original_price: 4500,
      final_price: 4500,
      added_services_total: 0,
      notes: 'Test av tilläggstjänster på bekräftelsesidan',
      service_type: 'moving',
      priority: 'medium',
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639'
    }
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single()
      
    let jobId = null
    if (!jobError && job) {
      jobId = job.id
      console.log('✅ Jobb skapat:', jobId)
    }
    
    // Skapa bokning
    const bookingData = {
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639',
      service_type: 'moving',
      service_types: ['moving'],
      move_date: '2025-03-15',
      move_time: '14:00',
      start_address: 'Testvägen 1, 12345 Stockholm',
      end_address: 'Målvägen 2, 12346 Stockholm',
      start_living_area: '65',
      end_living_area: '65',
      start_floor: '1',
      end_floor: '2',
      start_elevator: 'true',
      end_elevator: 'true',
      start_parking_distance: '5',
      end_parking_distance: '5',
      has_balcony: false,
      additional_services: [],
      special_instructions: 'Test av system - vänligen ignorera',
      payment_method: 'invoice',
      status: 'pending',
      total_price: 4500,
      customer_email: 'test@example.com',
      customer_phone: '070-555 44 33',
      details: {
        customerName: 'Test Användare',
        email: 'test@example.com',
        phone: '070-555 44 33',
        orderNumber: 'TEST-' + timestamp,
        moveVolume: '18',
        moveSize: '18',
        packingService: false,
        cleaningService: false,
        storageService: false,
        creditCheckStatus: 'approved',
        paymentMethod: 'invoice',
        startPropertyType: 'apartment',
        endPropertyType: 'apartment',
        startLivingArea: '65',
        endLivingArea: '65',
        startFloor: '1',
        endFloor: '2',
        startElevator: true,
        endElevator: true,
        startParkingDistance: '5',
        endParkingDistance: '5',
        moveDate: '2025-03-15',
        moveTime: '14:00',
        jobId: jobId,
        createdAt: new Date().toISOString()
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
    
    console.log('\n🎉 NY TEST-OFFERT SKAPAD!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 Booking ID:', booking.id)
    console.log('📅 Datum:', booking.move_date + ' kl ' + booking.move_time)
    console.log('💰 Pris:', booking.total_price + ' kr')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    console.log('\n🔗 KLICKA HÄR FÖR ATT SE OFFERTEN:')
    console.log(`http://localhost:3000/offer/${booking.id}?token=1234567890123456`)
    
    console.log('\n📝 INSTRUKTIONER:')
    console.log('1. Se till att Next.js-servern är omstartad')
    console.log('2. Klicka på länken ovan')
    console.log('3. Acceptera offerten')
    console.log('4. Bekräftelsesidan ska nu visas utan fel')
    console.log('5. Du kan lägga till tilläggstjänster via Staff App')
    
    // Om jobb skapades, skapa en test-tilläggstjänst
    if (jobId) {
      const testService = {
        job_id: jobId,
        service_id: 'test-service',
        service_name: 'Test-tilläggstjänst',
        service_category: 'other',
        quantity: 1,
        unit: 'st',
        unit_price: 500,
        total_price: 500,
        rut_eligible: false,
        added_by: 'Test System',
        added_at: new Date().toISOString()
      }
      
      const { error: serviceError } = await supabase
        .from('job_additional_services')
        .insert(testService)
        
      if (!serviceError) {
        console.log('\n✅ Test-tilläggstjänst skapad (500 kr)')
        console.log('   Den ska synas på bekräftelsesidan!')
      }
    }
    
  } catch (error) {
    console.error('❌ Fel:', error)
  }
}

createLatestOffer()