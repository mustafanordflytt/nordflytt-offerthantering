import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'
import { getAllStaff, addStaff } from '@/lib/staff-data'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Log initialization status in development
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase initialization:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    initialized: !!supabase
  })
}

// Export demoStaff for backward compatibility
export const demoStaff = getAllStaff()

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication - with error handling
    let authResult;
    try {
      authResult = await validateCRMAuth(request)
    } catch (authError) {
      console.error('Auth validation error:', authError)
      // In development, continue with demo data
      if (process.env.NODE_ENV === 'development') {
        authResult = { isValid: false, permissions: [] }
      } else {
        return NextResponse.json({ error: 'Authentication service error' }, { status: 500 })
      }
    }
    
    if (!authResult.isValid) {
      // In development mode, return demo data
      if (process.env.NODE_ENV === 'development') {
        const allStaff = getAllStaff()
        return NextResponse.json({
          success: true,
          staff: allStaff,
          stats: {
            total: allStaff.length,
            available: allStaff.filter(s => s.status === 'available').length,
            busy: allStaff.filter(s => s.status === 'busy' || s.status === 'scheduled').length,
            averageRating: 4.1,
            totalJobsCompleted: allStaff.reduce((sum, s) => sum + s.totalJobsCompleted, 0)
          }
        })
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get query parameters for filtering and sorting
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page') || '1'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const search = searchParams.get('search')
    
    // If Supabase is not available, return demo data
    if (!supabase) {
      let filteredData = [...getAllStaff()]
      
      // Apply filters
      if (role && role !== 'all') {
        filteredData = filteredData.filter(s => s.role === role)
      }
      if (status && status !== 'all') {
        filteredData = filteredData.filter(s => s.status === status)
      }
      if (department && department !== 'all') {
        filteredData = filteredData.filter(s => s.department === department)
      }
      if (search) {
        const searchLower = search.toLowerCase()
        filteredData = filteredData.filter(s => 
          s.name.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower) ||
          s.phone.includes(search)
        )
      }
      
      return NextResponse.json({
        success: true,
        staff: filteredData,
        stats: {
          total: filteredData.length,
          available: filteredData.filter(s => s.status === 'available').length,
          busy: filteredData.filter(s => s.status === 'busy' || s.status === 'scheduled').length,
          averageRating: filteredData.reduce((sum, s) => sum + s.rating, 0) / filteredData.length || 0,
          totalJobsCompleted: filteredData.reduce((sum, s) => sum + s.totalJobsCompleted, 0)
        }
      })
    }
    
    // Build query
    let query = supabase
      .from('staff')
      .select(`
        *,
        staff_availability!staff_id (
          status,
          current_job_id,
          available_from,
          available_until
        )
      `)
      .eq('employment_status', 'active')

    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    if (department && department !== 'all') {
      query = query.eq('department', department)
    }
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Apply sorting
    if (sortBy === 'name') {
      query = query.order('first_name', { ascending: sortOrder === 'asc' })
    } else if (sortBy === 'hireDate') {
      query = query.order('hire_date', { ascending: sortOrder === 'asc' })
    } else if (sortBy === 'rating') {
      query = query.order('average_rating', { ascending: sortOrder === 'asc' })
    } else if (sortBy === 'totalJobsCompleted') {
      query = query.order('total_jobs_completed', { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    if (limit) {
      const limitNum = parseInt(limit)
      const pageNum = parseInt(page)
      const offset = (pageNum - 1) * limitNum
      query = query.range(offset, offset + limitNum - 1)
    }

    const { data: staffData, error } = await query

    if (error) {
      console.error('Database error:', error)
      // In development, fall back to demo data
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          staff: demoStaff,
          total: demoStaff.length,
          page: parseInt(page),
          limit: limit ? parseInt(limit) : null,
          stats: {
            total: demoStaff.length,
            available: demoStaff.filter(s => s.status === 'available').length,
            busy: demoStaff.filter(s => s.status === 'busy' || s.status === 'scheduled').length,
            averageRating: 4.1,
            totalJobsCompleted: demoStaff.reduce((sum, s) => sum + s.totalJobsCompleted, 0)
          }
        })
      }
      throw new Error('Failed to fetch staff data')
    }

    // Transform data to match frontend expectations
    const transformedStaff = staffData?.map(staff => ({
      id: staff.id,
      name: `${staff.first_name} ${staff.last_name}`,
      email: staff.email,
      phone: staff.phone || staff.mobile || '',
      role: staff.role,
      status: staff.staff_availability?.[0]?.status || 'available',
      hireDate: new Date(staff.hire_date),
      skills: staff.skills || [],
      currentJobs: staff.staff_availability?.[0]?.current_job_id ? [staff.staff_availability[0].current_job_id] : [],
      totalJobsCompleted: staff.total_jobs_completed || 0,
      rating: staff.average_rating || 0,
      notes: staff.notes || '',
      department: staff.department || 'Operations',
      address: staff.city || '',
      emergencyContact: staff.emergency_contact_name ? 
        `${staff.emergency_contact_name}, ${staff.emergency_contact_phone}` : 
        '',
      salary: null, // Not included in public API
      employmentType: staff.employment_type || 'full_time',
      createdAt: new Date(staff.created_at),
      updatedAt: new Date(staff.updated_at),
      employee_number: staff.employee_number
    })) || []

    // Filter by status if needed (since it comes from availability table)
    let filteredStaff = transformedStaff
    if (status && status !== 'all') {
      filteredStaff = filteredStaff.filter(staff => staff.status === status)
    }

    // Calculate statistics
    const stats = {
      totalStaff: transformedStaff.length,
      availableStaff: transformedStaff.filter(s => s.status === 'available').length,
      busyStaff: transformedStaff.filter(s => s.status === 'busy').length,
      scheduledStaff: transformedStaff.filter(s => s.status === 'scheduled').length,
      onLeaveStaff: transformedStaff.filter(s => s.status === 'on_leave').length,
      avgRating: transformedStaff.length > 0 
        ? transformedStaff.reduce((sum, s) => sum + s.rating, 0) / transformedStaff.length 
        : 0,
      totalJobsCompleted: transformedStaff.reduce((sum, s) => sum + s.totalJobsCompleted, 0),
      roleDistribution: {
        admin: transformedStaff.filter(s => s.role === 'admin').length,
        manager: transformedStaff.filter(s => s.role === 'manager').length,
        mover: transformedStaff.filter(s => s.role === 'mover').length,
        driver: transformedStaff.filter(s => s.role === 'driver').length,
        customer_service: transformedStaff.filter(s => s.role === 'customer_service').length
      },
      departmentDistribution: transformedStaff.reduce((acc, s) => {
        acc[s.department] = (acc[s.department] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return NextResponse.json({
      staff: filteredStaff,
      total: filteredStaff.length,
      page: parseInt(page),
      limit: limit ? parseInt(limit) : null,
      stats
    })
    
  } catch (error) {
    console.error('Unexpected error in staff API:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    
    // In development, return more detailed error
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
          // Return demo data as fallback
          staff: demoStaff,
          stats: {
            total: demoStaff.length,
            available: demoStaff.filter(s => s.status === 'available').length,
            busy: demoStaff.filter(s => s.status === 'busy' || s.status === 'scheduled').length,
            averageRating: 4.1,
            totalJobsCompleted: demoStaff.reduce((sum, s) => sum + s.totalJobsCompleted, 0)
          }
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate CRM authentication
    let authResult;
    try {
      authResult = await validateCRMAuth(request)
    } catch (authError) {
      console.error('Auth validation error in POST:', authError)
      // In development, continue with basic auth
      if (process.env.NODE_ENV === 'development') {
        authResult = { isValid: true, user: { id: 'dev-user', email: 'dev@example.com', role: 'admin' }, permissions: ['staff:write', 'employees:write'] }
      } else {
        throw authError
      }
    }
    
    // In development, allow 'dev-token' or if auth is not fully valid
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (!isDevelopment && (!authResult.isValid || !authResult.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions (skip in development if auth is not valid)
    if (authResult.isValid && authResult.permissions && 
        !authResult.permissions.includes('staff:write') && 
        !authResult.permissions.includes('employees:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    let body;
    try {
      body = await request.json()
      console.log('Received POST body:', body)
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    // Validate required fields
    const { name, email, phone, role, department } = body
    
    if (!name || !email || !phone || !role || !department) {
      return NextResponse.json(
        { error: 'Name, email, phone, role, and department are required' },
        { status: 400 }
      )
    }
    
    // Split name into first and last name
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Validate role
    const validRoles = ['admin', 'manager', 'mover', 'driver', 'customer_service', 'cleaner', 'office']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }
    
    // Generate employee number
    const employeeNumber = `EMP${Date.now().toString().slice(-6)}`
    
    // Check if we should use demo mode
    const useDemoMode = !supabase || process.env.USE_DEMO_MODE === 'true'
    
    if (!supabase || useDemoMode) {
      const newStaffId = `staff-${Date.now()}`
      const newStaff = {
        name,
        email,
        phone,
        role,
        department,
        status: 'available',
        hireDate: new Date(body.hireDate || new Date().toISOString()),
        skills: body.skills || [],
        currentJobs: [],
        totalJobsCompleted: 0,
        rating: 0.0,
        address: body.address || '',
        emergencyContact: body.emergencyContact || '',
        notes: body.notes || '',
        employmentType: body.employmentType || 'full_time',
        avatar: '/placeholder-user.jpg'
      }
      
      // Add to demo data
      let addedStaff;
      try {
        console.log('Attempting to add staff to demo data:', newStaff)
        addedStaff = addStaff(newStaff)
        console.log('Staff added successfully:', addedStaff)
      } catch (addError) {
        console.error('Error adding staff to demo data:', addError)
        throw addError
      }
      
      return NextResponse.json({
        success: true,
        staff: addedStaff
      }, { status: 201 })
    }
    
    // Prepare staff data for Supabase
    const staffData = {
      employee_number: employeeNumber,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      mobile: body.mobile,
      role: role,
      department: department,
      employment_type: body.employmentType || 'full_time',
      employment_status: 'active',
      hire_date: body.hireDate || new Date().toISOString(),
      personal_number: body.personalNumber,
      address: body.address,
      postal_code: body.postalCode,
      city: body.city || 'Stockholm',
      country: body.country || 'Sweden',
      date_of_birth: body.dateOfBirth,
      emergency_contact_name: body.emergencyContactName,
      emergency_contact_phone: body.emergencyContactPhone,
      emergency_contact_relation: body.emergencyContactRelation,
      skills: body.skills || [],
      languages: body.languages || ['Swedish'],
      driver_license_types: body.driverLicenseTypes || [],
      notes: body.notes,
      created_by: authResult.user?.id || 'system',
      updated_by: authResult.user?.id || 'system'
    }
    
    // Insert staff record
    const { data: newStaff, error: staffError } = await supabase
      .from('staff')
      .insert(staffData)
      .select()
      .single()

    if (staffError) {
      console.error('Staff creation error:', staffError)
      if (staffError.code === '23505') {
        return NextResponse.json(
          { error: 'Email or employee number already exists' },
          { status: 400 }
        )
      }
      throw staffError
    }

    // Create initial availability record
    const { error: availabilityError } = await supabase
      .from('staff_availability')
      .insert({
        staff_id: newStaff.id,
        status: 'available'
      })

    if (availabilityError) {
      console.error('Availability creation error:', availabilityError)
      // Don't fail the entire operation if availability creation fails
    }

    // Transform response
    const transformedStaff = {
      id: newStaff.id,
      name: `${newStaff.first_name} ${newStaff.last_name}`,
      email: newStaff.email,
      phone: newStaff.phone || newStaff.mobile || '',
      role: newStaff.role,
      status: 'available',
      hireDate: new Date(newStaff.hire_date),
      skills: newStaff.skills || [],
      currentJobs: [],
      totalJobsCompleted: 0,
      rating: 0,
      notes: newStaff.notes || '',
      department: newStaff.department,
      address: newStaff.city || '',
      emergencyContact: newStaff.emergency_contact_name ? 
        `${newStaff.emergency_contact_name}, ${newStaff.emergency_contact_phone}` : 
        '',
      employmentType: newStaff.employment_type || 'full_time',
      createdAt: new Date(newStaff.created_at),
      updatedAt: new Date(newStaff.updated_at),
      employee_number: newStaff.employee_number
    }
    
    return NextResponse.json(transformedStaff, { status: 201 })
    
  } catch (error) {
    console.error('Unexpected error in staff creation:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    
    // In development, return more detailed error
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}