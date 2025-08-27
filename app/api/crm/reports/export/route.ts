import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function generateCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      // Escape values containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('reports:export')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get('type')
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let data: any[] = []
    let headers: string[] = []
    let filename = `report_${new Date().toISOString().split('T')[0]}`

    switch (reportType) {
      case 'customers':
        const { data: customers, error: customersError } = await supabase
          .from('customer_lifetime_value')
          .select('*')
          .order('total_revenue', { ascending: false })

        if (customersError) throw customersError

        data = customers || []
        headers = ['customer_id', 'company_name', 'contact_name', 'total_revenue', 'paid_revenue', 'total_invoices', 'total_jobs', 'customer_since']
        filename = `customers_${new Date().toISOString().split('T')[0]}`
        break

      case 'invoices':
        let invoiceQuery = supabase
          .from('invoices')
          .select(`
            *,
            customer:crm_customers(
              company_name,
              contact_name
            )
          `)
          .order('created_at', { ascending: false })

        if (startDate) {
          invoiceQuery = invoiceQuery.gte('invoice_date', startDate)
        }
        if (endDate) {
          invoiceQuery = invoiceQuery.lte('invoice_date', endDate)
        }

        const { data: invoices, error: invoicesError } = await invoiceQuery

        if (invoicesError) throw invoicesError

        data = (invoices || []).map(inv => ({
          invoice_number: inv.invoice_number,
          customer_name: inv.customer?.company_name || inv.customer?.contact_name || 'N/A',
          invoice_date: inv.invoice_date,
          due_date: inv.due_date,
          subtotal: inv.subtotal_amount / 100,
          vat: inv.vat_amount / 100,
          total: inv.total_amount / 100,
          status: inv.status,
          paid_date: inv.paid_date
        }))
        headers = ['invoice_number', 'customer_name', 'invoice_date', 'due_date', 'subtotal', 'vat', 'total', 'status', 'paid_date']
        filename = `invoices_${new Date().toISOString().split('T')[0]}`
        break

      case 'jobs':
        let jobQuery = supabase
          .from('jobs')
          .select(`
            *,
            customer:crm_customers!jobs_customer_id_fkey(
              company_name,
              contact_name
            ),
            assigned_user:crm_users!jobs_assigned_to_fkey(
              name
            )
          `)
          .order('scheduled_date', { ascending: false })

        if (startDate) {
          jobQuery = jobQuery.gte('scheduled_date', startDate)
        }
        if (endDate) {
          jobQuery = jobQuery.lte('scheduled_date', endDate)
        }

        const { data: jobs, error: jobsError } = await jobQuery

        if (jobsError) throw jobsError

        data = (jobs || []).map(job => ({
          job_id: job.job_id,
          customer_name: job.customer?.company_name || job.customer?.contact_name || 'N/A',
          service_type: job.service_type,
          scheduled_date: job.scheduled_date,
          scheduled_time: job.scheduled_time,
          status: job.status,
          assigned_to: job.assigned_user?.name || 'Unassigned',
          from_address: job.from_address,
          to_address: job.to_address,
          estimated_duration: job.estimated_duration_minutes,
          actual_duration: job.actual_duration_minutes,
          customer_rating: job.customer_rating
        }))
        headers = ['job_id', 'customer_name', 'service_type', 'scheduled_date', 'scheduled_time', 'status', 'assigned_to', 'from_address', 'to_address', 'estimated_duration', 'actual_duration', 'customer_rating']
        filename = `jobs_${new Date().toISOString().split('T')[0]}`
        break

      case 'employees':
        const { data: employees, error: employeesError } = await supabase
          .from('employee_performance')
          .select('*')
          .order('completed_jobs', { ascending: false })

        if (employeesError) throw employeesError

        data = (employees || []).map(emp => ({
          name: emp.name,
          email: emp.email,
          role: emp.role,
          total_jobs: emp.total_jobs,
          completed_jobs: emp.completed_jobs,
          in_progress_jobs: emp.in_progress_jobs,
          avg_duration_minutes: emp.avg_job_duration_minutes,
          days_worked: emp.days_worked,
          unique_customers: emp.unique_customers_served
        }))
        headers = ['name', 'email', 'role', 'total_jobs', 'completed_jobs', 'in_progress_jobs', 'avg_duration_minutes', 'days_worked', 'unique_customers']
        filename = `employee_performance_${new Date().toISOString().split('T')[0]}`
        break

      case 'expenses':
        let expenseQuery = supabase
          .from('expenses')
          .select(`
            *,
            supplier:suppliers(
              supplier_name
            ),
            category:expense_categories(
              name
            )
          `)
          .eq('status', 'approved')
          .order('expense_date', { ascending: false })

        if (startDate) {
          expenseQuery = expenseQuery.gte('expense_date', startDate)
        }
        if (endDate) {
          expenseQuery = expenseQuery.lte('expense_date', endDate)
        }

        const { data: expenses, error: expensesError } = await expenseQuery

        if (expensesError) throw expensesError

        data = (expenses || []).map(exp => ({
          expense_date: exp.expense_date,
          category: exp.category?.name || exp.category,
          supplier: exp.supplier?.supplier_name || 'N/A',
          description: exp.description,
          amount: exp.amount / 100,
          vat_amount: exp.vat_amount / 100,
          total_amount: exp.total_amount / 100,
          payment_method: exp.payment_method,
          reference_number: exp.reference_number
        }))
        headers = ['expense_date', 'category', 'supplier', 'description', 'amount', 'vat_amount', 'total_amount', 'payment_method', 'reference_number']
        filename = `expenses_${new Date().toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    if (format === 'csv') {
      const csv = generateCSV(data, headers)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      })
    } else {
      return NextResponse.json({ error: 'Invalid format. Use csv or json' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Export API error:', error)
    return NextResponse.json({
      error: 'Failed to export report',
      details: error.message
    }, { status: 500 })
  }
}