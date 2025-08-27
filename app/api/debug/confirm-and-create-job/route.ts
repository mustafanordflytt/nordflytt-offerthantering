import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Missing bookingId' }, { status: 400 });
    }

    console.log('🚀 Starting simplified confirmation process for:', bookingId);

    // Step 1: Find booking
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .or(`id.eq.${bookingId},reference.eq.${bookingId}`);

    const booking = bookings?.[0];
    
    if (!booking) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found',
        searchedFor: bookingId 
      });
    }

    console.log('✅ Booking found:', booking.id);

    // Step 2: Update booking status
    await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    // Step 3: Create job directly
    const jobData = {
      customer_id: booking.customer_id || booking.id,
      title: `${booking.service_type || 'Flytt'} - ${booking.start_address?.split(',')[0] || 'Stockholm'}`,
      description: `Skapad från bokning ${booking.reference || booking.id}`,
      job_type: 'moving',
      status: 'pending',
      priority: 'medium',
      scheduled_date: booking.move_date || new Date().toISOString().split('T')[0],
      scheduled_time: booking.move_time || '09:00',
      start_address: booking.start_address || '',  // Fixed: address_from → start_address
      end_address: booking.end_address || '',      // Fixed: address_to → end_address
      estimated_cost: booking.total_price || 0,
      special_requirements: booking.details?.specialInstructions || ''
    };

    console.log('📦 Creating job with data:', jobData);

    const { data: createdJob, error: jobError } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single();

    if (jobError) {
      console.error('❌ Job creation error:', jobError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create job',
        details: jobError.message 
      });
    }

    console.log('✅ Job created:', createdJob.id);

    // Step 4: Update booking with job reference
    await supabase
      .from('bookings')
      .update({ job_id: createdJob.id })
      .eq('id', booking.id);

    // Step 5: Verify job appears in calendar endpoint
    const calendarResponse = await fetch(`${request.nextUrl.origin}/api/crm/jobs`);
    const calendarData = await calendarResponse.json();
    const jobInCalendar = calendarData.jobs?.find((j: any) => j.id === createdJob.id);

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: 'confirmed',
        job_id: createdJob.id
      },
      job: createdJob,
      calendarCheck: {
        totalJobs: calendarData.jobs?.length || 0,
        jobFound: !!jobInCalendar
      },
      nextSteps: [
        'Booking confirmed ✅',
        'Job created ✅',
        'Job linked to booking ✅',
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