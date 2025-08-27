import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyBookingExists() {
  const bookingId = '6cb25b02-22e4-4e19-9ea0-9d67870cc9b2'
  
  console.log('🔍 Verifying booking:', bookingId)
  
  // 1. Kolla bookings-tabellen
  const { data: booking, error: bookingError, count } = await supabase
    .from('bookings')
    .select('id, status, created_at', { count: 'exact' })
    .eq('id', bookingId)
    
  console.log('\n📋 Bookings table:')
  console.log('- Count:', count)
  console.log('- Data:', booking)
  console.log('- Error:', bookingError)
  
  // 2. Kolla quotes-tabellen
  const { data: quote, error: quoteError, count: quoteCount } = await supabase
    .from('quotes')
    .select('id, status, created_at', { count: 'exact' })
    .eq('id', bookingId)
    
  console.log('\n📋 Quotes table:')
  console.log('- Count:', quoteCount)
  console.log('- Data:', quote)
  console.log('- Error:', quoteError)
  
  // 3. Om den finns i någon tabell, hämta full data
  if (booking && booking.length > 0) {
    const { data: fullBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
      
    console.log('\n✅ Full booking data found:')
    console.log('- Status:', fullBooking.status)
    console.log('- Has job_id?', !!fullBooking.job_id)
    console.log('- Has details.jobId?', !!fullBooking.details?.jobId)
    if (fullBooking.details?.jobId) {
      console.log('- JobId in details:', fullBooking.details.jobId)
    }
  } else if (quote && quote.length > 0) {
    console.log('\n⚠️ ID found in quotes table, not bookings!')
  } else {
    console.log('\n❌ ID not found in either table!')
  }
}

verifyBookingExists()