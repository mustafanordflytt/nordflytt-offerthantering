import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/api-auth'

// Job status workflow rules
const statusWorkflow: Record<string, { next: string[], label: string }> = {
  scheduled: { next: ['confirmed', 'cancelled'], label: 'Planerad' },
  confirmed: { next: ['on_route', 'cancelled'], label: 'Bekräftad' },
  on_route: { next: ['arrived'], label: 'På väg' },
  arrived: { next: ['loading'], label: 'Framme' },
  loading: { next: ['in_transit'], label: 'Lastar' },
  in_transit: { next: ['unloading'], label: 'Transport' },
  unloading: { next: ['completed'], label: 'Lastar av' },
  completed: { next: [], label: 'Slutförd' },
  cancelled: { next: [], label: 'Avbruten' }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

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
    const jobId = resolvedParams.id
    
    // Fetch booking with customer details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          customer_type,
          created_at
        )
      `)
      .eq('id', jobId)
      .single()
    
    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    
    const customer = booking.customers
    const moveDate = booking.move_date ? new Date(booking.move_date) : new Date()
    const now = new Date()
    
    // Calculate priority based on move date
    const daysUntilMove = Math.ceil((moveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    let priority: 'low' | 'medium' | 'high'
    
    if (daysUntilMove <= 1) {
      priority = 'high'
    } else if (daysUntilMove <= 7) {
      priority = 'medium'
    } else {
      priority = 'low'
    }
    
    // Map booking status to job status
    const statusMap: Record<string, 'scheduled' | 'in_progress' | 'completed' | 'cancelled'> = {
      'pending': 'scheduled',
      'confirmed': 'scheduled',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled'
    }
    
    const jobStatus = statusMap[booking.status] || 'scheduled'
    
    // Calculate estimated hours
    const estimatedHours = calculateEstimatedHours(booking)
    
    // Create job timeline/activities
    const activities = [
      {
        id: `activity-${booking.id}-created`,
        type: 'booking_created',
        title: 'Jobb skapades',
        description: 'Bokning mottagen och registrerad i systemet',
        date: new Date(booking.created_at),
        userId: 'system',
        completed: true
      }
    ]
    
    // Add status-based activities
    if (booking.status === 'confirmed') {
      activities.push({
        id: `activity-${booking.id}-confirmed`,
        type: 'status_change',
        title: 'Bokning bekräftad',
        description: 'Kunden har bekräftat bokningen',
        date: new Date(booking.updated_at || booking.created_at),
        userId: 'system',
        completed: true
      })
    }
    
    if (booking.status === 'completed') {
      activities.push({
        id: `activity-${booking.id}-completed`,
        type: 'job_completed',
        title: 'Jobb slutfört',
        description: 'Flytten är genomförd',
        date: new Date(booking.updated_at || booking.created_at),
        userId: 'system',
        completed: true
      })
    }
    
    // Create checklist based on services
    const checklist = []
    
    // Basic moving checklist
    checklist.push(
      { id: 'prep-materials', task: 'Förbereda flyttmaterial', completed: false, assignedTo: null },
      { id: 'confirm-time', task: 'Bekräfta tid med kund', completed: jobStatus !== 'scheduled', assignedTo: null },
      { id: 'load-truck', task: 'Lasta flyttbil', completed: false, assignedTo: null },
      { id: 'transport', task: 'Transport till ny adress', completed: false, assignedTo: null },
      { id: 'unload', task: 'Lossa på ny adress', completed: false, assignedTo: null }
    )
    
    // Add packing service checklist items
    if (booking.details?.packingService === 'Packhjälp') {
      checklist.unshift(
        { id: 'packing-materials', task: 'Förbereda packmaterial', completed: false, assignedTo: null },
        { id: 'pack-items', task: 'Packa kundens saker', completed: false, assignedTo: null }
      )
    }
    
    // Add cleaning service checklist items
    if (booking.details?.cleaningService === 'Flyttstädning') {
      checklist.push(
        { id: 'cleaning-supplies', task: 'Förbereda städmaterial', completed: false, assignedTo: null },
        { id: 'clean-old-home', task: 'Städa gamla bostaden', completed: false, assignedTo: null }
      )
    }
    
    // Add final completion
    checklist.push(
      { id: 'customer-approval', task: 'Kundgodkännande', completed: jobStatus === 'completed', assignedTo: null },
      { id: 'invoice', task: 'Skicka faktura', completed: false, assignedTo: null }
    )
    
    // Transform to job format
    const job = {
      id: booking.id,
      bookingNumber: booking.reference || `NF-${booking.id.slice(0, 8).toUpperCase()}`,
      customerId: customer?.id || '',
      customerName: customer?.name || booking.details?.name || 'Okänd kund',
      customerType: customer?.customer_type === 'business' ? 'business' : 'private',
      customerEmail: customer?.email || booking.details?.email || '',
      customerPhone: customer?.phone || booking.details?.phone || '',
      fromAddress: booking.start_address || booking.details?.startAddress || 'Ej angiven',
      toAddress: booking.end_address || booking.details?.endAddress || 'Ej angiven',
      moveDate: moveDate,
      moveTime: booking.move_time || booking.details?.moveTime || '13:00',
      status: jobStatus,
      priority: priority,
      assignedStaff: [], // TODO: Implement staff assignment
      estimatedHours: estimatedHours,
      actualHours: null, // TODO: Track actual hours
      totalPrice: booking.total_price || 0,
      services: booking.service_types || [],
      notes: booking.details?.specialInstructions || '',
      createdAt: new Date(booking.created_at),
      updatedAt: new Date(booking.updated_at || booking.created_at),
      
      // Detailed job information
      requiresPackingService: booking.details?.packingService === 'Packhjälp',
      requiresCleaningService: booking.details?.cleaningService === 'Flyttstädning',
      hasLargeItems: (booking.details?.largeItems?.length || 0) > 0,
      largeItems: booking.details?.largeItems || [],
      specialItems: booking.details?.specialItems || [],
      startFloor: Number(booking.details?.startFloor || 0),
      endFloor: Number(booking.details?.endFloor || 0),
      startElevator: booking.details?.startElevator || 'trappa',
      endElevator: booking.details?.endElevator || 'trappa',
      startParkingDistance: Number(booking.details?.startParkingDistance || 0),
      endParkingDistance: Number(booking.details?.endParkingDistance || 0),
      estimatedVolume: booking.details?.estimatedVolume || 0,
      distance: Number(booking.details?.calculatedDistance || 0),
      paymentMethod: booking.details?.paymentMethod || '',
      
      // Property details
      startPropertyType: booking.details?.startPropertyType || 'apartment',
      endPropertyType: booking.details?.endPropertyType || 'apartment',
      startLivingArea: Number(booking.details?.startLivingArea || 0),
      endLivingArea: Number(booking.details?.endLivingArea || 0),
      startDoorCode: booking.details?.startDoorCode || '',
      endDoorCode: booking.details?.endDoorCode || '',
      
      // Moving supplies
      needsMovingBoxes: booking.details?.needsMovingBoxes || false,
      movingBoxes: Number(booking.details?.movingBoxes || 0),
      additionalServices: booking.details?.additionalServices || [],
      
      // Activities and checklist
      activities: activities.sort((a, b) => b.date.getTime() - a.date.getTime()),
      checklist: checklist
    }
    
    // Calculate job statistics
    const stats = {
      daysUntilMove: daysUntilMove,
      hoursEstimated: estimatedHours,
      completedTasks: checklist.filter(item => item.completed).length,
      totalTasks: checklist.length,
      progressPercentage: Math.round((checklist.filter(item => item.completed).length / checklist.length) * 100),
      totalActivities: activities.length,
      customerSince: customer ? new Date(customer.created_at) : null
    }
    
    return NextResponse.json({
      job,
      stats
    })
    
  } catch (error) {
    console.error('Unexpected error in job details API:', error)
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
    const jobId = resolvedParams.id
    const body = await request.json()
    
    // Get current booking
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', jobId)
      .single()
    
    if (fetchError || !currentBooking) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    // Update basic fields
    if (body.moveDate) updateData.move_date = body.moveDate
    if (body.moveTime) updateData.move_time = body.moveTime
    if (body.fromAddress) updateData.start_address = body.fromAddress
    if (body.toAddress) updateData.end_address = body.toAddress
    if (body.totalPrice !== undefined) updateData.total_price = Number(body.totalPrice)
    if (body.services) updateData.service_types = body.services
    
    // Map job status back to booking status
    if (body.status) {
      const statusMap: Record<string, string> = {
        'scheduled': 'confirmed',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled'
      }
      updateData.status = statusMap[body.status] || body.status
    }
    
    // Update details object
    if (body.notes || body.estimatedHours || body.assignedStaff || body.actualHours) {
      const currentDetails = currentBooking.details || {}
      const updatedDetails = {
        ...currentDetails,
        ...(body.notes && { specialInstructions: body.notes }),
        ...(body.estimatedHours && { estimatedHours: Number(body.estimatedHours) }),
        ...(body.actualHours !== undefined && { actualHours: Number(body.actualHours) }),
        ...(body.assignedStaff && { assignedStaff: body.assignedStaff })
      }
      updateData.details = updatedDetails
    }
    
    // Update booking in database
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', jobId)
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          customer_type
        )
      `)
      .single()
    
    if (updateError) {
      console.error('Error updating booking:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      )
    }
    
    // Transform back to job format
    const customer = updatedBooking.customers
    const statusMap: Record<string, 'scheduled' | 'in_progress' | 'completed' | 'cancelled'> = {
      'pending': 'scheduled',
      'confirmed': 'scheduled',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled'
    }
    
    const updatedJob = {
      id: updatedBooking.id,
      bookingNumber: updatedBooking.reference || `NF-${updatedBooking.id.slice(0, 8).toUpperCase()}`,
      customerId: customer?.id || '',
      customerName: customer?.name || updatedBooking.details?.name || 'Okänd kund',
      customerType: customer?.customer_type === 'business' ? 'business' : 'private',
      fromAddress: updatedBooking.start_address || updatedBooking.details?.startAddress || '',
      toAddress: updatedBooking.end_address || updatedBooking.details?.endAddress || '',
      moveDate: new Date(updatedBooking.move_date),
      moveTime: updatedBooking.move_time || '13:00',
      status: statusMap[updatedBooking.status] || 'scheduled',
      priority: 'medium' as const, // Recalculate if needed
      assignedStaff: updatedBooking.details?.assignedStaff || [],
      estimatedHours: updatedBooking.details?.estimatedHours || calculateEstimatedHours(updatedBooking),
      actualHours: updatedBooking.details?.actualHours || null,
      totalPrice: updatedBooking.total_price || 0,
      services: updatedBooking.service_types || [],
      notes: updatedBooking.details?.specialInstructions || '',
      createdAt: new Date(updatedBooking.created_at),
      updatedAt: new Date(updatedBooking.updated_at)
    }
    
    return NextResponse.json(updatedJob)
    
  } catch (error) {
    console.error('Unexpected error in job update:', error)
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
    if (!authResult.permissions.includes('jobs:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id
    
    // Check if job exists
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', jobId)
      .single()
    
    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    
    // Don't allow deletion of completed jobs
    if (booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete completed jobs' },
        { status: 400 }
      )
    }
    
    // Instead of deleting, mark as cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
    
    if (updateError) {
      console.error('Error cancelling job:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel job' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Job cancelled successfully'
    })
    
  } catch (error) {
    console.error('Unexpected error in job deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH method for quick status updates
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const jobId = resolvedParams.id
    const updates = await request.json()

    // Handle demo mode
    if (!supabase) {
      // Mock response for demo
      return NextResponse.json({
        success: true,
        job: {
          id: jobId,
          status: updates.status,
          updatedAt: new Date().toISOString()
        }
      })
    }

    // Get current job status
    const { data: currentJob, error: fetchError } = await supabase
      .from('bookings')
      .select('status, details')
      .eq('id', jobId)
      .single()

    if (fetchError || !currentJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // If updating status, validate workflow
    if (updates.status) {
      const currentStatus = mapBookingStatusToJobStatus(currentJob.status)
      const newStatus = updates.status

      // Check if transition is allowed
      const allowedTransitions = statusWorkflow[currentStatus]?.next || []
      if (!allowedTransitions.includes(newStatus)) {
        return NextResponse.json({
          error: 'Invalid status transition',
          message: `Cannot transition from ${currentStatus} to ${newStatus}`,
          allowedTransitions
        }, { status: 400 })
      }

      // Map job status to booking status
      updates.status = mapJobStatusToBookingStatus(newStatus)

      // Add timestamps for certain status changes
      const details = currentJob.details || {}
      if (newStatus === 'on_route' && !details.startedAt) {
        details.startedAt = new Date().toISOString()
      } else if (newStatus === 'completed' && !details.completedAt) {
        details.completedAt = new Date().toISOString()
        // Calculate actual hours if not set
        if (!details.actualHours && details.startedAt) {
          const start = new Date(details.startedAt)
          const end = new Date()
          details.actualHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10
        }
      }
      updates.details = details
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: updatedBooking.id,
        status: mapBookingStatusToJobStatus(updatedBooking.status),
        updatedAt: updatedBooking.updated_at
      }
    })

  } catch (error) {
    console.error('Error updating job status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function mapBookingStatusToJobStatus(bookingStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'scheduled',
    'confirmed': 'confirmed',
    'in_progress': 'on_route',
    'completed': 'completed',
    'cancelled': 'cancelled'
  }
  return statusMap[bookingStatus] || 'scheduled'
}

function mapJobStatusToBookingStatus(jobStatus: string): string {
  const statusMap: Record<string, string> = {
    'scheduled': 'pending',
    'confirmed': 'confirmed',
    'on_route': 'in_progress',
    'arrived': 'in_progress',
    'loading': 'in_progress',
    'in_transit': 'in_progress',
    'unloading': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled'
  }
  return statusMap[jobStatus] || 'pending'
}

// Helper function to calculate estimated hours
function calculateEstimatedHours(booking: any): number {
  const livingArea = booking.details?.startLivingArea || booking.details?.endLivingArea || 70
  const baseHours = Math.max(3, Math.ceil(livingArea / 25))
  
  let additionalHours = 0
  if (booking.details?.packingService === 'Packhjälp') additionalHours += 2
  if (booking.details?.cleaningService === 'Flyttstädning') additionalHours += 1.5
  if (booking.details?.largeItems?.length > 0) additionalHours += booking.details.largeItems.length * 0.5
  
  const startFloor = Number(booking.details?.startFloor || 0)
  const endFloor = Number(booking.details?.endFloor || 0)
  
  if (booking.details?.startElevator === 'trappa' && startFloor > 0) {
    additionalHours += startFloor * 0.25
  }
  
  if (booking.details?.endElevator === 'trappa' && endFloor > 0) {
    additionalHours += endFloor * 0.25
  }
  
  return Math.ceil(baseHours + additionalHours)
}