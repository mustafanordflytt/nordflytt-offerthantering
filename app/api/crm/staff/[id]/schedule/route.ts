import { NextRequest, NextResponse } from 'next/server'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { createClient } from '@supabase/supabase-js'
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns'
import { sv } from 'date-fns/locale'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Demo schedule data
const demoSchedules: Record<string, any> = {
  'staff-001': {
    weeklySchedule: {
      monday: { start: '08:00', end: '17:00', available: true },
      tuesday: { start: '08:00', end: '17:00', available: true },
      wednesday: { start: '08:00', end: '17:00', available: true },
      thursday: { start: '08:00', end: '17:00', available: true },
      friday: { start: '08:00', end: '16:00', available: true },
      saturday: { start: null, end: null, available: false },
      sunday: { start: null, end: null, available: false }
    },
    assignments: [
      {
        id: 'assign-1',
        jobId: 'DEMO001',
        jobName: 'Flytt - Anna Svensson',
        date: new Date().toISOString(),
        startTime: '10:00',
        endTime: '13:00',
        status: 'confirmed'
      },
      {
        id: 'assign-2',
        jobId: 'DEMO002',
        jobName: 'Kontorsflytt - Företaget AB',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        startTime: '14:00',
        endTime: '18:00',
        status: 'confirmed'
      }
    ],
    vacations: [
      {
        id: 'vac-1',
        startDate: '2025-07-01',
        endDate: '2025-07-21',
        type: 'semester',
        status: 'approved'
      }
    ]
  },
  'staff-002': {
    weeklySchedule: {
      monday: { start: '07:00', end: '16:00', available: true },
      tuesday: { start: '07:00', end: '16:00', available: true },
      wednesday: { start: '07:00', end: '16:00', available: true },
      thursday: { start: '07:00', end: '16:00', available: true },
      friday: { start: '07:00', end: '15:00', available: true },
      saturday: { start: '09:00', end: '13:00', available: true },
      sunday: { start: null, end: null, available: false }
    },
    assignments: [
      {
        id: 'assign-3',
        jobId: 'DEMO002',
        jobName: 'Kontorsflytt - Företaget AB',
        date: new Date().toISOString(),
        startTime: '14:00',
        endTime: '20:00',
        status: 'confirmed'
      }
    ],
    vacations: []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const staffId = resolvedParams.id
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || startOfWeek(new Date(), { locale: sv }).toISOString()
    const endDate = searchParams.get('endDate') || endOfWeek(new Date(), { locale: sv }).toISOString()

    // Get demo schedule
    const schedule = demoSchedules[staffId] || {
      weeklySchedule: {
        monday: { start: '08:00', end: '17:00', available: true },
        tuesday: { start: '08:00', end: '17:00', available: true },
        wednesday: { start: '08:00', end: '17:00', available: true },
        thursday: { start: '08:00', end: '17:00', available: true },
        friday: { start: '08:00', end: '16:00', available: true },
        saturday: { start: null, end: null, available: false },
        sunday: { start: null, end: null, available: false }
      },
      assignments: [],
      vacations: []
    }

    // Filter assignments by date range
    const filteredAssignments = schedule.assignments.filter((assignment: any) => {
      const assignmentDate = new Date(assignment.date)
      return assignmentDate >= new Date(startDate) && assignmentDate <= new Date(endDate)
    })

    // Try Supabase if available
    if (supabase) {
      // In production, fetch from database
      const { data: dbSchedule, error } = await supabase
        .from('staff_schedule')
        .select(`
          *,
          job_assignments:job_assignments(*),
          vacations:staff_vacations(*)
        `)
        .eq('staff_id', staffId)
        .gte('date', startDate)
        .lte('date', endDate)

      if (!error && dbSchedule) {
        return NextResponse.json({
          success: true,
          schedule: dbSchedule,
          weeklySchedule: schedule.weeklySchedule
        })
      }
    }

    return NextResponse.json({
      success: true,
      schedule: {
        staffId,
        weeklySchedule: schedule.weeklySchedule,
        assignments: filteredAssignments,
        vacations: schedule.vacations,
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
    })

  } catch (error) {
    console.error('Error fetching staff schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const staffId = resolvedParams.id
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: 'Type and data are required' }, { status: 400 })
    }

    // Initialize schedule if not exists
    if (!demoSchedules[staffId]) {
      demoSchedules[staffId] = {
        weeklySchedule: {},
        assignments: [],
        vacations: []
      }
    }

    switch (type) {
      case 'assignment':
        // Add job assignment
        const newAssignment = {
          id: `assign-${Date.now()}`,
          ...data,
          createdAt: new Date().toISOString()
        }
        demoSchedules[staffId].assignments.push(newAssignment)
        
        return NextResponse.json({
          success: true,
          assignment: newAssignment
        })

      case 'vacation':
        // Add vacation
        const newVacation = {
          id: `vac-${Date.now()}`,
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString()
        }
        demoSchedules[staffId].vacations.push(newVacation)
        
        return NextResponse.json({
          success: true,
          vacation: newVacation
        })

      case 'weekly':
        // Update weekly schedule
        demoSchedules[staffId].weeklySchedule = {
          ...demoSchedules[staffId].weeklySchedule,
          ...data
        }
        
        return NextResponse.json({
          success: true,
          weeklySchedule: demoSchedules[staffId].weeklySchedule
        })

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error updating staff schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const staffId = resolvedParams.id
    const searchParams = request.nextUrl.searchParams
    const assignmentId = searchParams.get('assignmentId')
    const vacationId = searchParams.get('vacationId')

    if (!demoSchedules[staffId]) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    if (assignmentId) {
      // Remove assignment
      demoSchedules[staffId].assignments = demoSchedules[staffId].assignments.filter(
        (a: any) => a.id !== assignmentId
      )
    } else if (vacationId) {
      // Remove vacation
      demoSchedules[staffId].vacations = demoSchedules[staffId].vacations.filter(
        (v: any) => v.id !== vacationId
      )
    } else {
      return NextResponse.json({ error: 'Assignment ID or Vacation ID required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule item removed successfully'
    })

  } catch (error) {
    console.error('Error deleting schedule item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}