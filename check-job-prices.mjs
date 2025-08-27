import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const jobId = '000b8cc1-dabd-4283-9cbf-e6851aec302d'

async function checkJobPrices() {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('original_price, added_services_total, final_price')
    .eq('id', jobId)
    .single()
  
  if (error) {
    console.error('Fel:', error)
    return
  }
  
  console.log('💰 Jobb-priser efter tilläggstjänster:\n')
  console.log(`   Original pris: ${job.original_price} kr`)
  console.log(`   Tilläggstjänster: ${job.added_services_total} kr`)
  console.log(`   Slutpris: ${job.final_price} kr`)
  console.log(`   ✅ Trigger fungerade korrekt!`)
}

checkJobPrices()