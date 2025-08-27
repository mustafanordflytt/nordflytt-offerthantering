import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { authenticate } from '@/lib/security/auth-middleware'
import { rateLimit, rateLimiters } from '@/lib/security/rate-limit'
import { validateRequest } from '@/lib/security/validation'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Employee creation schema
const createEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^(\+46|0)[1-9]\d{8,9}$/, 'Invalid Swedish phone number'),
  role: z.enum(['admin', 'manager', 'mover', 'driver', 'packer']),
  department: z.enum(['Ledning', 'Operations', 'Flyttteam', 'Administration']),
  employment_type: z.enum(['full_time', 'part_time', 'hourly', 'contract']),
  personal_code: z.string().regex(/^\d{4,6}$/, 'Personal code must be 4-6 digits'),
  salary: z.number().min(0).optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional()
})

// Employee update schema (all fields optional)
const updateEmployeeSchema = createEmployeeSchema.partial().omit({ personal_code: true })

// Schema for changing personal code
const changePersonalCodeSchema = z.object({
  current_code: z.string().regex(/^\d{4,6}$/),
  new_code: z.string().regex(/^\d{4,6}$/)
})

// GET /api/employees - List employees (requires auth)
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitRes = await rateLimit(request, rateLimiters.normal)
    if (rateLimitRes) return rateLimitRes
    
    // Authentication required
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
    
    const supabase = createServerSupabaseClient()
    
    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'active'
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    const search = searchParams.get('search')
    
    // Build query
    let query = supabase
      .from('staff')
      .select(`
        id,
        staff_id,
        name,
        email,
        phone,
        role,
        department,
        status,
        avatar_url,
        hire_date,
        employment_type,
        created_at,
        updated_at
      `)
      .order('name')
    
    // Apply filters
    if (status) query = query.eq('status', status)
    if (role) query = query.eq('role', role)
    if (department) query = query.eq('department', department)
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    
    const { data: employees, error } = await query
    
    if (error) {
      logger.error('Error fetching employees:', error)
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      )
    }
    
    // Don't send sensitive data like personal_code_hash
    const sanitizedEmployees = employees?.map(emp => ({
      ...emp,
      personal_code_hash: undefined
    }))
    
    return NextResponse.json({
      success: true,
      data: sanitizedEmployees || []
    })
    
  } catch (error) {
    logger.error('Employees API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Create new employee (admin only)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for mutations
    const rateLimitRes = await rateLimit(request, rateLimiters.strict)
    if (rateLimitRes) return rateLimitRes
    
    // Authentication required - only admin can create employees
    const user = await authenticate(request, {
      methods: ['jwt', 'supabase'],
      roles: ['admin']
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }
    
    // Validate request body
    const employeeData = await validateRequest(request, createEmployeeSchema)
    
    logger.info('Creating new employee:', { 
      userId: user.id,
      employeeName: employeeData.name 
    })
    
    const supabase = createServerSupabaseClient()
    
    // Check if phone number already exists
    const { data: existing } = await supabase
      .from('staff')
      .select('id')
      .eq('phone', employeeData.phone)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      )
    }
    
    // Hash the personal code
    const hashedCode = await bcrypt.hash(employeeData.personal_code, 10)
    
    // Generate staff ID
    const staffId = `STAFF-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    
    // Create permissions based on role
    const permissions = getPermissionsByRole(employeeData.role)
    
    // Create employee
    const { data: employee, error } = await supabase
      .from('staff')
      .insert({
        staff_id: staffId,
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone,
        role: employeeData.role,
        department: employeeData.department,
        employment_type: employeeData.employment_type,
        personal_code_hash: hashedCode,
        permissions,
        salary: employeeData.salary,
        address: employeeData.address,
        emergency_contact: employeeData.emergency_contact,
        hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
        notes: employeeData.notes,
        status: 'active',
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) {
      logger.error('Error creating employee:', error)
      return NextResponse.json(
        { error: 'Failed to create employee' },
        { status: 500 }
      )
    }
    
    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'employee',
        resource_id: employee.id,
        action: 'create',
        user_id: user.id,
        details: { name: employeeData.name, role: employeeData.role }
      })
    
    // Send welcome SMS with personal code (in production, use SMS service)
    logger.info('Employee created successfully:', { 
      employeeId: employee.id,
      staffId: employee.staff_id 
    })
    
    // Remove sensitive data from response
    const { personal_code_hash, ...safeEmployee } = employee
    
    return NextResponse.json({
      success: true,
      data: safeEmployee,
      message: 'Employee created successfully. Personal code sent via SMS.'
    }, { status: 201 })
    
  } catch (error) {
    logger.error('Create employee error:', error)
    
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

// PUT /api/employees - Update employee (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitRes = await rateLimit(request, rateLimiters.strict)
    if (rateLimitRes) return rateLimitRes
    
    // Authentication required - only admin
    const user = await authenticate(request, {
      methods: ['jwt', 'supabase'],
      roles: ['admin']
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }
    
    // Get employee ID from body
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID required' },
        { status: 400 }
      )
    }
    
    // Validate update data
    const validatedData = updateEmployeeSchema.parse(updateData)
    
    logger.info('Updating employee:', { 
      userId: user.id,
      employeeId: id 
    })
    
    const supabase = createServerSupabaseClient()
    
    // Update permissions if role changed
    if (validatedData.role) {
      validatedData.permissions = getPermissionsByRole(validatedData.role)
    }
    
    // Update employee
    const { data: employee, error } = await supabase
      .from('staff')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      logger.error('Error updating employee:', error)
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 500 }
      )
    }
    
    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'employee',
        resource_id: id,
        action: 'update',
        user_id: user.id,
        details: validatedData
      })
    
    // Remove sensitive data
    const { personal_code_hash, ...safeEmployee } = employee
    
    return NextResponse.json({
      success: true,
      data: safeEmployee
    })
    
  } catch (error) {
    logger.error('Update employee error:', error)
    
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

// Helper function to get permissions by role
function getPermissionsByRole(role: string): string[] {
  const rolePermissions = {
    admin: ['all'],
    manager: ['schedule', 'checkin', 'chat', 'reports', 'employees:read'],
    mover: ['schedule', 'checkin', 'chat', 'deviation'],
    driver: ['schedule', 'checkin', 'chat', 'vehicle'],
    packer: ['schedule', 'checkin', 'chat']
  }
  
  return rolePermissions[role as keyof typeof rolePermissions] || ['schedule', 'checkin']
}