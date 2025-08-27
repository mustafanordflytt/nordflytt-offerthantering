# 🚀 Nordflytt CRM - Supabase Setup Guide

## ⚡ Snabbstart (5 minuter)

### 1. Skapa Supabase-projekt
1. Gå till [supabase.com](https://supabase.com)
2. Skapa nytt projekt
3. Välj region: Stockholm (eu-north-1) 
4. Spara databas-lösenordet säkert!

### 2. Kör databasschemat
1. Gå till SQL Editor i Supabase Dashboard
2. Kopiera innehållet från `/database/schema.sql`
3. Kör hela scriptet
4. Verifiera att alla tabeller skapades

### 3. Konfigurera miljövariabler
Skapa/uppdatera `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Existing vars
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyChAUwFV4q2SQUbHjjw_QIK1I5I3mee8b0
SENDGRID_API_KEY=your_sendgrid_key_here
```

### 4. Testa anslutningen
```bash
# Starta om Next.js
npm run dev

# Testa API:erna
curl http://localhost:3000/api/customers
curl http://localhost:3000/api/leads
curl http://localhost:3000/api/jobs
```

## 📊 Verifiera att allt fungerar

### Test 1: Skapa kund via API
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Kund",
    "email": "test@example.com",
    "phone": "070-123-4567"
  }'
```

### Test 2: Skapa offertförfrågan (simulera formulär)
```bash
curl -X POST http://localhost:3000/api/quote-requests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Anna Andersson",
    "email": "anna@test.se",
    "phone": "070-555-1234",
    "moveFromAddress": "Drottninggatan 50, Stockholm",
    "moveToAddress": "Kungsgatan 10, Göteborg",
    "moveDate": "2025-08-01",
    "apartmentSize": "3 rum",
    "additionalInfo": "Piano på 2:a våningen"
  }'
```

### Test 3: Kolla Dashboard
Gå till: http://localhost:3000/crm/dashboard
- Ska visa riktiga siffror från databasen
- Om inga kunder finns, visas mock-data

## 🔍 Felsökning

### Problem: "Failed to fetch customers"
**Lösning**: Kontrollera att Supabase-nycklarna är korrekt satta i `.env.local`

### Problem: "relation does not exist"  
**Lösning**: Kör databasschemat igen i SQL Editor

### Problem: Dashboard visar bara mock-data
**Lösning**: Normal om databasen är tom. Skapa några kunder/jobb först.

## ✅ Nästa steg

1. **Skapa testdata**:
   - Lägg till några kunder via CRM
   - Skapa leads och konvertera till jobb
   - Tilldela jobb till personal

2. **Aktivera Row Level Security (RLS)**:
   ```sql
   -- Exempel för customers-tabellen
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   
   -- Tillåt alla att läsa (för demo)
   CREATE POLICY "Allow read access" ON customers
     FOR SELECT USING (true);
   ```

3. **Sätt upp realtidsuppdateringar**:
   ```javascript
   // I frontend-komponenter
   import { supabaseClient } from '@/lib/supabase'
   
   useEffect(() => {
     const subscription = supabaseClient
       .from('jobs')
       .on('*', payload => {
         console.log('Change received!', payload)
         // Uppdatera UI
       })
       .subscribe()
     
     return () => subscription.unsubscribe()
   }, [])
   ```

## 🚀 Produktionsdriftsättning

1. **Säkerhet**:
   - Aktivera RLS på alla tabeller
   - Implementera autentisering
   - Begränsa API-åtkomst

2. **Prestanda**:
   - Skapa index för vanliga queries
   - Aktivera connection pooling
   - Sätt upp caching

3. **Backup**:
   - Aktivera Point-in-time recovery
   - Schemalägg dagliga backups
   - Testa restore-procedurer

## 📞 Support

- **Supabase Discord**: discord.supabase.com
- **Dokumentation**: supabase.com/docs
- **Status**: status.supabase.com

---

**OBS**: Spara alltid dina databas-credentials säkert och dela dem ALDRIG i kod!