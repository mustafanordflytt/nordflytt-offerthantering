// CRM API Middleware for Authentication and Authorization
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CRMRole } from './crm-auth'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface AuthenticatedCRMRequest extends NextRequest {
  user: {
    id: string
    email: string
    name: string
    role: CRMRole
    permissions: string[]
  }
}

export interface CRMMiddlewareOptions {
  requiredPermissions?: string[]
  requiredRole?: CRMRole
  allowSelf?: boolean // Allow users to access their own data
}

/**
 * Middleware to authenticate and authorize CRM API requests
 */
export async function crmAuthMiddleware(
  request: NextRequest,
  handler: (req: AuthenticatedCRMRequest) => Promise<NextResponse>,
  options: CRMMiddlewareOptions = {}
): Promise<NextResponse> {
  try {
    // Extract authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header missing' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user profile from CRM users table
    const { data: crmUser, error: profileError } = await supabaseAdmin
      .from('crm_users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !crmUser) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 403 }
      )
    }

    // Create authenticated request object
    const authenticatedRequest = request as AuthenticatedCRMRequest
    authenticatedRequest.user = {
      id: crmUser.id,
      email: crmUser.email,
      name: crmUser.name,
      role: crmUser.role,
      permissions: getRolePermissions(crmUser.role)
    }

    // Check role-based authorization
    if (options.requiredRole && !hasRequiredRole(crmUser.role, options.requiredRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient role permissions' },
        { status: 403 }
      )
    }

    // Check permission-based authorization
    if (options.requiredPermissions && !hasRequiredPermissions(crmUser.role, options.requiredPermissions)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Call the protected handler
    return await handler(authenticatedRequest)

  } catch (error) {
    console.error('CRM Auth middleware error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal authentication error' },
      { status: 500 }
    )
  }
}

/**
 * Get permissions for a given role
 */
function getRolePermissions(role: CRMRole): string[] {
  const rolePermissions: Record<CRMRole, string[]> = {
    admin: [
      'customers:read', 'customers:write', 'customers:delete',
      'jobs:read', 'jobs:write', 'jobs:delete',
      'leads:read', 'leads:write', 'leads:delete',
      'employees:read', 'employees:write', 'employees:delete',
      'reports:read', 'settings:read', 'settings:write',
      'ai:access', 'automation:access'
    ],
    manager: [
      'customers:read', 'customers:write',
      'jobs:read', 'jobs:write',
      'leads:read', 'leads:write',
      'employees:read', 'reports:read', 'ai:access'
    ],
    employee: [
      'customers:read', 'jobs:read', 'jobs:write',
      'leads:read', 'reports:read'
    ],
    readonly: [
      'customers:read', 'jobs:read', 'leads:read', 'reports:read'
    ]
  }

  return rolePermissions[role] || []
}

/**
 * Check if user has required role or higher
 */
function hasRequiredRole(userRole: CRMRole, requiredRole: CRMRole): boolean {
  const roleHierarchy: Record<CRMRole, number> = {
    readonly: 1,
    employee: 2,
    manager: 3,
    admin: 4
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if user has all required permissions
 */
function hasRequiredPermissions(userRole: CRMRole, requiredPermissions: string[]): boolean {
  const userPermissions = getRolePermissions(userRole)
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}

/**
 * Rate limiting middleware for CRM endpoints
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function crmRateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
): Promise<NextResponse | null> {
  // Get client identifier
  const clientId = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown'

  const now = Date.now()
  const windowStart = now - windowMs

  // Clean up expired entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < windowStart) {
      rateLimitStore.delete(key)
    }
  }

  // Get current rate limit data
  const current = rateLimitStore.get(clientId) || { count: 0, resetTime: now + windowMs }

  // Check if limit exceeded
  if (current.count >= maxRequests && current.resetTime > now) {
    const resetIn = Math.ceil((current.resetTime - now) / 1000)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Rate limit exceeded',
        resetIn 
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': current.resetTime.toString()
        }
      }
    )
  }

  // Update rate limit data
  if (current.resetTime <= now) {
    current.count = 1
    current.resetTime = now + windowMs
  } else {
    current.count++
  }

  rateLimitStore.set(clientId, current)

  // Add rate limit headers
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - current.count).toString())
  response.headers.set('X-RateLimit-Reset', current.resetTime.toString())

  return null // Continue to next middleware/handler
}

/**
 * Helper function to create protected CRM endpoints
 */
export function createProtectedCRMHandler<T = any>(
  handler: (req: AuthenticatedCRMRequest) => Promise<NextResponse<T>>,
  options: CRMMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    // Apply rate limiting first
    const rateLimitResponse = await crmRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<T>
    }

    // Apply authentication and authorization
    return crmAuthMiddleware(request, handler, options)
  }
}

/**
 * Permission decorator for easier endpoint protection
 */
export function requireCRMPermissions(...permissions: string[]) {
  return function<T>(
    handler: (req: AuthenticatedCRMRequest) => Promise<NextResponse<T>>
  ) {
    return createProtectedCRMHandler(handler, { requiredPermissions: permissions })
  }
}

/**
 * Role decorator for easier endpoint protection
 */
export function requireCRMRole(role: CRMRole) {
  return function<T>(
    handler: (req: AuthenticatedCRMRequest) => Promise<NextResponse<T>>
  ) {
    return createProtectedCRMHandler(handler, { requiredRole: role })
  }
}

/**
 * Utility to check if user can access resource (for self-access scenarios)
 */
export function canAccessResource(
  user: AuthenticatedCRMRequest['user'],
  resourceUserId: string,
  permission: string
): boolean {
  // Admin can access everything
  if (user.role === 'admin') {
    return true
  }

  // User can access their own resources
  if (user.id === resourceUserId) {
    return true
  }

  // Check if user has the required permission
  return user.permissions.includes(permission)
}