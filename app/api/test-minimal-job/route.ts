import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration missing'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Try absolute minimal job
    const jobData = {
      customer_id: '64cb61e7-16bd-4fe1-8552-8331523a0639', // From last booking
      status: 'pending'
    };
    
    console.log('Creating minimal job:', jobData);
    
    const { data: job, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select();
    
    if (error) {
      console.error('Job creation error:', error);
      
      // Try to understand the error better
      if (error.message.includes('column')) {
        return NextResponse.json({
          success: false,
          error: 'Column mismatch',
          details: error,
          hint: 'Check which columns exist in jobs table'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      job: job,
      message: 'Minimal job created successfully'
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}