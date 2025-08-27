import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addServicesToJob() {
  const jobId = '1642d15c-f7c6-4bd9-8722-66144bc8f488'
  
  console.log('➕ Adding services to job:', jobId)
  
  // Skapa nya tilläggstjänster med unika ID:n
  const services = [
    {
      id: randomUUID(),
      job_id: jobId,
      service_id: 'pack-help',
      service_name: 'Packhjälp',
      service_category: 'packing',
      notes: '2 timmar packhjälp',
      quantity: 2,
      unit: 'timmar',
      unit_price: 350,
      total_price: 700,
      rut_eligible: true,
      added_by: 'Mustafa (kund)',
      added_at: new Date().toISOString()
    },
    {
      id: randomUUID(),
      job_id: jobId,
      service_id: 'moving-boxes',
      service_name: 'Flyttkartonger',
      service_category: 'materials',
      notes: '15 st flyttkartonger',
      quantity: 15,
      unit: 'st',
      unit_price: 79,
      total_price: 1185,
      rut_eligible: false,
      added_by: 'Mustafa (kund)',
      added_at: new Date().toISOString()
    },
    {
      id: randomUUID(),
      job_id: jobId,
      service_id: 'bubble-wrap',
      service_name: 'Bubbelplast',
      service_category: 'materials',
      notes: 'Skyddsemballering för ömtåliga föremål',
      quantity: 1,
      unit: 'rulle',
      unit_price: 299,
      total_price: 299,
      rut_eligible: false,
      added_by: 'Personal (på plats)',
      added_at: new Date().toISOString()
    }
  ]
  
  const { data, error } = await supabase
    .from('job_additional_services')
    .insert(services)
    .select()
    
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Successfully added', data.length, 'services')
    
    const totalAdditional = data.reduce((sum, s) => sum + s.total_price, 0)
    console.log('💰 Total additional services:', totalAdditional, 'kr')
    
    // Uppdatera jobbet
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        final_price: 5500 + totalAdditional,
        added_services_total: totalAdditional
      })
      .eq('id', jobId)
      
    if (!updateError) {
      console.log('✅ Updated job with new total:', 5500 + totalAdditional, 'kr')
    }
  }
  
  console.log('\n🎉 Nu kan du ladda om bekräftelsesidan!')
  console.log('URL: http://localhost:3000/order-confirmation/6cb25b02-22e4-4e19-9ea0-9d67870cc9b2')
}

addServicesToJob()