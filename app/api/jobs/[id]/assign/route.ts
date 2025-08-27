import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST /api/jobs/[id]/assign - Assign staff to job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    if (!body.staff_ids || !Array.isArray(body.staff_ids) || body.staff_ids.length === 0) {
      return NextResponse.json(
        { error: 'Staff IDs array is required' },
        { status: 400 }
      );
    }

    // Verify job exists
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', params.id)
      .single();

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Create job assignments
    const assignments = body.staff_ids.map((staff_id: string, index: number) => ({
      job_id: params.id,
      staff_id: staff_id,
      role: index === 0 ? 'lead' : 'assistant',
      status: 'assigned'
    }));

    const { data: assignmentData, error: assignmentError } = await supabase
      .from('job_assignments')
      .insert(assignments)
      .select();

    if (assignmentError) {
      console.error('Error creating assignments:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to create assignments' },
        { status: 500 }
      );
    }

    // Update job status to assigned and store staff IDs
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status: 'assigned',
        assigned_staff: body.staff_ids,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating job:', updateError);
    }

    return NextResponse.json({
      success: true,
      assignments: assignmentData
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}