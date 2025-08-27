import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
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
    
    // Try to get one job to see its structure
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    
    if (error) {
      // If table doesn't exist or other error
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        hint: 'Table might not exist or have different structure'
      }, { status: 400 });
    }
    
    // Get all jobs to see if any exist
    const { data: allJobs, error: allError } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    return NextResponse.json({
      success: true,
      sample: jobs?.[0] || null,
      columns: jobs?.[0] ? Object.keys(jobs[0]) : [],
      totalJobs: allJobs?.length || 0,
      message: jobs?.length ? 'Found existing job' : 'Jobs table is empty'
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}