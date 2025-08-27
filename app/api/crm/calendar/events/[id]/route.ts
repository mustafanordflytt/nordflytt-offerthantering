import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    const eventId = resolvedParams.id

    // Fetch event with all related data
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        job:jobs(
          id,
          job_id,
          customer_id,
          services_requested,
          from_address,
          to_address,
          final_price,
          status
        ),
        customer:customers(
          id,
          customer_name,
          customer_phone,
          customer_email,
          customer_address
        ),
        attendees:calendar_attendees(
          id,
          user_id,
          external_email,
          external_name,
          status,
          role,
          responded_at,
          notes
        ),
        resource_bookings:calendar_resource_bookings(
          id,
          resource_id,
          status,
          resource:calendar_resources(
            id,
            resource_name,
            resource_type,
            capacity,
            location
          )
        )
      `)
      .eq('id', eventId)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      )
    }

    // Get staff details
    let staffDetails = []
    if (event.assigned_staff && event.assigned_staff.length > 0) {
      const { data: staff } = await supabase
        .from('crm_users')
        .select('id, name, email, role, phone')
        .in('id', event.assigned_staff)

      staffDetails = staff || []
    }

    // Get attendee user details
    const attendeeUserIds = event.attendees
      ?.filter((a: any) => a.user_id)
      .map((a: any) => a.user_id) || []

    let attendeeUsers: Record<string, any> = {}
    if (attendeeUserIds.length > 0) {
      const { data: users } = await supabase
        .from('crm_users')
        .select('id, name, email')
        .in('id', attendeeUserIds)

      attendeeUsers = (users || []).reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {})
    }

    // Transform event data
    const transformedEvent = {
      id: event.id,
      eventId: event.event_id,
      title: event.title,
      description: event.description,
      type: event.event_type,
      status: event.event_status,
      start: new Date(event.start_datetime),
      end: new Date(event.end_datetime),
      allDay: event.all_day,
      recurring: event.recurring,
      recurrenceRule: event.recurrence_rule,
      // Related data
      job: event.job,
      customer: event.customer,
      // Staff
      assignedStaff: staffDetails,
      requiredStaffCount: event.required_staff_count,
      // Location
      location: {
        name: event.location_name,
        address: event.location_address,
        lat: event.location_lat,
        lng: event.location_lng
      },
      // Attendees
      attendees: (event.attendees || []).map((a: any) => ({
        id: a.id,
        name: a.user_id ? attendeeUsers[a.user_id]?.name : a.external_name,
        email: a.user_id ? attendeeUsers[a.user_id]?.email : a.external_email,
        status: a.status,
        role: a.role,
        respondedAt: a.responded_at ? new Date(a.responded_at) : null,
        notes: a.notes
      })),
      // Resources
      resources: (event.resource_bookings || []).map((rb: any) => ({
        id: rb.resource_id,
        name: rb.resource?.resource_name,
        type: rb.resource?.resource_type,
        status: rb.status
      })),
      // Metadata
      color: event.color,
      priority: event.priority,
      tags: event.tags || [],
      attachments: event.attachments || [],
      reminderMinutes: event.reminder_minutes || [],
      // Audit
      createdBy: event.created_by,
      updatedBy: event.updated_by,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at)
    }

    return NextResponse.json({
      event: transformedEvent
    })

  } catch (error) {
    console.error('Unexpected error in event details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const eventId = resolvedParams.id
    const body = await request.json()

    // Get current event
    const { data: currentEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (fetchError || !currentEvent) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      )
    }

    // Check permission to update
    const canUpdate = currentEvent.created_by === authResult.user.id ||
                     currentEvent.assigned_staff?.includes(authResult.user.id) ||
                     authResult.permissions.includes('admin')

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'You do not have permission to update this event' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_by: authResult.user.id,
      updated_at: new Date().toISOString()
    }

    // Update fields if provided
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.event_type = body.type
    if (body.status !== undefined) updateData.event_status = body.status
    if (body.start !== undefined) updateData.start_datetime = new Date(body.start).toISOString()
    if (body.end !== undefined) updateData.end_datetime = new Date(body.end).toISOString()
    if (body.allDay !== undefined) updateData.all_day = body.allDay
    if (body.assignedStaff !== undefined) updateData.assigned_staff = body.assignedStaff
    if (body.requiredStaffCount !== undefined) updateData.required_staff_count = body.requiredStaffCount
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.color !== undefined) updateData.color = body.color
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.reminderMinutes !== undefined) updateData.reminder_minutes = body.reminderMinutes

    // Update location if provided
    if (body.location) {
      updateData.location_name = body.location.name || null
      updateData.location_address = body.location.address || null
      updateData.location_lat = body.location.lat || null
      updateData.location_lng = body.location.lng || null
    }

    // Validate datetime if both are provided
    if (body.start && body.end) {
      const startDatetime = new Date(body.start)
      const endDatetime = new Date(body.end)
      
      if (endDatetime <= startDatetime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }

      // Check for conflicts if staff changed
      if (body.assignedStaff && 
          JSON.stringify(body.assignedStaff.sort()) !== JSON.stringify(currentEvent.assigned_staff?.sort())) {
        const { data: conflicts } = await supabase
          .rpc('check_calendar_conflicts', {
            p_start_datetime: startDatetime.toISOString(),
            p_end_datetime: endDatetime.toISOString(),
            p_assigned_staff: body.assignedStaff,
            p_exclude_event_id: eventId
          })

        if (conflicts && conflicts.length > 0) {
          return NextResponse.json({
            error: 'Scheduling conflict detected',
            conflicts: conflicts.map((c: any) => ({
              title: c.event_title,
              type: c.event_type,
              start: c.start_datetime,
              end: c.end_datetime
            }))
          }, { status: 400 })
        }
      }
    }

    // Update event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) {
      console.error('Event update error:', updateError)
      throw updateError
    }

    // Update attendees if provided
    if (body.attendees !== undefined) {
      // Remove existing attendees
      await supabase
        .from('calendar_attendees')
        .delete()
        .eq('event_id', eventId)

      // Add new attendees
      if (body.attendees.length > 0) {
        const attendeeData = body.attendees.map((attendee: any) => ({
          event_id: eventId,
          user_id: attendee.userId || null,
          external_email: attendee.email || null,
          external_name: attendee.name || null,
          role: attendee.role || 'attendee',
          status: attendee.status || 'pending'
        }))

        await supabase
          .from('calendar_attendees')
          .insert(attendeeData)
      }
    }

    // Update resource bookings if provided
    if (body.resources !== undefined) {
      // Remove existing bookings
      await supabase
        .from('calendar_resource_bookings')
        .delete()
        .eq('event_id', eventId)

      // Add new bookings
      if (body.resources.length > 0) {
        const resourceBookings = body.resources.map((resourceId: string) => ({
          event_id: eventId,
          resource_id: resourceId,
          status: 'confirmed'
        }))

        await supabase
          .from('calendar_resource_bookings')
          .insert(resourceBookings)
      }
    }

    return NextResponse.json({
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        status: updatedEvent.event_status,
        updatedAt: updatedEvent.updated_at
      },
      message: 'Calendar event updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in event update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const eventId = resolvedParams.id

    // Get event to check permissions
    const { data: event, error: fetchError } = await supabase
      .from('calendar_events')
      .select('created_by, event_type')
      .eq('id', eventId)
      .single()

    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      )
    }

    // Check permission to delete
    const canDelete = event.created_by === authResult.user.id ||
                     authResult.permissions.includes('admin')

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      )
    }

    // Don't allow deletion of job events - they should be cancelled instead
    if (event.event_type === 'job') {
      return NextResponse.json(
        { error: 'Job events cannot be deleted. Please cancel instead.' },
        { status: 400 }
      )
    }

    // Delete event (cascades to attendees and resource bookings)
    const { error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      console.error('Event deletion error:', deleteError)
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar event deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in event deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}