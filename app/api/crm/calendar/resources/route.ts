import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
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
        resources: [],
        stats: {
          totalResources: 0,
          activeResources: 0,
          resourcesByType: {},
          inUse: 0
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
    const resourceType = searchParams.get('type')
    const isActive = searchParams.get('active')
    const location = searchParams.get('location')

    // If no supabase client, return empty resources
    if (!supabase) {
      return NextResponse.json({
        success: true,
        resources: [],
        stats: {
          totalResources: 0,
          activeResources: 0,
          resourcesByType: {},
          inUse: 0
        }
      }, { headers })
    }

    // Build query
    let query = supabase
      .from('calendar_resources')
      .select(`
        *,
        bookings:calendar_resource_bookings(
          id,
          event_id,
          status,
          event:calendar_events(
            id,
            title,
            start_datetime,
            end_datetime,
            event_status
          )
        )
      `)
      .order('resource_name', { ascending: true })

    // Apply filters
    if (resourceType && resourceType !== 'all') {
      query = query.eq('resource_type', resourceType)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    const { data: resources, error } = await query

    if (error) {
      console.error('Database error:', error)
      // If table doesn't exist, return empty resources
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          resources: [],
          stats: {
            totalResources: 0,
            activeResources: 0,
            resourcesByType: {},
            inUse: 0
          }
        }, { headers })
      }
      throw new Error('Failed to fetch resources')
    }

    // Transform resources for frontend
    const transformedResources = (resources || []).map(resource => ({
      id: resource.id,
      name: resource.resource_name,
      type: resource.resource_type,
      capacity: resource.capacity,
      location: resource.location,
      description: resource.description,
      isActive: resource.is_active,
      metadata: resource.metadata || {},
      // Current and upcoming bookings
      currentBooking: resource.bookings?.find((b: any) => {
        const now = new Date()
        const start = new Date(b.event?.start_datetime)
        const end = new Date(b.event?.end_datetime)
        return b.status === 'confirmed' && 
               b.event?.event_status !== 'cancelled' &&
               now >= start && now <= end
      }),
      upcomingBookings: resource.bookings?.filter((b: any) => {
        const now = new Date()
        const start = new Date(b.event?.start_datetime)
        return b.status === 'confirmed' && 
               b.event?.event_status !== 'cancelled' &&
               start > now
      }).slice(0, 5) || [],
      createdAt: new Date(resource.created_at),
      updatedAt: new Date(resource.updated_at)
    }))

    // Calculate statistics
    const stats = {
      totalResources: transformedResources.length,
      activeResources: transformedResources.filter(r => r.isActive).length,
      resourcesByType: transformedResources.reduce((acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      inUse: transformedResources.filter(r => r.currentBooking).length
    }

    return NextResponse.json({
      success: true,
      resources: transformedResources,
      stats
    }, { headers })

  } catch (error: any) {
    console.error('Resources API error:', error)
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch resources',
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

export async function POST(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only managers can create resources
    if (!authResult.permissions.includes('admin') && authResult.user.role !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    const { name, type } = body
    
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Check for duplicate resource name
    const { data: existing } = await supabase
      .from('calendar_resources')
      .select('id')
      .eq('resource_name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A resource with this name already exists' },
        { status: 400 }
      )
    }

    // Create resource
    const { data: newResource, error } = await supabase
      .from('calendar_resources')
      .insert({
        resource_name: name,
        resource_type: type,
        capacity: body.capacity || null,
        location: body.location || null,
        description: body.description || null,
        is_active: body.isActive !== false,
        metadata: body.metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Resource creation error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      resource: {
        id: newResource.id,
        name: newResource.resource_name,
        type: newResource.resource_type,
        isActive: newResource.is_active
      },
      message: 'Resource created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Resource creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create resource',
      details: error.message
    }, { status: 500 })
  }
}