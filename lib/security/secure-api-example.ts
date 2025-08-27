import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from './auth-middleware'
import { rateLimit, rateLimiters } from './rate-limit'
import { validateRequest, bookingSchema } from './validation'

/**
 * Example of a secured API route with all security measures
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResponse = await rateLimit(request, rateLimiters.normal)
    if (rateLimitResponse) return rateLimitResponse
    
    // 2. Authentication (optional for public endpoints)
    let user = null
    try {
      user = await authenticate(request, {
        methods: ['jwt', 'supabase'],
        roles: ['admin', 'staff'] // Optional role check
      })
    } catch (error) {
      // For public endpoints, continue without auth
      // For protected endpoints, return 401
      if (!isPublicEndpoint(request)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }
    
    // 3. Input validation
    const validatedData = await validateRequest(request, bookingSchema)
    
    // 4. Business logic with sanitized data
    const result = await processBooking(validatedData, user)
    
    // 5. Return response with security headers
    const response = NextResponse.json({
      success: true,
      data: result
    })
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
    
  } catch (error) {
    // Error handling
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    // Log error (but don't expose internals)
    console.error('API Error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Helper to check if endpoint is public
 */
function isPublicEndpoint(request: NextRequest): boolean {
  const publicPaths = [
    '/api/submit-booking',
    '/api/offers/[id]',
    '/api/health'
  ]
  
  const path = request.nextUrl.pathname
  return publicPaths.some(p => path.includes(p))
}

/**
 * Example business logic
 */
async function processBooking(data: any, user: any) {
  // Your actual business logic here
  return {
    id: 'booking-123',
    ...data,
    createdBy: user?.id || 'anonymous'
  }
}

/**
 * Middleware wrapper for easier usage
 */
export function secureApiRoute(
  handler: (request: NextRequest, context?: any) => Promise<Response>,
  options?: {
    auth?: boolean
    roles?: string[]
    rateLimit?: 'strict' | 'normal' | 'relaxed'
    public?: boolean
  }
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    try {
      // Rate limiting
      const limiter = options?.rateLimit 
        ? rateLimiters[options.rateLimit] 
        : rateLimiters.normal
        
      const rateLimitResponse = await rateLimit(request, limiter)
      if (rateLimitResponse) return rateLimitResponse
      
      // Authentication
      if (options?.auth !== false && !options?.public) {
        await authenticate(request, {
          roles: options?.roles
        })
      }
      
      // Call handler
      const response = await handler(request, context)
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      
      return response
      
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }
      
      console.error('API Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}