import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bookingId = '3fa6a931-964e-431b-b3d1-61a6d09c7cb7'

// Simulera samma query som bekräftelsesidan gör
async function checkConfirmationData() {
  try {
    // 1. Hämta booking med customer
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers!bookings_customer_id_fkey (
          name,
          email,
          phone,
          address,
          city,
          postal_code,
          id
        )
      `)
      .eq('id', bookingId)
      .single()
      
    if (bookingError) {
      console.error('❌ Fel vid hämtning av bokning:', bookingError)
      return
    }
    
    console.log('\n✅ BOKNING HÄMTAD:')
    console.log('   Status:', bookingData.status)
    console.log('   Kund:', bookingData.customers?.name || bookingData.customer_name || 'Okänd')
    console.log('   Total pris:', bookingData.total_price)
    console.log('   Job ID:', bookingData.details?.jobId)
    
    // 2. Kolla tilläggstjänster om jobId finns
    if (bookingData.details?.jobId) {
      const { data: services, error: servicesError } = await supabase
        .from('job_additional_services')
        .select('*')
        .eq('job_id', bookingData.details.jobId)
        
      console.log('\n📋 TILLÄGGSTJÄNSTER:')
      if (services && services.length > 0) {
        services.forEach(s => {
          console.log(`   - ${s.service_name}: ${s.total_price} kr`)
        })
        const total = services.reduce((sum, s) => sum + parseFloat(s.total_price), 0)
        console.log(`   TOTALT TILLÄGG: ${total} kr`)
      } else {
        console.log('   Inga tilläggstjänster')
      }
    }
    
    // 3. Test API endpoint
    console.log('\n🔗 TESTAR API ENDPOINT:')
    const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}/additional-services`)
    if (response.ok) {
      const apiData = await response.json()
      console.log('   API svarade med:', apiData)
    } else {
      console.log('   API fel:', response.status, response.statusText)
    }
    
  } catch (error) {
    console.error('❌ Fel:', error)
  }
}

checkConfirmationData()