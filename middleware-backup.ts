import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/form',
  '/offer',
  '/api/submit-booking',
  '/api/offers',
  '/api/public'
]

// Routes that require specific permissions
const PROTECTED_API_ROUTES: Record<string, string[]> = {
  '/api/crm/customers': ['customers:read'],
  '/api/crm/leads': ['leads:read'],
  '/api/crm/jobs': ['jobs:read'],
  '/api/crm/staff': ['staff:read'],
  '/api/crm/financial': ['financial:read'],
  '/api/crm/reports': ['reports:read'],
  '/api/crm/settings': ['settings:read']
}

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Get pathname
  const pathname = request.nextUrl.pathname

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Allow public routes
  if (isPublicRoute) {
    return res
  }

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session && pathname.startsWith('/crm')) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // For API routes, check permissions
  if (pathname.startsWith('/api/crm/')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check specific permissions if needed
    const requiredPermissions = PROTECTED_API_ROUTES[pathname]
    if (requiredPermissions) {
      // In a real implementation, check user permissions
      // For now, allow all authenticated users
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}