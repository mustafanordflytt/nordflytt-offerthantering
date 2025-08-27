import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/staff-auth'

// Deviation types with Swedish descriptions
const DEVIATION_TYPES = {
  'volume_increase': {
    id: 'volume_increase',
    name: 'Volymökning',
    description: 'Mer volym än beräknat',
    priority: 'medium',
    requiresApproval: true,
    category: 'logistics'
  },
  'no_elevator': {
    id: 'no_elevator',
    name: 'Hiss ej tillgänglig',
    description: 'Hiss funkar inte eller finns inte',
    priority: 'high',
    requiresApproval: false,
    category: 'logistics'
  },
  'access_problem': {
    id: 'access_problem',
    name: 'Åtkomstproblem',
    description: 'Kan inte komma åt byggnaden/lägenheten',
    priority: 'high',
    requiresApproval: false,
    category: 'access'
  },
  'parking_issue': {
    id: 'parking_issue',
    name: 'Parkeringsproblem',
    description: 'Ingen parkering eller begränsad åtkomst',
    priority: 'medium',
    requiresApproval: false,
    category: 'logistics'
  },
  'customer_not_present': {
    id: 'customer_not_present',
    name: 'Kund ej närvarande',
    description: 'Kunden finns inte på plats som planerat',
    priority: 'high',
    requiresApproval: true,
    category: 'customer'
  },
  'weather_delay': {
    id: 'weather_delay',
    name: 'Väderförsening',
    description: 'Dåligt väder påverkar jobbet',
    priority: 'low',
    requiresApproval: false,
    category: 'external'
  },
  'equipment_failure': {
    id: 'equipment_failure',
    name: 'Utrustningsfel',
    description: 'Utrustning funkar inte som förväntat',
    priority: 'high',
    requiresApproval: false,
    category: 'equipment'
  },
  'damage_found': {
    id: 'damage_found',
    name: 'Skada upptäckt',
    description: 'Skada på egendom eller föremål',
    priority: 'critical',
    requiresApproval: true,
    category: 'damage'
  },
  'extra_services': {
    id: 'extra_services',
    name: 'Extra tjänster begärda',
    description: 'Kunden ber om ytterligare tjänster',
    priority: 'medium',
    requiresApproval: true,
    category: 'services'
  },
  'safety_concern': {
    id: 'safety_concern',
    name: 'Säkerhetsproblem',
    description: 'Säkerhetsrisk eller arbetsmiljöproblem',
    priority: 'critical',
    requiresApproval: false,
    category: 'safety'
  }
}

// Mock storage för avvikelser
const mockDeviations = new Map<string, any>()
let deviationCounter = 1

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
      jobId,
      deviationType,
      description,
      photos,
      coordinates,
      estimatedDelay, // i minuter
      estimatedCost, // extra kostnad i SEK
      customerInformed,
      urgency // 'low', 'medium', 'high', 'critical'
    } = body

    // Validera input
    if (!jobId || !deviationType || !description) {
      return NextResponse.json(
        { error: 'Job ID, avvikelsetyp och beskrivning krävs' },
        { status: 400 }
      )
    }

    // Validera avvikelsetyp
    const devType = DEVIATION_TYPES[deviationType as keyof typeof DEVIATION_TYPES]
    if (!devType) {
      return NextResponse.json(
        { error: 'Ogiltig avvikelsetyp' },
        { status: 400 }
      )
    }

    const staffId = payload.staffId as string
    const timestamp = new Date()
    const deviationId = `DEV-${new Date().getFullYear()}-${String(deviationCounter++).padStart(4, '0')}`

    // Skapa avvikelse
    const deviation = {
      id: deviationId,
      jobId,
      staffId,
      staffName: payload.name as string,
      type: deviationType,
      typeInfo: devType,
      title: devType.name,
      description,
      photos: photos || [],
      coordinates: coordinates || null,
      estimatedDelay: estimatedDelay || 0,
      estimatedCost: estimatedCost || 0,
      customerInformed: customerInformed || false,
      urgency: urgency || devType.priority,
      status: devType.requiresApproval ? 'pending_approval' : 'accepted',
      reportedAt: timestamp.toISOString(),
      approvedAt: null,
      approvedBy: null,
      resolvedAt: null,
      resolution: null,
      adminNotes: null,
      automaticActions: [] as string[]
    }

    // Automatiska åtgärder baserat på avvikelsetyp
    switch (deviationType) {
      case 'volume_increase':
        deviation.automaticActions.push('Uppdatera kostnadskalkyl')
        deviation.automaticActions.push('Informera ekonomiavdelning')
        break
      case 'no_elevator':
        deviation.automaticActions.push('Lägg till extra arbetstid')
        deviation.automaticActions.push('Kontrollera personalresurser')
        break
      case 'customer_not_present':
        deviation.automaticActions.push('Pausa timer')
        deviation.automaticActions.push('Kontakta kund omedelbart')
        break
      case 'damage_found':
        deviation.automaticActions.push('Dokumentera med foton')
        deviation.automaticActions.push('Kontakta försäkring')
        deviation.automaticActions.push('Informera kundansvarig')
        break
      case 'safety_concern':
        deviation.automaticActions.push('Stoppa arbete omedelbart')
        deviation.automaticActions.push('Kontakta säkerhetsansvarig')
        break
    }

    // Spara i mock storage
    mockDeviations.set(deviationId, deviation)

    // Simulera notifieringar baserat på prioritet
    const notifications = []
    
    if (['high', 'critical'].includes(deviation.urgency)) {
      notifications.push({
        type: 'sms',
        recipient: 'manager',
        message: `URGENT: ${devType.name} rapporterad på jobb ${jobId} av ${payload.name}`
      })
    }

    notifications.push({
      type: 'email',
      recipient: 'admin',
      message: `Avvikelse ${deviationId} rapporterad: ${devType.name}`
    })

    // I produktion: Spara till Supabase och skicka notifieringar
    // const supabase = createClient()
    // const { data, error } = await supabase
    //   .from('staff_deviations')
    //   .insert([deviation])

    return NextResponse.json({
      success: true,
      deviation: {
        id: deviationId,
        type: devType.name,
        status: deviation.status,
        reportedAt: deviation.reportedAt
      },
      automaticActions: deviation.automaticActions,
      notificationsSent: notifications.length,
      message: devType.requiresApproval 
        ? 'Avvikelse rapporterad och väntar på godkännande'
        : 'Avvikelse rapporterad och accepterad automatiskt'
    })

  } catch (error) {
    console.error('Deviation API error:', error)
    return NextResponse.json(
      { error: 'Kunde inte rapportera avvikelse' },
      { status: 500 }
    )
  }
}

// GET för att hämta avvikelser
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

    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')
    const staffId = searchParams.get('staffId') || payload.staffId as string
    const status = searchParams.get('status')
    const urgency = searchParams.get('urgency')

    // Hämta avvikelser från mock storage
    let deviations = Array.from(mockDeviations.values())

    // Filtrera baserat på parametrar
    if (jobId) {
      deviations = deviations.filter(dev => dev.jobId === jobId)
    }
    
    if (staffId && payload.role !== 'admin') {
      deviations = deviations.filter(dev => dev.staffId === staffId)
    }
    
    if (status) {
      deviations = deviations.filter(dev => dev.status === status)
    }
    
    if (urgency) {
      deviations = deviations.filter(dev => dev.urgency === urgency)
    }

    // Sortera efter datum (senaste först)
    deviations.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())

    // Beräkna statistik
    const stats = {
      total: deviations.length,
      pending: deviations.filter(d => d.status === 'pending_approval').length,
      accepted: deviations.filter(d => d.status === 'accepted').length,
      resolved: deviations.filter(d => d.status === 'resolved').length,
      critical: deviations.filter(d => d.urgency === 'critical').length,
      totalEstimatedCost: deviations.reduce((sum, d) => sum + (d.estimatedCost || 0), 0),
      totalEstimatedDelay: deviations.reduce((sum, d) => sum + (d.estimatedDelay || 0), 0)
    }

    return NextResponse.json({
      deviations,
      stats,
      availableTypes: Object.values(DEVIATION_TYPES)
    })

  } catch (error) {
    console.error('Get deviations error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta avvikelser' },
      { status: 500 }
    )
  }
}

// PUT för att uppdatera/godkänna avvikelse (admin/manager)
export async function PUT(request: NextRequest) {
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

    // Kontrollera behörigheter
    const userRole = payload.role as string
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Otillräckliga behörigheter för att uppdatera avvikelse' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      deviationId,
      action, // 'approve', 'reject', 'resolve'
      adminNotes,
      resolution,
      approvedCost,
      approvedDelay
    } = body

    if (!deviationId || !action) {
      return NextResponse.json(
        { error: 'Deviation ID och action krävs' },
        { status: 400 }
      )
    }

    const deviation = mockDeviations.get(deviationId)
    if (!deviation) {
      return NextResponse.json(
        { error: 'Avvikelse hittades inte' },
        { status: 404 }
      )
    }

    const timestamp = new Date().toISOString()

    switch (action) {
      case 'approve':
        deviation.status = 'accepted'
        deviation.approvedAt = timestamp
        deviation.approvedBy = payload.staffId as string
        deviation.adminNotes = adminNotes || null
        deviation.approvedCost = approvedCost || deviation.estimatedCost
        deviation.approvedDelay = approvedDelay || deviation.estimatedDelay
        break

      case 'reject':
        deviation.status = 'rejected'
        deviation.approvedAt = timestamp
        deviation.approvedBy = payload.staffId as string
        deviation.adminNotes = adminNotes || 'Avvikelse ej godkänd'
        break

      case 'resolve':
        deviation.status = 'resolved'
        deviation.resolvedAt = timestamp
        deviation.resolution = resolution || 'Avvikelse löst'
        deviation.adminNotes = adminNotes || null
        break

      default:
        return NextResponse.json(
          { error: 'Ogiltig action' },
          { status: 400 }
        )
    }

    // Uppdatera i mock storage
    mockDeviations.set(deviationId, deviation)

    return NextResponse.json({
      success: true,
      deviation: {
        id: deviationId,
        status: deviation.status,
        updatedAt: timestamp,
        updatedBy: payload.name as string
      },
      message: `Avvikelse ${action === 'approve' ? 'godkänd' : action === 'reject' ? 'ej godkänd' : 'löst'}`
    })

  } catch (error) {
    console.error('Update deviation error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera avvikelse' },
      { status: 500 }
    )
  }
}