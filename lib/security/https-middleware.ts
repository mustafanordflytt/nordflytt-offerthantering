// HTTPS enforcement and security headers middleware
import { NextRequest, NextResponse } from 'next/server'

export function httpsMiddleware(request: NextRequest, handler: Function) {
  return async () => {
    const response: NextResponse = await handler()
    
    // Force HTTPS in production
    if (process.env.NODE_ENV === 'production' && !request.headers.get('x-forwarded-proto')?.includes('https')) {
      const httpsUrl = new URL(request.url)
      httpsUrl.protocol = 'https'
      return NextResponse.redirect(httpsUrl, { status: 301 })
    }

    // Add security headers
    const securedResponse = addSecurityHeaders(response)
    
    return securedResponse
  }
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Strict Transport Security - Force HTTPS for 1 year
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  
  // Content Security Policy - Prevent XSS and injection attacks
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://chatgpt.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.openai.com https://maps.googleapis.com wss://*.supabase.co",
      "frame-src 'self' https://chatgpt.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  )
  
  // X-Frame-Options - Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // X-Content-Type-Options - Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // X-XSS-Protection - Enable XSS filtering
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy - Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy - Control browser features
  response.headers.set(
    'Permissions-Policy',
    [
      'camera=(self)',
      'microphone=()',
      'geolocation=(self)',
      'payment=()',
      'usb=()',
      'serial=()',
      'bluetooth=()'
    ].join(', ')
  )
  
  // Remove potentially sensitive headers
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')
  
  // Cache control for sensitive pages
  if (request.nextUrl.pathname.startsWith('/staff') || 
      request.nextUrl.pathname.startsWith('/crm')) {
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate, private'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  return response
}

// Specific middleware for API routes
export function apiSecurityHeaders(response: NextResponse): NextResponse {
  // JSON-specific security
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  
  // API rate limiting headers (if implemented)
  if (response.headers.get('X-RateLimit-Remaining')) {
    response.headers.set('X-RateLimit-Policy', '100;w=60')
  }
  
  return response
}