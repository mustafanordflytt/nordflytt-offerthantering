import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { rateLimit, rateLimiters } from '@/lib/security/rate-limit'
import { validateRequest } from '@/lib/security/validation'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password too short')
})

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting - strict for auth endpoints
    const rateLimitResponse = await rateLimit(request, rateLimiters.auth)
    if (rateLimitResponse) return rateLimitResponse
    
    // 2. Validate input
    const { email, password } = await validateRequest(request, loginSchema)
    
    // 3. Authenticate with Supabase
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error || !data.user) {
      logger.warn('Failed login attempt:', { email })
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 })
    }
    
    // 4. Get user profile with role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, role, permissions')
      .eq('user_id', data.user.id)
      .single()
    
    // 5. Create secure user object (no sensitive data)
    const user = {
      id: data.user.id,
      email: data.user.email!,
      name: profile?.name || data.user.email!.split('@')[0],
      role: profile?.role || 'employee',
      permissions: profile?.permissions || ['customers:read', 'jobs:read']
    }
    
    logger.info('Successful login:', { userId: user.id, email: user.email })
    
    // 6. Create secure response with httpOnly cookies
    const response = NextResponse.json({
      success: true,
      user,
      // Don't send raw token to frontend
      expiresAt: data.session?.expires_at
    })
    
    // 7. Set secure cookies
    if (data.session?.access_token) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })
      
      response.cookies.set('sb-refresh-token', data.session.refresh_token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
    }
    
    return response
    
  } catch (error) {
    // Don't expose error details
    logger.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input format'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Authentication service unavailable'
    }, { status: 500 })
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    await supabase.auth.signOut()
    
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    // Clear cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    
    return response
  } catch (error) {
    logger.error('Logout error:', error)
    return NextResponse.json({
      success: false,
      error: 'Logout failed'
    }, { status: 500 })
  }
}