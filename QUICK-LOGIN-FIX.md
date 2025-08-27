# 🔧 Quick Login Fix

## Problem
Autentiseringstjänsten försökte använda Supabase men miljövariablerna saknades, vilket orsakade fel.

## Lösning
1. Skapade en mock-autentiseringstjänst (`/lib/auth/mock-auth-service.ts`)
2. Uppdaterade AuthProvider att använda mock-tjänsten
3. Behåller samma inloggningsuppgifter som tidigare

## Inloggningsuppgifter

### Admin
- Email: admin@nordflytt.se
- Lösenord: admin123

### Manager
- Email: manager@nordflytt.se
- Lösenord: manager123

### Employee
- Email: employee@nordflytt.se
- Lösenord: employee123

## Starta om servern
```bash
# Stoppa servern (Ctrl+C)
# Starta om
npm run dev
```

## Testa
1. Gå till http://localhost:3000/login
2. Använd någon av ovanstående inloggningsuppgifter
3. Du kommer till CRM dashboard efter lyckad inloggning

## För produktion
I produktion skulle ni:
1. Konfigurera riktiga Supabase-miljövariabler
2. Använda den ursprungliga auth-service.ts
3. Implementera riktig databas-autentisering