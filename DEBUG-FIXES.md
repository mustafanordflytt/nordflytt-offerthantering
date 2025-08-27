# 🔧 Debug Guide - Fas 1 Problem

## Problem 1: Tiden visar alltid 0 minuter

### Felsökning:
1. Öppna webbläsarens konsol (F12)
2. Starta ett jobb med "Starta tid"
3. Kolla efter: `Updating time for job: xxx {hours: 0, minutes: 0, isActive: true}`

### Möjliga orsaker:
- `getCurrentWorkTime` returnerar fel värde
- Time entry sparas inte korrekt i localStorage
- Component re-renderas inte

### Fix jag implementerade:
- Added console.log för debugging
- Force update när man startar tid
- Uppdaterar var 10:e sekund

## Problem 2: Bilder laddas inte upp till Supabase

### Felsökning:
1. Kolla om du har konfigurerat `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key
```

2. Kör den uppdaterade SQL-migrationen för public access:
```sql
-- Kör: supabase/migrations/20250116_update_photo_policies.sql
```

3. Kolla konsolen för:
- "⚠️ Supabase not configured" - betyder env vars saknas
- "Uploading photo for job: xxx" - visar rätt job ID
- Eventuella CORS eller permission errors

### Fix jag implementerade:
- Check om Supabase är konfigurerat
- Public policies för demo
- Bättre job ID hämtning från localStorage
- Fallback om Supabase inte finns

## Problem 3: Mobil kategori-scrolling fungerar inte

### Felsökning:
1. På mobil, öppna "Lägg till tjänster"
2. Försök swipa horisontellt på kategori-tabbar
3. Om det inte fungerar, kolla om något element överlappar

### Fix jag implementerade:
- Added `overflow-x: auto !important`
- Z-index fix för att undvika överlappning
- Explicit width för scroll container

## Snabb Test-Guide:

### 1. Testa tidsvisning:
```javascript
// Kör i konsolen:
localStorage.getItem('time_entries')
// Ska visa aktiva time entries

// Force update:
location.reload()
```

### 2. Testa bilduppladdning:
```javascript
// Kolla om Supabase är konfigurerat:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// Om undefined, lägg till i .env.local

// Kolla sparade bilder lokalt:
JSON.parse(localStorage.getItem('staff_photos') || '[]')
```

### 3. Testa mobil scrolling:
- Använd Chrome DevTools mobil-vy
- Eller testa på riktig mobil
- Swipa horisontellt på kategori-tabs

## Om inget fungerar:

1. **Rensa all data:**
```javascript
localStorage.clear()
location.reload()
```

2. **Starta om Next.js:**
```bash
npm run dev
```

3. **Kolla för fel:**
- Browser console
- Network tab för 4xx/5xx errors
- Next.js terminal output