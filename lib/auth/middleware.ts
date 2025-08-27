// Authentication middleware for API routes
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    name: string
    role: string
    employeeId?: string
  }
}

// Middleware to verify JWT tokens
export async function authMiddleware(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get token from cookie or Authorization header
    const cookieToken = request.cookies.get('staff-access-token')?.value
    const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '')
    const token = cookieToken || headerToken

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Add user to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      employeeId: payload.employeeId,
    }

    // Call the handler with authenticated request
    return handler(authenticatedRequest)
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

// Role-based access control
export function requireRole(allowedRoles: string[]) {
  return (
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    if (!request.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!allowedRoles.includes(request.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(request)
  }
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    const userLimit = rateLimitMap.get(ip)
    
    if (!userLimit || now > userLimit.resetTime) {
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      })
    } else {
      userLimit.count++
      
      if (userLimit.count > maxRequests) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )
      }
    }

    return handler(request)
  }
}

// CORS middleware
export function cors(allowedOrigins: string[] = ['*']) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const origin = request.headers.get('origin') || ''
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : 
            allowedOrigins.includes(origin) ? origin : '',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const response = await handler(request)
    
    // Add CORS headers to response
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return response
  }
}

// Combine multiple middlewares
export function composeMiddleware(...middlewares: Function[]) {
  return (request: NextRequest, handler: Function) => {
    return middlewares.reduceRight(
      (next, middleware) => () => middleware(request, next),
      () => handler(request)
    )()
  }
}