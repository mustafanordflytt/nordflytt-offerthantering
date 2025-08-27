import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  console.log('🧪 Testing job creation...');
  
  try {
    // First, let's check if jobs table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['jobs', 'bookings', 'customers', 'quotes']);

    if (tablesError) {
      console.error('Cannot query tables:', tablesError);
    } else {
      console.log('Available tables:', tables?.map(t => t.table_name));
    }

    // Try to create a simple test job
    const testJob = {
      customer_id: 'test-customer-123',
      title: 'Test Job Creation',
      description: 'Testing if job creation works',
      job_type: 'moving',
      status: 'pending',
      priority: 'medium',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      start_address: 'Test Address 1',  // Fixed: address_from → start_address
      end_address: 'Test Address 2',    // Fixed: address_to → end_address
      estimated_cost: 1000
    };

    console.log('Attempting to create job:', testJob);

    const { data: createdJob, error: createError } = await supabase
      .from('jobs')
      .insert([testJob])
      .select()
      .single();

    if (createError) {
      console.error('❌ Job creation failed:', createError);
      
      // Try to get column info
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'jobs');
      
      return NextResponse.json({
        success: false,
        error: createError.message,
        details: createError,
        availableColumns: columns,
        attemptedData: testJob
      });
    }

    console.log('✅ Test job created:', createdJob);

    // Clean up test job
    await supabase
      .from('jobs')
      .delete()
      .eq('id', createdJob.id);

    return NextResponse.json({
      success: true,
      message: 'Job creation test successful',
      createdJob,
      tables: tables?.map(t => t.table_name)
    });

  } catch (error) {
    console.error('💥 Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}