import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create scheduled_reports table if not exists
const createTableIfNotExists = async () => {
  await supabase.rpc('exec', {
    query: `
      CREATE TABLE IF NOT EXISTS scheduled_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        report_name VARCHAR(255) NOT NULL,
        report_type VARCHAR(50) NOT NULL,
        schedule_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
        schedule_time TIME,
        schedule_day_of_week INTEGER, -- 0-6 for weekly
        schedule_day_of_month INTEGER, -- 1-31 for monthly
        recipients JSONB NOT NULL DEFAULT '[]',
        format VARCHAR(20) NOT NULL DEFAULT 'csv',
        filters JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        last_run_at TIMESTAMP WITH TIME ZONE,
        next_run_at TIMESTAMP WITH TIME ZONE,
        created_by UUID REFERENCES crm_users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `
  })
}

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

    // Ensure table exists
    await createTableIfNotExists()

    // Fetch scheduled reports
    const { data: reports, error } = await supabase
      .from('scheduled_reports')
      .select(`
        *,
        created_by_user:crm_users!scheduled_reports_created_by_fkey(
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch scheduled reports')
    }

    return NextResponse.json({
      success: true,
      reports: reports || []
    })

  } catch (error: any) {
    console.error('Scheduled reports API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch scheduled reports',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('reports:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    const { reportName, reportType, scheduleType, recipients } = body
    
    if (!reportName || !reportType || !scheduleType || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Report name, type, schedule type and recipients are required' },
        { status: 400 }
      )
    }

    // Ensure table exists
    await createTableIfNotExists()

    // Calculate next run time
    const now = new Date()
    let nextRunAt = new Date()

    switch (scheduleType) {
      case 'daily':
        const [hours, minutes] = (body.scheduleTime || '09:00').split(':')
        nextRunAt.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        if (nextRunAt <= now) {
          nextRunAt.setDate(nextRunAt.getDate() + 1)
        }
        break
      
      case 'weekly':
        const dayOfWeek = body.scheduleDayOfWeek || 1 // Monday
        const daysUntilNext = (dayOfWeek - now.getDay() + 7) % 7 || 7
        nextRunAt.setDate(now.getDate() + daysUntilNext)
        const [whours, wminutes] = (body.scheduleTime || '09:00').split(':')
        nextRunAt.setHours(parseInt(whours), parseInt(wminutes), 0, 0)
        break
      
      case 'monthly':
        const dayOfMonth = body.scheduleDayOfMonth || 1
        nextRunAt.setDate(dayOfMonth)
        if (nextRunAt <= now) {
          nextRunAt.setMonth(nextRunAt.getMonth() + 1)
        }
        const [mhours, mminutes] = (body.scheduleTime || '09:00').split(':')
        nextRunAt.setHours(parseInt(mhours), parseInt(mminutes), 0, 0)
        break
    }

    // Create scheduled report
    const { data: newReport, error } = await supabase
      .from('scheduled_reports')
      .insert({
        report_name: reportName,
        report_type: reportType,
        schedule_type: scheduleType,
        schedule_time: body.scheduleTime || '09:00',
        schedule_day_of_week: body.scheduleDayOfWeek || null,
        schedule_day_of_month: body.scheduleDayOfMonth || null,
        recipients: recipients,
        format: body.format || 'csv',
        filters: body.filters || {},
        is_active: body.isActive !== false,
        next_run_at: nextRunAt.toISOString(),
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Report creation error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      report: newReport,
      message: 'Scheduled report created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Scheduled report creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create scheduled report',
      details: error.message
    }, { status: 500 })
  }
}