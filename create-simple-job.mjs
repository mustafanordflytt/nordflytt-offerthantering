import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bookingId = 'd21137f5-bc8b-41a2-b515-aa680a93977f'

async function createSimpleJob() {
  try {
    // Skapa ett mycket enkelt jobb
    const jobData = {
      title: 'Test Flytt',
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639',
      scheduled_date: '2025-04-01',
      status: 'scheduled',
      original_price: 4440,
      final_price: 4440
    }
    
    const { data: job, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single()
      
    if (error) {
      console.error('Kunde inte skapa jobb:', error)
      return
    }
    
    console.log('✅ Jobb skapat med ID:', job.id)
    
    // Uppdatera booking med jobId
    const { data: booking } = await supabase
      .from('bookings')
      .select('details')
      .eq('id', bookingId)
      .single()
      
    await supabase
      .from('bookings')
      .update({
        details: {
          ...booking?.details,
          jobId: job.id
        }
      })
      .eq('id', bookingId)
      
    console.log('✅ Booking uppdaterad med jobId')
    
    // Lägg till tilläggstjänster
    const services = [
      {
        job_id: job.id,
        service_id: 'pack-1',
        service_name: 'Packhjälp (2 timmar)',
        service_category: 'packing',
        quantity: 2,
        unit: 'timmar',
        unit_price: 350,
        total_price: 700,
        rut_eligible: true,
        added_by: 'Test',
        added_at: new Date().toISOString()
      },
      {
        job_id: job.id,
        service_id: 'material-1',
        service_name: 'Flyttkartonger',
        service_category: 'material',
        quantity: 15,
        unit: 'st',
        unit_price: 79,
        total_price: 1185,
        rut_eligible: false,
        added_by: 'Test',
        added_at: new Date().toISOString()
      }
    ]
    
    const { error: servicesError } = await supabase
      .from('job_additional_services')
      .insert(services)
      
    if (servicesError) {
      console.error('Fel vid tillägg av tjänster:', servicesError)
    } else {
      console.log('✅ Tilläggstjänster skapade!')
      console.log('   - Packhjälp: 700 kr')
      console.log('   - Flyttkartonger: 1185 kr')
      console.log('   Total tillägg: 1885 kr')
    }
    
    console.log('\n🔄 Ladda om bekräftelsesidan:')
    console.log(`http://localhost:3000/order-confirmation/${bookingId}`)
    
  } catch (error) {
    console.error('Fel:', error)
  }
}

createSimpleJob()