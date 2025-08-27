import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const jobId = '000b8cc1-dabd-4283-9cbf-e6851aec302d'
const bookingId = '3fa6a931-964e-431b-b3d1-61a6d09c7cb7'

console.log('🔍 Verifierar hela flödet...\n')

async function verifyFlow() {
  // 1. Kontrollera jobbet
  console.log('1️⃣ JOBB-INFO:')
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, original_price, added_services_total, final_price')
    .eq('id', jobId)
    .single()
    
  if (job) {
    console.log(`   ID: ${job.id}`)
    console.log(`   Titel: ${job.title}`)
    console.log(`   Original pris: ${job.original_price} kr`)
    console.log(`   Tilläggstjänster total: ${job.added_services_total} kr`)
    console.log(`   Slutpris: ${job.final_price} kr`)
  }
  
  // 2. Kontrollera tilläggstjänster
  console.log('\n2️⃣ TILLÄGGSTJÄNSTER:')
  const { data: services } = await supabase
    .from('job_additional_services')
    .select('*')
    .eq('job_id', jobId)
    
  if (services && services.length > 0) {
    services.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.service_name}`)
      console.log(`      Pris: ${service.unit_price} kr x ${service.quantity} = ${service.total_price} kr`)
      console.log(`      Tillagd av: ${service.added_by}`)
      console.log(`      Tid: ${new Date(service.added_at).toLocaleString('sv-SE')}`)
    })
  } else {
    console.log('   Inga tilläggstjänster hittades')
  }
  
  // 3. Kontrollera bokningen
  console.log('\n3️⃣ BOKNING-INFO:')
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, customer_email, total_price, details')
    .eq('id', bookingId)
    .single()
    
  if (booking) {
    console.log(`   ID: ${booking.id}`)
    console.log(`   Email: ${booking.customer_email}`)
    console.log(`   Bokningens pris: ${booking.total_price} kr`)
    console.log(`   Job ID i details: ${booking.details?.jobId || 'Saknas'}`)
  }
  
  // 4. Sammanfattning
  console.log('\n4️⃣ SAMMANFATTNING:')
  console.log(`   ✅ Jobb finns med slutpris: ${job?.final_price} kr`)
  console.log(`   ✅ ${services?.length || 0} tilläggstjänster registrerade`)
  console.log(`   ✅ Bokning kopplad till jobb: ${booking?.details?.jobId === jobId ? 'JA' : 'NEJ'}`)
  
  console.log('\n📄 Testa bekräftelsesidan:')
  console.log(`   http://localhost:3000/order-confirmation/${bookingId}`)
  
  console.log('\n💡 På bekräftelsesidan ska du se:')
  console.log('   - Grundpris: 5,000 kr')
  console.log('   - Tilläggstjänster: +' + (job?.added_services_total || 0) + ' kr')
  console.log('   - Totalt: ' + (job?.final_price || 0) + ' kr')
}

verifyFlow()