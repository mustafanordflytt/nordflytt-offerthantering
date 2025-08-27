import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// GET /api/dashboard/metrics - Get dashboard metrics
export async function GET(request: NextRequest) {
  try {
    // If Supabase is not configured, return mock data
    if (!supabase) {
      return NextResponse.json({
        customers: 156,
        activeJobs: 12,
        monthlyRevenue: 487500,
        newLeads: 23,
        staffUtilization: 78,
        completedJobs: 89,
        avgJobRating: 4.8,
        totalRevenue: 2845000,
        lastUpdated: new Date().toISOString()
      });
    }

    // Get real metrics from database
    try {
      // Customer count
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      // Active jobs
      const { count: activeJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'in_progress']);
      
      // Monthly revenue (completed jobs this month)
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { data: monthlyJobs } = await supabase
        .from('jobs')
        .select('final_cost')
        .eq('status', 'completed')
        .gte('completed_at', firstDayOfMonth.toISOString());
      
      const monthlyRevenue = monthlyJobs?.reduce((sum, job) => 
        sum + (parseFloat(job.final_cost) || 0), 0) || 0;
      
      // New leads this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: newLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());
      
      // Staff utilization (percentage of staff with active jobs)
      const { count: totalStaff } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      const { data: activeAssignments } = await supabase
        .from('job_assignments')
        .select('staff_id')
        .in('status', ['assigned', 'accepted']);
      
      const uniqueActiveStaff = new Set(activeAssignments?.map(a => a.staff_id) || []);
      const staffUtilization = totalStaff ? 
        Math.round((uniqueActiveStaff.size / totalStaff) * 100) : 0;
      
      // Completed jobs this month
      const { count: completedJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', firstDayOfMonth.toISOString());
      
      // Total revenue (all time)
      const { data: allCompletedJobs } = await supabase
        .from('jobs')
        .select('final_cost')
        .eq('status', 'completed');
      
      const totalRevenue = allCompletedJobs?.reduce((sum, job) => 
        sum + (parseFloat(job.final_cost) || 0), 0) || 0;

      return NextResponse.json({
        customers: customerCount || 0,
        activeJobs: activeJobs || 0,
        monthlyRevenue: monthlyRevenue,
        newLeads: newLeads || 0,
        staffUtilization: staffUtilization,
        completedJobs: completedJobs || 0,
        avgJobRating: 4.8, // Placeholder - implement ratings later
        totalRevenue: totalRevenue,
        lastUpdated: new Date().toISOString()
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Return mock data on database error
      return NextResponse.json({
        customers: 156,
        activeJobs: 12,
        monthlyRevenue: 487500,
        newLeads: 23,
        staffUtilization: 78,
        completedJobs: 89,
        avgJobRating: 4.8,
        totalRevenue: 2845000,
        lastUpdated: new Date().toISOString(),
        dataSource: 'mock'
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}