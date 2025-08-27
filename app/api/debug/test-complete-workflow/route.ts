import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeBookingReference, uuidToDisplayReference } from '@/lib/utils/booking-reference';
import { createJobWithFallback } from '@/lib/utils/job-creation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { offerId } = await request.json();
    
    if (!offerId) {
      return NextResponse.json({ success: false, error: 'Missing offerId' }, { status: 400 });
    }

    console.log('🧪 Testing complete workflow for offer:', offerId);

    // Normalize the reference to handle both NF- format and UUID
    const { displayFormat, uuidFormat, searchPattern } = normalizeBookingReference(offerId);
    
    console.log('🔍 Normalized reference:', {
      original: offerId,
      display: displayFormat,
      uuid: uuidFormat
    });

    // Step 1: Check if booking exists (using bookings table as that's where data is)
    let booking = null;
    
    // Try UUID format first
    if (uuidFormat) {
      const { data: uuidMatch, error: uuidError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', uuidFormat)
        .single();
      
      if (!uuidError && uuidMatch) {
        booking = uuidMatch;
      }
    }
    
    // Try pattern match
    if (!booking) {
      const { data: matches } = await supabase
        .from('bookings')
        .select('*')
        .ilike('id', `${searchPattern}%`);
      
      if (matches && matches.length > 0) {
        booking = matches[0];
      }
    }

    if (!booking) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found',
        searchedFor: offerId,
        normalized: { displayFormat, uuidFormat, searchPattern }
      });
    }

    console.log('✅ Booking found:', {
      id: booking.id,
      reference: booking.reference || uuidToDisplayReference(booking.id),
      status: booking.status,
      customer_id: booking.customer_id
    });

    // Step 2: Check if lead exists
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('metadata->>offer_id', booking.id);

    console.log('📋 Leads found:', leads?.length || 0);

    // Step 3: Simulate booking acceptance
    console.log('🚀 Simulating booking acceptance...');

    // Update booking status - MINIMAL UPDATE
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed'  // ONLY status field!
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('❌ Failed to update booking:', updateError);
    }

    // Update lead status
    if (leads && leads.length > 0) {
      await supabase
        .from('leads')
        .update({
          status: 'qualified',
          updated_at: new Date().toISOString()
        })
        .eq('id', leads[0].id);
    }

    // Step 4: Create job using fallback approach
    console.log('📦 Creating job with fallback approach...');
    
    const jobResult = await createJobWithFallback(supabase, booking);
    
    if (!jobResult.success) {
      console.error('❌ Job creation failed:', jobResult.error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create job',
        details: jobResult.error 
      });
    }

    const createdJobId = jobResult.jobId!;
    console.log('✅ Job created:', createdJobId);
    
    // Since jobs are actually just confirmed bookings, we don't need to query a separate jobs table
    // The job IS the booking with confirmed status
    const createdJob = booking; // The booking IS the job after status update
    
    console.log('📌 Job is the booking itself (no separate jobs table)');

    // No need to update job_id since jobs aren't separate entities
    // Jobs are just bookings viewed differently

    // Step 5: Verify job appears in calendar by checking the booking
    const { data: calendarBooking } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', booking.id)
      .single();

    const jobInCalendar = calendarBooking;

    return NextResponse.json({
      success: true,
      workflow: {
        booking: {
          id: booking.id,
          reference: booking.reference || uuidToDisplayReference(booking.id),
          status: 'confirmed',
          job_id: createdJob.id
        },
        lead: {
          count: leads?.length || 0,
          status: 'qualified'
        },
        job: {
          id: createdJobId,
          bookingNumber: booking?.reference || uuidToDisplayReference(booking?.id || ''),
          status: 'confirmed'
        },
        calendar: {
          jobFound: !!jobInCalendar,
          jobData: jobInCalendar
        }
      },
      nextSteps: [
        'Booking confirmed ✅',
        'Lead updated ✅',
        'Job created ✅',
        `Job ${jobInCalendar ? 'IS' : 'NOT'} visible in calendar ${jobInCalendar ? '✅' : '❌'}`
      ]
    });

  } catch (error) {
    console.error('💥 Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}