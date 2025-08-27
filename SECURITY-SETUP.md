# 🔒 Säkerhetsguide - Nordflytt Bokningssystem

## 1. Miljövariabler

### Skapa `.env.local` fil
Kopiera `.env.local.example` till `.env.local` och fyll i dina värden:

```bash
cp .env.local.example .env.local
```

### Obligatoriska variabler:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-supabase-anon-key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=din-google-maps-api-key
```

### ⚠️ VIKTIGT: Google Maps API-säkerhet
1. Gå till [Google Cloud Console](https://console.cloud.google.com)
2. Välj ditt projekt
3. Gå till "APIs & Services" → "Credentials"
4. Klicka på din API-nyckel
5. Under "Application restrictions", välj "HTTP referrers"
6. Lägg till:
   - För utveckling: `http://localhost:3000/*`
   - För produktion: `https://din-domän.se/*`

## 2. Gitignore
Kontrollera att `.env.local` är i `.gitignore`:
```gitignore
# Miljövariabler
.env.local
.env.production
```

## 3. Vercel deployment
När du deployar till Vercel:
1. Gå till Project Settings → Environment Variables
2. Lägg till alla variabler från `.env.local`
3. Välj rätt scope (Production/Preview/Development)

## ✅ Säkerhetskontroll
- [ ] API-nycklar ALDRIG i kod
- [ ] `.env.local` aldrig committad
- [ ] Google Maps API begränsad till domäner
- [ ] Alla känsliga variabler i Vercel

## 🚨 Om API-nyckel läckt
1. Inaktivera nyckeln omedelbart i Google Cloud Console
2. Skapa ny nyckel
3. Uppdatera alla miljöer
4. Kontrollera Git-historik för exponering