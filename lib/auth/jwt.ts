// JWT Authentication utilities for staff app
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_EXPIRES_IN = '8h' // 8 hours for work shift
const REFRESH_TOKEN_EXPIRES_IN = '7d' // 7 days

// Supabase client for auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: string
  employeeId?: string
  exp?: number
  iat?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// Generate access and refresh tokens
export async function generateTokens(payload: Omit<JWTPayload, 'exp' | 'iat'>): Promise<AuthTokens> {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })

  const refreshToken = jwt.sign(
    { userId: payload.userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  )

  // Store refresh token in database
  await supabase
    .from('staff_refresh_tokens')
    .insert({
      user_id: payload.userId,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

  return {
    accessToken,
    refreshToken,
    expiresIn: 8 * 60 * 60, // 8 hours in seconds
  }
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type')
    }

    // Check if refresh token exists in database and is valid
    const { data: tokenData } = await supabase
      .from('staff_refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .eq('user_id', decoded.userId)
      .single()

    if (!tokenData || new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Refresh token expired or invalid')
    }

    // Get user data
    const { data: userData } = await supabase
      .from('employees')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (!userData) {
      throw new Error('User not found')
    }

    // Generate new tokens
    return generateTokens({
      userId: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'staff',
      employeeId: userData.id,
    })
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

// Set auth cookies
export async function setAuthCookies(tokens: AuthTokens) {
  const cookieStore = await cookies()
  
  // Set access token cookie (httpOnly for security)
  cookieStore.set('staff-access-token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: tokens.expiresIn,
    path: '/',
  })

  // Set refresh token cookie (httpOnly, longer expiry)
  cookieStore.set('staff-refresh-token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
}

// Clear auth cookies
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete('staff-access-token')
  cookieStore.delete('staff-refresh-token')
}

// Get current user from token
export async function getCurrentUser(token: string): Promise<JWTPayload | null> {
  const payload = await verifyToken(token)
  if (!payload) return null

  // Optionally fetch fresh user data from database
  const { data: userData } = await supabase
    .from('employees')
    .select('*')
    .eq('id', payload.userId)
    .single()

  if (!userData) return null

  return {
    userId: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role || 'staff',
    employeeId: userData.id,
  }
}

// Validate staff credentials
export async function validateStaffCredentials(email: string, password: string) {
  // Check if demo mode is enabled
  if (process.env.ENABLE_DEMO_AUTH === 'true' && process.env.DEMO_PASSWORD) {
    const demoUsers = [
      { email: 'erik@nordflytt.se', name: 'Erik Andersson', role: 'Flyttchef' },
      { email: 'sofia@nordflytt.se', name: 'Sofia Lindberg', role: 'Flyttare' },
      { email: 'marcus@nordflytt.se', name: 'Marcus Johansson', role: 'Lastbilschaufför' },
    ]

    const demoUser = demoUsers.find(u => u.email === email)
    if (demoUser && password === process.env.DEMO_PASSWORD) {
      return {
        id: `demo-${email}`,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      }
    }
  }

  // Production: validate against Supabase auth
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return null
    }

    // Get employee data
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .single()

    if (!employee) {
      return null
    }

    return {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role || 'staff',
    }
  } catch (error) {
    console.error('Auth validation error:', error)
    return null
  }
}