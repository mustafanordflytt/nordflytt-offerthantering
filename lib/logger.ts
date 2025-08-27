/**
 * Safe logger that strips sensitive data in production
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

// Patterns for sensitive data
const sensitivePatterns = [
  /password[\s]*[:=]\s*['"]?[^'"\s]+/gi,
  /token[\s]*[:=]\s*['"]?[^'"\s]+/gi,
  /api[_-]?key[\s]*[:=]\s*['"]?[^'"\s]+/gi,
  /secret[\s]*[:=]\s*['"]?[^'"\s]+/gi,
  /authorization[\s]*[:=]\s*['"]?bearer\s+[^'"\s]+/gi,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
  /(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])-?\d{4}/g, // Swedish personal number
]

/**
 * Sanitize sensitive data from strings
 */
function sanitize(data: any): any {
  if (typeof data === 'string') {
    let sanitized = data
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })
    return sanitized
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitize)
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      // Redact sensitive keys
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('auth')
      ) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitize(value)
      }
    }
    return sanitized
  }
  
  return data
}

/**
 * Safe console.log replacement
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment || isTest) {
      console.log(...args.map(sanitize))
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, but sanitize in production
    if (isDevelopment || isTest) {
      console.error(...args)
    } else {
      console.error(...args.map(sanitize))
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment || isTest) {
      console.warn(...args.map(sanitize))
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment || isTest) {
      console.info(...args.map(sanitize))
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
  
  // Production-safe logger that always sanitizes
  prod: {
    log: (...args: any[]) => console.log(...args.map(sanitize)),
    error: (...args: any[]) => console.error(...args.map(sanitize)),
    warn: (...args: any[]) => console.warn(...args.map(sanitize)),
    info: (...args: any[]) => console.info(...args.map(sanitize))
  }
}

// Override global console in production
if (!isDevelopment && !isTest) {
  global.console.log = logger.log
  global.console.warn = logger.warn
  global.console.info = logger.info
  // Keep error and debug as-is for debugging
}