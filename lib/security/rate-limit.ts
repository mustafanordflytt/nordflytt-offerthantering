import { LRUCache } from 'lru-cache'

export interface RateLimitOptions {
  interval: number // Time window in seconds
  maxRequests: number // Max requests per interval
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new LRUCache<string, number[]>({
  max: 10000, // Store up to 10k unique IPs
  ttl: 1000 * 60 * 60 // 1 hour TTL
})

/**
 * Simple rate limiter
 */
export class RateLimiter {
  private options: RateLimitOptions

  constructor(options: RateLimitOptions) {
    this.options = options
  }

  async check(identifier: string): Promise<boolean> {
    const now = Date.now()
    const windowStart = now - (this.options.interval * 1000)
    
    // Get existing requests
    const requests = rateLimitStore.get(identifier) || []
    
    // Filter out old requests
    const recentRequests = requests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (recentRequests.length >= this.options.maxRequests) {
      return false
    }
    
    // Add current request
    recentRequests.push(now)
    rateLimitStore.set(identifier, recentRequests)
    
    return true
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now()
    const windowStart = now - (this.options.interval * 1000)
    const requests = rateLimitStore.get(identifier) || []
    const recentRequests = requests.filter(timestamp => timestamp > windowStart)
    
    return Math.max(0, this.options.maxRequests - recentRequests.length)
  }

  getResetTime(identifier: string): number {
    const requests = rateLimitStore.get(identifier) || []
    if (requests.length === 0) return 0
    
    const oldestRequest = Math.min(...requests)
    return oldestRequest + (this.options.interval * 1000)
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Strict: 10 requests per minute
  strict: new RateLimiter({ interval: 60, maxRequests: 10 }),
  
  // Normal: 60 requests per minute
  normal: new RateLimiter({ interval: 60, maxRequests: 60 }),
  
  // Relaxed: 300 requests per minute
  relaxed: new RateLimiter({ interval: 60, maxRequests: 300 }),
  
  // Auth endpoints: 5 attempts per 15 minutes
  auth: new RateLimiter({ interval: 900, maxRequests: 5 }),
  
  // API endpoints: 100 requests per minute
  api: new RateLimiter({ interval: 60, maxRequests: 100 })
}

/**
 * Express-style rate limit middleware for Next.js
 */
export async function rateLimit(
  request: Request,
  limiter: RateLimiter = rateLimiters.normal
): Promise<Response | null> {
  // Get identifier (IP address)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  
  // Check rate limit
  const allowed = await limiter.check(ip)
  
  if (!allowed) {
    const remaining = limiter.getRemainingRequests(ip)
    const resetTime = limiter.getResetTime(ip)
    
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limiter.options.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
      }
    })
  }
  
  return null
}

/**
 * Helper to apply rate limiting to API route
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiter?: RateLimiter
) {
  return async (request: Request): Promise<Response> => {
    const rateLimitResponse = await rateLimit(request, limiter)
    if (rateLimitResponse) return rateLimitResponse
    
    return handler(request)
  }
}