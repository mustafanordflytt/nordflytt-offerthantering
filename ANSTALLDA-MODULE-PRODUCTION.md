# Anställda-modulen - Produktionsguide

## 🚀 Översikt
Anställda-modulen är nu produktionsklar med fullständig databas-integration, e-postfunktionalitet, filhantering och säkerhet.

## ✅ Vad som implementerats

### 1. **Databas (Supabase)**
- ✅ Kompletta tabeller för anställda, kontrakt, tillgångar, onboarding
- ✅ Row Level Security (RLS) policies
- ✅ Automatiska triggers för updated_at
- ✅ Indexering för prestanda

### 2. **API Endpoints**
- ✅ `/api/employees` - Lista och skapa anställda
- ✅ `/api/employees/[id]` - Hämta, uppdatera, ta bort specifik anställd
- ✅ `/api/employees/[id]/contracts` - Hantera kontrakt
- ✅ `/api/employees/[id]/assets` - Hantera tillgångar
- ✅ `/api/employees/[id]/onboarding` - Onboarding-steg

### 3. **Funktioner**
- ✅ Skapa ny anställd med automatisk ID-generering
- ✅ Generera PDF-kontrakt
- ✅ Skicka kontrakt via e-post
- ✅ Ladda upp och lagra dokument
- ✅ Hantera tillgångar med kvitton
- ✅ Onboarding-checklista
- ✅ Fordonsåtkomst med unika koder
- ✅ Tidsrapportering

### 4. **Säkerhet**
- ✅ Autentisering krävs för alla API-anrop
- ✅ Input-validering
- ✅ Felhantering
- ✅ Säker filuppladdning

## 📋 Installation

### 1. Konfigurera Supabase
```bash
# Kör migreringar
supabase migration up
```

### 2. Sätt miljövariabler
Kopiera `.env.production.example` till `.env.local` och fyll i:
```env
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
SUPABASE_SERVICE_ROLE_KEY=din-service-key
RESEND_API_KEY=din-resend-key
```

### 3. Installera paket
```bash
npm install @supabase/supabase-js resend jspdf
```

### 4. Konfigurera Supabase Storage
Skapa följande buckets i Supabase:
- `employee-documents` - För kontrakt och kvitton
- `employee-photos` - För profilbilder

## 🔧 Användning

### Skapa anställd
```typescript
const response = await fetch('/api/employees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Anna Andersson',
    email: 'anna@nordflytt.se',
    phone: '+46701234567',
    role: 'mover',
    department: 'Operations'
  })
})
```

### Generera och skicka kontrakt
```typescript
// 1. Generera kontrakt
const contractResponse = await fetch(`/api/employees/${staffId}/contracts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractType: 'permanent',
    salary: 28000,
    workingHours: 40,
    vacationDays: 25
  })
})

// 2. Skicka kontrakt
const sendResponse = await fetch(`/api/employees/${staffId}/contracts`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractId: contract.id,
    action: 'send'
  })
})
```

## 🔐 Säkerhet

### Autentisering
Alla API-anrop kräver giltig CRM-session:
```typescript
// API validerar automatiskt
const authResult = await validateCRMAuth(request)
if (!authResult.isValid) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Behörigheter
- Endast admin/HR kan skapa/redigera anställda
- Anställda kan se sin egen profil
- Känsliga operationer loggas

## 📊 Övervakning

### Sentry (om konfigurerat)
```typescript
Sentry.captureException(error, {
  tags: {
    module: 'employees',
    action: 'create'
  }
})
```

### Loggar
Alla viktiga händelser loggas:
- Anställd skapad/uppdaterad
- Kontrakt skickat/signerat
- Tillgångar utdelade/återlämnade

## 🚨 Vanliga problem

### "Failed to fetch employees"
- Kontrollera Supabase-anslutning
- Verifiera API-nycklar
- Kolla RLS policies

### "Failed to send email"
- Verifiera Resend API-nyckel
- Kontrollera e-postadresser
- Se Resend dashboard för fel

### "Failed to upload file"  
- Kontrollera Storage-buckets
- Verifiera filstorlek (max 50MB)
- Kolla CORS-inställningar

## 📚 API-dokumentation

Se `/docs/api/employees.md` för fullständig API-dokumentation.

## 🔄 Nästa steg

1. **BankID-integration** för digital signering
2. **Automatiska påminnelser** för osignerade kontrakt
3. **Bulk-import** av anställda
4. **Avancerad rapportering**
5. **Mobile app** för anställda

---

**Senast uppdaterad**: 2024-01-08
**Version**: 1.0.0
**Status**: Produktionsklar ✅