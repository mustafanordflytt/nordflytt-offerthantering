import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables - Calendar Availability')
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
        success: true,
        staff: [],
        summary: {
          totalStaff: 0,
          availableStaff: 0,
          busyStaff: 0,
          averageAvailability: 0
        }
      }, { headers })
    }

    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString()
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')

    // If no supabase client, return empty availability
    if (!supabase) {
      return NextResponse.json({ 
        success: true,
        staff: [],
        summary: {
          totalStaff: 0,
          availableStaff: 0,
          busyStaff: 0,
          averageAvailability: 0
        }
      }, { headers })
    }

    // Get all staff members
    const { data: staffMembers, error: staffError } = await supabase
      .from('crm_users')
      .select('id, name, email, phone, role')
      .in('role', ['manager', 'staff', 'admin'])
      .eq('is_active', true)

    if (staffError) {
      console.error('Error fetching staff:', staffError)
      // Return empty availability if error
      return NextResponse.json({ 
        success: true,
        staff: [],
        summary: {
          totalStaff: 0,
          availableStaff: 0,
          busyStaff: 0,
          averageAvailability: 0
        }
      }, { headers })
    }

    // Get calendar events for the specified date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_datetime', startOfDay.toISOString())
      .lte('start_datetime', endOfDay.toISOString())
      .neq('event_status', 'cancelled')

    if (eventsError && !eventsError.message.includes('does not exist')) {
      console.error('Error fetching events:', eventsError)
    }

    // Calculate availability for each staff member
    const staffAvailability = (staffMembers || []).map(staff => {
      const staffEvents = (events || []).filter(event => 
        event.assigned_staff && event.assigned_staff.includes(staff.id)
      )

      const conflicts = staffEvents.filter(event => {
        if (startTime && endTime) {
          const eventStart = new Date(event.start_datetime)
          const eventEnd = new Date(event.end_datetime)
          const checkStart = new Date(`${date.split('T')[0]}T${startTime}`)
          const checkEnd = new Date(`${date.split('T')[0]}T${endTime}`)
          
          return (eventStart < checkEnd && eventEnd > checkStart)
        }
        return true
      })

      const totalWorkHours = 8 // Assume 8-hour workday
      const bookedHours = staffEvents.reduce((total, event) => {
        const start = new Date(event.start_datetime)
        const end = new Date(event.end_datetime)
        return total + ((end.getTime() - start.getTime()) / (1000 * 60 * 60))
      }, 0)

      const availabilityPercentage = Math.max(0, ((totalWorkHours - bookedHours) / totalWorkHours) * 100)

      return {
        staffId: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isAvailable: conflicts.length === 0,
        conflicts: conflicts.map(c => ({
          id: c.id,
          title: c.title,
          start: c.start_datetime,
          end: c.end_datetime,
          type: c.event_type
        })),
        totalEvents: staffEvents.length,
        availabilityPercentage: Math.round(availabilityPercentage),
        bookedHours: Math.round(bookedHours * 10) / 10
      }
    })

    // Calculate summary statistics
    const summary = {
      totalStaff: staffAvailability.length,
      availableStaff: staffAvailability.filter(s => s.isAvailable).length,
      busyStaff: staffAvailability.filter(s => !s.isAvailable).length,
      averageAvailability: Math.round(
        staffAvailability.reduce((sum, s) => sum + s.availabilityPercentage, 0) / 
        (staffAvailability.length || 1)
      )
    }

    return NextResponse.json({
      success: true,
      staff: staffAvailability,
      summary,
      date,
      timeRange: startTime && endTime ? { start: startTime, end: endTime } : null
    }, { headers })

  } catch (error: any) {
    console.error('Availability API error:', error)
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    return NextResponse.json({
      success: false,
      error: 'Failed to check availability',
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