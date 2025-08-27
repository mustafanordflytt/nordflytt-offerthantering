# 🔧 Kör den fixade migreringen

## Steg 1: Öppna Supabase SQL Editor

1. Gå till din Supabase Dashboard
2. Klicka på "SQL Editor" i sidomenyn

## Steg 2: Kör migreringen

Kopiera och klistra in innehållet från filen:
```
supabase/migrations/20240108_employees_module_fixed.sql
```

Den fixade versionen:
- ✅ Tar bort alla referenser till `jobs` tabellen
- ✅ Tar bort alla referenser till `auth.users`
- ✅ Använder IF NOT EXISTS för att undvika dubbletter
- ✅ Tillåter alla operationer tillfälligt (kan justeras senare)

## Steg 3: Testa att det fungerar

När migreringen är klar, testa att skapa en anställd igen på:
http://localhost:3000/crm/anstallda

## 🎯 Vad som är fixat:

1. **Borttagna foreign keys:**
   - `created_by UUID REFERENCES auth.users(id)` → `created_by UUID`
   - `job_id UUID REFERENCES jobs(id)` → `job_id UUID`

2. **Förenklade RLS policies:**
   - Tillåter alla operationer för utveckling
   - Kan säkras senare när auth är på plats

3. **IF NOT EXISTS överallt:**
   - Förhindrar "already exists" fel
   - Gör migreringen idempotent

## ⚠️ OBS!

För produktion behöver du senare:
1. Skapa auth.users tabellen (om du använder Supabase Auth)
2. Lägga till riktiga RLS policies
3. Eventuellt skapa jobs tabellen om den behövs