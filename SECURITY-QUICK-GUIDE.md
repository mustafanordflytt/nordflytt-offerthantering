# ⚡ Nordflytt Security Quick Guide

## 🚨 TOP 5 Säkerhetsåtgärder (Gör dessa NU!)

### 1. Säkra ALLA POST/PUT/DELETE endpoints
```typescript
// ❌ OSÄKER
export async function POST(request: Request) {
  const data = await request.json()
  // Skapar/ändrar data utan auth eller validering
}

// ✅ SÄKER (copy-paste denna!)
import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/security/auth-middleware'
import { rateLimit, rateLimiters } from '@/lib/security/rate-limit'
import { validateRequest } from '@/lib/security/validation'
import { z } from 'zod'

// Define your schema
const mySchema = z.object({
  name: z.string().min(2).max(100),
  // add your fields...
})

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitRes = await rateLimit(request, rateLimiters.normal)
  if (rateLimitRes) return rateLimitRes
  
  // 2. Authentication
  try {
    await authenticate(request, { roles: ['admin', 'staff'] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 3. Validation
  try {
    const data = await validateRequest(request, mySchema)
    // Your safe business logic here
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
}
```

### 2. Sanitera ALL HTML output
```typescript
// ❌ OSÄKER
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ SÄKER
import DOMPurify from 'isomorphic-dompurify'

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### 3. Använd säker logger
```typescript
// ❌ OSÄKER - Kan läcka lösenord/tokens
console.log('User data:', userData)

// ✅ SÄKER - Auto-saniterar känslig data
import { logger } from '@/lib/logger'
logger.log('User data:', userData)
```

### 4. Validera ALLTID input
```typescript
// ❌ OSÄKER
const { email, phone } = await request.json()

// ✅ SÄKER
import { schemas } from '@/lib/security/validation'

const schema = z.object({
  email: schemas.email,
  phone: schemas.phone
})
const validated = await validateRequest(request, schema)
```

### 5. Checka auth i alla skyddade routes
```typescript
// I din route handler:
const user = await authenticate(request)
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## 🔥 Copy-Paste Templates

### Säker API Route (Full)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/security/auth-middleware'
import { rateLimit, rateLimiters } from '@/lib/security/rate-limit'
import { validateRequest, schemas } from '@/lib/security/validation'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const inputSchema = z.object({
  // Your fields here
  name: z.string().min(2),
  email: schemas.email,
  phone: schemas.phone
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rl = await rateLimit(request, rateLimiters.normal)
    if (rl) return rl
    
    // Auth
    const user = await authenticate(request)
    
    // Validate
    const data = await validateRequest(request, inputSchema)
    
    // Your logic
    logger.info('Creating resource:', { userId: user.id })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Säker Form Component
```tsx
import { useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

const formSchema = z.object({
  message: z.string().transform(val => DOMPurify.sanitize(val))
})

export function SecureForm() {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formData = new FormData(e.target)
      const validated = formSchema.parse({
        message: formData.get('message')
      })
      
      const res = await fetch('/api/secure-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated)
      })
      
      if (!res.ok) throw new Error()
      
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea name="message" required />
      <button disabled={loading}>Submit</button>
    </form>
  )
}
```

## 🚀 Snabbkommandon

```bash
# Hitta osäkra endpoints
grep -r "export async function POST\|PUT\|DELETE" app/api --include="*.ts" | grep -v "authenticate\|requireAuth"

# Hitta console.logs
grep -r "console.log" app components lib --include="*.ts" --include="*.tsx" | grep -v node_modules

# Hitta dangerouslySetInnerHTML
grep -r "dangerouslySetInnerHTML" app components --include="*.tsx"

# Kör säkerhetsaudit
node security-audit-script.cjs
```

## ⚠️ ALDRIG gör detta

1. **ALDRIG** hårdkoda API-nycklar/lösenord
2. **ALDRIG** lita på client-side validering enbart
3. **ALDRIG** exponera interna fel till användare
4. **ALDRIG** skippa rate limiting på mutations
5. **ALDRIG** rendera user content utan sanitering

## 📞 Hjälp

- Osäker? Fråga innan du implementerar
- Hittat en sårbarhet? Rapportera direkt
- Behöver exempel? Kolla `/lib/security/secure-api-example.ts`

---

**Remember**: Säkerhet är inte optional - det är obligatoriskt! 🔒