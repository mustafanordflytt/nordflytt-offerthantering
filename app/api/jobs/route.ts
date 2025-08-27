import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { authenticate } from '@/lib/security/auth-middleware'
import { rateLimit, rateLimiters } from '@/lib/security/rate-limit'
import { validateRequest, querySchemas } from '@/lib/security/validation'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Job creation schema
const createJobSchema = z.object({
  booking_id: z.string().uuid('Invalid booking ID'),
  customer_id: z.string().uuid('Invalid customer ID'),
  customer_name: z.string().min(2).max(100),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  service_type: z.enum(['moving', 'packing', 'cleaning', 'storage']),
  from_address: z.string().min(5),
  to_address: z.string().min(5),
  move_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  estimated_duration: z.number().min(1).max(24),
  estimated_volume: z.number().min(0).optional(),
  staff_required: z.number().min(1).max(10).default(2),
  notes: z.string().max(1000).optional(),
  additional_services: z.array(z.string()).optional()
})

// GET /api/jobs - List jobs (with auth)
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitRes = await rateLimit(request, rateLimiters.normal)
    if (rateLimitRes) return rateLimitRes
    
    // Authentication required
    const user = await authenticate(request, {
      methods: ['jwt', 'supabase'],
      roles: ['admin', 'manager', 'staff']
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams
    const params = validateQueryParams(searchParams, z.object({
      status: z.enum(['pending', 'assigned', 'started', 'completed', 'cancelled']).optional(),
      staffId: z.string().uuid().optional(),
      customerId: z.string().uuid().optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      ...querySchemas.pagination
    }))
    
    const supabase = createServerSupabaseClient()
    
    // Build query with proper access control
    let query = supabase
      .from('jobs')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        ),
        job_staff (
          staff (
            id,
            name,
            phone
          )
        )
      `)
    
    // Apply filters based on user role
    if (user.role === 'staff') {
      // Staff can only see their assigned jobs
      query = query.eq('job_staff.staff_id', user.id)
    }
    
    // Apply search filters
    if (params.status) query = query.eq('status', params.status)
    if (params.customerId) query = query.eq('customer_id', params.customerId)
    if (params.date) query = query.eq('move_date', params.date)
    
    // Pagination
    const { page = 1, limit = 20, sortBy = 'created_at', sort = 'desc' } = params
    const offset = (page - 1) * limit
    
    query = query
      .order(sortBy, { ascending: sort === 'asc' })
      .range(offset, offset + limit - 1)
    
    const { data: jobs, error, count } = await query
    
    if (error) {
      logger.error('Error fetching jobs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: jobs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error) {
    logger.error('Jobs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Create new job (requires auth)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for mutations
    const rateLimitRes = await rateLimit(request, rateLimiters.strict)
    if (rateLimitRes) return rateLimitRes
    
    // Authentication required - only admin/manager can create jobs
    const user = await authenticate(request, {
      methods: ['jwt', 'supabase'],
      roles: ['admin', 'manager']
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Manager access required' },
        { status: 401 }
      )
    }
    
    // Validate request body
    const jobData = await validateRequest(request, createJobSchema)
    
    logger.info('Creating new job:', { 
      userId: user.id,
      bookingId: jobData.booking_id,
      customerName: jobData.customer_name 
    })
    
    const supabase = createServerSupabaseClient()
    
    // Check if booking exists and not already converted to job
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', jobData.booking_id)
      .single()
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    if (booking.status === 'converted') {
      return NextResponse.json(
        { error: 'Booking already converted to job' },
        { status: 400 }
      )
    }
    
    // Start transaction (create job and update booking)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        booking_id: jobData.booking_id,
        customer_id: jobData.customer_id,
        customer_name: jobData.customer_name,
        customer_email: jobData.customer_email,
        customer_phone: jobData.customer_phone,
        service_type: jobData.service_type,
        from_address: jobData.from_address,
        to_address: jobData.to_address,
        move_date: jobData.move_date,
        start_time: jobData.start_time,
        estimated_duration: jobData.estimated_duration,
        estimated_volume: jobData.estimated_volume,
        staff_required: jobData.staff_required,
        notes: jobData.notes,
        additional_services: jobData.additional_services || [],
        status: 'pending',
        created_by: user.id,
        total_price: 0 // Will be calculated based on actual work
      })
      .select()
      .single()
    
    if (jobError) {
      logger.error('Error creating job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }
    
    // Update booking status
    await supabase
      .from('bookings')
      .update({ status: 'converted', job_id: job.id })
      .eq('id', jobData.booking_id)
    
    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'job',
        resource_id: job.id,
        action: 'create',
        user_id: user.id,
        details: { booking_id: jobData.booking_id }
      })
    
    logger.info('Job created successfully:', { jobId: job.id })
    
    return NextResponse.json({
      success: true,
      data: job
    }, { status: 201 })
    
  } catch (error) {
    logger.error('Create job error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper to validate query params
function validateQueryParams(
  searchParams: URLSearchParams,
  schema: z.ZodSchema
): any {
  const params: Record<string, any> = {}
  
  searchParams.forEach((value, key) => {
    // Try to parse numbers
    const numValue = Number(value)
    params[key] = isNaN(numValue) ? value : numValue
  })
  
  return schema.parse(params)
}