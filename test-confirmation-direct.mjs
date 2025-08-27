import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bookingId = '3fa6a931-964e-431b-b3d1-61a6d09c7cb7'

async function checkBookingAndServices() {
  try {
    // Hämta bokning och dess status
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
      
    if (bookingError) {
      console.error('❌ Kunde inte hämta bokning:', bookingError)
      return
    }
    
    console.log('\n📄 BOKNING-STATUS:')
    console.log('   ID:', booking.id)
    console.log('   Status:', booking.status)
    console.log('   Payment Method:', booking.payment_method)
    console.log('   Total Price:', booking.total_price)
    
    // Kolla om jobId finns i details
    const jobId = booking.details?.jobId
    console.log('   Job ID:', jobId || 'Saknas')
    
    if (jobId) {
      // Hämta tilläggstjänster
      const { data: services, error: servicesError } = await supabase
        .from('job_additional_services')
        .select('*')
        .eq('job_id', jobId)
        
      if (services && services.length > 0) {
        console.log('\n📋 TILLÄGGSTJÄNSTER:')
        services.forEach(service => {
          console.log(`   - ${service.service_name}: ${service.total_price} kr`)
        })
      }
    }
    
    console.log('\n🔗 DIREKTLÄNKAR TILL BEKRÄFTELSESIDAN:')
    console.log('\n1. Med token (för att komma förbi middleware):')
    console.log(`   http://localhost:3000/order-confirmation/${bookingId}?token=1234567890123456`)
    
    console.log('\n2. Utan token (kan ge error om middleware blockerar):')
    console.log(`   http://localhost:3000/order-confirmation/${bookingId}`)
    
    console.log('\n💡 Tips: Använd länk #1 för att garanterat komma in på sidan.')
    
  } catch (error) {
    console.error('❌ Fel:', error)
  }
}

checkBookingAndServices()