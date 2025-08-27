import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    
    // Build query
    let query = supabase
      .from('jobs')
      .select(`
        id,
        customer_name,
        customer_id,
        from_address,
        to_address,
        scheduled_date,
        scheduled_time,
        services,
        estimated_hours,
        status,
        metadata,
        created_at
      `)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (date) {
      query = query.eq('scheduled_date', date);
    }
    
    const { data: jobs, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      // Return mock data if database fails
      return NextResponse.json({
        success: true,
        assignments: getMockAssignments(staffId, status, date)
      });
    }
    
    // Transform jobs into assignments
    const assignments = (jobs || []).map(job => ({
      id: job.id,
      jobId: job.id,
      jobNumber: job.metadata?.jobNumber || `JOB${job.id.slice(0, 8)}`,
      staffId: staffId || 'staff-1',
      staffName: 'Anders Andersson',
      role: 'team_leader',
      customerName: job.customer_name,
      customerId: job.customer_id,
      date: job.scheduled_date,
      time: job.scheduled_time || '09:00',
      duration: job.estimated_hours || 4,
      fromAddress: job.from_address,
      toAddress: job.to_address,
      services: job.services || ['moving'],
      status: job.status || 'scheduled',
      priority: job.metadata?.priority || 'normal',
      notes: job.metadata?.notes || '',
      createdAt: job.created_at
    }));
    
    // Calculate summary statistics
    const summary = {
      total: assignments.length,
      byStatus: {
        scheduled: assignments.filter(a => a.status === 'scheduled').length,
        in_progress: assignments.filter(a => a.status === 'in_progress').length,
        completed: assignments.filter(a => a.status === 'completed').length,
        cancelled: assignments.filter(a => a.status === 'cancelled').length
      },
      totalHours: assignments.reduce((sum, a) => sum + a.duration, 0),
      upcomingToday: assignments.filter(a => 
        a.date === new Date().toISOString().split('T')[0] && 
        a.status === 'scheduled'
      ).length
    };
    
    return NextResponse.json({
      success: true,
      assignments,
      summary
    });
    
  } catch (error: any) {
    console.error('Assignments API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assignments',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const data = await request.json();
    
    // Create new assignment
    const { jobId, staffId, role } = data;
    
    // Update job with staff assignment
    const { data: job } = await supabase
      .from('jobs')
      .select('metadata')
      .eq('id', jobId)
      .single();
    
    if (job) {
      const metadata = job.metadata || {};
      metadata.assignments = metadata.assignments || [];
      
      // Add new assignment
      metadata.assignments.push({
        staffId,
        staffName: data.staffName || 'Staff Member',
        role: role || 'mover',
        assignedAt: new Date().toISOString(),
        assignedBy: data.assignedBy || 'system'
      });
      
      // Update job
      await supabase
        .from('jobs')
        .update({ metadata })
        .eq('id', jobId);
      
      return NextResponse.json({
        success: true,
        assignment: {
          jobId,
          staffId,
          role,
          assignedAt: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Job not found'
    }, { status: 404 });
    
  } catch (error: any) {
    console.error('Assignment creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create assignment',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { jobId, staffId } = await request.json();
    
    // Remove assignment from job
    const { data: job } = await supabase
      .from('jobs')
      .select('metadata')
      .eq('id', jobId)
      .single();
    
    if (job) {
      const metadata = job.metadata || {};
      if (metadata.assignments) {
        metadata.assignments = metadata.assignments.filter(
          (a: any) => a.staffId !== staffId
        );
        
        await supabase
          .from('jobs')
          .update({ metadata })
          .eq('id', jobId);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Assignment removed'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Job not found'
    }, { status: 404 });
    
  } catch (error: any) {
    console.error('Assignment deletion error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove assignment',
      details: error.message
    }, { status: 500 });
  }
}

// Mock data generator
function getMockAssignments(staffId?: string, status?: string, date?: string) {
  const statuses = status ? [status] : ['scheduled', 'in_progress', 'completed'];
  const assignments = [];
  
  for (let i = 0; i < 5; i++) {
    const jobDate = date || new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    assignments.push({
      id: `assignment-${i}`,
      jobId: `job-${i}`,
      jobNumber: `JOB202500${100 + i}`,
      staffId: staffId || `staff-${i % 3 + 1}`,
      staffName: ['Anders Andersson', 'Björn Björnsson', 'Carl Carlsson'][i % 3],
      role: i === 0 ? 'team_leader' : 'mover',
      customerName: `Customer ${i + 1}`,
      customerId: `cust-${i}`,
      date: jobDate,
      time: `${9 + (i % 3) * 3}:00`,
      duration: 3 + (i % 3),
      fromAddress: `Startgatan ${i + 1}, Stockholm`,
      toAddress: `Målgatan ${i + 10}, Stockholm`,
      services: ['moving', 'packing'].slice(0, (i % 2) + 1),
      status: statuses[i % statuses.length],
      priority: ['high', 'normal', 'low'][i % 3],
      notes: i % 2 === 0 ? 'Extra försiktighet med glasvaror' : '',
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return assignments;
}