import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Create a simple test job
    const jobData = {
      booking_id: 'test-booking-' + Date.now(),
      customer_id: 'test-customer-' + Date.now(),
      customer_name: 'Test Customer Direct',
      from_address: 'Test From Address',
      to_address: 'Test To Address',
      scheduled_date: new Date().toISOString().split('T')[0],
      services: ['moving'],
      estimated_hours: 4,
      status: 'scheduled',
      metadata: {
        jobNumber: 'JOB' + Date.now(),
        scheduled_time: '14:00',
        move_time: '14:00'
      }
    };
    
    console.log('Attempting to create job:', jobData);
    
    const { data: job, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single();
    
    if (error) {
      console.error('Job creation error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      job: job,
      message: 'Test job created successfully'
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}