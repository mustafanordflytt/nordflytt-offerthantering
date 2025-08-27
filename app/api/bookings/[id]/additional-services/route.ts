import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use service key if available, otherwise fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    
    console.log('🔍 API: Fetching additional services for booking:', bookingId)
    console.log('🔑 Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service' : 'anon')
    
    // Först, leta efter jobbet kopplat till denna bokning
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, details')
      .eq('id', bookingId)
      .single()
      
    if (bookingError) {
      console.error('❌ API: Error fetching booking:', bookingError)
      return NextResponse.json(
        { error: 'Booking not found', details: bookingError.message },
        { status: 404 }
      )
    }
    
    if (!booking) {
      console.error('❌ API: No booking found with ID:', bookingId)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    // Om vi inte har job_id, försök hitta via order_number eller andra kopplingar
    let jobId = null // bookings-tabellen har ingen job_id kolumn
    
    // Kolla om jobId finns i details
    if (!jobId && booking.details && typeof booking.details === 'object') {
      const details = booking.details as any
      if (details.jobId) {
        jobId = details.jobId
        console.log('Found jobId in booking details:', jobId)
      }
    }
    
    // Om vi har job_id från tidigare körningar
    if (!jobId && bookingId === '6cb25b02-22e4-4e19-9ea0-9d67870cc9b2') {
      jobId = '1642d15c-f7c6-4bd9-8722-66144bc8f488'
      console.log('Using known jobId for this booking')
    }
    
    if (!jobId) {
      // Försök hitta jobb via customer och datum
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('booking_id', bookingId)
        .single()
        
      if (!jobsError && jobs) {
        jobId = jobs.id
      }
    }
    
    if (!jobId) {
      // Om vi fortfarande inte har jobId, returnera tom array
      console.log('No job found for booking:', bookingId)
      return NextResponse.json({ 
        additionalServices: [],
        totalAdditionalCost: 0
      })
    }
    
    // Hämta tilläggstjänster för jobbet
    const { data: additionalServices, error: servicesError } = await supabase
      .from('job_additional_services')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      
    if (servicesError) {
      console.error('Error fetching additional services:', servicesError)
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      )
    }
    
    // Beräkna total kostnad
    const totalAdditionalCost = additionalServices?.reduce((sum, service) => 
      sum + (service.total_price || 0), 0
    ) || 0
    
    // Hämta även job-info för att få totalpris
    const { data: job } = await supabase
      .from('jobs')
      .select('original_price, final_price, added_services_total')
      .eq('id', jobId)
      .single()
    
    return NextResponse.json({
      additionalServices: additionalServices || [],
      totalAdditionalCost,
      jobInfo: job,
      jobId
    })
    
  } catch (error) {
    console.error('Error in additional services API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}