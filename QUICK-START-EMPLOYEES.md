# 🚀 Snabbstart - Anställda Modulen

## Steg 1: Kör Supabase-migrering

```bash
# Alternativ 1: Använd deployment script
node scripts/deploy-employees-module.js

# Alternativ 2: Kör SQL direkt i Supabase Dashboard
# 1. Gå till din Supabase Dashboard
# 2. Gå till SQL Editor
# 3. Klistra in innehållet från: supabase/migrations/20240108_employees_module.sql
# 4. Kör
```

## Steg 2: Testa att det fungerar

```bash
# Starta utvecklingsservern
npm run dev

# I en annan terminal, kör test
node test-employees-module.js
```

## Steg 3: Öppna i webbläsaren

1. Gå till: http://localhost:3000/crm/anstallda
2. Klicka på "Ny Anställd" för att skapa en anställd
3. Klicka på en anställd för att se profilen
4. Testa alla flikar (Avtal, Tillgångar, Onboarding, etc.)

## 🎯 Vad fungerar nu?

### ✅ Med Supabase (Produktion)
- Anställda sparas i databas
- Kontrakt genereras som PDF
- Dokument lagras säkert
- E-post kan skickas (om Resend konfigurerat)

### ✅ Utan extra konfiguration (Demo)
- Alla UI-funktioner fungerar
- PDF-generering fungerar lokalt
- Mock-data för testning

## ⚡ Vanliga problem

### "Failed to fetch employees"
```bash
# Kontrollera att Supabase-tabeller är skapade
# Kör migreringen igen om behövs
```

### "Unauthorized" fel
```bash
# För demo/test, kan du tillfälligt kommentera bort auth-check i API:
# // const authResult = await validateCRMAuth(request)
# // if (!authResult.isValid) { ... }
```

### E-post fungerar inte
```bash
# E-post kräver Resend API-nyckel
# För test, hoppa över e-postutskick
```

## 📝 Nästa steg

1. **För produktion**: Konfigurera Resend för e-post
2. **För säkerhet**: Aktivera autentisering
3. **För prestanda**: Lägg till caching

---

**Tips**: Modulen fungerar även utan full konfiguration - perfekt för demo och utveckling!