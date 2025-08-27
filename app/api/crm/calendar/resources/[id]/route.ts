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

    const resolvedParams = await params
    const resourceId = resolvedParams.id

    // Fetch resource with all bookings
    const { data: resource, error } = await supabase
      .from('calendar_resources')
      .select(`
        *,
        bookings:calendar_resource_bookings(
          id,
          event_id,
          status,
          notes,
          created_at,
          event:calendar_events(
            id,
            event_id,
            title,
            description,
            event_type,
            event_status,
            start_datetime,
            end_datetime,
            customer:customers(
              id,
              customer_name,
              customer_phone,
              customer_email
            ),
            job:jobs(
              id,
              job_id,
              from_address,
              to_address
            )
          )
        )
      `)
      .eq('id', resourceId)
      .single()

    if (error || !resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Transform resource data
    const transformedResource = {
      id: resource.id,
      name: resource.resource_name,
      type: resource.resource_type,
      capacity: resource.capacity,
      location: resource.location,
      description: resource.description,
      isActive: resource.is_active,
      metadata: resource.metadata || {},
      // Bookings history
      bookings: (resource.bookings || []).map((booking: any) => ({
        id: booking.id,
        eventId: booking.event_id,
        status: booking.status,
        notes: booking.notes,
        createdAt: new Date(booking.created_at),
        event: booking.event ? {
          id: booking.event.id,
          eventId: booking.event.event_id,
          title: booking.event.title,
          description: booking.event.description,
          type: booking.event.event_type,
          status: booking.event.event_status,
          start: new Date(booking.event.start_datetime),
          end: new Date(booking.event.end_datetime),
          customer: booking.event.customer,
          job: booking.event.job
        } : null
      })).sort((a: any, b: any) => 
        new Date(b.event?.start || 0).getTime() - new Date(a.event?.start || 0).getTime()
      ),
      // Usage statistics
      stats: {
        totalBookings: resource.bookings?.length || 0,
        activeBookings: resource.bookings?.filter((b: any) => 
          b.status === 'confirmed' && b.event?.event_status !== 'cancelled'
        ).length || 0,
        utilizationRate: calculateUtilizationRate(resource.bookings || [])
      },
      createdAt: new Date(resource.created_at),
      updatedAt: new Date(resource.updated_at)
    }

    return NextResponse.json({
      resource: transformedResource
    })

  } catch (error) {
    console.error('Unexpected error in resource details:', error)
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

    // Check permissions - only managers can update resources
    if (!authResult.permissions.includes('admin') && authResult.user.role !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const resourceId = resolvedParams.id
    const body = await request.json()

    // Get current resource
    const { data: currentResource, error: fetchError } = await supabase
      .from('calendar_resources')
      .select('*')
      .eq('id', resourceId)
      .single()

    if (fetchError || !currentResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Check for duplicate name if name is being changed
    if (body.name && body.name !== currentResource.resource_name) {
      const { data: existing } = await supabase
        .from('calendar_resources')
        .select('id')
        .eq('resource_name', body.name)
        .neq('id', resourceId)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'A resource with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Update fields if provided
    if (body.name !== undefined) updateData.resource_name = body.name
    if (body.type !== undefined) updateData.resource_type = body.type
    if (body.capacity !== undefined) updateData.capacity = body.capacity
    if (body.location !== undefined) updateData.location = body.location
    if (body.description !== undefined) updateData.description = body.description
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    // Update resource
    const { data: updatedResource, error: updateError } = await supabase
      .from('calendar_resources')
      .update(updateData)
      .eq('id', resourceId)
      .select()
      .single()

    if (updateError) {
      console.error('Resource update error:', updateError)
      throw updateError
    }

    return NextResponse.json({
      resource: {
        id: updatedResource.id,
        name: updatedResource.resource_name,
        type: updatedResource.resource_type,
        isActive: updatedResource.is_active,
        updatedAt: updatedResource.updated_at
      },
      message: 'Resource updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in resource update:', error)
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

    // Check permissions - only admins can delete resources
    if (!authResult.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const resourceId = resolvedParams.id

    // Check if resource has active bookings
    const { data: activeBookings } = await supabase
      .from('calendar_resource_bookings')
      .select('id, event:calendar_events(start_datetime, end_datetime)')
      .eq('resource_id', resourceId)
      .eq('status', 'confirmed')

    const now = new Date()
    const hasActiveBookings = activeBookings?.some((booking: any) => {
      const end = new Date(booking.event?.end_datetime)
      return end > now
    })

    if (hasActiveBookings) {
      return NextResponse.json(
        { error: 'Cannot delete resource with active bookings' },
        { status: 400 }
      )
    }

    // Delete resource (cascades to bookings)
    const { error: deleteError } = await supabase
      .from('calendar_resources')
      .delete()
      .eq('id', resourceId)

    if (deleteError) {
      console.error('Resource deletion error:', deleteError)
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in resource deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate utilization rate
function calculateUtilizationRate(bookings: any[]): number {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const recentBookings = bookings.filter((b: any) => {
    const start = new Date(b.event?.start_datetime)
    return b.status === 'confirmed' && 
           b.event?.event_status !== 'cancelled' &&
           start >= thirtyDaysAgo && start <= now
  })

  if (recentBookings.length === 0) return 0

  // Calculate total booked hours
  const totalBookedHours = recentBookings.reduce((total, booking) => {
    const start = new Date(booking.event.start_datetime)
    const end = new Date(booking.event.end_datetime)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return total + hours
  }, 0)

  // Assume 8 hours per day, 22 working days per month
  const totalAvailableHours = 8 * 22
  const utilizationRate = (totalBookedHours / totalAvailableHours) * 100

  return Math.min(Math.round(utilizationRate), 100)
}