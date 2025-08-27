import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('reports:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get('type')
    const period = searchParams.get('period') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let data: any = {}

    switch (reportType) {
      case 'revenue':
        // Fetch revenue data from view
        const { data: revenueData, error: revenueError } = await supabase
          .from('revenue_by_month')
          .select('*')
          .order('month', { ascending: true })
          .limit(12)

        if (revenueError) throw revenueError

        // Also fetch expense data
        const { data: expenseData, error: expenseError } = await supabase
          .from('expense_analytics')
          .select('month, sum(total_expenses) as total_expenses')
          .order('month', { ascending: true })
          .limit(12)

        if (expenseError) throw expenseError

        // Combine revenue and expense data
        data = revenueData?.map(rev => {
          const expense = expenseData?.find(exp => 
            new Date(exp.month).getTime() === new Date(rev.month).getTime()
          )
          return {
            month: new Date(rev.month).toLocaleDateString('sv-SE', { month: 'short' }),
            revenue: Math.round(rev.total_revenue),
            expenses: expense ? Math.round(expense.total_expenses) : 0,
            profit: Math.round(rev.total_revenue - (expense?.total_expenses || 0))
          }
        }) || []
        break

      case 'customers':
        // Fetch customer lifetime value data
        const { data: customerData, error: customerError } = await supabase
          .from('customer_lifetime_value')
          .select('*')
          .order('total_revenue', { ascending: false })
          .limit(20)

        if (customerError) throw customerError

        // Also get customer growth over time
        const { data: growthData, error: growthError } = await supabase
          .from('crm_customers')
          .select('created_at')
          .order('created_at', { ascending: true })

        if (growthError) throw growthError

        // Process growth data by month
        const growthByMonth = new Map()
        let cumulativeCount = 0
        
        growthData?.forEach(customer => {
          const month = new Date(customer.created_at).toISOString().substring(0, 7)
          cumulativeCount++
          growthByMonth.set(month, cumulativeCount)
        })

        const customerGrowth = Array.from(growthByMonth.entries())
          .slice(-12)
          .map(([month, count]) => ({
            month: new Date(month + '-01').toLocaleDateString('sv-SE', { month: 'short' }),
            customers: count
          }))

        data = {
          topCustomers: customerData?.slice(0, 10) || [],
          growth: customerGrowth
        }
        break

      case 'leads':
        // Fetch sales pipeline data
        const { data: pipelineData, error: pipelineError } = await supabase
          .from('sales_pipeline')
          .select('*')
          .order('pipeline_stage', { ascending: true })

        if (pipelineError) throw pipelineError

        // Also fetch conversion funnel
        const { data: funnelData, error: funnelError } = await supabase
          .from('conversion_funnel')
          .select('*')
          .order('month', { ascending: false })
          .limit(6)

        if (funnelError) throw funnelError

        data = {
          pipeline: pipelineData || [],
          funnel: funnelData || []
        }
        break

      case 'employees':
        // Fetch employee performance data
        const { data: performanceData, error: performanceError } = await supabase
          .from('employee_performance')
          .select('*')
          .order('completed_jobs', { ascending: false })

        if (performanceError) throw performanceError

        data = performanceData?.map(emp => ({
          name: emp.name,
          email: emp.email,
          role: emp.role,
          jobs: emp.total_jobs,
          completedJobs: emp.completed_jobs,
          inProgressJobs: emp.in_progress_jobs,
          avgDuration: Math.round(emp.avg_job_duration_minutes || 0),
          daysWorked: emp.days_worked,
          uniqueCustomers: emp.unique_customers_served
        })) || []
        break

      case 'jobs':
        // Fetch job analytics
        const { data: jobData, error: jobError } = await supabase
          .from('job_analytics')
          .select('*')
          .order('month', { ascending: true })
          .limit(12)

        if (jobError) throw jobError

        // Also get job type distribution
        const { data: jobTypes, error: typesError } = await supabase
          .from('jobs')
          .select('service_type')
          .not('service_type', 'is', null)

        if (typesError) throw typesError

        // Count job types
        const typeCount = new Map()
        jobTypes?.forEach(job => {
          const type = job.service_type
          typeCount.set(type, (typeCount.get(type) || 0) + 1)
        })

        const totalJobs = jobTypes?.length || 0
        const jobTypeDistribution = Array.from(typeCount.entries())
          .map(([type, count]) => ({
            type,
            count,
            percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)

        data = {
          analytics: jobData || [],
          types: jobTypeDistribution
        }
        break

      case 'satisfaction':
        // Fetch customer satisfaction from jobs
        const { data: satisfactionData, error: satisfactionError } = await supabase
          .from('jobs')
          .select('customer_rating')
          .not('customer_rating', 'is', null)

        if (satisfactionError) throw satisfactionError

        // Calculate satisfaction metrics
        const ratings = satisfactionData?.map(j => j.customer_rating) || []
        const average = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0

        const distribution = [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: ratings.filter(r => r === rating).length
        }))

        data = {
          average: Math.round(average * 10) / 10,
          totalRatings: ratings.length,
          distribution
        }
        break

      case 'suppliers':
        // Fetch supplier spending data
        const { data: supplierData, error: supplierError } = await supabase
          .from('supplier_spending')
          .select('*')
          .order('total_spent', { ascending: false })
          .limit(10)

        if (supplierError) throw supplierError

        // Also get supplier performance metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('supplier_performance_metrics')
          .select(`
            supplier_id,
            overall_performance_score,
            on_time_delivery_rate,
            quality_score
          `)
          .order('metric_date', { ascending: false })

        if (metricsError) throw metricsError

        // Get latest metrics for each supplier
        const latestMetrics = new Map()
        metricsData?.forEach(metric => {
          if (!latestMetrics.has(metric.supplier_id)) {
            latestMetrics.set(metric.supplier_id, metric)
          }
        })

        data = supplierData?.map(supplier => {
          const metrics = latestMetrics.get(supplier.id)
          return {
            ...supplier,
            performanceScore: metrics?.overall_performance_score || null,
            onTimeDelivery: metrics?.on_time_delivery_rate || null,
            qualityScore: metrics?.quality_score || null
          }
        }) || []
        break

      case 'overview':
        // Fetch multiple data points for dashboard overview
        const [revenue, pipeline, jobs, employees] = await Promise.all([
          supabase.from('revenue_by_month').select('*').order('month', { ascending: false }).limit(1).single(),
          supabase.from('sales_pipeline').select('*'),
          supabase.from('job_analytics').select('*').order('month', { ascending: false }).limit(1).single(),
          supabase.from('employee_performance').select('*')
        ])

        data = {
          currentMonthRevenue: revenue.data?.total_revenue || 0,
          currentMonthInvoices: revenue.data?.invoice_count || 0,
          pipelineValue: pipeline.data?.reduce((sum, stage) => sum + stage.total_pipeline_value, 0) || 0,
          activeLeads: pipeline.data?.reduce((sum, stage) => sum + stage.lead_count, 0) || 0,
          completedJobs: jobs.data?.completed_jobs || 0,
          activeEmployees: employees.data?.length || 0
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      data,
      generated_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Reports API error:', error)
    return NextResponse.json({
      error: 'Failed to generate report',
      details: error.message
    }, { status: 500 })
  }
}