import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gindcnpiejkntkangpuc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbmRjbnBpZWprbnRrYW5ncHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMyMzY4NiwiZXhwIjoyMDU5ODk5Njg2fQ.PDSFabceXFB7C3s868rhq4TU_3ElYD8h3xedNqm2aoI'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createDemoJobWithServices() {
  const bookingId = '6cb25b02-22e4-4e19-9ea0-9d67870cc9b2'
  
  // 1. Skapa ett nytt jobb för Mustafa Abdulkarim
  console.log('🔨 Creating new job for Mustafa Abdulkarim...')
  
  const jobData = {
    customer_name: 'Mustafa Abdulkarim',
    customer_email: 'mustafa@nordflytt.se',
    customer_phone: '070-123 45 67',
    date: '2025-01-30',
    time_slot: '10:00-14:00',
    addresses: {
      start: 'Kungsgatan 10, 11143 Stockholm',
      end: 'Vasagatan 25, 11120 Stockholm'
    },
    status: 'scheduled',
    original_price: 5500,
    final_price: 5500,
    job_details: {
      bookingId: bookingId,
      moveSize: 20,
      startFloor: 3,
      endFloor: 2,
      hasElevatorStart: true,
      hasElevatorEnd: true
    }
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
  
  // 2. Lägg till tilläggstjänster
  console.log('\n➕ Adding additional services...')
  
  const additionalServices = [
    {
      job_id: job.id,
      service_name: 'Packhjälp',
      description: '2 timmar packhjälp',
      quantity: 2,
      unit: 'timmar',
      unit_price: 350,
      total_price: 700,
      added_by: 'Mustafa (kund)',
      added_at: new Date().toISOString()
    },
    {
      job_id: job.id,
      service_name: 'Flyttkartonger',
      description: '15 st flyttkartonger',
      quantity: 15,
      unit: 'st',
      unit_price: 79,
      total_price: 1185,
      added_by: 'Mustafa (kund)',
      added_at: new Date().toISOString()
    },
    {
      job_id: job.id,
      service_name: 'Bubbelplast',
      description: 'Skyddsemballering för ömtåliga föremål',
      quantity: 1,
      unit: 'rulle',
      unit_price: 299,
      total_price: 299,
      added_by: 'Personal (på plats)',
      added_at: new Date().toISOString()
    }
  ]
  
  const { data: services, error: servicesError } = await supabase
    .from('job_additional_services')
    .insert(additionalServices)
    .select()
    
  if (servicesError) {
    console.error('❌ Error adding services:', servicesError)
  } else {
    console.log('✅ Added', services.length, 'additional services')
    
    const totalAdditional = services.reduce((sum, s) => sum + s.total_price, 0)
    console.log('💰 Total additional services:', totalAdditional, 'kr')
    
    // 3. Uppdatera jobbet med ny totalpris
    const newTotalPrice = job.original_price + totalAdditional
    
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        final_price: newTotalPrice,
        added_services_total: totalAdditional
      })
      .eq('id', job.id)
      
    if (!updateError) {
      console.log('✅ Updated job total price to:', newTotalPrice, 'kr')
    }
  }
  
  // 4. Uppdatera bokningen med job_id i details
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
  
  console.log('\n🎉 Demo job created successfully!')
  console.log('Job ID:', job.id)
  console.log('Now refresh the confirmation page to see the additional services!')
}

createDemoJobWithServices()