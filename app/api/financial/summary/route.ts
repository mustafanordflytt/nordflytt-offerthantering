import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    if (!supabase) {
      // Return mock data if Supabase not configured
      return NextResponse.json({
        summary: {
          period: period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          revenue: {
            total: 847500,
            bookings: 752000,
            storage: 45500,
            additional_services: 50000
          },
          expenses: {
            total: 523400,
            salaries: 320000,
            fuel: 45000,
            maintenance: 35400,
            supplies: 23000,
            other: 100000
          },
          profit: {
            gross: 324100,
            margin: 38.2
          },
          kpis: {
            jobs_completed: 156,
            average_job_value: 4820,
            customer_satisfaction: 4.7,
            employee_utilization: 87.5
          }
        }
      });
    }
    
    // Fetch data from multiple tables
    const [jobsResult, storageResult] = await Promise.all([
      // Get completed jobs revenue
      supabase
        .from('jobs')
        .select('id, total_amount, completed_at')
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString()),
      
      // Get storage revenue
      supabase
        .from('customer_storage')
        .select('monthly_rate')
        .eq('status', 'active')
    ]);
    
    // Calculate revenue
    const bookingRevenue = (jobsResult.data || []).reduce((sum, job) => 
      sum + (job.total_amount || 0), 0
    );
    
    const storageRevenue = (storageResult.data || []).reduce((sum, storage) => 
      sum + (storage.monthly_rate || 0), 0
    );
    
    const totalRevenue = bookingRevenue + storageRevenue;
    
    // Mock expenses (in real app, would come from expense tracking tables)
    const expenses = {
      total: totalRevenue * 0.65, // 65% expense ratio
      salaries: totalRevenue * 0.4,
      fuel: totalRevenue * 0.05,
      maintenance: totalRevenue * 0.04,
      supplies: totalRevenue * 0.03,
      other: totalRevenue * 0.13
    };
    
    const profit = totalRevenue - expenses.total;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    return NextResponse.json({
      summary: {
        period: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        revenue: {
          total: totalRevenue,
          bookings: bookingRevenue,
          storage: storageRevenue,
          additional_services: 0
        },
        expenses: expenses,
        profit: {
          gross: profit,
          margin: Number(margin.toFixed(1))
        },
        kpis: {
          jobs_completed: jobsResult.data?.length || 0,
          average_job_value: jobsResult.data?.length ? 
            bookingRevenue / jobsResult.data.length : 0,
          customer_satisfaction: 4.7, // Would come from reviews
          employee_utilization: 87.5 // Would come from timesheet data
        }
      }
    });
    
  } catch (error: any) {
    console.error('Financial summary error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate financial summary' 
    }, { status: 500 });
  }
}