# 🔒 Nordflytt Security Implementation Guide

## 🚀 Quick Security Fixes (Gör detta NU!)

### 1. Säkra alla API-endpoints

**Gamla osäkra endpoint:**
```typescript
// ❌ OSÄKER
export async function POST(request: Request) {
  const data = await request.json()
  // Ingen auth, ingen validering, ingen rate limiting!
  return Response.json({ success: true })
}
```

**Nya säkra endpoint:**
```typescript
// ✅ SÄKER
import { secureApiRoute } from '@/lib/security/secure-api-example'
import { validateRequest, bookingSchema } from '@/lib/security/validation'

export const POST = secureApiRoute(
  async (request) => {
    const data = await validateRequest(request, bookingSchema)
    // Din business logic här
    return Response.json({ success: true })
  },
  {
    auth: true,          // Kräv autentisering
    roles: ['admin'],    // Endast admin
    rateLimit: 'normal'  // 60 req/min
  }
)
```

### 2. Ersätt console.log

**Gamla:**
```typescript
// ❌ Kan läcka känslig data
console.log('User data:', userData)
console.log('Token:', token)
```

**Nya:**
```typescript
// ✅ Säker logging
import { logger } from '@/lib/logger'

logger.log('User data:', userData)  // Automatisk sanitering
logger.error('Error:', error)       // Alltid loggad men saniterad
```

### 3. Validera all input

**Gamla:**
```typescript
// ❌ Ingen validering
const { email, phone } = await request.json()
```

**Nya:**
```typescript
// ✅ Med Zod-validering
import { validateRequest, bookingSchema } from '@/lib/security/validation'

const validatedData = await validateRequest(request, bookingSchema)
// Nu vet vi att data är säker och korrekt format
```

## 📋 Steg-för-steg implementation

### Steg 1: Uppdatera middleware.ts

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimiters, rateLimit } from '@/lib/security/rate-limit'

export async function middleware(request: NextRequest) {
  // Security headers
  const response = NextResponse.next()
  
  // CORS
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  )
  
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = await rateLimit(request, rateLimiters.api)
    if (rateLimitResponse) return rateLimitResponse
  }
  
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

### Steg 2: Skydda Staff App endpoints

```typescript
// app/api/staff/jobs/route.ts
import { secureApiRoute } from '@/lib/security/secure-api-example'
import { authenticate } from '@/lib/security/auth-middleware'

export const GET = secureApiRoute(
  async (request) => {
    // Hämta jobb för inloggad personal
    const jobs = await getJobsForStaff()
    return Response.json(jobs)
  },
  {
    auth: true,
    roles: ['staff', 'admin']
  }
)
```

### Steg 3: Säkra formulär mot XSS

```tsx
// components/form/ContactForm.tsx
import { sanitizeHtml } from '@/lib/security/validation'

function ContactForm() {
  const handleSubmit = async (data: FormData) => {
    // Sanitera användarinput
    const message = sanitizeHtml(data.message)
    
    // Skicka till API
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        message // Saniterad
      })
    })
  }
}
```

## 🛡️ Security Checklist

### För varje ny API-endpoint:
- [ ] Lägg till autentisering (`requireAuth`)
- [ ] Lägg till rate limiting (`rateLimit`)
- [ ] Validera input med Zod schema
- [ ] Sanitera output data
- [ ] Använd `logger` istället för `console.log`

### För varje formulär:
- [ ] Validera på klient-sidan
- [ ] Validera igen på server-sidan
- [ ] Sanitera all HTML-input
- [ ] Använd CSRF-skydd

### För varje databas-query:
- [ ] Använd parameteriserade queries (Supabase gör detta)
- [ ] Validera input innan query
- [ ] Begränsa resultat med `limit`

## 🚨 Vanliga säkerhetsproblem och lösningar

### Problem 1: Exponerade API-nycklar
```typescript
// ❌ FEL
const API_KEY = "sk_live_abcd1234"

// ✅ RÄTT
const API_KEY = process.env.API_KEY
```

### Problem 2: Osäkra redirects
```typescript
// ❌ FEL - Open redirect vulnerability
const redirectUrl = request.query.redirect
return redirect(redirectUrl)

// ✅ RÄTT - Whitelist tillåtna URLs
const ALLOWED_REDIRECTS = ['/dashboard', '/profile']
const redirectUrl = request.query.redirect
if (ALLOWED_REDIRECTS.includes(redirectUrl)) {
  return redirect(redirectUrl)
}
```

### Problem 3: SQL Injection (även med ORMs)
```typescript
// ❌ FEL
const users = await db.raw(`SELECT * FROM users WHERE name = '${userName}'`)

// ✅ RÄTT
const users = await db
  .from('users')
  .where('name', userName)
  .select()
```

## 📚 Resurser

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🔑 Environment Variables

Skapa `.env.local`:
```env
# Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# API Keys (aldrig committa!)
SUPABASE_SERVICE_ROLE_KEY=<from-supabase>
SENDGRID_API_KEY=<from-sendgrid>
TWILIO_AUTH_TOKEN=<from-twilio>

# Public (OK att exponera)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## ⚡ Snabbkommandon

```bash
# Generera säker secret
openssl rand -base64 32

# Kör säkerhetsaudit
node security-audit-script.cjs

# Kontrollera dependencies
npm audit

# Fixa kända sårbarheter
npm audit fix
```

---

**Kom ihåg**: Säkerhet är inte en engångsåtgärd utan en kontinuerlig process! 🔒