import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const period = searchParams.get('period') || 'month';
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    
    if (!supabase) {
      // Return mock data if Supabase not configured
      return generateMockReport(type, period);
    }
    
    // Calculate date range
    const dates = calculateDateRange(period, start_date, end_date);
    
    switch (type) {
      case 'revenue':
        return await generateRevenueReport(dates);
      case 'operations':
        return await generateOperationsReport(dates);
      case 'staff':
        return await generateStaffReport(dates);
      case 'customer':
        return await generateCustomerReport(dates);
      case 'summary':
      default:
        return await generateSummaryReport(dates);
    }
    
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate report',
      report: null
    }, { status: 500 });
  }
}

function calculateDateRange(period: string, start?: string | null, end?: string | null) {
  const now = new Date();
  let start_date: Date;
  let end_date: Date;
  
  if (start && end) {
    start_date = new Date(start);
    end_date = new Date(end);
  } else {
    switch (period) {
      case 'week':
        start_date = new Date(now.setDate(now.getDate() - 7));
        end_date = new Date();
        break;
      case 'month':
        start_date = new Date(now.getFullYear(), now.getMonth(), 1);
        end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start_date = new Date(now.getFullYear(), quarter * 3, 1);
        end_date = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'year':
        start_date = new Date(now.getFullYear(), 0, 1);
        end_date = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        start_date = new Date(now.setDate(now.getDate() - 30));
        end_date = new Date();
    }
  }
  
  return {
    start: start_date.toISOString(),
    end: end_date.toISOString()
  };
}

function generateMockReport(type: string, period: string) {
  const mockData = {
    type,
    period,
    generated_at: new Date().toISOString(),
    data: {
      revenue: {
        total: 1250000,
        growth: 12.5,
        by_service: {
          moving: 800000,
          storage: 250000,
          packing: 200000
        }
      },
      operations: {
        jobs_completed: 156,
        average_rating: 4.8,
        on_time_rate: 94.2,
        utilization_rate: 87.5
      },
      customers: {
        new: 45,
        returning: 111,
        satisfaction: 4.9,
        retention_rate: 82.3
      }
    }
  };
  
  return NextResponse.json({ report: mockData });
}

async function generateRevenueReport(dates: { start: string; end: string }) {
  if (!supabase) return generateMockReport('revenue', 'custom');
  
  // Get all completed jobs in date range
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'completed')
    .gte('completed_date', dates.start)
    .lte('completed_date', dates.end);
  
  // Get quotes for revenue calculation
  const quoteIds = jobs?.map(j => j.quote_id).filter(Boolean) || [];
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .in('id', quoteIds);
  
  // Calculate revenue metrics
  const total_revenue = quotes?.reduce((sum, q) => sum + (q.total_price || 0), 0) || 0;
  const job_count = jobs?.length || 0;
  const average_job_value = job_count > 0 ? total_revenue / job_count : 0;
  
  // Group by service type
  const revenue_by_service = jobs?.reduce((acc: any, job) => {
    const service = job.service_type || 'other';
    const quote = quotes?.find(q => q.id === job.quote_id);
    acc[service] = (acc[service] || 0) + (quote?.total_price || 0);
    return acc;
  }, {});
  
  return NextResponse.json({
    report: {
      type: 'revenue',
      period: { start: dates.start, end: dates.end },
      generated_at: new Date().toISOString(),
      data: {
        total_revenue,
        job_count,
        average_job_value,
        revenue_by_service,
        top_customers: [] // Would need customer join
      }
    }
  });
}

async function generateOperationsReport(dates: { start: string; end: string }) {
  if (!supabase) return generateMockReport('operations', 'custom');
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .gte('scheduled_date', dates.start)
    .lte('scheduled_date', dates.end);
  
  const total_jobs = jobs?.length || 0;
  const completed_jobs = jobs?.filter(j => j.status === 'completed').length || 0;
  const cancelled_jobs = jobs?.filter(j => j.status === 'cancelled').length || 0;
  const completion_rate = total_jobs > 0 ? (completed_jobs / total_jobs) * 100 : 0;
  
  return NextResponse.json({
    report: {
      type: 'operations',
      period: { start: dates.start, end: dates.end },
      generated_at: new Date().toISOString(),
      data: {
        total_jobs,
        completed_jobs,
        cancelled_jobs,
        completion_rate,
        jobs_by_status: {
          pending: jobs?.filter(j => j.status === 'pending').length || 0,
          confirmed: jobs?.filter(j => j.status === 'confirmed').length || 0,
          in_progress: jobs?.filter(j => j.status === 'in_progress').length || 0,
          completed: completed_jobs,
          cancelled: cancelled_jobs
        }
      }
    }
  });
}

async function generateStaffReport(dates: { start: string; end: string }) {
  if (!supabase) return generateMockReport('staff', 'custom');
  
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('status', 'active');
  
  const { data: assignments } = await supabase
    .from('job_assignments')
    .select('*')
    .gte('assigned_date', dates.start)
    .lte('assigned_date', dates.end);
  
  const total_staff = staff?.length || 0;
  const total_assignments = assignments?.length || 0;
  const average_assignments = total_staff > 0 ? total_assignments / total_staff : 0;
  
  return NextResponse.json({
    report: {
      type: 'staff',
      period: { start: dates.start, end: dates.end },
      generated_at: new Date().toISOString(),
      data: {
        total_staff,
        total_assignments,
        average_assignments,
        staff_by_role: {
          driver: staff?.filter(s => s.role === 'driver').length || 0,
          mover: staff?.filter(s => s.role === 'mover').length || 0,
          supervisor: staff?.filter(s => s.role === 'supervisor').length || 0
        }
      }
    }
  });
}

async function generateCustomerReport(dates: { start: string; end: string }) {
  if (!supabase) return generateMockReport('customer', 'custom');
  
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .gte('created_at', dates.start)
    .lte('created_at', dates.end);
  
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id');
  
  const new_customers = customers?.length || 0;
  const total_customers = allCustomers?.length || 0;
  
  return NextResponse.json({
    report: {
      type: 'customer',
      period: { start: dates.start, end: dates.end },
      generated_at: new Date().toISOString(),
      data: {
        new_customers,
        total_customers,
        customer_types: {
          private: customers?.filter(c => c.type === 'private').length || 0,
          business: customers?.filter(c => c.type === 'business').length || 0
        }
      }
    }
  });
}

async function generateSummaryReport(dates: { start: string; end: string }) {
  if (!supabase) return generateMockReport('summary', 'custom');
  
  // Combine key metrics from all report types
  const [revenue, operations, staff, customer] = await Promise.all([
    generateRevenueReport(dates),
    generateOperationsReport(dates),
    generateStaffReport(dates),
    generateCustomerReport(dates)
  ]);
  
  const revenueData = await revenue.json();
  const operationsData = await operations.json();
  const staffData = await staff.json();
  const customerData = await customer.json();
  
  return NextResponse.json({
    report: {
      type: 'summary',
      period: { start: dates.start, end: dates.end },
      generated_at: new Date().toISOString(),
      data: {
        revenue: revenueData.report.data,
        operations: operationsData.report.data,
        staff: staffData.report.data,
        customers: customerData.report.data
      }
    }
  });
}