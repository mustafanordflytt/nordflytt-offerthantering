import { z } from 'zod'

/**
 * Common validation schemas
 */
export const schemas = {
  // Swedish phone number
  phone: z.string().regex(
    /^(\+46|0)[1-9]\d{8,9}$/,
    'Invalid Swedish phone number'
  ),
  
  // Email
  email: z.string().email('Invalid email address'),
  
  // Swedish personal number
  personalNumber: z.string().regex(
    /^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])-?\d{4}$/,
    'Invalid personal number'
  ),
  
  // UUID
  uuid: z.string().uuid('Invalid ID format'),
  
  // Date string
  dateString: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in YYYY-MM-DD format'
  ),
  
  // Time string
  timeString: z.string().regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    'Time must be in HH:MM format'
  ),
  
  // Positive number
  positiveNumber: z.number().positive('Must be a positive number'),
  
  // Safe string (no XSS)
  safeString: z.string().transform(val => 
    val.replace(/<script.*?>.*?<\/script>/gi, '')
       .replace(/<[^>]*>/g, '')
       .trim()
  )
}

/**
 * Booking validation schema
 */
export const bookingSchema = z.object({
  customerType: z.enum(['private', 'company']),
  name: z.string().min(2, 'Name too short').max(100, 'Name too long'),
  email: schemas.email,
  phone: schemas.phone,
  moveDate: schemas.dateString,
  moveTime: schemas.timeString.optional().default('08:00'),
  fromAddress: z.string().min(5, 'Address too short'),
  toAddress: z.string().min(5, 'Address too short'),
  serviceType: z.enum(['moving', 'packing', 'cleaning', 'storage']),
  hasElevatorFrom: z.boolean().optional(),
  hasElevatorTo: z.boolean().optional(),
  floorFrom: z.number().min(0).max(20).optional(),
  floorTo: z.number().min(0).max(20).optional(),
  estimatedVolume: z.number().min(0).max(1000).optional(),
  services: z.array(z.string()).optional().default([]),
  additionalInfo: schemas.safeString.optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms'
  })
})

/**
 * Staff login schema
 */
export const loginSchema = z.object({
  phone: schemas.phone,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits').optional()
})

/**
 * Job update schema
 */
export const jobUpdateSchema = z.object({
  status: z.enum(['assigned', 'started', 'paused', 'completed', 'cancelled']).optional(),
  notes: schemas.safeString.optional(),
  photos: z.array(z.string().url()).optional(),
  actualVolume: schemas.positiveNumber.optional(),
  additionalServices: z.array(z.string()).optional(),
  signature: z.string().optional()
})

/**
 * API request validation middleware
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      throw new ValidationError('Validation failed', errors)
    }
    throw error
  }
}

/**
 * Custom validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - use DOMPurify in production
  return html
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/<iframe.*?>.*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<[^>]*>/g, (tag) => {
      // Allow only safe tags
      const safeTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
      const tagName = tag.match(/<\/?(\w+)/)?.[1]?.toLowerCase()
      
      if (tagName && safeTags.includes(tagName)) {
        // Remove event handlers
        return tag.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      }
      
      return ''
    })
}

/**
 * Validate and sanitize query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  schema: z.ZodSchema
): any {
  const params: Record<string, any> = {}
  
  searchParams.forEach((value, key) => {
    // Try to parse numbers
    const numValue = Number(value)
    params[key] = isNaN(numValue) ? value : numValue
  })
  
  return schema.parse(params)
}

/**
 * Common query parameter schemas
 */
export const querySchemas = {
  pagination: z.object({
    page: z.number().min(1).optional().default(1),
    limit: z.number().min(1).max(100).optional().default(20),
    sort: z.enum(['asc', 'desc']).optional().default('desc'),
    sortBy: z.string().optional()
  }),
  
  dateRange: z.object({
    from: schemas.dateString.optional(),
    to: schemas.dateString.optional()
  }),
  
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    fields: z.array(z.string()).optional()
  })
}