import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Booking ID från bekräftelsesidan
const bookingId = 'd21137f5-bc8b-41a2-b515-aa680a93977f'

async function addTestServices() {
  try {
    // Hämta bokningen för att få jobId
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('details')
      .eq('id', bookingId)
      .single()
      
    let jobId = booking?.details?.jobId
    
    if (!jobId) {
      console.log('Ingen jobId hittades, skapar nytt jobb...')
      
      // Försök skapa ett jobb direkt
      const jobData = {
        title: 'Flytt - Test Batman',
        customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639',
        scheduled_date: '2025-04-01',
        scheduled_time: '10:00:00',
        status: 'scheduled',
        start_address: 'Testgatan 1, Stockholm',
        end_address: 'Målgatan 2, Stockholm',
        original_price: 4440,
        final_price: 4440,
        service_type: 'moving'
      }
      
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single()
        
      if (jobError) {
        console.error('Kunde inte skapa jobb:', jobError)
        return
      }
      
      console.log('✅ Nytt jobb skapat:', job.id)
      
      // Uppdatera booking med jobId
      await supabase
        .from('bookings')
        .update({
          details: {
            ...booking?.details,
            jobId: job.id
          }
        })
        .eq('id', bookingId)
        
      jobId = job.id
    }
    
    console.log('🔧 Använder job ID:', jobId)
    
    // Lägg till test-tilläggstjänster
    const testServices = [
      {
        job_id: jobId,
        service_id: 'packing-service',
        service_name: 'Packhjälp',
        service_category: 'packing',
        quantity: 2,
        unit: 'timmar',
        unit_price: 350,
        total_price: 700,
        rut_eligible: true,
        added_by: 'Test System',
        added_at: new Date().toISOString()
      },
      {
        job_id: jobId,
        service_id: 'special-emballering',
        service_name: 'Specialemballering',
        service_category: 'material',
        quantity: 1,
        unit: 'st',
        unit_price: 250,
        total_price: 250,
        rut_eligible: false,
        added_by: 'Test System',
        added_at: new Date().toISOString()
      },
      {
        job_id: jobId,
        service_id: 'moving-boxes',
        service_name: 'Flyttkartonger',
        service_category: 'material',
        quantity: 10,
        unit: 'st',
        unit_price: 79,
        total_price: 790,
        rut_eligible: false,
        added_by: 'Test System',
        added_at: new Date().toISOString()
      }
    ]
    
    // Ta bort eventuella gamla tjänster först
    await supabase
      .from('job_additional_services')
      .delete()
      .eq('job_id', jobId)
    
    // Lägg till nya tjänster
    const { data: services, error: servicesError } = await supabase
      .from('job_additional_services')
      .insert(testServices)
      .select()
      
    if (servicesError) {
      console.error('Fel vid tillägg av tjänster:', servicesError)
      return
    }
    
    console.log('\n✅ TILLÄGGSTJÄNSTER SKAPADE!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    services.forEach(service => {
      console.log(`📦 ${service.service_name}: ${service.total_price} kr`)
    })
    
    const total = services.reduce((sum, s) => sum + parseFloat(s.total_price), 0)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`💰 Total tillägg: ${total} kr`)
    console.log(`💰 Nytt totalpris: ${4440 + total} kr`)
    
    console.log('\n🔄 LADDA OM BEKRÄFTELSESIDAN FÖR ATT SE TJÄNSTERNA!')
    console.log(`   http://localhost:3000/order-confirmation/${bookingId}`)
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

addTestServices()