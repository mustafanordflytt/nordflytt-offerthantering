import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBookingDetails() {
  const bookingId = '6cb25b02-22e4-4e19-9ea0-9d67870cc9b2'
  
  console.log('🔍 Checking booking details:', bookingId)
  
  // Hämta bokningen med alla fält
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()
    
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('\n📋 Booking fields:')
  Object.keys(booking).forEach(key => {
    const value = booking[key]
    if (value && typeof value === 'object') {
      console.log(`- ${key}:`, JSON.stringify(value, null, 2))
    } else {
      console.log(`- ${key}:`, value)
    }
  })
  
  // Kolla om det finns ett jobb med samma kundinformation
  const customerName = booking.customerName || booking.details?.customerName || 'Test Batman'
  console.log('\n🔎 Looking for job with customer name:', customerName)
  
  const { data: jobs, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .ilike('customer_name', `%${customerName}%`)
    
  if (!jobError && jobs && jobs.length > 0) {
    console.log(`✅ Found ${jobs.length} job(s) for this customer`)
    jobs.forEach(job => {
      console.log(`\nJob ${job.id}:`)
      console.log('- Customer:', job.customer_name)
      console.log('- Status:', job.status)
      console.log('- Created:', new Date(job.created_at).toLocaleDateString('sv-SE'))
    })
  }
}

checkBookingDetails()