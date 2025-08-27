import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/staff-auth'

// Hjälpfunktion för att beräkna avstånd mellan GPS-koordinater (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Jordens radie i kilometer
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Avstånd i kilometer
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI/180)
}

// Mock data för jobbplatser och deras GPS-koordinater
const mockJobLocations = {
  'job-001': {
    id: 'job-001',
    bookingNumber: 'NF-2025-001',
    customer: 'Volvo AB',
    address: 'Volvo Personvagnar AB, VAK, 405 31 Göteborg',
    coordinates: { lat: 57.7089, lng: 11.9746 },
    allowedRadius: 0.1 // 100 meter tolerans
  },
  'job-005': {
    id: 'job-005',
    bookingNumber: 'NF-2025-005',
    customer: 'Familjen Svensson',
    address: 'Björkgatan 15, 411 32 Göteborg',
    coordinates: { lat: 57.6868, lng: 11.9668 },
    allowedRadius: 0.1
  },
  'job-010': {
    id: 'job-010',
    bookingNumber: 'NF-2025-010',
    customer: 'IKEA Uppsala',
    address: 'Dag Hammarskjölds väg 52, 752 37 Uppsala',
    coordinates: { lat: 59.8585, lng: 17.6389 },
    allowedRadius: 0.2 // Större tolerans för stora platser
  }
}

// Mock data för aktiva arbetstider
const activeTimereports = new Map<string, any>()

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

    const body = await request.json()
    const { 
      action, // 'checkin' eller 'checkout'
      jobId,
      coordinates, // { lat, lng }
      photo, // Valfri bild för verifiering
      notes // Valfria anteckningar
    } = body

    // Validera input
    if (!action || !coordinates || !coordinates.lat || !coordinates.lng) {
      return NextResponse.json(
        { error: 'Action och GPS-koordinater krävs' },
        { status: 400 }
      )
    }

    if (!['checkin', 'checkout'].includes(action)) {
      return NextResponse.json(
        { error: 'Action måste vara "checkin" eller "checkout"' },
        { status: 400 }
      )
    }

    const staffId = payload.staffId as string
    const timestamp = new Date()

    if (action === 'checkin') {
      // Validera att personal är nära rätt plats för jobbet
      if (!jobId) {
        return NextResponse.json(
          { error: 'Job ID krävs för incheckning' },
          { status: 400 }
        )
      }

      const jobLocation = mockJobLocations[jobId as keyof typeof mockJobLocations]
      if (!jobLocation) {
        return NextResponse.json(
          { error: 'Jobb hittades inte' },
          { status: 404 }
        )
      }

      // Beräkna avstånd mellan personal och jobbplats
      const distance = calculateDistance(
        coordinates.lat,
        coordinates.lng,
        jobLocation.coordinates.lat,
        jobLocation.coordinates.lng
      )

      // Kontrollera om personal är inom tillåten radie
      if (distance > jobLocation.allowedRadius) {
        return NextResponse.json(
          { 
            error: 'Du är för långt från jobbplatsen för att checka in',
            distance: Math.round(distance * 1000), // Avstånd i meter
            allowedDistance: Math.round(jobLocation.allowedRadius * 1000),
            jobLocation: jobLocation.address
          },
          { status: 400 }
        )
      }

      // Kontrollera om personal redan är incheckad på ett annat jobb
      const existingCheckin = activeTimereports.get(staffId)
      if (existingCheckin && !existingCheckin.checkedOut) {
        return NextResponse.json(
          { 
            error: 'Du är redan incheckad på ett annat jobb',
            activeJob: existingCheckin.jobId,
            checkinTime: existingCheckin.checkinTime
          },
          { status: 400 }
        )
      }

      // Skapa ny timerapport
      const timereport = {
        id: `tr-${Date.now()}`,
        staffId,
        staffName: payload.name as string,
        jobId,
        jobInfo: jobLocation,
        checkinTime: timestamp.toISOString(),
        checkinCoordinates: coordinates,
        checkinPhoto: photo || null,
        checkinNotes: notes || null,
        checkedOut: false,
        checkoutTime: null,
        checkoutCoordinates: null,
        checkoutPhoto: null,
        checkoutNotes: null,
        totalHours: null,
        status: 'active'
      }

      // Spara i mock storage (skulle vara Supabase i produktion)
      activeTimereports.set(staffId, timereport)

      return NextResponse.json({
        success: true,
        action: 'checkin',
        timereportId: timereport.id,
        job: {
          id: jobId,
          customer: jobLocation.customer,
          address: jobLocation.address
        },
        checkinTime: timestamp.toISOString(),
        distance: Math.round(distance * 1000), // meter
        message: `Incheckad på ${jobLocation.customer}`
      })

    } else if (action === 'checkout') {
      // Hämta aktiv timerapport
      const activeReport = activeTimereports.get(staffId)
      
      if (!activeReport || activeReport.checkedOut) {
        return NextResponse.json(
          { error: 'Ingen aktiv incheckning hittades' },
          { status: 400 }
        )
      }

      // Beräkna arbetstid
      const checkinTime = new Date(activeReport.checkinTime)
      const totalMinutes = Math.floor((timestamp.getTime() - checkinTime.getTime()) / 1000 / 60)
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100 // Avrunda till 2 decimaler

      // Kontrollera minsta arbetstid (15 minuter)
      if (totalMinutes < 15) {
        return NextResponse.json(
          { 
            error: 'Minsta arbetstid är 15 minuter',
            currentMinutes: totalMinutes
          },
          { status: 400 }
        )
      }

      // Uppdatera timerapport med utcheckning
      activeReport.checkedOut = true
      activeReport.checkoutTime = timestamp.toISOString()
      activeReport.checkoutCoordinates = coordinates
      activeReport.checkoutPhoto = photo || null
      activeReport.checkoutNotes = notes || null
      activeReport.totalHours = totalHours
      activeReport.status = 'completed'

      // Uppdatera i mock storage
      activeTimereports.set(staffId, activeReport)

      // I produktion: Spara till Supabase
      // const supabase = createClient()
      // const { data, error } = await supabase
      //   .from('staff_timereports')
      //   .insert([activeReport])

      return NextResponse.json({
        success: true,
        action: 'checkout',
        timereportId: activeReport.id,
        job: {
          id: activeReport.jobId,
          customer: activeReport.jobInfo.customer
        },
        checkinTime: activeReport.checkinTime,
        checkoutTime: timestamp.toISOString(),
        totalHours,
        totalMinutes,
        earnings: Math.round(totalHours * 250), // Mock timpenning 250 kr/h
        message: `Utcheckad från ${activeReport.jobInfo.customer}. Arbetstid: ${totalHours}h`
      })
    }

  } catch (error) {
    console.error('Check-in API error:', error)
    return NextResponse.json(
      { error: 'Internt serverfel vid in/utcheckning' },
      { status: 500 }
    )
  }
}

// GET för att hämta aktuell check-in status
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
    const activeReport = activeTimereports.get(staffId)

    if (!activeReport || activeReport.checkedOut) {
      return NextResponse.json({
        checkedIn: false,
        activeJob: null,
        todayHours: 0,
        todayEarnings: 0
      })
    }

    // Beräkna pågående arbetstid
    const checkinTime = new Date(activeReport.checkinTime)
    const currentTime = new Date()
    const currentMinutes = Math.floor((currentTime.getTime() - checkinTime.getTime()) / 1000 / 60)
    const currentHours = Math.round((currentMinutes / 60) * 100) / 100

    return NextResponse.json({
      checkedIn: true,
      activeJob: {
        id: activeReport.jobId,
        customer: activeReport.jobInfo.customer,
        address: activeReport.jobInfo.address,
        checkinTime: activeReport.checkinTime
      },
      currentHours,
      currentMinutes,
      currentEarnings: Math.round(currentHours * 250),
      todayHours: currentHours, // I produktion: summa av alla jobb idag
      todayEarnings: Math.round(currentHours * 250)
    })

  } catch (error) {
    console.error('Check-in status error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta check-in status' },
      { status: 500 }
    )
  }
}

// DELETE för att avbryta en incheckning (admin/emergency)
export async function DELETE(request: NextRequest) {
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

    // Kontrollera admin-behörigheter
    const userRole = payload.role as string
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Otillräckliga behörigheter' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { staffId, reason } = body

    if (!staffId || !reason) {
      return NextResponse.json(
        { error: 'Staff ID och anledning krävs' },
        { status: 400 }
      )
    }

    // Avbryt aktiv incheckning
    const activeReport = activeTimereports.get(staffId)
    if (activeReport && !activeReport.checkedOut) {
      activeReport.status = 'cancelled'
      activeReport.cancelledBy = payload.staffId as string
      activeReport.cancelReason = reason
      activeReport.cancelledAt = new Date().toISOString()
      
      activeTimereports.delete(staffId)
    }

    return NextResponse.json({
      success: true,
      message: 'Incheckning avbruten',
      cancelledBy: payload.name as string,
      reason
    })

  } catch (error) {
    console.error('Cancel check-in error:', error)
    return NextResponse.json(
      { error: 'Kunde inte avbryta incheckning' },
      { status: 500 }
    )
  }
}