import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SignJWT, jwtVerify } from 'jose'
import { rateLimit, rateLimiters } from '@/lib/security/rate-limit'
import { validateRequest } from '@/lib/security/validation'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'

// JWT Secret from environment
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ''
)

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// Login schema for staff
const staffLoginSchema = z.object({
  staffId: z.string().min(1, 'Staff ID required'),
  personalCode: z.string().regex(/^\d{4,6}$/, 'Personal code must be 4-6 digits')
})

// Create JWT token for staff
async function createStaffToken(staffId: string, staffData: any) {
  const token = await new SignJWT({ 
    staffId,
    role: staffData.role,
    permissions: staffData.permissions,
    name: staffData.name,
    department: staffData.department
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // Shorter expiry for staff tokens
    .setSubject(staffId)
    .sign(JWT_SECRET)
  
  return token
}

// Verify JWT token
export async function verifyStaffToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256']
    })
    return payload
  } catch (error) {
    return null
  }
}

// POST - Staff login
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting - strict for auth
    const rateLimitResponse = await rateLimit(request, rateLimiters.auth)
    if (rateLimitResponse) return rateLimitResponse
    
    // 2. Validate input
    const { staffId, personalCode } = await validateRequest(request, staffLoginSchema)
    
    // 3. Get staff from database
    const supabase = createServerSupabaseClient()
    const { data: staff, error } = await supabase
      .from('staff')
      .select(`
        id,
        name,
        email,
        phone,
        role,
        department,
        permissions,
        personal_code_hash,
        status,
        avatar_url
      `)
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .single()
    
    if (error || !staff) {
      logger.warn('Failed staff login attempt:', { staffId })
      // Generic error to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // 4. Verify personal code
    const isValidCode = await bcrypt.compare(personalCode, staff.personal_code_hash)
    
    if (!isValidCode) {
      // Log failed attempt
      await supabase.from('staff_login_attempts').insert({
        staff_id: staff.id,
        success: false,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent')
      })
      
      logger.warn('Invalid personal code for staff:', { staffId })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // 5. Create JWT token
    const token = await createStaffToken(staff.id, staff)
    
    // 6. Get today's schedule
    const today = new Date().toISOString().split('T')[0]
    const { data: schedule } = await supabase
      .from('staff_schedules')
      .select(`
        *,
        jobs:jobs(
          id,
          booking_number,
          customer_name,
          from_address,
          to_address,
          start_time,
          estimated_duration,
          status
        )
      `)
      .eq('staff_id', staff.id)
      .eq('date', today)
      .single()
    
    // 7. Log successful login
    await supabase.from('staff_login_attempts').insert({
      staff_id: staff.id,
      success: true,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent')
    })
    
    logger.info('Successful staff login:', { staffId: staff.id })
    
    // 8. Create secure response
    const response = NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        department: staff.department,
        permissions: staff.permissions,
        avatar: staff.avatar_url || '/placeholder-user.jpg'
      },
      todaySchedule: schedule || { date: today, jobs: [] },
      loginTime: new Date().toISOString()
    })
    
    // 9. Set secure HTTP-only cookie
    response.cookies.set('staff-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/'
    })
    
    return response
    
  } catch (error) {
    logger.error('Staff login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 500 }
    )
  }
}

// GET - Verify staff token
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const cookieToken = request.cookies.get('staff-token')?.value
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const token = cookieToken || headerToken
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }
    
    // Verify token
    const payload = await verifyStaffToken(token)
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    // Get fresh staff data
    const supabase = createServerSupabaseClient()
    const { data: staff } = await supabase
      .from('staff')
      .select('id, name, email, role, department, permissions, status')
      .eq('id', payload.sub!)
      .eq('status', 'active')
      .single()
    
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff not found or inactive' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      valid: true,
      staff,
      expiresAt: new Date((payload.exp as number) * 1000).toISOString()
    })
    
  } catch (error) {
    logger.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Could not verify token' },
      { status: 500 }
    )
  }
}

// DELETE - Staff logout
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    // Clear cookie
    response.cookies.delete('staff-token')
    
    return response
  } catch (error) {
    logger.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}