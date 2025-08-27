import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, rateLimiters } from './lib/security/rate-limit'
import { applyCorsHeaders, handleCorsPreflightRequest } from './lib/security/cors-config'

// Protected paths configuration
const protectedPaths = {
  offer: '/offer/',
  orderConfirmation: '/order-confirmation/',
  crm: '/crm',
  staff: '/staff',
  admin: '/admin',
  api: '/api'
}

// Public API endpoints that don't need auth
const publicApiEndpoints = [
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/submit-booking',
  '/api/confirm-booking',
  '/api/offers',
  '/api/health',
  '/api/send-booking-confirmation',
  '/api/test-simple', // For testing
  '/api/orders/confirmation', // Order confirmation is public
  '/api/check-env' // Environment check endpoint
]

// Security headers configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline' https://*.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://*.gstatic.com; connect-src 'self' https://*.supabase.co https://*.google-analytics.com wss://*.supabase.co; frame-src 'self' https://*.google.com;"
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request)
  }
  
  let response = NextResponse.next()
  
  // 1. Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Apply CORS headers
  response = applyCorsHeaders(response, origin)
  
  // 2. Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && 
      request.headers.get('x-forwarded-proto') === 'http') {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, { status: 301 })
  }
  
  // 3. API Rate limiting
  if (pathname.startsWith('/api/')) {
    // Skip rate limiting for health checks
    if (pathname === '/api/health') {
      return response
    }
    
    // Different rate limits for different endpoints
    let limiter = rateLimiters.normal
    
    if (pathname.includes('/auth') || pathname.includes('/login')) {
      limiter = rateLimiters.auth // Strictest
    } else if (pathname.includes('/submit') || pathname.includes('/create')) {
      limiter = rateLimiters.strict // Strict for mutations
    }
    
    const rateLimitResponse = await rateLimit(request, limiter)
    if (rateLimitResponse) return rateLimitResponse
    
    // Check if API endpoint needs authentication
    const needsAuth = !publicApiEndpoints.some(endpoint => pathname.startsWith(endpoint))
    
    if (needsAuth) {
      // Check for API key or session
      const apiKey = request.headers.get('x-api-key')
      const authHeader = request.headers.get('authorization')
      const sessionCookie = request.cookies.get('sb-access-token')
      
      if (!apiKey && !authHeader && !sessionCookie) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }
  }
  
  // 4. Protected page routes (offer, order-confirmation)
  if (pathname.startsWith(protectedPaths.offer) || pathname.startsWith(protectedPaths.orderConfirmation)) {
    const token = request.nextUrl.searchParams.get('token')
    const accessKey = request.nextUrl.searchParams.get('key')
    
    // Development bypass for testing
    if (process.env.NODE_ENV === 'development' && 
        (pathname.includes('test') || pathname.includes('demo'))) {
      return response
    }
    
    // Require token or access key
    if (!token && !accessKey && pathname.startsWith(protectedPaths.offer)) {
      return NextResponse.redirect(new URL(`/access-required?resource=${pathname}`, request.url))
    }
    
    // Validate token/key format (minimum security)
    if (token && token.length < 16) {
      return NextResponse.redirect(new URL('/access-required?error=invalid_token', request.url))
    }
  }
  
  // 5. CRM and Staff authentication
  if (pathname.startsWith(protectedPaths.crm) || pathname.startsWith(protectedPaths.staff)) {
    // Allow login pages
    if (pathname.includes('/login')) {
      return response
    }
    
    // Check authentication
    const authToken = request.cookies.get('auth-token') || request.cookies.get('sb-access-token')
    const staffToken = request.cookies.get('staff-token')
    
    const isStaffArea = pathname.startsWith(protectedPaths.staff)
    const hasCrmAuth = authToken?.value
    const hasStaffAuth = staffToken?.value
    
    if (isStaffArea && !hasStaffAuth) {
      return NextResponse.redirect(new URL(`/staff/login?redirect=${pathname}`, request.url))
    }
    
    if (pathname.startsWith(protectedPaths.crm) && !hasCrmAuth) {
      return NextResponse.redirect(new URL(`/crm/login?redirect=${pathname}`, request.url))
    }
  }
  
  // 6. Admin area protection
  if (pathname.startsWith(protectedPaths.admin)) {
    const authToken = request.cookies.get('auth-token')
    const sessionId = request.cookies.get('session-id')
    
    // TODO: Check if user has admin role
    if (!authToken || !sessionId) {
      return NextResponse.redirect(new URL('/crm/login?redirect=' + pathname, request.url))
    }
  }
  
  // 7. Add request ID for tracing
  response.headers.set('X-Request-ID', crypto.randomUUID())
  
  // 8. Log security events (in production, send to monitoring service)
  if (process.env.NODE_ENV === 'production') {
    const securityLog = {
      timestamp: new Date().toISOString(),
      path: pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      authenticated: !!(request.cookies.get('auth-token') || request.cookies.get('staff-token'))
    }
    
    // TODO: Send to monitoring service
    console.log('[Security]', JSON.stringify(securityLog))
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public assets (images, fonts, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)$).*)',
  ],
}