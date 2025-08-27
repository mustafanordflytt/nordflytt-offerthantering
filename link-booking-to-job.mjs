import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function linkBookingToJob() {
  const bookingId = '6cb25b02-22e4-4e19-9ea0-9d67870cc9b2'
  const jobId = '870e464d-eff6-4cc4-85a6-6fc866acb5c5' // Jobbet som har tilläggstjänster
  
  console.log('🔗 Linking booking to job...')
  console.log('- Booking:', bookingId)
  console.log('- Job:', jobId)
  
  // Uppdatera bokningen med job_id
  const { data, error } = await supabase
    .from('bookings')
    .update({ job_id: jobId })
    .eq('id', bookingId)
    .select()
      
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Successfully linked booking to job\!')
    console.log('Updated booking:', data)
  }
  
  // Verifiera tilläggstjänsterna
  console.log('\n📋 Additional services for this job:')
  const { data: services } = await supabase
    .from('job_additional_services')
    .select('*')
    .eq('job_id', jobId)
    
  if (services && services.length > 0) {
    services.forEach(s => {
      console.log(`- ${s.service_name}: ${s.total_price} kr`)
    })
    const total = services.reduce((sum, s) => sum + s.total_price, 0)
    console.log(`💰 Total: ${total} kr`)
  }
}

linkBookingToJob()
EOF < /dev/null