# 🚨 Manuell Sentry Setup för Nordflytt

Eftersom du redan har skapat projektet `javascript-nextjs-ko` under organisation `nordflytt`, gör följande:

## 1. Hämta din DSN

1. Gå till [sentry.io](https://sentry.io)
2. Välj ditt projekt: **javascript-nextjs-ko**
3. Gå till **Settings** → **Client Keys (DSN)**
4. Kopiera DSN (ser ut som: `https://xxx@o123.ingest.sentry.io/xxx`)

## 2. Skapa Auth Token

1. Gå till **Settings** (kugghjulet)
2. Välj **Auth Tokens**
3. Klicka **Create New Token**
4. Namn: `nordflytt-deploy`
5. Markera dessa scopes:
   - ✅ `project:releases`
   - ✅ `project:write`
   - ✅ `org:read`
6. **Create Token** och KOPIERA direkt!

## 3. Skapa .env.local

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=din-dsn-här
SENTRY_ORG=nordflytt
SENTRY_PROJECT=javascript-nextjs-ko
SENTRY_AUTH_TOKEN=din-auth-token-här

# Andra miljövariabler från .env.local.example
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# ... etc
```

## 4. Installera Sentry (redan gjort)

```bash
npm install @sentry/nextjs --legacy-peer-deps
```

## 5. Verifiera filerna finns

Kontrollera att dessa filer skapades av mitt script:
- ✅ `sentry.client.config.ts`
- ✅ `sentry.server.config.ts`
- ✅ `sentry.edge.config.ts`
- ✅ `next.config.mjs` (uppdaterad med Sentry)

## 6. Testa Sentry

```bash
# Starta appen
npm run dev
```

Öppna http://localhost:3000 och kör i browser console:

```javascript
// Skicka test-error
throw new Error("Test från manuell setup")
```

## 7. Verifiera i Sentry

1. Gå till ditt Sentry-projekt
2. Klicka på **Issues**
3. Du borde se ditt test-error!

## Troubleshooting

### Om inget error syns:

1. **Kolla browser console** för fel
2. **Verifiera .env.local** är korrekt
3. **Testa i production mode**:
   ```bash
   npm run build
   npm start
   ```

### Vanliga fel:

**"Invalid DSN"**
- Dubbelkolla att hela DSN är kopierad
- Inga extra mellanslag

**"Cannot read env variables"**
- Starta om dev server efter .env.local ändringar
- `ctrl+c` sedan `npm run dev`

## Nästa steg

När det fungerar:
1. ✅ Konfigurera alerts i Sentry
2. ⬜ Lägg till Google Analytics
3. ⬜ Testa monitoring dashboard på `/admin/monitoring`

Lycka till! 🚀