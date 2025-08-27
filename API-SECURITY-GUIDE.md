# 🔒 API Security Implementation Guide

## Overview
This guide documents the security implementation for all API endpoints in the Nordflytt booking system.

## Security Features Implemented

### 1. Authentication & Authorization
- **Multiple auth levels**: PUBLIC, AUTHENTICATED, ADMIN, INTERNAL
- **Session-based auth** for user endpoints
- **API key auth** for partner/internal access
- **Bearer token support** for mobile apps

### 2. Rate Limiting
- **60 requests per minute** per IP address
- Configurable per endpoint if needed
- Uses in-memory store (upgrade to Redis in production)

### 3. Input Validation
- **Schema-based validation** for all inputs
- Type checking, pattern matching, enum validation
- Min/max length enforcement
- Custom validation functions

### 4. Data Sanitization
- **XSS prevention** with HTML entity encoding
- **SQL injection prevention** (though using Supabase ORM)
- Personal data hashing (personal numbers)

### 5. Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: restrictive

### 6. Audit Logging
- All API access logged with timestamp, IP, user
- Success and failure logging
- Ready for integration with logging services

## Usage Examples

### Public Endpoint (with rate limiting)
```typescript
export async function POST(request: NextRequest) {
  // Authenticate - public but rate limited
  const auth = await authenticateAPI(request, AuthLevel.PUBLIC)
  if (!auth.authorized) {
    return auth.response!
  }
  
  // Your endpoint logic...
}
```

### Authenticated Endpoint
```typescript
export async function POST(request: NextRequest) {
  // Requires valid session token
  const auth = await authenticateAPI(request, AuthLevel.AUTHENTICATED)
  if (!auth.authorized) {
    return auth.response!
  }
  
  // Access user info
  const userId = auth.session?.userId
  
  // Your endpoint logic...
}
```

### Admin Endpoint
```typescript
export async function POST(request: NextRequest) {
  // Requires admin role
  const auth = await authenticateAPI(request, AuthLevel.ADMIN)
  if (!auth.authorized) {
    return auth.response!
  }
  
  // Your admin logic...
}
```

### Internal/Partner API
```typescript
export async function POST(request: NextRequest) {
  // Requires valid API key in x-api-key header
  const auth = await authenticateAPI(request, AuthLevel.INTERNAL)
  if (!auth.authorized) {
    return auth.response!
  }
  
  // Your internal API logic...
}
```

## Input Validation

### Define Schema
```typescript
const bookingSchema = {
  email: {
    type: 'string' as const,
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: 'string' as const,
    required: true,
    pattern: /^[\d\s\-\+\(\)]+$/
  },
  moveDate: {
    type: 'string' as const,
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/
  },
  serviceType: {
    type: 'string' as const,
    required: true,
    enum: ['moving', 'cleaning', 'storage']
  }
}
```

### Validate Input
```typescript
const validation = validateInput(data, bookingSchema)
if (!validation.valid) {
  return apiError(`Invalid input: ${validation.errors.join(', ')}`, 400)
}
```

## Response Handling

### Success Response
```typescript
return apiResponse({
  success: true,
  data: result
})
```

### Error Response
```typescript
return apiError('Error message', 400, 'ERROR_CODE')
```

## Environment Variables

### Generate API Keys
```bash
# Generate secure API keys
openssl rand -hex 32
```

### Required Variables
```env
# API Security
INTERNAL_API_KEY=<32-byte hex key>
PARTNER_API_KEY=<32-byte hex key>
MOBILE_APP_KEY=<32-byte hex key>
PERSONAL_NUMBER_SALT=<random salt>
```

## Testing

### Test Rate Limiting
```bash
# Should fail after 60 requests
for i in {1..70}; do
  curl -X POST http://localhost:3000/api/submit-booking \
    -H "Content-Type: application/json" \
    -d '{"test": true}'
done
```

### Test Authentication
```bash
# Test with API key
curl -X POST http://localhost:3000/api/internal/endpoint \
  -H "x-api-key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json"
  
# Test with Bearer token
curl -X POST http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

## Security Checklist

### Before Deployment
- [ ] All API keys in environment variables
- [ ] No hardcoded credentials
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose internals
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Security headers set

### Monitoring
- [ ] API access logs configured
- [ ] Rate limit violations monitored
- [ ] Failed auth attempts tracked
- [ ] Error rates monitored

## Next Steps

1. **Implement Redis** for distributed rate limiting
2. **Add JWT tokens** for better session management
3. **Implement API versioning**
4. **Add request signing** for high-security endpoints
5. **Set up WAF rules** in production

## Emergency Procedures

### If API Key Compromised
1. Immediately rotate the key in environment
2. Update all services using the key
3. Review access logs for unauthorized use
4. Implement IP allowlisting if needed

### If Rate Limits Hit
1. Check for legitimate high traffic
2. Identify potential attack sources
3. Temporarily block offending IPs
4. Scale rate limits if legitimate

---

**Last Updated**: 2025-01-16
**Version**: 1.0.0