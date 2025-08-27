import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables - Calendar Events')
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

export async function GET(request: NextRequest) {
  try {
    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers })
    }
    
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase environment variables missing')
      return NextResponse.json({ 
        error: 'Database configuration missing',
        details: 'Supabase environment variables not configured'
      }, { status: 500, headers })
    }

    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      console.error('Authentication failed:', authResult)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    // Check permissions
    if (!authResult.permissions.includes('jobs:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403, headers })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const viewMode = searchParams.get('viewMode') || 'month'
    const eventType = searchParams.get('eventType')
    const staffId = searchParams.get('staffId')

    // If no supabase client, return empty events
    if (!supabase) {
      return NextResponse.json({
        success: true,
        events: [],
        stats: {
          totalEvents: 0,
          todayEvents: 0,
          upcomingEvents: 0,
          eventsByType: {}
        },
        viewMode
      }, { headers })
    }

    // Build base query - check if we have the new structure or old structure
    let query = supabase
      .from('calendar_events')
      .select('*')
    
    // First, check which structure we have
    const { data: sampleEvent, error: sampleError } = await supabase
      .from('calendar_events')
      .select('*')
      .limit(1)
      .single()
    
    if (sampleError && sampleError.code !== 'PGRST116') {
      console.error('Error checking calendar structure:', sampleError)
      throw new Error('Database connection failed: ' + sampleError.message)
    }
    
    const hasNewStructure = sampleEvent && 'start_datetime' in sampleEvent
    
    if (hasNewStructure) {
      query = supabase
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
            final_price
          ),
          customer:customers(
            id,
            name,
            phone,
            email
          )
        `)
        .neq('event_status', 'cancelled')
        .order('start_datetime', { ascending: true })
    } else {
      // Old structure with date and time fields
      query = supabase
        .from('calendar_events')
        .select(`
          *,
          customer:customers(
            id,
            name,
            phone,
            email
          )
        `)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
    }

    // Apply date filters
    if (hasNewStructure) {
      if (startDate) {
        query = query.gte('start_datetime', startDate)
      }
      if (endDate) {
        query = query.lte('start_datetime', endDate)
      }
      // Filter by event type
      if (eventType && eventType !== 'all') {
        query = query.eq('event_type', eventType)
      }
      // Filter by staff member
      if (staffId && staffId !== 'all') {
        query = query.contains('assigned_staff', [staffId])
      }
    } else {
      // Old structure filtering
      if (startDate) {
        query = query.gte('date', startDate.split('T')[0])
      }
      if (endDate) {
        query = query.lte('date', endDate.split('T')[0])
      }
      // Filter by event type
      if (eventType && eventType !== 'all') {
        query = query.eq('type', eventType)
      }
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Database query failed: ${error.message} (${error.code})`)
    }

    // Get staff details for assigned staff
    const allStaffIds = [...new Set(events?.flatMap(e => e.assigned_staff || []) || [])]
    let staffMap: Record<string, any> = {}

    if (allStaffIds.length > 0) {
      const { data: staffData } = await supabase
        .from('crm_users')
        .select('id, name, email, role')
        .in('id', allStaffIds)

      staffMap = (staffData || []).reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {})
    }

    // Transform events for frontend
    const transformedEvents = (events || []).map(event => {
      if (hasNewStructure) {
        return {
          id: event.id,
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
          jobId: event.job_id,
          job: event.job,
          customerId: event.customer_id,
          customer: event.customer,
          // Staff
          assignedStaff: event.assigned_staff?.map((id: string) => staffMap[id]).filter(Boolean) || [],
          requiredStaffCount: event.required_staff_count,
          // Location
          location: {
            name: event.location_name,
            address: event.location_address,
            lat: event.location_lat,
            lng: event.location_lng
          },
          // Metadata
          color: event.color || getEventTypeColor(event.event_type),
          priority: event.priority,
          tags: event.tags || [],
          attachments: event.attachments || [],
          reminderMinutes: event.reminder_minutes || [],
          // Dates
        }
      } else {
        // Old structure transformation
        const startDate = new Date(`${event.date}T${event.time || '09:00:00'}`)
        const duration = parseInt(event.duration) || 4 // Default 4 hours
        const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000)
        
        return {
          id: event.id,
          title: event.title,
          description: event.type,
          type: 'job', // Default to job type
          status: event.status || 'scheduled',
          start: startDate,
          end: endDate,
          allDay: false,
          recurring: false,
          recurrenceRule: null,
          // Related data
          jobId: null,
          job: null,
          customerId: event.customer_id,
          customer: event.customer,
          // Staff
          assignedStaff: event.participants || [],
          requiredStaffCount: 1,
          // Location
          location: {
            name: event.title,
            address: null,
            lat: null,
            lng: null
          },
          // Metadata
          color: getEventTypeColor('job'),
          priority: 'medium',
          tags: [],
          attachments: [],
          reminderMinutes: [],
          createdAt: event.created_at,
          updatedAt: event.updated_at || event.created_at
        }
      }
    })

    // Calculate statistics
    const stats = {
      totalEvents: transformedEvents.length,
      eventsByType: transformedEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      todayEvents: transformedEvents.filter(e => 
        new Date(e.start).toDateString() === new Date().toDateString()
      ).length,
      upcomingEvents: transformedEvents.filter(e => 
        new Date(e.start) > new Date()
      ).length
    }

    return NextResponse.json({
      success: true,
      events: transformedEvents,
      stats,
      viewMode
    }, { headers })

  } catch (error: any) {
    console.error('Calendar API error:', error)
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch calendar events',
      details: error.message
    }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  return new NextResponse(null, { status: 200, headers })
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Validate required fields
    const { title, type, start, end } = body
    
    if (!title || !type || !start || !end) {
      return NextResponse.json(
        { error: 'Title, type, start and end are required' },
        { status: 400 }
      )
    }

    // Validate datetime
    const startDatetime = new Date(start)
    const endDatetime = new Date(end)
    
    if (endDatetime <= startDatetime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Check for conflicts if staff is assigned
    if (body.assignedStaff && body.assignedStaff.length > 0) {
      const { data: conflicts } = await supabase
        .rpc('check_calendar_conflicts', {
          p_start_datetime: startDatetime.toISOString(),
          p_end_datetime: endDatetime.toISOString(),
          p_assigned_staff: body.assignedStaff
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

    // Generate event ID
    const { data: lastEvent } = await supabase
      .from('calendar_events')
      .select('event_id')
      .order('event_id', { ascending: false })
      .limit(1)
      .single()

    const lastNumber = lastEvent ? parseInt(lastEvent.event_id.replace('EVENT', '')) : 0
    const eventId = `EVENT${String(lastNumber + 1).padStart(6, '0')}`

    // Create event
    const { data: newEvent, error } = await supabase
      .from('calendar_events')
      .insert({
        event_id: eventId,
        title: title,
        description: body.description || null,
        event_type: type,
        event_status: body.status || 'scheduled',
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        all_day: body.allDay || false,
        recurring: body.recurring || false,
        recurrence_rule: body.recurrenceRule || null,
        job_id: body.jobId || null,
        customer_id: body.customerId || null,
        assigned_staff: body.assignedStaff || [],
        required_staff_count: body.requiredStaffCount || 1,
        location_name: body.location?.name || null,
        location_address: body.location?.address || null,
        location_lat: body.location?.lat || null,
        location_lng: body.location?.lng || null,
        color: body.color || null,
        priority: body.priority || 'medium',
        tags: body.tags || [],
        reminder_minutes: body.reminderMinutes || [],
        created_by: authResult.user.id,
        updated_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Event creation error:', error)
      throw error
    }

    // Add attendees if provided
    if (body.attendees && body.attendees.length > 0) {
      const attendeeData = body.attendees.map((attendee: any) => ({
        event_id: newEvent.id,
        user_id: attendee.userId || null,
        external_email: attendee.email || null,
        external_name: attendee.name || null,
        role: attendee.role || 'attendee',
        status: attendee.isOrganizer ? 'accepted' : 'pending'
      }))

      await supabase
        .from('calendar_attendees')
        .insert(attendeeData)
    }

    // Book resources if provided
    if (body.resources && body.resources.length > 0) {
      const resourceBookings = body.resources.map((resourceId: string) => ({
        event_id: newEvent.id,
        resource_id: resourceId,
        status: 'confirmed'
      }))

      await supabase
        .from('calendar_resource_bookings')
        .insert(resourceBookings)
    }

    return NextResponse.json({
      success: true,
      event: {
        id: newEvent.id,
        eventId: newEvent.event_id,
        title: newEvent.title,
        type: newEvent.event_type,
        start: newEvent.start_datetime,
        end: newEvent.end_datetime
      },
      message: 'Calendar event created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Event creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create calendar event',
      details: error.message
    }, { status: 500 })
  }
}

// Helper function to get default color for event types
function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    job: '#002A5C',
    meeting: '#0088cc',
    training: '#28a745',
    break: '#ffc107',
    vacation: '#6c757d',
    other: '#17a2b8'
  }
  return colors[type] || '#6c757d'
}