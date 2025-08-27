import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAllData() {
  console.log('🔍 Checking all bookings and jobs...\n')
  
  // 1. Lista alla bokningar
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
    
  if (bookingsError) {
    console.error('❌ Bookings error:', bookingsError)
  } else {
    console.log('📋 Latest bookings:')
    bookings.forEach(b => {
      console.log(`- ${b.id} | Status: ${b.status} | Created: ${new Date(b.created_at).toLocaleDateString('sv-SE')}`)
      if (b.job_id) console.log(`  → Has job_id: ${b.job_id}`)
    })
  }
  
  // 2. Lista alla jobb
  console.log('\n💼 Latest jobs:')
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
    
  if (jobsError) {
    console.error('❌ Jobs error:', jobsError)
  } else {
    jobs.forEach(j => {
      console.log(`- ${j.id} | ${j.customer_name || 'No name'} | Status: ${j.status}`)
    })
  }
  
  // 3. Lista alla tilläggstjänster
  console.log('\n➕ All additional services in database:')
  const { data: services, error: servicesError } = await supabase
    .from('job_additional_services')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (servicesError) {
    console.error('❌ Services error:', servicesError)
  } else if (services && services.length > 0) {
    console.log(`Found ${services.length} additional services:`)
    services.forEach(s => {
      console.log(`- Job ${s.job_id}: ${s.service_name} - ${s.total_price} kr`)
    })
  } else {
    console.log('❌ No additional services found in database')
  }
}

checkAllData()