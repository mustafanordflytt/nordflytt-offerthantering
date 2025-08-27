import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Kontrollerar sparade tilläggstjänster...\n')

async function checkServices() {
  // Hämta de senaste tilläggstjänsterna
  const { data: services, error } = await supabase
    .from('job_additional_services')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Fel:', error)
    return
  }
  
  if (services && services.length > 0) {
    console.log(`Hittade ${services.length} tilläggstjänster:\n`)
    services.forEach(service => {
      console.log(`📦 ${service.service_name}`)
      console.log(`   Pris: ${service.unit_price} kr x ${service.quantity} = ${service.total_price} kr`)
      console.log(`   Tillagd av: ${service.added_by}`)
      console.log(`   Tid: ${new Date(service.added_at).toLocaleString('sv-SE')}`)
      console.log(`   Job ID: ${service.job_id}`)
      console.log('')
    })
  } else {
    console.log('Inga tilläggstjänster hittades än.')
  }
}

checkServices()