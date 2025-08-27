# 🚀 Backend Implementation Roadmap

## 📋 Prioriterad Implementation

### 🔴 Fas 1: Kritiska API:er (Dag 1-3)

#### 1. Autentisering (`/api/auth/*`)
```typescript
// /api/auth/otp/generate/route.ts
- POST: Generera OTP för telefonnummer
- Validering med Zod
- Rate limiting: 5 försök/15 min
- SMS via Twilio

// /api/auth/otp/verify/route.ts  
- POST: Verifiera OTP-kod
- JWT-generering vid lyckad verifiering
- Session management

// /api/auth/crm-login/route.ts
- POST: CRM-inloggning (redan implementerad)
- Behöver kopplas till Supabase
```

#### 2. Bokningar (`/api/bookings/*`)
```typescript
// /api/submit-booking/route.ts
- POST: Skapa ny bokning
- Validering av alla steg
- Prisberäkning
- Lead/Job creation
- Email/SMS bekräftelse

// /api/bookings/[id]/route.ts
- GET: Hämta bokningsdetaljer
- PUT: Uppdatera bokning
```

#### 3. Staff Jobs (`/api/staff/jobs/*`)
```typescript
// /api/staff/jobs/route.ts
- GET: Lista jobb för inloggad personal
- Filtrering på status/datum

// /api/staff/jobs/[id]/route.ts
- GET: Jobdetaljer
- PUT: Uppdatera jobbstatus
- POST: Lägg till tjänster
```

### 🟡 Fas 2: Core Funktionalitet (Dag 4-7)

#### 4. Offers (`/api/offers/*`)
```typescript
// /api/offers/[id]/route.ts
- GET: Hämta offertdetaljer
- PUT: Acceptera/avböja offert

// /api/offers/[id]/payment/route.ts
- POST: Process Swish-betalning
```

#### 5. Kunder (`/api/customers/*`)
```typescript
// /api/customers/route.ts
- GET: Lista kunder (med auth)
- POST: Skapa ny kund
- Kreditsäfer-integration

// /api/customers/[id]/route.ts
- GET: Kunddetaljer
- PUT: Uppdatera kund
```

#### 6. Uppladdning (`/api/upload/*`)
```typescript
// /api/staff/photo-upload/route.ts
- POST: Ladda upp foton
- Supabase Storage integration
- Metadata hantering
```

### 🟢 Fas 3: AI & Automation (Dag 8-10)

#### 7. AI Tjänster (`/api/ai/*`)
```typescript
// /api/ai/chat/route.ts
- POST: Chatbot-svar
- OpenAI GPT integration
- Context management

// /api/ai/lead-scoring/route.ts
- POST: Poängsätt leads
- ML-modell integration
```

#### 8. Notifikationer (`/api/notifications/*`)
```typescript
// /api/notifications/sms/route.ts
- POST: Skicka SMS via Twilio

// /api/notifications/email/route.ts
- POST: Skicka email via SendGrid
```

## 🛠️ Implementation Checklista

### För varje API endpoint:

- [ ] Skapa route handler i App Router
- [ ] Implementera Zod-validering
- [ ] Lägg till auth middleware (där behövs)
- [ ] Lägg till rate limiting
- [ ] Koppla till Supabase
- [ ] Implementera error handling
- [ ] Lägg till logging
- [ ] Skapa unit tests
- [ ] Dokumentera i OpenAPI

## 📝 Exempel Implementation

```typescript
// /app/api/bookings/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { authenticate } from '@/lib/security/auth-middleware'
import { rateLimiters } from '@/lib/security/rate-limit'
import { supabase } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

const bookingSchema = z.object({
  customerType: z.enum(['private', 'company']),
  contactInfo: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^\+46\d{9}$/)
  }),
  moveDetails: z.object({
    fromAddress: z.string(),
    toAddress: z.string(),
    moveDate: z.string().datetime(),
    volume: z.number().positive()
  }),
  services: z.array(z.string()),
  additionalServices: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiters.normal.check(request)
    if (!rateLimitResult.allowed) {
      return new Response('Too many requests', { status: 429 })
    }

    // Parse and validate
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        ...validatedData,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Create lead
    await supabase.from('leads').insert({
      booking_id: booking.id,
      customer_name: validatedData.contactInfo.name,
      email: validatedData.contactInfo.email,
      phone: validatedData.contactInfo.phone,
      status: 'new'
    })

    // Send notifications
    await fetch('/api/notifications/email', {
      method: 'POST',
      body: JSON.stringify({
        to: validatedData.contactInfo.email,
        template: 'booking_confirmation',
        data: booking
      })
    })

    logger.info('Booking created', { bookingId: booking.id })

    return Response.json({ 
      success: true, 
      bookingId: booking.id,
      message: 'Bokning skapad framgångsrikt'
    })

  } catch (error) {
    logger.error('Booking creation failed', error)
    
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
```

## 🔍 Verifiering

Efter varje fas, kör TestSprite igen:

```bash
npx @testsprite/cli generate-and-execute \
  --project-path . \
  --test-ids TC001,TC006,TC003
```

## 📊 Förväntade Resultat

### Efter Fas 1:
- 3/10 tester bör passera (booking, auth, confirmation)

### Efter Fas 2:  
- 7/10 tester bör passera (+ offers, photos, customers)

### Efter Fas 3:
- 10/10 tester bör passera (+ AI, automation, security)

---

**Nästa steg**: Börja med Fas 1 implementation av autentisering och boknings-API:er.