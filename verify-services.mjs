import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bookingId = 'd21137f5-bc8b-41a2-b515-aa680a93977f'

async function verifyServices() {
  console.log('🔍 VERIFIERAR TILLÄGGSTJÄNSTER\n')
  
  // 1. Hämta booking och jobId
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, details')
    .eq('id', bookingId)
    .single()
    
  console.log('📋 BOKNING:')
  console.log('   ID:', booking.id)
  console.log('   Status:', booking.status)
  console.log('   Total pris (booking):', booking.total_price)
  console.log('   Job ID i details:', booking.details?.jobId)
  
  const jobId = booking.details?.jobId
  
  if (!jobId) {
    console.log('\n❌ Ingen jobId hittades i bokningen!')
    return
  }
  
  // 2. Hämta jobb
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()
    
  console.log('\n💼 JOBB:')
  console.log('   ID:', job?.id)
  console.log('   Titel:', job?.title)
  console.log('   Original pris:', job?.original_price)
  console.log('   Tilläggstjänster total:', job?.added_services_total)
  console.log('   Slutpris:', job?.final_price)
  
  // 3. Hämta tilläggstjänster
  const { data: services } = await supabase
    .from('job_additional_services')
    .select('*')
    .eq('job_id', jobId)
    
  console.log('\n📦 TILLÄGGSTJÄNSTER:')
  if (services && services.length > 0) {
    services.forEach(service => {
      console.log(`   - ${service.service_name}: ${service.total_price} kr`)
    })
    const total = services.reduce((sum, s) => sum + parseFloat(s.total_price), 0)
    console.log(`   TOTALT: ${total} kr`)
  } else {
    console.log('   ❌ Inga tilläggstjänster hittades!')
  }
  
  // 4. Testa API endpoint
  console.log('\n🔗 TESTAR API ENDPOINT:')
  try {
    const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}/additional-services`)
    const text = await response.text()
    
    console.log('   Status:', response.status)
    console.log('   Response:', text)
    
    if (response.ok) {
      const data = JSON.parse(text)
      console.log('   Tjänster från API:', data.additionalServices?.length || 0)
      console.log('   Total från API:', data.totalAdditionalCost || 0)
    }
  } catch (error) {
    console.log('   ❌ API fel:', error.message)
  }
  
  console.log('\n💡 OM TJÄNSTERNA INTE SYNS:')
  console.log('   1. Kontrollera att Next.js servern är omstartad')
  console.log('   2. Rensa browser-cache (Ctrl+Shift+R)')
  console.log('   3. Kontrollera konsolen i webbläsaren för fel')
}

verifyServices()