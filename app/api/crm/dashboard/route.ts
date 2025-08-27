import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCRMPermissions } from '@/lib/auth/crm-middleware';

// Initialize Supabase client with service role for dashboard queries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// This endpoint provides dashboard data for the CRM
const getDashboardData = requireCRMPermissions('reports:read')(
  async (request: NextRequest) => {
  try {
    // Fetch real data from Supabase database
    console.log('🔄 Fetching dashboard data from database...');

    // Get authenticated user info for personalized data
    const user = (request as any).user;
    console.log(`📊 Dashboard requested by: ${user.name} (${user.role})`);

    // Execute parallel queries for dashboard metrics
    const [
      customersResult,
      leadsResult,
      jobsResult,
      revenueResult,
      recentBookingsResult,
      activitiesResult
    ] = await Promise.all([
      // Total customers count
      supabase
        .from('customers')
        .select('id, status')
        .eq('status', 'active'),

      // Total leads count (using leads table if exists, fallback to customers)
      supabase
        .from('leads')
        .select('id, status')
        .in('status', ['new', 'contacted', 'qualified', 'proposal', 'negotiation'])
        .then(result => result.data ? result : 
          supabase.from('customers').select('id').eq('status', 'lead')),

      // Jobs data
      supabase
        .from('jobs')
        .select('id, status, total_price, scheduled_date')
        .order('created_at', { ascending: false }),

      // Revenue calculation from completed jobs this month
      supabase
        .from('jobs')
        .select('total_price, completed_at')
        .eq('status', 'completed')
        .gte('completed_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

      // Recent upcoming jobs
      supabase
        .from('jobs')
        .select(`
          id,
          job_number,
          customer_name,
          scheduled_date,
          scheduled_time,
          total_price,
          status,
          customers!inner(name, email)
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(5),

      // Recent activities (bookings and job updates)
      supabase
        .from('bookings')
        .select(`
          id,
          booking_number,
          customer_name,
          created_at,
          status,
          metadata
        `)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    // Process results with error handling
    const customers = customersResult.data || [];
    const leads = Array.isArray(leadsResult.data) ? leadsResult.data : [];
    const jobs = jobsResult.data || [];
    const revenueJobs = revenueResult.data || [];
    const upcomingJobs = recentBookingsResult.data || [];
    const recentBookings = activitiesResult.data || [];

    // Calculate metrics
    const activeJobs = jobs.filter(job => ['scheduled', 'in_progress'].includes(job.status));
    const completedJobsThisMonth = jobs.filter(job => 
      job.status === 'completed' && 
      new Date(job.completed_at || '').getMonth() === new Date().getMonth()
    );

    const totalRevenue = jobs
      .filter(job => job.status === 'completed')
      .reduce((sum, job) => sum + (job.total_price || 0), 0);

    const revenueThisMonth = revenueJobs
      .reduce((sum, job) => sum + (job.total_price || 0), 0);

    const avgJobValue = jobs.length > 0 
      ? totalRevenue / jobs.filter(job => job.status === 'completed').length 
      : 0;

    // Calculate conversion rate (leads to completed jobs)
    const totalLeadsCount = leads.length + customers.length; // Include active customers as potential leads
    const conversionRate = totalLeadsCount > 0 
      ? (completedJobsThisMonth.length / totalLeadsCount) * 100 
      : 0;

    // Transform recent activities
    const recentActivities = recentBookings.map(booking => ({
      id: booking.id,
      type: 'booking',
      title: `Ny bokning: ${booking.booking_number}`,
      description: `${booking.customer_name} - ${booking.status}`,
      entityType: 'booking',
      entityId: booking.booking_number,
      userId: user.id,
      completed: booking.status === 'completed',
      createdAt: booking.created_at
    }));

    // Format upcoming jobs
    const formattedUpcomingJobs = upcomingJobs.map(job => ({
      id: job.job_number || job.id,
      customerName: job.customers?.name || job.customer_name,
      moveDate: new Date(job.scheduled_date),
      moveTime: job.scheduled_time || '08:00',
      totalPrice: job.total_price || 0,
      status: job.status
    }));

    // Detect critical issues
    const criticalIssues = [];
    if (activeJobs.length > 10) {
      criticalIssues.push({
        id: 'high_active_jobs',
        type: 'warning',
        title: 'Många aktiva jobb',
        description: `${activeJobs.length} aktiva jobb kräver uppmärksamhet`
      });
    }

    const dashboardStats = {
      totalCustomers: customers.length,
      totalLeads: leads.length,
      activeJobs: activeJobs.length,
      completedJobsThisMonth: completedJobsThisMonth.length,
      totalRevenue: Math.round(totalRevenue),
      revenueThisMonth: Math.round(revenueThisMonth),
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
      avgJobValue: Math.round(avgJobValue),
      upcomingJobs: formattedUpcomingJobs,
      recentActivities,
      criticalIssues,
      notifications: [],
      lastUpdated: new Date().toISOString(),
      generatedFor: {
        userId: user.id,
        userName: user.name,
        userRole: user.role
      }
    };

    console.log(`✅ Dashboard data generated for ${user.name} (${dashboardStats.totalCustomers} customers, ${dashboardStats.activeJobs} active jobs)`);
    return NextResponse.json(dashboardStats);

  } catch (error: any) {
    console.error('❌ Dashboard API error:', error);
    
    // Return fallback data if database is not fully set up
    const fallbackData = {
      totalCustomers: 0,
      totalLeads: 0,
      activeJobs: 0,
      completedJobsThisMonth: 0,
      totalRevenue: 0,
      revenueThisMonth: 0,
      conversionRate: 0,
      avgJobValue: 0,
      upcomingJobs: [],
      recentActivities: [],
      criticalIssues: [{
        id: 'database_connection',
        type: 'error',
        title: 'Databas-anslutning misslyckades',
        description: 'Kontrollera databas-konfiguration och migrations'
      }],
      notifications: [],
      lastUpdated: new Date().toISOString(),
      fallbackMode: true,
      error: error.message
    };

    return NextResponse.json(fallbackData, { status: 200 }); // Return 200 with fallback data
  }
})

// Export the protected handler
export const GET = getDashboardData;