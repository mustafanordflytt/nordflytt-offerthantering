import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 1. Count all jobs
    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    // 2. Get all jobs
    const { data: allJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // 3. Get today's jobs
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('scheduled_date', today);
    
    // 4. Get recent bookings to see if they have jobs
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id, customer_email, created_at, details')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return NextResponse.json({
      success: true,
      debug: {
        totalJobs: totalJobs || 0,
        allJobs: allJobs || [],
        todaysJobs: todaysJobs || [],
        recentBookings: recentBookings || [],
        jobsError: jobsError?.message || null
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}