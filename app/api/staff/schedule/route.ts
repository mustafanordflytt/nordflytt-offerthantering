import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/staff-auth'

// Mock schedule data - skulle normalt komma från Supabase
const mockScheduleData = {
  'staff-001': { // Lars Andersson (Admin)
    weekSchedule: {
      monday: { start: '08:00', end: '17:00', type: 'office' },
      tuesday: { start: '08:00', end: '17:00', type: 'office' },
      wednesday: { start: '08:00', end: '17:00', type: 'office' },
      thursday: { start: '08:00', end: '17:00', type: 'office' },
      friday: { start: '08:00', end: '16:00', type: 'office' },
      saturday: { start: null, end: null, type: 'off' },
      sunday: { start: null, end: null, type: 'off' }
    },
    todayJobs: []
  },
  'staff-002': { // Maria Eriksson (Manager)
    weekSchedule: {
      monday: { start: '07:30', end: '16:30', type: 'field' },
      tuesday: { start: '08:00', end: '17:00', type: 'office' },
      wednesday: { start: '07:30', end: '16:30', type: 'field' },
      thursday: { start: '08:00', end: '17:00', type: 'office' },
      friday: { start: '08:00', end: '15:00', type: 'office' },
      saturday: { start: null, end: null, type: 'off' },
      sunday: { start: null, end: null, type: 'off' }
    },
    todayJobs: [
      {
        id: 'job-010',
        bookingNumber: 'NF-2025-010',
        title: 'Kvalitetskontroll - IKEA Uppsala',
        customer: 'IKEA Uppsala',
        customerPhone: '+46 18 123 45 67',
        fromAddress: {
          street: 'IKEA Uppsala',
          address: 'Dag Hammarskjölds väg 52',
          city: '752 37 Uppsala',
          coordinates: { lat: 59.8585, lng: 17.6389 }
        },
        toAddress: {
          street: 'Nya kontoret',
          address: 'Centralvägen 10',
          city: '752 28 Uppsala',
          coordinates: { lat: 59.8567, lng: 17.6456 }
        },
        scheduledTime: '09:00',
        estimatedDuration: 2,
        status: 'scheduled',
        priority: 'high',
        team: ['Maria Eriksson'],
        services: ['Kvalitetskontroll', 'Projektledning'],
        specialInstructions: 'Kontrollera att alla möbler är korrekt placerade',
        equipmentNeeded: ['Checklista', 'Mätband', 'Kamera']
      }
    ]
  },
  'staff-003': { // Johan Karlsson (Mover)
    weekSchedule: {
      monday: { start: '07:00', end: '16:00', type: 'field' },
      tuesday: { start: '07:00', end: '16:00', type: 'field' },
      wednesday: { start: '07:00', end: '16:00', type: 'field' },
      thursday: { start: '07:00', end: '16:00', type: 'field' },
      friday: { start: '07:00', end: '15:00', type: 'field' },
      saturday: { start: '08:00', end: '12:00', type: 'field' },
      sunday: { start: null, end: null, type: 'off' }
    },
    todayJobs: [
      {
        id: 'job-001',
        bookingNumber: 'NF-2025-001',
        title: 'Kontorsflytt - Volvo AB',
        customer: 'Volvo AB',
        customerPhone: '+46 31 123 45 67',
        fromAddress: {
          street: 'Volvo Huvudkontor',
          address: 'Volvo Personvagnar AB, VAK, 405 31 Göteborg',
          city: '405 31 Göteborg',
          coordinates: { lat: 57.7089, lng: 11.9746 }
        },
        toAddress: {
          street: 'Nya Volvo-huset',
          address: 'Lindholmsplatsen 1',
          city: '417 56 Göteborg',
          coordinates: { lat: 57.7065, lng: 11.9397 }
        },
        scheduledTime: '08:00',
        estimatedDuration: 6,
        status: 'scheduled',
        priority: 'high',
        team: ['Johan Karlsson', 'Anna Johansson', 'Peter Svensson'],
        services: ['Packning', 'Transport', 'Uppackning', 'Möbelmontering'],
        specialInstructions: 'Extra försiktighet med IT-utrustning. Viktiga servrar måste hanteras av IT-personal.',
        equipmentNeeded: ['Lastbil stor', 'Lyfttruck', 'IT-säkra lådor', 'Bubbelplast', 'Verktygssats']
      },
      {
        id: 'job-005',
        bookingNumber: 'NF-2025-005',
        title: 'Hemflytt - Familjen Svensson',
        customer: 'Familjen Svensson',
        customerPhone: '+46 70 987 65 43',
        fromAddress: {
          street: 'Gamla hemmet',
          address: 'Björkgatan 15',
          city: '411 32 Göteborg',
          coordinates: { lat: 57.6868, lng: 11.9668 }
        },
        toAddress: {
          street: 'Nya villan',
          address: 'Rosengatan 8',
          city: '412 51 Göteborg',
          coordinates: { lat: 57.6789, lng: 11.9445 }
        },
        scheduledTime: '14:30',
        estimatedDuration: 4,
        status: 'scheduled',
        priority: 'medium',
        team: ['Johan Karlsson', 'Anna Johansson'],
        services: ['Packning', 'Transport', 'Uppackning'],
        specialInstructions: 'Piano på andra våningen - behöver extra personal för detta',
        equipmentNeeded: ['Lastbil medel', 'Pianotrolley', 'Extra rep', 'Möbelfiltar']
      }
    ]
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Ingen token tillhandahållen' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Ogiltig eller utgången token' },
        { status: 401 }
      )
    }

    const staffId = payload.staffId as string
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const week = searchParams.get('week') === 'true'

    // Hämta schemainfo för personal
    const scheduleData = mockScheduleData[staffId as keyof typeof mockScheduleData]
    
    if (!scheduleData) {
      return NextResponse.json(
        { error: 'Schema hittades inte för denna personal' },
        { status: 404 }
      )
    }

    // Dagens dag (måndag = 0, söndag = 6)
    const today = new Date(date)
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const currentDay = dayNames[today.getDay() === 0 ? 6 : today.getDay() - 1] // Justera för svenska veckosystem

    // Nuvarande tid för att bestämma status på jobb
    const currentTime = new Date()
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

    // Uppdatera jobbstatus baserat på tid
    const jobsWithStatus = scheduleData.todayJobs.map(job => {
      const jobTime = job.scheduledTime
      const jobHour = parseInt(jobTime.split(':')[0])
      const jobMinute = parseInt(jobTime.split(':')[1])
      
      let status = job.status
      if (currentHour > jobHour || (currentHour === jobHour && currentMinute > jobMinute + 30)) {
        status = 'in_progress'
      } else if (currentHour > jobHour + job.estimatedDuration) {
        status = 'completed'
      }

      return { ...job, status, currentTime: currentTimeStr }
    })

    // Beräkna statistik för dagen
    const stats = {
      totalJobs: jobsWithStatus.length,
      completedJobs: jobsWithStatus.filter(j => j.status === 'completed').length,
      inProgressJobs: jobsWithStatus.filter(j => j.status === 'in_progress').length,
      upcomingJobs: jobsWithStatus.filter(j => j.status === 'scheduled').length,
      totalEstimatedHours: jobsWithStatus.reduce((sum, job) => sum + job.estimatedDuration, 0),
      earliestStart: jobsWithStatus.length > 0 ? 
        Math.min(...jobsWithStatus.map(j => {
          const [hour, minute] = j.scheduledTime.split(':').map(Number)
          return hour * 60 + minute
        })).toString() : null,
      latestEnd: jobsWithStatus.length > 0 ? {
        time: Math.max(...jobsWithStatus.map(j => {
          const [hour, minute] = j.scheduledTime.split(':').map(Number)
          return hour + j.estimatedDuration + (minute / 60)
        })),
        formatted: '' // Beräknas nedan
      } : null
    }

    if (stats.latestEnd) {
      const endHour = Math.floor(stats.latestEnd.time)
      const endMinute = Math.round((stats.latestEnd.time - endHour) * 60)
      stats.latestEnd.formatted = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
    }

    const response = {
      date,
      staff: {
        id: staffId,
        name: payload.name as string,
        role: payload.role as string
      },
      shift: scheduleData.weekSchedule[currentDay as keyof typeof scheduleData.weekSchedule],
      jobs: jobsWithStatus,
      stats,
      weather: {
        // Mock väderdata - skulle komma från väder-API
        temperature: 18,
        condition: 'Delvis molnigt',
        icon: 'partly-cloudy',
        precipitation: 20
      },
      notifications: [
        {
          id: 'notif-001',
          type: 'info',
          title: 'Påminnelse',
          message: 'Kom ihåg att checka in vid första jobbet',
          timestamp: new Date().toISOString()
        }
      ]
    }

    // Om veckoschema begärs
    if (week) {
      (response as any).weekSchedule = scheduleData.weekSchedule
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Schedule API error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta schema' },
      { status: 500 }
    )
  }
}

// POST för att uppdatera schema (admin-funktion)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Ingen token tillhandahållen' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Ogiltig eller utgången token' },
        { status: 401 }
      )
    }

    // Kontrollera behörigheter (endast admin/manager kan uppdatera schema)
    const userRole = payload.role as string
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Otillräckliga behörigheter för att uppdatera schema' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { staffId, date, updates } = body

    // Validera input
    if (!staffId || !date || !updates) {
      return NextResponse.json(
        { error: 'Staff ID, datum och uppdateringar krävs' },
        { status: 400 }
      )
    }

    // I produktion: Uppdatera schema i databas
    // const supabase = createClient()
    // const { data, error } = await supabase
    //   .from('staff_schedules')
    //   .update(updates)
    //   .eq('staff_id', staffId)
    //   .eq('date', date)

    return NextResponse.json({
      success: true,
      message: 'Schema uppdaterat',
      updatedBy: payload.staffId as string,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Schedule update error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera schema' },
      { status: 500 }
    )
  }
}