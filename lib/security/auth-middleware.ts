import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email?: string
  phone?: string
  role?: string
}

// Lista över publika endpoints som inte kräver autentisering
const PUBLIC_ENDPOINTS = [
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/submit-booking',
  '/api/confirm-booking',
  '/api/offers', // GET för att visa offers
  '/api/health', // Health check endpoint
  '/api/orders/confirmation', // Order confirmation is public
  '/api/test-simple', // Test endpoint
  '/api/check-env', // Environment check endpoint
]

// Endpoints som kan vara publika med token i query params
const TOKEN_BASED_ENDPOINTS = [
  '/api/offers', // Med token parameter
  '/api/contracts', // Med token parameter
  '/api/order-confirmation', // Med booking ID
]

/**
 * Check if endpoint is public
 */
export function isPublicEndpoint(pathname: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint))
}

/**
 * Check if endpoint allows token-based auth
 */
export function isTokenBasedEndpoint(pathname: string): boolean {
  return TOKEN_BASED_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint))
}

/**
 * Verify JWT token and return user data
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, secret) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Auth middleware for API routes - UPDATED with public endpoint support
 */
export async function requireAuth(
  request: NextRequest,
  options?: {
    roles?: string[]
    allowPublic?: boolean
  }
): Promise<AuthUser | null> {
  const pathname = request.nextUrl.pathname
  
  // Check if this is a public endpoint
  if (isPublicEndpoint(pathname) || options?.allowPublic) {
    return null // No auth required
  }

  // Development bypass (remove in production!)
  if (process.env.NODE_ENV === 'development' && process.env.AUTH_BYPASS === 'true') {
    return { id: 'dev-user', email: 'dev@nordflytt.se', role: 'admin' }
  }

  // Check for token-based endpoints
  if (isTokenBasedEndpoint(pathname)) {
    const token = request.nextUrl.searchParams.get('token')
    if (token) {
      const user = await verifyToken(token)
      if (user) return user
    }
  }

  // Get token from Authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7)
  const user = await verifyToken(token)

  if (!user) {
    throw new Error('Invalid token')
  }

  // Check role if specified
  if (options?.roles && options.roles.length > 0) {
    if (!user.role || !options.roles.includes(user.role)) {
      throw new Error('Insufficient permissions')
    }
  }

  return user
}

/**
 * Supabase auth check
 */
export async function requireSupabaseAuth(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  
  // Get session from cookie
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    throw new Error('Unauthorized')
  }
  
  return session.user
}

/**
 * API key authentication
 */
export async function requireApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key')
  const validApiKey = process.env.API_KEY
  
  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    throw new Error('Invalid API key')
  }
  
  return true
}

/**
 * Combined auth check - tries multiple methods
 */
export async function authenticate(
  request: NextRequest,
  options?: {
    methods?: ('jwt' | 'supabase' | 'apikey')[]
    roles?: string[]
  }
): Promise<AuthUser | null> {
  const pathname = request.nextUrl.pathname
  
  // Check if public endpoint first
  if (isPublicEndpoint(pathname)) {
    return null
  }

  // Development bypass
  if (process.env.NODE_ENV === 'development' && process.env.AUTH_BYPASS === 'true') {
    return { id: 'dev-user', email: 'dev@nordflytt.se', role: 'admin' }
  }

  const methods = options?.methods || ['jwt', 'supabase']
  
  for (const method of methods) {
    try {
      switch (method) {
        case 'jwt':
          return await requireAuth(request, { roles: options?.roles })
        
        case 'supabase':
          const user = await requireSupabaseAuth(request)
          return {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role
          }
        
        case 'apikey':
          await requireApiKey(request)
          return { id: 'api-user' }
        
        default:
          continue
      }
    } catch (error) {
      // Try next method
      continue
    }
  }
  
  throw new Error('Authentication failed')
}

/**
 * Generate test token for development
 */
export function generateTestToken(user: AuthUser): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key'
  return jwt.sign(user, secret, { expiresIn: '30d' })
}