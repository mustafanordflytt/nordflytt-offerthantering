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
    
    const body = await request.json();
    
    // Start with minimal fields and see what works
    const jobData: any = {
      customer_id: body.customer_id || 'test-customer-' + Date.now(),
      status: 'pending'
    };
    
    // Try adding fields one by one based on common patterns
    const possibleFields = {
      title: body.title || 'Test Job ' + Date.now(),
      description: body.description || 'Test job created via API',
      job_type: 'moving',
      priority: 'medium',
      scheduled_date: new Date().toISOString().split('T')[0],
      // Try different address field names
      from_address: body.from_address || 'Test From Address',
      to_address: body.to_address || 'Test To Address',
      // Alternative names
      address_from: body.from_address || 'Test From Address',
      address_to: body.to_address || 'Test To Address',
      // Try storing as JSON
      metadata: JSON.stringify({
        jobNumber: 'JOB' + Date.now(),
        scheduled_time: '09:00',
        services: ['moving']
      })
    };
    
    // Add fields based on what might exist
    Object.assign(jobData, possibleFields);
    
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
        details: error
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