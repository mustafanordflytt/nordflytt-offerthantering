# 🚀 Vercel Deployment - Steg för Steg

## 1️⃣ Logga in på Vercel

Öppna terminal och kör:
```bash
vercel login
```

Detta öppnar din webbläsare där du loggar in med:
- GitHub
- GitLab
- Bitbucket
- Email

## 2️⃣ Länka projektet

I projektmappen, kör:
```bash
vercel link
```

Följ prompterna:
- Set up and deploy: **Y**
- Which scope: **Välj din Vercel account**
- Link to existing project? **N** (första gången)
- Project name: **nordflytt** (eller vad du vill)
- Directory: **./** (tryck Enter)
- Override settings? **N**

## 3️⃣ Lägg till Environment Variables

### Option A: Via Vercel CLI (rekommenderat)
```bash
# Lägg till alla variabler från .env.production
vercel env add production < .env.production
```

### Option B: Via Vercel Dashboard
1. Gå till https://vercel.com/dashboard
2. Klicka på ditt projekt
3. Gå till "Settings" → "Environment Variables"
4. Lägg till ALLA variabler från `.env.production`
5. Välj "Production" som environment

## 4️⃣ Deploy till Production

```bash
vercel --prod
```

Detta kommer:
- Bygga projektet
- Köra alla optimeringar
- Deploya till Vercel's globala CDN
- Ge dig en produktions-URL

## 5️⃣ Konfigurera Custom Domain

Efter första deployment:

1. Gå till Vercel Dashboard
2. Ditt projekt → "Settings" → "Domains"
3. Lägg till: `nordflytt.se` och `www.nordflytt.se`
4. Följ DNS-instruktionerna:
   ```
   A Record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```

## 6️⃣ Verifiera Deployment

```bash
# Kolla deployment status
vercel ls

# Öppna production site
vercel open --production
```

## 🔍 Troubleshooting

### Om build misslyckas:
```bash
# Kolla logs
vercel logs

# Kör build lokalt först
npm run build
```

### Om environment variables saknas:
```bash
# Lista alla env vars
vercel env ls

# Lägg till saknad variabel
vercel env add VARIABLE_NAME production
```

## 📱 GitHub Integration (Automatisk Deploy)

1. På Vercel Dashboard → "Settings" → "Git"
2. Koppla GitHub repository
3. Välj branch för automatic deploys:
   - `main` → Production
   - `develop` → Preview

Nu kommer varje push automatiskt deployas!

## ✅ Deployment Checklist

- [ ] Alla env variables tillagda
- [ ] Build lyckas lokalt
- [ ] Custom domain konfigurerad
- [ ] SSL certifikat aktivt (automatiskt)
- [ ] GitHub integration klar

## 🎉 Klart!

Din app är nu live på:
- https://your-project.vercel.app (temporär URL)
- https://nordflytt.se (när DNS är konfigurerat)

---

**Tips**: 
- Vercel ger dig automatiskt HTTPS
- Preview deployments för varje PR
- Rollback med ett klick
- Analytics och monitoring inkluderat