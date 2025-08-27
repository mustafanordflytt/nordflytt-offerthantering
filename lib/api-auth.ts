import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { validateTokenProduction, getUserFromRequest } from '@/lib/security/jwt-validation'

// API Security Configuration
export const API_SECURITY = {
  // Rate limiting
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 60, // 60 requests per minute
  
  // Token settings
  API_TOKEN_LENGTH: 32,
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Valid API keys (in production, store in database)
const validApiKeys = new Set([
  process.env.INTERNAL_API_KEY,
  process.env.PARTNER_API_KEY,
  process.env.MOBILE_APP_KEY
].filter(Boolean))

// Authentication levels
export enum AuthLevel {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  ADMIN = 'admin',
  INTERNAL = 'internal'
}

// API Response helper
export function apiResponse(
  data: any,
  status: number = 200,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      ...API_SECURITY.SECURITY_HEADERS,
      ...headers
    }
  })
}

// Error response helper
export function apiError(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  return apiResponse(
    {
      error: message,
      code: code || 'ERROR',
      timestamp: new Date().toISOString()
    },
    status
  )
}

// Rate limiting middleware
export async function checkRateLimit(request: NextRequest): Promise<boolean> {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const key = `rate_limit:${ip}`
  const now = Date.now()
  
  const record = rateLimitStore.get(key)
  
  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + API_SECURITY.RATE_LIMIT_WINDOW
    })
    return true
  }
  
  if (record.count >= API_SECURITY.RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  record.count++
  return true
}

// API Key validation
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  
  if (!apiKey || !validApiKeys.has(apiKey)) {
    return false
  }
  
  return true
}

// Session validation
export async function validateSession(request: NextRequest): Promise<{
  valid: boolean
  userId?: string
  role?: string
}> {
  const authHeader = request.headers.get('authorization')
  const sessionCookie = request.cookies.get('session')?.value
  
  const token = authHeader || sessionCookie
  if (!token) {
    return { valid: false }
  }
  
  try {
    // Use proper JWT validation
    const payload = await getUserFromRequest(token)
    if (!payload) {
      return { valid: false }
    }
    
    return {
      valid: true,
      userId: payload.userId,
      role: payload.role
    }
  } catch {
    return { valid: false }
  }
}

// Main authentication middleware
export async function authenticateAPI(
  request: NextRequest,
  requiredAuth: AuthLevel = AuthLevel.AUTHENTICATED
): Promise<{ authorized: boolean; response?: NextResponse; session?: any }> {
  // Check rate limiting first
  const rateLimitOk = await checkRateLimit(request)
  if (!rateLimitOk) {
    return {
      authorized: false,
      response: apiError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED')
    }
  }
  
  // Public endpoints don't need auth
  if (requiredAuth === AuthLevel.PUBLIC) {
    return { authorized: true }
  }
  
  // Development bypass
  if (process.env.NODE_ENV === 'development' && process.env.AUTH_BYPASS === 'true') {
    return { 
      authorized: true, 
      session: { 
        userId: 'dev-user', 
        role: requiredAuth === AuthLevel.ADMIN ? 'admin' : 'staff' 
      }
    }
  }
  
  // Check API key for internal/partner access
  if (requiredAuth === AuthLevel.INTERNAL) {
    const hasValidKey = validateApiKey(request)
    if (!hasValidKey) {
      return {
        authorized: false,
        response: apiError('Invalid API key', 401, 'INVALID_API_KEY')
      }
    }
    return { authorized: true }
  }
  
  // Check session for authenticated/admin access
  const session = await validateSession(request)
  if (!session.valid) {
    return {
      authorized: false,
      response: apiError('Authentication required', 401, 'AUTH_REQUIRED')
    }
  }
  
  // Check admin role if required
  if (requiredAuth === AuthLevel.ADMIN && session.role !== 'admin') {
    return {
      authorized: false,
      response: apiError('Admin access required', 403, 'FORBIDDEN')
    }
  }
  
  return { authorized: true, session }
}

// Input validation helper
export function validateInput<T>(
  data: any,
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array'
      required?: boolean
      min?: number
      max?: number
      pattern?: RegExp
      enum?: any[]
      validate?: (value: any) => boolean
    }
  }
): { valid: boolean; errors: string[]; data?: T } {
  const errors: string[] = []
  const validated: any = {}
  
  for (const [field, rules] of Object.entries(schema) as any) {
    const value = data[field]
    
    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }
    
    // Skip optional empty fields
    if (!rules.required && (value === undefined || value === null)) {
      continue
    }
    
    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (actualType !== rules.type) {
      errors.push(`${field} must be ${rules.type}`)
      continue
    }
    
    // String validations
    if (rules.type === 'string') {
      if (rules.min && value.length < rules.min) {
        errors.push(`${field} must be at least ${rules.min} characters`)
      }
      if (rules.max && value.length > rules.max) {
        errors.push(`${field} must be at most ${rules.max} characters`)
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} has invalid format`)
      }
    }
    
    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`)
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`)
      }
    }
    
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`)
    }
    
    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors.push(`${field} is invalid`)
    }
    
    validated[field] = value
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validated : undefined
  }
}

// SQL injection prevention
export function sanitizeSQL(input: string): string {
  // Basic SQL injection prevention
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
}

// XSS prevention
export function sanitizeHTML(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Generate secure tokens
export function generateSecureToken(length: number = API_SECURITY.API_TOKEN_LENGTH): string {
  return crypto.randomBytes(length).toString('hex')
}

// Hash passwords
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// Verify passwords
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}

// Audit logging
export function logAPIAccess(
  request: NextRequest,
  response: NextResponse,
  userId?: string
): void {
  const log = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.nextUrl.pathname,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userId,
    status: response.status,
    userAgent: request.headers.get('user-agent')
  }
  
  // In production, send to logging service
  console.log('[API Access]', log)
}