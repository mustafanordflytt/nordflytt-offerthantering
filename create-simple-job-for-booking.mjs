import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSimpleJobForBooking() {
  const bookingId = '6cb25b02-22e4-4e19-9ea0-9d67870cc9b2'
  
  // 1. Skapa ett enkelt jobb
  console.log('🔨 Creating job for booking:', bookingId)
  
  const jobData = {
    customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639', // Samma som i bokningen
    title: 'Flytt - Mustafa Abdulkarim',
    status: 'scheduled',
    scheduled_date: '2025-01-30',
    original_price: 5500,
    final_price: 5500,
    added_services_total: 0
  }
  
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert([jobData])
    .select()
    .single()
    
  if (jobError) {
    console.error('❌ Error creating job:', jobError)
    return
  }
  
  console.log('✅ Job created:', job.id)
  
  // 2. Lägg till tilläggstjänster från det andra jobbet
  console.log('\n➕ Copying additional services...')
  
  const { data: existingServices } = await supabase
    .from('job_additional_services')
    .select('*')
    .eq('job_id', '870e464d-eff6-4cc4-85a6-6fc866acb5c5')
    
  if (existingServices && existingServices.length > 0) {
    const newServices = existingServices.map(service => ({
      ...service,
      id: undefined, // Ta bort ID så nya skapas
      job_id: job.id, // Använd det nya job ID:t
      created_at: undefined // Låt databasen sätta ny tid
    }))
    
    const { data: addedServices, error: servicesError } = await supabase
      .from('job_additional_services')
      .insert(newServices)
      .select()
      
    if (servicesError) {
      console.error('❌ Error adding services:', servicesError)
    } else {
      console.log('✅ Added', addedServices.length, 'services')
      
      const totalAdditional = addedServices.reduce((sum, s) => sum + s.total_price, 0)
      console.log('💰 Total additional services:', totalAdditional, 'kr')
      
      // Uppdatera jobbet med totalsumman
      await supabase
        .from('jobs')
        .update({ 
          final_price: job.original_price + totalAdditional,
          added_services_total: totalAdditional
        })
        .eq('id', job.id)
    }
  }
  
  // 3. Uppdatera bokningen med job_id i details
  console.log('\n🔗 Updating booking with job reference...')
  
  const { data: booking } = await supabase
    .from('bookings')
    .select('details')
    .eq('id', bookingId)
    .single()
    
  const updatedDetails = {
    ...booking.details,
    jobId: job.id
  }
  
  const { error: bookingUpdateError } = await supabase
    .from('bookings')
    .update({ details: updatedDetails })
    .eq('id', bookingId)
    
  if (!bookingUpdateError) {
    console.log('✅ Booking updated with job reference')
  }
  
  console.log('\n🎉 Job created successfully!')
  console.log('Job ID:', job.id)
  console.log('\n📌 Nu kan du ladda om bekräftelsesidan för att se tilläggstjänsterna!')
}

createSimpleJobForBooking()