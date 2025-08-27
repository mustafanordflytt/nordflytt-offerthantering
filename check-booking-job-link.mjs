import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBookingJobLink() {
  const bookingId = 'b87bc970-d99f-45ae-aa8f-1fb8bb44c3e4'
  
  console.log('🔍 Checking booking:', bookingId)
  
  // 1. Hämta bokningen
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()
    
  if (bookingError) {
    console.error('❌ Booking error:', bookingError)
    return
  }
  
  console.log('\n📋 Booking data:')
  console.log('- ID:', booking.id)
  console.log('- Customer name:', booking.customerName)
  console.log('- Status:', booking.status)
  console.log('- Job ID field:', booking.job_id || 'Not set')
  console.log('- Details contains jobId?', booking.details?.jobId || 'No')
  
  // 2. Försök hitta jobb kopplat till bokningen
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, booking_id, customer_name, status')
    .eq('booking_id', bookingId)
    
  if (jobsError) {
    console.error('❌ Jobs error:', jobsError)
  } else {
    console.log('\n💼 Jobs linked to booking:', jobs.length)
    jobs.forEach(job => {
      console.log(`- Job ${job.id}: ${job.customer_name} (${job.status})`)
    })
  }
  
  // 3. Om vi har ett job ID, kolla tilläggstjänster
  const jobId = booking.job_id || jobs?.[0]?.id
  
  if (jobId) {
    console.log('\n🔎 Checking additional services for job:', jobId)
    
    const { data: services, error: servicesError } = await supabase
      .from('job_additional_services')
      .select('*')
      .eq('job_id', jobId)
      
    if (servicesError) {
      console.error('❌ Services error:', servicesError)
    } else if (services.length > 0) {
      console.log('✅ Found', services.length, 'additional services:')
      services.forEach(service => {
        console.log(`  - ${service.service_name}: ${service.total_price} kr (${service.quantity} ${service.unit})`)
      })
      const total = services.reduce((sum, s) => sum + s.total_price, 0)
      console.log(`  💰 Total: ${total} kr`)
    } else {
      console.log('❌ No additional services found for job', jobId)
    }
  } else {
    console.log('\n❌ No job ID found - cannot check additional services')
  }
}

checkBookingJobLink()