# 🚨 Sentry Setup Guide för Nordflytt

## Steg 1: Skapa ett nytt projekt i Sentry

1. Logga in på [sentry.io](https://sentry.io)
2. Klicka på "Create Project"
3. Välj platform: **Next.js**
4. Projektnamn: `nordflytt-booking` (eller liknande)
5. Välj team eller skapa nytt
6. Klicka "Create Project"

## Steg 2: Kopiera din DSN

Efter du skapat projektet kommer du se en DSN som ser ut så här:
```
https://1234567890abcdef@o123456.ingest.sentry.io/1234567
```

**VIKTIGT**: Kopiera denna DSN!

## Steg 3: Skapa Auth Token

1. Gå till **Settings** (kugghjulet uppe till höger)
2. Välj **Auth Tokens** i sidomenyn
3. Klicka **"Create New Token"**
4. Ge token ett namn: `nordflytt-deployment`
5. Under **Scopes**, markera:
   - `project:releases`
   - `project:write`
   - `org:read`
6. Klicka **"Create Token"**
7. **KOPIERA TOKEN DIREKT** (du ser den bara en gång!)

## Steg 4: Uppdatera .env.local

Skapa eller uppdatera din `.env.local` fil:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=din-dsn-här
SENTRY_ORG=din-organisation
SENTRY_PROJECT=nordflytt-booking
SENTRY_AUTH_TOKEN=din-auth-token-här
```

### Hitta din organisation:
- Kolla i URL:en: `https://din-org.sentry.io/...`
- Eller gå till Settings → General Settings

## Steg 5: Testa att det fungerar

Kör dessa kommandon:

```bash
# Starta utvecklingsservern
npm run dev
```

Öppna browser console (F12) och kör:
```javascript
// Detta ska skicka ett test-error till Sentry
throw new Error("Test error från Sentry setup")
```

## Steg 6: Verifiera i Sentry Dashboard

1. Gå tillbaka till Sentry
2. Klicka på ditt projekt
3. Du borde se ditt test-error under "Issues"

## Steg 7: Konfigurera Alert Rules (valfritt)

1. I ditt projekt, gå till **Alerts**
2. Klicka **"Create Alert"**
3. Välj **"Issue Alert"**
4. Konfigurera när du vill få notiser:
   - När ett nytt fel uppstår
   - När fel-frekvensen ökar
   - När specifika fel inträffar

### Rekommenderade alerts:
- **New Issue Alert**: Få veta om nya fel direkt
- **High Error Rate**: Om fel-frekvensen överstiger 5%
- **Performance Alert**: Om sidan blir långsam

## Vanliga problem och lösningar

### "Invalid DSN" error
- Kontrollera att du kopierat hela DSN:en
- Se till att det inte finns extra mellanslag

### "Authentication failed"
- Kontrollera att auth token är korrekt
- Verifiera att token har rätt scopes

### Inga errors syns i Sentry
- Kontrollera browser console för fel
- Verifiera att `NEXT_PUBLIC_SENTRY_DSN` är satt
- Testa i produktion-mode: `npm run build && npm start`

## Nästa steg

När Sentry fungerar:
1. ✅ Testa error tracking fungerar
2. ✅ Konfigurera alerts
3. ⬜ Sätt upp release tracking
4. ⬜ Aktivera performance monitoring
5. ⬜ Konfigurera source maps

## Release Tracking (avancerat)

För att se vilken version som har fel:

```bash
# I din deployment pipeline
SENTRY_RELEASE=$(git rev-parse HEAD)
```

Behöver du hjälp? Kolla [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)