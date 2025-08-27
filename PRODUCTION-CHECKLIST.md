# 🚀 Produktions-checklista för Anställda-modulen

## ✅ Miljövariabler (KLAR)
Följande miljövariabler används från `.env.development.local`:

### Databas (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase projekt-URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Publik nyckel för klient
- `SUPABASE_URL` - Samma som ovan för server
- `SUPABASE_SERVICE_ROLE_KEY` - Admin-nyckel för server

### Email (SendGrid)
- `SENDGRID_API_KEY` - SendGrid API-nyckel
- `SENDGRID_FROM_EMAIL` - Avsändaradress (hej@nordflytt.se)

### Autentisering
- `JWT_SECRET` - För JWT-token signering
- `ENABLE_DEMO_AUTH` - Sätt till "false" i produktion

## ⚠️ Kritiska produktionsåtgärder

### 1. **Migrera från JSON till Supabase** 🔴
**Status**: EJ KLAR
```sql
-- Kör dessa SQL-kommandon i Supabase:
-- Se /supabase/migrations/20250106_create_employee_schemas.sql
```

### 2. **Autentisering** ✅
**Status**: KLAR (aktiveras när ENABLE_DEMO_AUTH=false)
- Autentisering är nu aktiverad på alla API-endpoints
- Använder JWT-tokens för säkerhet

### 3. **Säker fillagring** 🔴
**Status**: EJ KLAR
- PDF:er sparas fortfarande i `/public/`
- Måste flyttas till Supabase Storage

### 4. **Ta bort testdata** 🔴
**Status**: EJ KLAR
```bash
# Lägg till i .gitignore:
/data/contracts.json
/data/asset-documents.json
/public/generated-documents/
/public/contracts/
```

### 5. **URL-konfiguration** 🟡
**Status**: DELVIS KLAR
```bash
# I produktion, sätt:
NEXT_PUBLIC_BASE_URL=https://din-domän.se
NEXTAUTH_URL=https://din-domän.se
```

## 📋 Deployment-steg

### Steg 1: Förbered miljövariabler
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
SUPABASE_URL=din-supabase-url
SUPABASE_SERVICE_ROLE_KEY=din-service-key
SENDGRID_API_KEY=din-sendgrid-key
SENDGRID_FROM_EMAIL=hej@nordflytt.se
JWT_SECRET=generera-säker-nyckel
ENABLE_DEMO_AUTH=false
```

### Steg 2: Kör databas-migrationer
```bash
# I Supabase SQL Editor:
# Kör innehållet från /supabase/migrations/
```

### Steg 3: Migrera befintlig data
```javascript
// Kör detta skript för att migrera från JSON till Supabase:
node scripts/migrate-to-supabase.js
```

### Steg 4: Deploy
```bash
# Vercel/Netlify
vercel --prod

# Eller med Docker
docker build -t nordflytt-crm .
docker run -p 3000:3000 nordflytt-crm
```

## 🔒 Säkerhetskontroller

- [x] Autentisering aktiverad på alla endpoints
- [x] Miljövariabler används (inga hårdkodade värden)
- [x] JWT-tokens för säker autentisering
- [ ] Rate limiting implementerat
- [ ] CORS konfigurerat
- [ ] SSL/HTTPS aktiverat
- [ ] Security headers konfigurerade
- [ ] Sentry för error tracking

## 📊 Övervakning

Konfigurera följande för produktion:
- Sentry för error tracking
- Google Analytics för användningsstatistik
- Supabase Dashboard för databas-övervakning
- SendGrid Dashboard för email-statistik

## ✅ Vad som fungerar utan ändringar

1. **UI/UX flödet** - Alla komponenter fungerar
2. **PDF-generering** - Skapar korrekta dokument
3. **Email-funktionalitet** - SendGrid konfigurerat
4. **Statushantering** - Polling och uppdateringar
5. **Toast-notifikationer** - Användbar feedback

## 🚨 Varning

**VIKTIGT**: Kör ALDRIG produktion med:
- `ENABLE_DEMO_AUTH=true`
- Data i JSON-filer
- PDF:er i `/public/` mappen

---

**Senast uppdaterad**: 2025-01-25
**Status**: Redo för produktions-förberedelser