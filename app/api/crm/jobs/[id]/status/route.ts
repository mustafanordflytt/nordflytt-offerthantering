import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('jobs:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id
    const { status, reason } = await request.json()

    // Validate status
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: scheduled, in_progress, completed, cancelled' },
        { status: 400 }
      )
    }

    // First, try to update in jobs table
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', jobId)
      .single()

    if (!jobError && job) {
      // Update job status
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', jobId)

      if (updateError) {
        throw updateError
      }

      // Log status change
      await supabase
        .from('job_status_history')
        .insert({
          job_id: parseInt(jobId),
          old_status: job.status,
          new_status: status,
          changed_by: authResult.user.id,
          reason: reason || `Status changed from ${job.status} to ${status}`
        })

      return NextResponse.json({
        success: true,
        message: 'Job status updated successfully',
        status
      })
    }

    // If not in jobs table, try bookings table
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', jobId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Map job status to booking status
    const statusMap: Record<string, string> = {
      'scheduled': 'confirmed',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled'
    }

    const bookingStatus = statusMap[status]

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: bookingStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (updateError) {
      throw updateError
    }

    // Update staff availability if job is completed or cancelled
    if (status === 'completed' || status === 'cancelled') {
      // Get assigned staff from booking details
      const { data: bookingDetails } = await supabase
        .from('bookings')
        .select('details')
        .eq('id', jobId)
        .single()

      const assignedStaff = bookingDetails?.details?.assignedStaff || []
      
      // Update each staff member's availability
      for (const staff of assignedStaff) {
        await supabase
          .from('staff_availability')
          .update({
            status: 'available',
            current_job_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('staff_id', staff.id)
          .eq('current_job_id', jobId)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Job status updated successfully',
      status
    })

  } catch (error) {
    console.error('Error updating job status:', error)
    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('jobs:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id

    // Get status history from job_status_history table
    const { data: history, error: historyError } = await supabase
      .from('job_status_history')
      .select(`
        *,
        changed_by_user:crm_users!changed_by(
          id,
          name,
          email
        )
      `)
      .eq('job_id', parseInt(jobId))
      .order('changed_at', { ascending: false })

    if (!historyError && history && history.length > 0) {
      return NextResponse.json({
        history: history.map(h => ({
          id: h.id,
          oldStatus: h.old_status,
          newStatus: h.new_status,
          changedBy: h.changed_by_user?.name || 'System',
          reason: h.reason,
          changedAt: h.changed_at
        }))
      })
    }

    // If no history in job_status_history, create a simple history from booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status, created_at, updated_at')
      .eq('id', jobId)
      .single()

    if (booking) {
      const history = [
        {
          id: `${booking.id}-created`,
          oldStatus: null,
          newStatus: 'scheduled',
          changedBy: 'System',
          reason: 'Job created',
          changedAt: booking.created_at
        }
      ]

      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        history.push({
          id: `${booking.id}-current`,
          oldStatus: 'scheduled',
          newStatus: booking.status,
          changedBy: 'System',
          reason: 'Status updated',
          changedAt: booking.updated_at
        })
      }

      return NextResponse.json({ history })
    }

    return NextResponse.json({ history: [] })

  } catch (error) {
    console.error('Error fetching job status history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status history' },
      { status: 500 }
    )
  }
}