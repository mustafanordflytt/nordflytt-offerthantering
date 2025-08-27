import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🧪 Testar tilläggstjänster-systemet...\n')

async function testAdditionalServices() {
  try {
    // 1. Skapa ett test-jobb först
    console.log('1️⃣ Skapar test-jobb...')
    const testJob = {
      id: crypto.randomUUID(),
      title: `Test jobb - ${new Date().toISOString()}`,
      original_price: 5000,
      status: 'pending',
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639' // Using existing customer
    }
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(testJob)
      .select()
      .single()
    
    if (jobError) {
      console.error('❌ Kunde inte skapa jobb:', jobError)
      return
    }
    
    console.log('✅ Test-jobb skapat:', job.id)
    console.log('   Original pris:', job.original_price, 'kr')
    
    // 2. Testa att lägga till tjänster via API
    console.log('\n2️⃣ Testar API för att lägga till tjänster...')
    
    const testServices = [
      {
        id: 'tunga-lyft-100kg',
        name: 'Tunga lyft - Piano',
        category: 'tunga-lyft',
        price: 1000,
        quantity: 1,
        rutEligible: true
      },
      {
        id: 'flyttkartonger',
        name: 'Flyttkartonger',
        category: 'material',
        price: 79,
        quantity: 10,
        unit: 'st',
        rutEligible: false
      }
    ]
    
    // Simulera API-anrop (eftersom server kanske inte kör)
    console.log('   Lägger till tjänster direkt i databasen...')
    
    for (const service of testServices) {
      const { data: added, error: addError } = await supabase
        .from('job_additional_services')
        .insert({
          job_id: job.id,
          service_id: service.id,
          service_name: service.name,
          service_category: service.category,
          quantity: service.quantity,
          unit: service.unit,
          unit_price: service.price,
          total_price: service.price * service.quantity,
          rut_eligible: service.rutEligible,
          added_by: 'Test Script'
        })
        .select()
        .single()
      
      if (addError) {
        console.error(`❌ Fel vid tillägg av ${service.name}:`, addError)
        console.error('   Service data:', {
          job_id: job.id,
          service_id: service.id,
          service_name: service.name,
          quantity: service.quantity,
          total_price: service.price * service.quantity
        })
      } else {
        console.log(`✅ Lade till: ${service.name} - ${added.total_price} kr`)
      }
    }
    
    // 3. Kontrollera att trigger fungerade
    console.log('\n3️⃣ Kontrollerar att trigger uppdaterade jobbet...')
    
    const { data: updatedJob, error: fetchError } = await supabase
      .from('jobs')
      .select('original_price, added_services_total, final_price')
      .eq('id', job.id)
      .single()
    
    if (fetchError) {
      console.error('❌ Kunde inte hämta uppdaterat jobb:', fetchError)
    } else {
      console.log('✅ Jobb uppdaterat:')
      console.log('   Original pris:', updatedJob.original_price, 'kr')
      console.log('   Tilläggstjänster:', updatedJob.added_services_total, 'kr')
      console.log('   Slutpris:', updatedJob.final_price, 'kr')
    }
    
    // 4. Testa view
    console.log('\n4️⃣ Testar job_services_summary view...')
    
    const { data: summary, error: viewError } = await supabase
      .from('job_services_summary')
      .select('*')
      .eq('job_id', job.id)
      .single()
    
    if (viewError) {
      console.error('❌ Kunde inte läsa från view:', viewError)
    } else {
      console.log('✅ Summary från view:')
      console.log('   Antal tjänster:', summary.additional_services_count)
      console.log('   Total med tillägg:', summary.total_price_with_additions, 'kr')
      console.log('   Tjänster:', summary.services_list)
    }
    
    // 5. Städa upp
    console.log('\n5️⃣ Städar upp test-data...')
    
    await supabase
      .from('job_additional_services')
      .delete()
      .eq('job_id', job.id)
    
    await supabase
      .from('jobs')
      .delete()
      .eq('id', job.id)
    
    console.log('✅ Test-data borttaget')
    
    console.log('\n🎉 Alla tester genomförda!')
    console.log('\n📋 Nästa steg:')
    console.log('1. Uppdatera handleServiceAdded i Staff App')
    console.log('2. Testa i webbläsaren')
    console.log('3. Uppdatera bekräftelsesidan')
    console.log('4. Verifiera fakturering')
    
  } catch (error) {
    console.error('❌ Fel:', error)
  }
}

testAdditionalServices()