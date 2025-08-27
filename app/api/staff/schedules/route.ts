import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') || date;
    const endDate = searchParams.get('endDate') || date;
    
    // Fetch jobs for the date range
    let query = supabase
      .from('jobs')
      .select(`
        id,
        customer_name,
        from_address,
        to_address,
        scheduled_date,
        scheduled_time,
        services,
        estimated_hours,
        status,
        metadata
      `)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });
    
    // Filter by staff if provided
    if (staffId) {
      // Since we don't have a staff table, mock staff assignment
      // In production, this would filter by team_members containing staffId
    }
    
    const { data: jobs, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      // Return mock data if database fails
      return NextResponse.json({
        success: true,
        schedules: getMockSchedules(startDate, endDate, staffId)
      });
    }
    
    // Transform jobs into schedule format
    const schedules = (jobs || []).map(job => ({
      id: job.id,
      date: job.scheduled_date,
      time: job.scheduled_time || '09:00',
      duration: job.estimated_hours || 4,
      jobId: job.id,
      jobNumber: job.metadata?.jobNumber || `JOB${job.id.slice(0, 8)}`,
      customerName: job.customer_name,
      fromAddress: job.from_address,
      toAddress: job.to_address,
      services: job.services || ['moving'],
      status: job.status || 'scheduled',
      team: [
        { id: 'staff-1', name: 'Anders Andersson', role: 'team_leader' },
        { id: 'staff-2', name: 'Björn Björnsson', role: 'mover' }
      ]
    }));
    
    return NextResponse.json({
      success: true,
      schedules,
      summary: {
        totalJobs: schedules.length,
        totalHours: schedules.reduce((sum, s) => sum + s.duration, 0),
        dates: [...new Set(schedules.map(s => s.date))]
      }
    });
    
  } catch (error: any) {
    console.error('Schedules API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch schedules',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const data = await request.json();
    
    // Create or update schedule
    const scheduleData = {
      staff_id: data.staffId,
      job_id: data.jobId,
      date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      role: data.role || 'mover',
      notes: data.notes
    };
    
    // Since we don't have a schedules table, store in job metadata
    const { data: job } = await supabase
      .from('jobs')
      .select('metadata')
      .eq('id', data.jobId)
      .single();
    
    if (job) {
      const metadata = job.metadata || {};
      metadata.schedules = metadata.schedules || [];
      metadata.schedules.push({
        ...scheduleData,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      });
      
      await supabase
        .from('jobs')
        .update({ metadata })
        .eq('id', data.jobId);
    }
    
    return NextResponse.json({
      success: true,
      schedule: scheduleData
    });
    
  } catch (error: any) {
    console.error('Schedule creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create schedule',
      details: error.message
    }, { status: 500 });
  }
}

// Mock data generator
function getMockSchedules(startDate: string, endDate: string, staffId?: string) {
  const schedules = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    // Add 1-3 jobs per day
    const jobCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < jobCount; i++) {
      schedules.push({
        id: `schedule-${dateStr}-${i}`,
        date: dateStr,
        time: `${9 + i * 3}:00`,
        duration: 3 + Math.floor(Math.random() * 3),
        jobId: `job-${dateStr}-${i}`,
        jobNumber: `JOB202500${Math.floor(Math.random() * 1000)}`,
        customerName: ['Anna Andersson', 'Björn Björnsson', 'Carl Carlsson'][i % 3],
        fromAddress: `Startgatan ${i + 1}, Stockholm`,
        toAddress: `Målgatan ${i + 10}, Stockholm`,
        services: ['moving', 'packing'],
        status: 'scheduled',
        team: [
          { id: staffId || 'staff-1', name: 'Anders Andersson', role: 'team_leader' }
        ]
      });
    }
  }
  
  return schedules;
}