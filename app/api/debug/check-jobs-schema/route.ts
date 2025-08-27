import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('🔍 Checking jobs table schema...');
    
    // Get sample job to see columns
    const { data: sampleJob, error: sampleError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    
    // Get count
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    // Try to create a test job to see what columns are accepted
    const testJobData = {
      customer_id: 'test-customer-' + Date.now(),
      title: 'Schema Test Job',
      description: 'Testing job table schema',
      job_type: 'moving',
      status: 'pending',
      priority: 'medium',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      // Try both column names
      start_address: 'Test Start Address',
      end_address: 'Test End Address',
      estimated_cost: 1000
    };
    
    const { data: testJob, error: createError } = await supabase
      .from('jobs')
      .insert([testJobData])
      .select()
      .single();
    
    // Clean up test job if created
    if (testJob) {
      await supabase
        .from('jobs')
        .delete()
        .eq('id', testJob.id);
    }
    
    return NextResponse.json({
      schema: {
        tableExists: !sampleError || sampleError.code !== 'PGRST116',
        rowCount: count || 0,
        columns: sampleJob && sampleJob.length > 0 ? Object.keys(sampleJob[0]) : [],
        sampleRow: sampleJob?.[0] || null
      },
      testCreation: {
        success: !!testJob && !createError,
        error: createError?.message || null,
        createdJob: testJob || null,
        testedColumns: Object.keys(testJobData)
      },
      recommendations: {
        addressColumns: sampleJob && sampleJob.length > 0 ? 
          Object.keys(sampleJob[0]).filter(col => 
            col.includes('address') || col.includes('from') || col.includes('to')
          ) : [],
        statusColumns: sampleJob && sampleJob.length > 0 ?
          Object.keys(sampleJob[0]).filter(col => col.includes('status')) : []
      }
    });
    
  } catch (error) {
    console.error('💥 Schema check error:', error);
    return NextResponse.json({ 
      error: 'Schema check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}