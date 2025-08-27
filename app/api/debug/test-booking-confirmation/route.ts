import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookingId = searchParams.get('id') || 'NF-23857BDE';
  
  console.log('🔍 DEBUG: Testing booking confirmation for:', bookingId);
  
  try {
    // Step 1: Check if booking exists
    console.log('Step 1: Checking if booking exists...');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .or(`id.eq.${bookingId},reference.eq.${bookingId}`)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({
        success: false,
        step: 'booking_lookup',
        error: bookingError?.message || 'Booking not found',
        searchedFor: bookingId
      });
    }

    console.log('✅ Booking found:', {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      customer_id: booking.customer_id,
      quote_id: booking.quote_id
    });

    // Step 2: Check if quote exists
    if (booking.quote_id) {
      console.log('Step 2: Checking quote...');
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', booking.quote_id)
        .single();

      console.log('Quote status:', quote ? {
        id: quote.id,
        status: quote.status,
        customer_id: quote.customer_id
      } : 'No quote found');
    }

    // Step 3: Check if job already exists
    console.log('Step 3: Checking for existing jobs...');
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('*')
      .or(`customer_id.eq.${booking.customer_id},quote_id.eq.${booking.quote_id || 'null'}`);

    console.log('Existing jobs:', existingJobs?.length || 0);

    // Step 4: Test the confirmation process
    console.log('Step 4: Testing confirmation process...');
    
    // First update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      return NextResponse.json({
        success: false,
        step: 'booking_update',
        error: updateError.message
      });
    }

    // Update quote if exists
    if (booking.quote_id) {
      await supabase
        .from('quotes')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.quote_id);
    }

    // Step 5: Test job creation
    console.log('Step 5: Testing job creation...');
    
    const jobData = {
      customer_id: booking.customer_id,
      quote_id: booking.quote_id,
      title: `Test Job - ${booking.service_type || 'Flytt'}`,
      description: 'Debug test job creation',
      job_type: 'moving',
      status: 'pending',
      priority: 'medium',
      scheduled_date: booking.move_date || new Date().toISOString().split('T')[0],
      scheduled_time: booking.move_time || '09:00',
      address_from: booking.start_address || '',
      address_to: booking.end_address || '',
      estimated_cost: booking.total_price || 0,
      special_requirements: booking.details?.specialInstructions || ''
    };

    console.log('Attempting to create job with data:', jobData);

    const { data: createdJob, error: jobError } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single();

    if (jobError) {
      return NextResponse.json({
        success: false,
        step: 'job_creation',
        error: jobError.message,
        details: jobError,
        jobData
      });
    }

    console.log('✅ Job created successfully:', createdJob.id);

    // Update booking with job reference
    await supabase
      .from('bookings')
      .update({ job_id: createdJob.id })
      .eq('id', booking.id);

    // Step 6: Verify job appears in calendar query
    console.log('Step 6: Verifying job in calendar query...');
    const { data: calendarJobs } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const jobInCalendar = calendarJobs?.find(j => j.id === createdJob.id);

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: 'confirmed',
        job_id: createdJob.id
      },
      job: createdJob,
      jobAppearsInCalendar: !!jobInCalendar,
      totalJobsInCalendar: calendarJobs?.length || 0,
      debugInfo: {
        bookingFound: true,
        quoteExists: !!booking.quote_id,
        jobCreated: true,
        steps: [
          'Booking found',
          'Status updated to confirmed',
          'Quote updated to accepted',
          'Job created successfully',
          'Booking linked to job',
          'Job visible in calendar query'
        ]
      }
    });

  } catch (error) {
    console.error('💥 Debug test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}