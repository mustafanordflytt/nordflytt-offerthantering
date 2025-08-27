import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')
    const assignedTo = searchParams.get('assignedTo')
    const customerId = searchParams.get('customerId')
    const bookingId = searchParams.get('bookingId')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page') || '1'
    
    // For now, we'll create mock issues data based on bookings and customer feedback
    // In a real implementation, you'd have a dedicated issues table
    
    // Fetch some bookings to generate realistic issues
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_id,
        status,
        move_date,
        total_price,
        created_at,
        start_address,
        end_address,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (bookingsError) {
      console.error('Error fetching bookings for issues:', bookingsError)
    }
    
    // Generate mock issues based on bookings and common scenarios
    const mockIssues = [
      {
        id: 'issue-001',
        title: 'Försenad leverans av flyttlådor',
        description: 'Kunden har inte fått sina beställda flyttlådor i tid för flytten',
        type: 'delivery',
        status: 'open',
        priority: 'high',
        customerId: bookings?.[0]?.customer_id || 'customer-001',
        customerName: (bookings?.[0]?.customers as any)?.name || 'Anna Svensson',
        bookingId: bookings?.[0]?.id || null,
        assignedTo: 'admin',
        reportedBy: 'customer',
        tags: ['logistics', 'delivery', 'moving-supplies'],
        createdAt: new Date('2025-06-29'),
        updatedAt: new Date('2025-06-30'),
        dueDate: new Date('2025-07-01'),
        resolution: null,
        comments: [
          {
            id: 'comment-001',
            userId: 'admin',
            message: 'Kontaktar leverantör för att spåra leveransen',
            createdAt: new Date('2025-06-29T14:30:00'),
            isInternal: true
          },
          {
            id: 'comment-002',
            userId: 'customer',
            message: 'Behöver lådorna senast imorgon, annars blir flytten försenad',
            createdAt: new Date('2025-06-30T09:15:00'),
            isInternal: false
          }
        ]
      },
      {
        id: 'issue-002',
        title: 'Skada på möbel under transport',
        description: 'Matbord fick repor under flytten, kunden vill ha ersättning',
        type: 'damage',
        status: 'in_progress',
        priority: 'medium',
        customerId: bookings?.[1]?.customer_id || 'customer-002',
        customerName: (bookings?.[1]?.customers as any)?.name || 'Erik Johansson',
        bookingId: bookings?.[1]?.id || null,
        assignedTo: 'admin',
        reportedBy: 'customer',
        tags: ['damage', 'insurance', 'furniture'],
        createdAt: new Date('2025-06-28'),
        updatedAt: new Date('2025-06-30'),
        dueDate: new Date('2025-07-05'),
        resolution: null,
        estimatedCost: 2500,
        comments: [
          {
            id: 'comment-003',
            userId: 'admin',
            message: 'Bilder mottagna, kontaktar försäkringsbolag',
            createdAt: new Date('2025-06-28T16:45:00'),
            isInternal: true
          },
          {
            id: 'comment-004',
            userId: 'admin',
            message: 'Försäkringsärende öppnat, ärendenummer: INS-2025-0156',
            createdAt: new Date('2025-06-30T11:20:00'),
            isInternal: false
          }
        ]
      },
      {
        id: 'issue-003',
        title: 'Felaktig fakturering - dubbel debitering',
        description: 'Kunden har debiterats två gånger för samma flytt',
        type: 'billing',
        status: 'resolved',
        priority: 'high',
        customerId: bookings?.[2]?.customer_id || 'customer-003',
        customerName: (bookings?.[2]?.customers as any)?.name || 'Maria Lindqvist',
        bookingId: bookings?.[2]?.id || null,
        assignedTo: 'admin',
        reportedBy: 'customer',
        tags: ['billing', 'payment', 'refund'],
        createdAt: new Date('2025-06-25'),
        updatedAt: new Date('2025-06-26'),
        dueDate: new Date('2025-06-28'),
        resolution: 'Återbetalning genomförd, kund kompenserad med 500 kr rabatt på nästa flytt',
        refundAmount: 8500,
        comments: [
          {
            id: 'comment-005',
            userId: 'admin',
            message: 'Verifierat dubbel debitering i systemet',
            createdAt: new Date('2025-06-25T13:10:00'),
            isInternal: true
          },
          {
            id: 'comment-006',
            userId: 'admin',
            message: 'Återbetalning initierad, 3-5 bankdagar',
            createdAt: new Date('2025-06-26T10:30:00'),
            isInternal: false
          }
        ]
      },
      {
        id: 'issue-004',
        title: 'Personal kom för sent till flyttjobb',
        description: 'Flyttteamet var 45 minuter försenade vilket orsakade stress för kunden',
        type: 'service',
        status: 'open',
        priority: 'medium',
        customerId: bookings?.[3]?.customer_id || 'customer-004',
        customerName: (bookings?.[3]?.customers as any)?.name || 'Petra Nilsson',
        bookingId: bookings?.[3]?.id || null,
        assignedTo: 'admin',
        reportedBy: 'staff',
        tags: ['punctuality', 'service-quality', 'staff'],
        createdAt: new Date('2025-06-27'),
        updatedAt: new Date('2025-06-29'),
        dueDate: new Date('2025-07-02'),
        resolution: null,
        comments: [
          {
            id: 'comment-007',
            userId: 'staff-001',
            message: 'Trafikstockning på E4:an, informerade kund via telefon',
            createdAt: new Date('2025-06-27T08:15:00'),
            isInternal: true
          },
          {
            id: 'comment-008',
            userId: 'admin',
            message: 'Erbjuder 10% rabatt som kompensation',
            createdAt: new Date('2025-06-29T14:00:00'),
            isInternal: false
          }
        ]
      },
      {
        id: 'issue-005',
        title: 'Kund vill ändra flyttdatum',
        description: 'Akut ändring av flyttdatum på grund av försenad nyckelöverlämning',
        type: 'scheduling',
        status: 'in_progress',
        priority: 'high',
        customerId: bookings?.[4]?.customer_id || 'customer-005',
        customerName: (bookings?.[4]?.customers as any)?.name || 'Stockholm Housing Corp',
        bookingId: bookings?.[4]?.id || null,
        assignedTo: 'admin',
        reportedBy: 'customer',
        tags: ['scheduling', 'date-change', 'urgent'],
        createdAt: new Date('2025-06-30'),
        updatedAt: new Date('2025-06-30'),
        dueDate: new Date('2025-06-30T18:00:00'), // Same day resolution needed
        resolution: null,
        comments: [
          {
            id: 'comment-009',
            userId: 'customer',
            message: 'Nycklarna försenas till måndag, kan vi flytta flyttdatumet?',
            createdAt: new Date('2025-06-30T10:30:00'),
            isInternal: false
          },
          {
            id: 'comment-010',
            userId: 'admin',
            message: 'Kollar tillgänglighet för måndag, återkommer inom 2 timmar',
            createdAt: new Date('2025-06-30T10:45:00'),
            isInternal: false
          }
        ]
      },
      {
        id: 'issue-006',
        title: 'Systemfel - bokning försvann',
        description: 'Tekniskt fel ledde till att kundens bokning försvann från systemet',
        type: 'technical',
        status: 'resolved',
        priority: 'critical',
        customerId: null,
        customerName: 'System Issue',
        bookingId: null,
        assignedTo: 'admin',
        reportedBy: 'staff',
        tags: ['technical', 'system-error', 'data-loss'],
        createdAt: new Date('2025-06-24'),
        updatedAt: new Date('2025-06-24'),
        dueDate: new Date('2025-06-24T23:59:59'),
        resolution: 'Bokning återställd från backup, extra validering implementerad',
        comments: [
          {
            id: 'comment-011',
            userId: 'admin',
            message: 'Kritiskt systemfel identifierat, eskalerar till utveckling',
            createdAt: new Date('2025-06-24T14:20:00'),
            isInternal: true
          },
          {
            id: 'comment-012',
            userId: 'admin',
            message: 'Data återställd, kund informerad och kompenserad',
            createdAt: new Date('2025-06-24T18:30:00'),
            isInternal: true
          }
        ]
      }
    ]
    
    // Apply filters
    let filteredIssues = mockIssues
    
    if (status) {
      filteredIssues = filteredIssues.filter(issue => issue.status === status)
    }
    
    if (priority) {
      filteredIssues = filteredIssues.filter(issue => issue.priority === priority)
    }
    
    if (type) {
      filteredIssues = filteredIssues.filter(issue => issue.type === type)
    }
    
    if (customerId) {
      filteredIssues = filteredIssues.filter(issue => issue.customerId === customerId)
    }
    
    if (bookingId) {
      filteredIssues = filteredIssues.filter(issue => issue.bookingId === bookingId)
    }
    
    if (assignedTo) {
      filteredIssues = filteredIssues.filter(issue => issue.assignedTo === assignedTo)
    }
    
    // Apply pagination
    const totalIssues = filteredIssues.length
    if (limit) {
      const limitNum = parseInt(limit)
      const pageNum = parseInt(page)
      const offset = (pageNum - 1) * limitNum
      filteredIssues = filteredIssues.slice(offset, offset + limitNum)
    }
    
    // Calculate statistics
    const stats = {
      totalIssues: mockIssues.length,
      openIssues: mockIssues.filter(i => i.status === 'open').length,
      inProgressIssues: mockIssues.filter(i => i.status === 'in_progress').length,
      resolvedIssues: mockIssues.filter(i => i.status === 'resolved').length,
      criticalIssues: mockIssues.filter(i => i.priority === 'critical').length,
      highPriorityIssues: mockIssues.filter(i => i.priority === 'high').length,
      avgResolutionTime: 2.3, // Mock average resolution time in days
      customerReportedIssues: mockIssues.filter(i => i.reportedBy === 'customer').length,
      issueTypes: {
        billing: mockIssues.filter(i => i.type === 'billing').length,
        damage: mockIssues.filter(i => i.type === 'damage').length,
        delivery: mockIssues.filter(i => i.type === 'delivery').length,
        service: mockIssues.filter(i => i.type === 'service').length,
        scheduling: mockIssues.filter(i => i.type === 'scheduling').length,
        technical: mockIssues.filter(i => i.type === 'technical').length
      }
    }
    
    return NextResponse.json({
      issues: filteredIssues,
      total: totalIssues,
      page: parseInt(page),
      limit: limit ? parseInt(limit) : null,
      stats
    })
    
  } catch (error) {
    console.error('Unexpected error in issues API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    // Validate required fields
    const { title, description, type, priority, customerId, bookingId } = body
    
    if (!title || !description || !type) {
      return NextResponse.json(
        { error: 'Title, description, and type are required' },
        { status: 400 }
      )
    }
    
    // Validate type
    const validTypes = ['billing', 'damage', 'delivery', 'service', 'scheduling', 'technical', 'other']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid issue type' },
        { status: 400 }
      )
    }
    
    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      )
    }
    
    // Validate customer exists if provided
    let customerName = 'Unknown Customer'
    if (customerId) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', customerId)
        .single()
      
      if (customerError || !customer) {
        return NextResponse.json(
          { error: 'Invalid customer ID' },
          { status: 400 }
        )
      }
      
      customerName = customer.name
    }
    
    // Validate booking exists if provided
    if (bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('id', bookingId)
        .single()
      
      if (bookingError || !booking) {
        return NextResponse.json(
          { error: 'Invalid booking ID' },
          { status: 400 }
        )
      }
    }
    
    // In real implementation, this would insert into an issues table
    const newIssue = {
      id: `issue-${Date.now()}`,
      title,
      description,
      type,
      status: 'open',
      priority: priority || 'medium',
      customerId: customerId || null,
      customerName,
      bookingId: bookingId || null,
      assignedTo: body.assignedTo || 'admin',
      reportedBy: body.reportedBy || 'customer',
      tags: body.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      resolution: null,
      comments: []
    }
    
    // In real implementation:
    // const { data: issue, error } = await supabase
    //   .from('issues')
    //   .insert([newIssue])
    //   .select()
    //   .single()
    
    return NextResponse.json(newIssue, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error in issue creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}