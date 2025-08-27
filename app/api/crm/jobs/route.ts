import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { getEnhancedDemoJobs } from './demo-data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Demo jobs for development
function getDemoJobs() {
  // Use enhanced demo data
  return getEnhancedDemoJobs()
  
  return [
    {
      id: 'demo-job-1',
      bookingNumber: 'NF-DEMO001',
      customerId: 'demo-customer-1',
      customerName: 'Anna Svensson',
      customerType: 'private',
      fromAddress: 'Kungsgatan 10, Stockholm',
      toAddress: 'Drottninggatan 25, Stockholm',
      moveDate: tomorrow,
      moveTime: '09:00',
      status: 'scheduled',
      priority: 'high',
      assignedStaff: [],
      estimatedHours: 4,
      actualHours: null,
      totalPrice: 4500,
      services: ['Flytt', 'Packhjälp'],
      notes: 'Kund har piano som behöver flyttas',
      createdAt: now,
      updatedAt: now,
      requiresPackingService: true,
      requiresCleaningService: false,
      hasLargeItems: true,
      largeItems: ['Piano'],
      volume: 15,
      distance: 5.2,
      numberOfFloors: 2,
      hasElevator: true,
      parkingDistance: 10
    },
    {
      id: 'demo-job-2',
      bookingNumber: 'NF-DEMO002',
      customerId: 'demo-customer-2',
      customerName: 'Företaget AB',
      customerType: 'business',
      fromAddress: 'Vasagatan 50, Göteborg',
      toAddress: 'Östra Hamngatan 30, Göteborg',
      moveDate: nextWeek,
      moveTime: '14:00',
      status: 'scheduled',
      priority: 'medium',
      assignedStaff: [],
      estimatedHours: 6,
      actualHours: null,
      totalPrice: 12000,
      services: ['Kontorsflytt', 'Packtjänst'],
      notes: 'Kontorsflytt med IT-utrustning',
      createdAt: now,
      updatedAt: now,
      requiresPackingService: true,
      requiresCleaningService: false,
      hasLargeItems: false,
      largeItems: [],
      volume: 30,
      distance: 8.5,
      numberOfFloors: 3,
      hasElevator: true,
      parkingDistance: 5
    },
    {
      id: 'demo-job-3',
      bookingNumber: 'NF-DEMO003',
      customerId: 'demo-customer-3',
      customerName: 'Erik Johansson',
      customerType: 'private',
      fromAddress: 'Storgatan 15, Malmö',
      toAddress: 'Parkvägen 8, Malmö',
      moveDate: now,
      moveTime: '10:00',
      status: 'in_progress',
      priority: 'high',
      assignedStaff: [],
      estimatedHours: 3,
      actualHours: 1.5,
      totalPrice: 3200,
      services: ['Flytt'],
      notes: 'Liten lägenhet, 2:a',
      createdAt: now,
      updatedAt: now,
      requiresPackingService: false,
      requiresCleaningService: false,
      hasLargeItems: false,
      largeItems: [],
      volume: 10,
      distance: 3.2,
      numberOfFloors: 1,
      hasElevator: true,
      parkingDistance: 5
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    
    // Allow demo mode for development
    if (!authResult.isValid) {
      console.log('⚠️ Using demo data for jobs')
      // Return demo jobs data
      return NextResponse.json({
        success: true,
        jobs: getDemoJobs(),
        stats: {
          total: 5,
          today: 2,
          inProgress: 1,
          completed: 1,
          revenue: 31400
        }
      })
    }

    console.log('🗓️ Fetching jobs for CRM...')
    
    // First try to get real jobs from bookings table (since that's where jobs are stored)
    const { data: realJobs, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(
          id,
          name,
          email,
          phone,
          customer_type
        )
      `)
      .in('status', ['confirmed', 'in_progress', 'completed'])
      .order('move_date', { ascending: true })
      .limit(100)
    
    if (!error && realJobs && realJobs.length > 0) {
      console.log(`✅ Found ${realJobs.length} real jobs in database`)
      
      // Transform bookings to job format with EXACT field names
      const transformedJobs = realJobs.map(booking => {
        // Calculate priority based on move date
        const moveDate = new Date(booking.move_date);
        const daysUntilMove = Math.ceil((moveDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        let priority: 'low' | 'medium' | 'high' = 'medium';
        if (daysUntilMove <= 1) priority = 'high';
        else if (daysUntilMove <= 7) priority = 'medium';
        else priority = 'low';

        // Map booking status to job status
        const statusMap: Record<string, 'scheduled' | 'in_progress' | 'completed' | 'cancelled'> = {
          'confirmed': 'scheduled',
          'in_progress': 'in_progress',
          'completed': 'completed',
          'cancelled': 'cancelled'
        };
        const jobStatus = statusMap[booking.status] || 'scheduled';

        // Calculate enhanced time estimation
        const enhancedTimeResult = calculateEnhancedTime(booking);
        
        return {
          id: booking.id,
          bookingNumber: booking.reference || `NF-${booking.id.slice(0, 8).toUpperCase()}`,
          customerId: booking.customer_id,
          customerName: booking.customer_name || booking.customer?.name || 'Unknown',
          customerEmail: booking.customer_email || booking.customer?.email || '',
          customerPhone: booking.customer_phone || booking.customer?.phone || '',
          customerType: booking.customer_type || booking.customer?.customer_type || 'private',
          fromAddress: booking.start_address || '',
          toAddress: booking.end_address || '',
          moveDate: booking.move_date,
          moveTime: booking.move_time || '09:00',
          status: jobStatus,
          priority: priority,
          totalPrice: booking.total_price || 0,
          distance: parseFloat(booking.details?.calculatedDistance) || 0,
          estimatedHours: enhancedTimeResult.totalHours,
          estimatedVolume: booking.details?.estimatedVolume || 20,
          services: booking.service_types || ['moving'],
          notes: booking.details?.specialInstructions || '',
          assignedStaff: [],
          actualHours: null,
          createdAt: new Date(booking.created_at),
          updatedAt: new Date(booking.updated_at || booking.created_at),
          // ENHANCED FEATURES
          timeBreakdown: enhancedTimeResult.breakdown,
          teamOptimization: enhancedTimeResult.teamOptimization,
          competitiveAnalysis: enhancedTimeResult.competitiveAnalysis
        };
      });
      
      return NextResponse.json({ jobs: transformedJobs })
    }
    
    console.log('⚠️ No real jobs found, using mock data')
    
    // Fall back to mock data if no real jobs
    const mockJobs = [
      {
        id: '1',
        reference: 'NF-2024001',
        customer_id: '1',
        customers: {
          id: '1',
          name: 'Anna Andersson',
          email: 'anna@example.com',
          phone: '070-123 45 67',
          customer_type: 'private'
        },
        service_type: 'moving',
        service_types: ['moving', 'packing'],
        move_date: new Date('2024-07-30').toISOString(),
        move_time: '09:00',
        start_address: 'Kungsgatan 1, Stockholm',
        end_address: 'Drottninggatan 50, Stockholm',
        status: 'scheduled',
        total_price: 12500,
        details: {
          startFloor: 3,
          endFloor: 2,
          startElevator: 'hiss',
          endElevator: 'trappa',
          estimatedVolume: 25,
          calculatedDistance: 2.5,
          packingService: 'Packhjälp',
          specialInstructions: 'Försiktig med tavlor'
        },
        created_at: new Date('2024-07-20').toISOString(),
        updated_at: new Date('2024-07-20').toISOString()
      },
      {
        id: '2',
        reference: 'NF-2024002',
        customer_id: '2',
        customers: {
          id: '2',
          name: 'Företaget AB',
          email: 'info@foretaget.se',
          phone: '08-123 45 67',
          customer_type: 'business'
        },
        service_type: 'office',
        service_types: ['office', 'packing', 'storage'],
        move_date: new Date('2024-08-05').toISOString(),
        move_time: '08:00',
        start_address: 'Vasagatan 10, Stockholm',
        end_address: 'Hamngatan 15, Stockholm',
        status: 'confirmed',
        total_price: 45000,
        details: {
          startFloor: 5,
          endFloor: 3,
          startElevator: 'hiss',
          endElevator: 'hiss',
          estimatedVolume: 120,
          calculatedDistance: 3.2,
          specialItems: ['Arkivskåp', 'Server rack'],
          specialInstructions: 'IT-utrustning kräver specialhantering'
        },
        created_at: new Date('2024-07-15').toISOString(),
        updated_at: new Date('2024-07-18').toISOString()
      },
      {
        id: '3',
        reference: 'NF-2024003',
        customer_id: '1',
        customers: {
          id: '1',
          name: 'Anna Andersson',
          email: 'anna@example.com',
          phone: '070-123 45 67',
          customer_type: 'private'
        },
        service_type: 'moving',
        service_types: ['moving'],
        move_date: new Date('2024-06-15').toISOString(),
        move_time: '10:00',
        start_address: 'Sveavägen 20, Stockholm',
        end_address: 'Kungsgatan 1, Stockholm',
        status: 'completed',
        total_price: 8500,
        details: {
          startFloor: 2,
          endFloor: 3,
          startElevator: 'hiss',
          endElevator: 'hiss',
          estimatedVolume: 15,
          calculatedDistance: 1.8
        },
        created_at: new Date('2024-06-01').toISOString(),
        updated_at: new Date('2024-06-15').toISOString()
      }
    ];

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const customerId = searchParams.get('customerId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page') || '1'
    
    // Filter mock data
    let bookings = mockJobs;
    
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }
    
    if (customerId) {
      bookings = bookings.filter(b => b.customer_id === customerId);
    }
    
    if (dateFrom) {
      bookings = bookings.filter(b => new Date(b.move_date) >= new Date(dateFrom));
    }
    
    if (dateTo) {
      bookings = bookings.filter(b => new Date(b.move_date) <= new Date(dateTo));
    }
    
    // Transform bookings to jobs format
    const jobs = (bookings || []).map((booking: any) => {
      const customer = booking.customers
      const moveDate = booking.move_date ? new Date(booking.move_date) : new Date()
      const now = new Date()
      
      // Calculate priority based on move date
      const daysUntilMove = Math.ceil((moveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      let calculatedPriority: 'low' | 'medium' | 'high'
      
      if (daysUntilMove <= 1) {
        calculatedPriority = 'high'
      } else if (daysUntilMove <= 7) {
        calculatedPriority = 'medium'
      } else {
        calculatedPriority = 'low'
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
      
      // Calculate enhanced time estimation  
      const enhancedTimeResult = calculateEnhancedTime(booking)
      
      return {
        id: booking.id,
        bookingNumber: booking.reference || `NF-${booking.id.slice(0, 8).toUpperCase()}`,
        customerId: customer?.id || '',
        customerName: customer?.name || booking.details?.name || 'Okänd kund',
        customerType: customer?.customer_type === 'business' ? 'business' : 'private',
        fromAddress: booking.start_address || booking.details?.startAddress || 'Ej angiven',
        toAddress: booking.end_address || booking.details?.endAddress || 'Ej angiven',
        moveDate: moveDate,
        moveTime: booking.move_time || booking.details?.moveTime || '13:00',
        status: jobStatus,
        priority: calculatedPriority,
        assignedStaff: [], // TODO: Implement staff assignment
        estimatedHours: enhancedTimeResult.totalHours,
        actualHours: null, // TODO: Track actual hours
        totalPrice: booking.total_price || 0,
        services: booking.service_types || [],
        notes: booking.details?.specialInstructions || '',
        createdAt: new Date(booking.created_at),
        updatedAt: new Date(booking.updated_at || booking.created_at),
        // Additional job-specific fields
        requiresPackingService: booking.details?.packingService === 'Packhjälp',
        requiresCleaningService: booking.details?.cleaningService === 'Flyttstädning',
        hasLargeItems: (booking.details?.largeItems?.length || 0) > 0,
        largeItems: booking.details?.largeItems || [],
        specialItems: booking.details?.specialItems || [],
        startFloor: Number(booking.details?.startFloor || 0),
        endFloor: Number(booking.details?.endFloor || 0),
        startElevator: booking.details?.startElevator || 'trappa',
        endElevator: booking.details?.endElevator || 'trappa',
        estimatedVolume: booking.details?.estimatedVolume || 0,
        distance: Number(booking.details?.calculatedDistance || 0),
        paymentMethod: booking.details?.paymentMethod || '',
        customerEmail: customer?.email || booking.details?.email || '',
        customerPhone: customer?.phone || booking.details?.phone || '',
        // ENHANCED FEATURES
        timeBreakdown: enhancedTimeResult.breakdown,
        teamOptimization: enhancedTimeResult.teamOptimization,
        competitiveAnalysis: enhancedTimeResult.competitiveAnalysis
      }
    })
    
    // Apply additional filters that couldn't be done in SQL
    let filteredJobs = jobs
    
    if (priority) {
      filteredJobs = filteredJobs.filter(job => job.priority === priority)
    }
    
    if (assignedTo) {
      // For now, filter by empty assigned staff (unassigned jobs)
      if (assignedTo === 'unassigned') {
        filteredJobs = filteredJobs.filter(job => job.assignedStaff.length === 0)
      }
    }
    
    // Apply pagination
    const totalJobs = filteredJobs.length
    if (limit) {
      const limitNum = parseInt(limit)
      const pageNum = parseInt(page)
      const offset = (pageNum - 1) * limitNum
      filteredJobs = filteredJobs.slice(offset, offset + limitNum)
    }
    
    // Calculate statistics
    const stats = {
      totalJobs: totalJobs,
      scheduledJobs: jobs.filter(j => j.status === 'scheduled').length,
      inProgressJobs: jobs.filter(j => j.status === 'in_progress').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      cancelledJobs: jobs.filter(j => j.status === 'cancelled').length,
      highPriorityJobs: jobs.filter(j => j.priority === 'high').length,
      totalRevenue: jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + j.totalPrice, 0),
      avgJobValue: jobs.length > 0 ? jobs.reduce((sum, j) => sum + j.totalPrice, 0) / jobs.length : 0,
      upcomingJobs: jobs.filter(j => {
        const moveDate = new Date(j.moveDate)
        const now = new Date()
        return moveDate > now && ['scheduled', 'in_progress'].includes(j.status)
      }).length
    }
    
    return NextResponse.json({
      jobs: filteredJobs,
      total: totalJobs,
      page: parseInt(page),
      limit: limit ? parseInt(limit) : null,
      stats
    })
    
  } catch (error) {
    console.error('Unexpected error in jobs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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
    const {
      customerId,
      fromAddress,
      toAddress,
      moveDate,
      moveTime,
      services,
      estimatedHours,
      totalPrice
    } = body
    
    if (!customerId || !fromAddress || !toAddress || !moveDate) {
      return NextResponse.json(
        { error: 'customerId, fromAddress, toAddress, and moveDate are required' },
        { status: 400 }
      )
    }
    
    // Validate customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('id', customerId)
      .single()
    
    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Create booking (which represents a job in our system)
    const bookingData = {
      customer_id: customerId,
      service_type: services?.[0] || 'moving',
      service_types: services || ['moving'],
      move_date: moveDate,
      move_time: moveTime || '13:00',
      start_address: fromAddress,
      end_address: toAddress,
      status: 'pending',
      total_price: Number(totalPrice) || 0,
      details: {
        ...body,
        estimatedHours: Number(estimatedHours) || 4,
        createdViaAPI: true,
        originalCustomerId: customerId
      },
      created_at: new Date().toISOString()
    }
    
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
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
    
    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }
    
    // Transform to job format
    const newJob = {
      id: newBooking.id,
      bookingNumber: `NF-${newBooking.id.slice(0, 8).toUpperCase()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerType: (customer as any).customer_type === 'business' ? 'business' : 'private',
      fromAddress: newBooking.start_address,
      toAddress: newBooking.end_address,
      moveDate: new Date(newBooking.move_date),
      moveTime: newBooking.move_time,
      status: 'scheduled' as const,
      priority: 'medium' as const,
      assignedStaff: [],
      estimatedHours: Number(estimatedHours) || 4,
      actualHours: null,
      totalPrice: newBooking.total_price,
      services: newBooking.service_types,
      notes: body.notes || '',
      createdAt: new Date(newBooking.created_at),
      updatedAt: new Date(newBooking.created_at),
      customerEmail: customer.email,
      customerPhone: customer.phone
    }
    
    return NextResponse.json(newJob, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error in job creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate estimated hours using enhanced team-based calculation
function calculateEstimatedHours(booking: any): number {
  const result = calculateEnhancedTime(booking);
  return result.totalHours;
}

// Helper function to get full enhanced time estimation result
function calculateEnhancedTime(booking: any): any {
  // Import the enhanced calculation
  const { calculateEnhancedEstimatedTime } = require('@/lib/utils/enhanced-time-estimation');
  
  // Convert elevator info to type format
  const elevatorTypeFrom = booking.details?.startElevator === 'hiss' ? 'stor' : 
                          booking.details?.startElevator === 'big' ? 'stor' :
                          booking.details?.startElevator === 'small' ? 'liten' : 'ingen';
  const elevatorTypeTo = booking.details?.endElevator === 'hiss' ? 'stor' : 
                        booking.details?.endElevator === 'big' ? 'stor' :
                        booking.details?.endElevator === 'small' ? 'liten' : 'ingen';
  
  // Extract living area - critical for correct calculation
  const livingArea = parseInt(booking.details?.startLivingArea) || 
                    parseInt(booking.details?.endLivingArea) || 
                    70; // Default fallback
  
  // Calculate volume if not provided
  const volume = booking.details?.estimatedVolume || 
                (livingArea * 0.3); // 0.3 m³/kvm for apartments
  
  const timeEstimation = calculateEnhancedEstimatedTime({
    volume,
    distance: parseFloat(booking.details?.calculatedDistance) || 10,
    teamSize: 2, // Default team size
    propertyType: booking.details?.startPropertyType === 'house' ? 'villa' : 
                  booking.details?.startPropertyType === 'storage' ? 'lägenhet' : 'lägenhet',
    livingArea,
    floors: {
      from: parseInt(booking.details?.startFloor) || 0,
      to: parseInt(booking.details?.endFloor) || 0
    },
    elevatorType: {
      from: elevatorTypeFrom,
      to: elevatorTypeTo
    },
    parkingDistance: {
      from: parseInt(booking.details?.startParkingDistance) || 0,
      to: parseInt(booking.details?.endParkingDistance) || 0
    },
    services: booking.service_types || ['moving'],
    trafficFactor: 'normal',
    heavyItems: booking.details?.largeItems?.length > 0,
    specialItems: booking.details?.specialItems || []
  });
  
  return timeEstimation;
}