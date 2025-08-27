import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
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
    const body = await request.json()

    // Validate required fields
    const { staffId, role } = body
    if (!staffId) {
      return NextResponse.json(
        { error: 'staffId is required' },
        { status: 400 }
      )
    }

    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      // Try to find in bookings table
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

      // For now, update the booking details with assigned staff
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('details')
        .eq('id', jobId)
        .single()

      const currentDetails = currentBooking?.details || {}
      const currentStaff = currentDetails.assignedStaff || []

      // Check if staff member already assigned
      const isAlreadyAssigned = currentStaff.some((s: any) => s.id === staffId)
      if (isAlreadyAssigned) {
        return NextResponse.json(
          { error: 'Staff member already assigned to this job' },
          { status: 400 }
        )
      }

      // Get staff details
      const { data: staffMember } = await supabase
        .from('staff')
        .select('id, first_name, last_name, role as staffRole')
        .eq('id', staffId)
        .single()

      if (!staffMember) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        )
      }

      // Add staff to assignment
      const newAssignment = {
        id: staffId,
        name: `${staffMember.first_name} ${staffMember.last_name}`,
        role: role || staffMember.staffRole || 'mover',
        assignedAt: new Date().toISOString(),
        assignedBy: authResult.user.id
      }

      const updatedStaff = [...currentStaff, newAssignment]

      // Update booking with new staff assignment
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          details: {
            ...currentDetails,
            assignedStaff: updatedStaff
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        assignment: newAssignment
      })
    }

    // If job exists in jobs table, use job_staff_assignments
    const { data: staffMember, error: staffError } = await supabase
      .from('staff')
      .select('id, first_name, last_name')
      .eq('id', staffId)
      .single()

    if (staffError || !staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Create assignment
    const { data: assignment, error: assignError } = await supabase
      .from('job_staff_assignments')
      .insert({
        job_id: parseInt(jobId),
        staff_id: staffId,
        role: role || 'mover',
        assigned_by: authResult.user.id
      })
      .select()
      .single()

    if (assignError) {
      if (assignError.code === '23505') {
        return NextResponse.json(
          { error: 'Staff member already assigned to this job' },
          { status: 400 }
        )
      }
      throw assignError
    }

    return NextResponse.json({
      success: true,
      assignment: {
        ...assignment,
        staffName: `${staffMember.first_name} ${staffMember.last_name}`
      }
    })

  } catch (error) {
    console.error('Error assigning staff to job:', error)
    return NextResponse.json(
      { error: 'Failed to assign staff' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { staffId } = await request.json()

    if (!staffId) {
      return NextResponse.json(
        { error: 'staffId is required' },
        { status: 400 }
      )
    }

    // First try to remove from job_staff_assignments
    const { error: removeError } = await supabase
      .from('job_staff_assignments')
      .delete()
      .match({ job_id: parseInt(jobId), staff_id: staffId })

    if (!removeError) {
      return NextResponse.json({
        success: true,
        message: 'Staff member removed from job'
      })
    }

    // If not found in job_staff_assignments, try bookings
    const { data: booking } = await supabase
      .from('bookings')
      .select('details')
      .eq('id', jobId)
      .single()

    if (booking) {
      const currentDetails = booking.details || {}
      const currentStaff = currentDetails.assignedStaff || []
      const updatedStaff = currentStaff.filter((s: any) => s.id !== staffId)

      await supabase
        .from('bookings')
        .update({
          details: {
            ...currentDetails,
            assignedStaff: updatedStaff
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      return NextResponse.json({
        success: true,
        message: 'Staff member removed from job'
      })
    }

    return NextResponse.json(
      { error: 'Assignment not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error removing staff assignment:', error)
    return NextResponse.json(
      { error: 'Failed to remove staff assignment' },
      { status: 500 }
    )
  }
}