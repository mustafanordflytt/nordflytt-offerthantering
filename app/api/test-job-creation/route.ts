import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const body = await request.json();
    
    // Create a job with the exact schema we know works
    const jobData = {
      customer_id: body.customer_id,
      quote_id: body.booking_id,
      title: `JOB${Date.now().toString().slice(-8)} - ${body.customer_name}`,
      status: 'pending',
      scheduled_date: body.move_date,
      created_at: new Date().toISOString()
    };
    
    console.log('Creating job with data:', jobData);
    
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
        code: error.code,
        details: error,
        attempted_data: jobData
      }, { status: 400 });
    }
    
    console.log('Job created successfully:', job);
    
    return NextResponse.json({
      success: true,
      job: job,
      message: 'Job created successfully'
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}