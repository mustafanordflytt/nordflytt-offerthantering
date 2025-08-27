import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const resolvedParams = await params
    const issueId = resolvedParams.id
    
    // Mock issues data - same structure as in main issues route
    const mockIssues = [
      {
        id: 'issue-001',
        title: 'Försenad leverans av flyttlådor',
        description: 'Kunden har inte fått sina beställda flyttlådor i tid för flytten',
        type: 'delivery',
        status: 'open',
        priority: 'high',
        customerId: 'customer-001',
        customerName: 'Anna Svensson',
        bookingId: 'booking-001',
        assignedTo: 'admin',
        reportedBy: 'customer',
        tags: ['logistics', 'delivery', 'moving-supplies'],
        createdAt: new Date('2025-06-29'),
        updatedAt: new Date('2025-06-30'),
        dueDate: new Date('2025-07-01'),
        resolution: null,
        estimatedCost: null,
        actualCost: null,
        comments: [
          {
            id: 'comment-001',
            userId: 'admin',
            userName: 'Admin',
            message: 'Kontaktar leverantör för att spåra leveransen',
            createdAt: new Date('2025-06-29T14:30:00'),
            isInternal: true
          },
          {
            id: 'comment-002',
            userId: 'customer',
            userName: 'Anna Svensson',
            message: 'Behöver lådorna senast imorgon, annars blir flytten försenad',
            createdAt: new Date('2025-06-30T09:15:00'),
            isInternal: false
          }
        ],
        attachments: [
          {
            id: 'att-001',
            filename: 'order-confirmation.pdf',
            filesize: 245760,
            contentType: 'application/pdf',
            uploadedAt: new Date('2025-06-29T14:35:00'),
            uploadedBy: 'admin'
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
        customerId: 'customer-002',
        customerName: 'Erik Johansson',
        bookingId: 'booking-002',
        assignedTo: 'admin',
        reportedBy: 'customer',
        tags: ['damage', 'insurance', 'furniture'],
        createdAt: new Date('2025-06-28'),
        updatedAt: new Date('2025-06-30'),
        dueDate: new Date('2025-07-05'),
        resolution: null,
        estimatedCost: 2500,
        actualCost: null,
        comments: [
          {
            id: 'comment-003',
            userId: 'admin',
            userName: 'Admin',
            message: 'Bilder mottagna, kontaktar försäkringsbolag',
            createdAt: new Date('2025-06-28T16:45:00'),
            isInternal: true
          },
          {
            id: 'comment-004',
            userId: 'admin',
            userName: 'Admin',
            message: 'Försäkringsärende öppnat, ärendenummer: INS-2025-0156',
            createdAt: new Date('2025-06-30T11:20:00'),
            isInternal: false
          }
        ],
        attachments: [
          {
            id: 'att-002',
            filename: 'damage-photo-1.jpg',
            filesize: 1024000,
            contentType: 'image/jpeg',
            uploadedAt: new Date('2025-06-28T16:40:00'),
            uploadedBy: 'customer'
          },
          {
            id: 'att-003',
            filename: 'damage-photo-2.jpg',
            filesize: 856000,
            contentType: 'image/jpeg',
            uploadedAt: new Date('2025-06-28T16:41:00'),
            uploadedBy: 'customer'
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
        customerId: 'customer-003',
        customerName: 'Maria Lindqvist',
        bookingId: 'booking-003',
        assignedTo: 'admin',
        reportedBy: 'customer',
        tags: ['billing', 'payment', 'refund'],
        createdAt: new Date('2025-06-25'),
        updatedAt: new Date('2025-06-26'),
        dueDate: new Date('2025-06-28'),
        resolution: 'Återbetalning genomförd, kund kompenserad med 500 kr rabatt på nästa flytt',
        estimatedCost: null,
        actualCost: 500, // Compensation cost
        refundAmount: 8500,
        comments: [
          {
            id: 'comment-005',
            userId: 'admin',
            userName: 'Admin',
            message: 'Verifierat dubbel debitering i systemet',
            createdAt: new Date('2025-06-25T13:10:00'),
            isInternal: true
          },
          {
            id: 'comment-006',
            userId: 'admin',
            userName: 'Admin',
            message: 'Återbetalning initierad, 3-5 bankdagar',
            createdAt: new Date('2025-06-26T10:30:00'),
            isInternal: false
          }
        ],
        attachments: []
      },
      {
        id: 'issue-004',
        title: 'Personal kom för sent till flyttjobb',
        description: 'Flyttteamet var 45 minuter försenade vilket orsakade stress för kunden',
        type: 'service',
        status: 'open',
        priority: 'medium',
        customerId: 'customer-004',
        customerName: 'Petra Nilsson',
        bookingId: 'booking-004',
        assignedTo: 'admin',
        reportedBy: 'staff',
        tags: ['punctuality', 'service-quality', 'staff'],
        createdAt: new Date('2025-06-27'),
        updatedAt: new Date('2025-06-29'),
        dueDate: new Date('2025-07-02'),
        resolution: null,
        estimatedCost: null,
        actualCost: null,
        comments: [
          {
            id: 'comment-007',
            userId: 'staff-001',
            userName: 'John Andersson',
            message: 'Trafikstockning på E4:an, informerade kund via telefon',
            createdAt: new Date('2025-06-27T08:15:00'),
            isInternal: true
          },
          {
            id: 'comment-008',
            userId: 'admin',
            userName: 'Admin',
            message: 'Erbjuder 10% rabatt som kompensation',
            createdAt: new Date('2025-06-29T14:00:00'),
            isInternal: false
          }
        ],
        attachments: []
      },
      {
        id: 'issue-005',
        title: 'Kund vill ändra flyttdatum',
        description: 'Akut ändring av flyttdatum på grund av försenad nyckelöverlämning',
        type: 'scheduling',
        status: 'in_progress',
        priority: 'high',
        customerId: 'customer-005',
        customerName: 'Stockholm Housing Corp',
        bookingId: 'booking-005',
        assignedTo: 'admin',
        reportedBy: 'customer',
        tags: ['scheduling', 'date-change', 'urgent'],
        createdAt: new Date('2025-06-30'),
        updatedAt: new Date('2025-06-30'),
        dueDate: new Date('2025-06-30T18:00:00'),
        resolution: null,
        estimatedCost: null,
        actualCost: null,
        comments: [
          {
            id: 'comment-009',
            userId: 'customer',
            userName: 'Stockholm Housing Corp',
            message: 'Nycklarna försenas till måndag, kan vi flytta flyttdatumet?',
            createdAt: new Date('2025-06-30T10:30:00'),
            isInternal: false
          },
          {
            id: 'comment-010',
            userId: 'admin',
            userName: 'Admin',
            message: 'Kollar tillgänglighet för måndag, återkommer inom 2 timmar',
            createdAt: new Date('2025-06-30T10:45:00'),
            isInternal: false
          }
        ],
        attachments: []
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
        estimatedCost: null,
        actualCost: null,
        comments: [
          {
            id: 'comment-011',
            userId: 'admin',
            userName: 'Admin',
            message: 'Kritiskt systemfel identifierat, eskalerar till utveckling',
            createdAt: new Date('2025-06-24T14:20:00'),
            isInternal: true
          },
          {
            id: 'comment-012',
            userId: 'admin',
            userName: 'Admin',
            message: 'Data återställd, kund informerad och kompenserad',
            createdAt: new Date('2025-06-24T18:30:00'),
            isInternal: true
          }
        ],
        attachments: []
      }
    ]
    
    // Find the specific issue
    const issue = mockIssues.find(i => i.id === issueId)
    
    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }
    
    // Get related booking details if issue is linked to a booking
    let relatedBooking = null
    if (issue.bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          move_date,
          move_time,
          start_address,
          end_address,
          total_price,
          status,
          service_types
        `)
        .eq('id', issue.bookingId)
        .single()
      
      if (!bookingError && booking) {
        relatedBooking = {
          id: booking.id,
          moveDate: booking.move_date,
          moveTime: booking.move_time,
          fromAddress: booking.start_address,
          toAddress: booking.end_address,
          totalPrice: booking.total_price,
          status: booking.status,
          services: booking.service_types
        }
      }
    }
    
    // Get related customer details if issue is linked to a customer
    let relatedCustomer = null
    if (issue.customerId) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          email,
          phone,
          customer_type,
          created_at
        `)
        .eq('id', issue.customerId)
        .single()
      
      if (!customerError && customer) {
        relatedCustomer = {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          customerType: customer.customer_type,
          customerSince: new Date(customer.created_at)
        }
      }
    }
    
    // Calculate issue statistics
    const now = new Date()
    const createdAt = issue.createdAt
    const daysOpen = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const hoursUntilDue = issue.dueDate 
      ? Math.ceil((issue.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      : null
    
    const stats = {
      daysOpen,
      hoursUntilDue,
      totalComments: issue.comments.length,
      customerComments: issue.comments.filter(c => !c.isInternal).length,
      internalComments: issue.comments.filter(c => c.isInternal).length,
      totalAttachments: issue.attachments.length,
      lastActivity: issue.comments.length > 0 
        ? new Date(Math.max(...issue.comments.map(c => c.createdAt.getTime())))
        : issue.createdAt,
      isOverdue: issue.dueDate ? now > issue.dueDate : false,
      estimatedCost: issue.estimatedCost || 0,
      actualCost: issue.actualCost || 0
    }
    
    return NextResponse.json({
      issue: {
        ...issue,
        comments: issue.comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      },
      relatedBooking,
      relatedCustomer,
      stats
    })
    
  } catch (error) {
    console.error('Unexpected error in issue details API:', error)
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
    const supabase = createClient()
    const resolvedParams = await params
    const issueId = resolvedParams.id
    const body = await request.json()
    
    // Mock validation - check if issue exists
    const mockIssueIds = ['issue-001', 'issue-002', 'issue-003', 'issue-004', 'issue-005', 'issue-006']
    
    if (!mockIssueIds.includes(issueId)) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }
    
    // Validate status if provided
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      )
    }
    
    // Validate type if provided
    const validTypes = ['billing', 'damage', 'delivery', 'service', 'scheduling', 'technical', 'other']
    if (body.type && !validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      )
    }
    
    // In real implementation, this would update the database
    const updatedIssue = {
      id: issueId,
      title: body.title || 'Updated Issue Title',
      description: body.description || 'Updated description',
      type: body.type || 'other',
      status: body.status || 'open',
      priority: body.priority || 'medium',
      assignedTo: body.assignedTo || 'admin',
      tags: body.tags || [],
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      resolution: body.resolution || null,
      estimatedCost: body.estimatedCost ? Number(body.estimatedCost) : null,
      actualCost: body.actualCost ? Number(body.actualCost) : null,
      updatedAt: new Date()
    }
    
    // In real implementation:
    // const { data: issue, error } = await supabase
    //   .from('issues')
    //   .update(updatedIssue)
    //   .eq('id', issueId)
    //   .select()
    //   .single()
    
    return NextResponse.json(updatedIssue)
    
  } catch (error) {
    console.error('Unexpected error in issue update:', error)
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
    const supabase = createClient()
    const resolvedParams = await params
    const issueId = resolvedParams.id
    
    // Mock validation - check if issue exists
    const mockIssueIds = ['issue-001', 'issue-002', 'issue-003', 'issue-004', 'issue-005', 'issue-006']
    
    if (!mockIssueIds.includes(issueId)) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }
    
    // Don't allow deletion of resolved issues with refunds/costs
    if (issueId === 'issue-003') { // The billing issue with refund
      return NextResponse.json(
        { error: 'Cannot delete resolved billing issues with financial transactions' },
        { status: 400 }
      )
    }
    
    // In real implementation, this would soft delete or hard delete from database
    // const { error } = await supabase
    //   .from('issues')
    //   .delete()
    //   .eq('id', issueId)
    
    return NextResponse.json({ 
      success: true,
      message: 'Issue deleted successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in issue deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}