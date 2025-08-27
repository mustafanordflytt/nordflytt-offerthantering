# 📱 Mobilåtkomst Guide för Nordflytt Staff App

## Problem: "Loading chunk app/staff/page failed"

Detta fel uppstår när Next.js inte kan ladda JavaScript-filer över nätverket.

## Lösningar:

### 1. **Använd rätt URL** ✅
```
http://192.168.1.228:3000/staff
```
(Inte https, inget extra "U")

### 2. **Rensa cache på mobilen**
- **Safari**: Inställningar → Safari → Rensa historik och webbplatsdata
- **Chrome**: Tryck på tre prickar → Historik → Rensa webbdata

### 3. **Starta om servern** 🔄
```bash
# Stoppa servern (Ctrl+C)
# Starta igen:
npm run dev
```

### 4. **Alternativ lösning - Använd ngrok**
Om problemet kvarstår, använd ngrok för säker tunnel:

```bash
# Installera ngrok (om inte redan gjort)
brew install ngrok

# Starta tunnel
ngrok http 3000
```

Ngrok ger dig en publik URL som fungerar överallt, t.ex:
`https://abc123.ngrok.io/staff`

### 5. **Kontrollera konsolen**
På mobilen:
- **Safari**: Aktivera "Webbutvecklare" i inställningar
- Anslut till Mac via USB
- Öppna Safari på Mac → Utveckla → [Din mobil] → Inspektera

### 6. **Quick Fix - Inaktivera chunk optimization**
Lägg till i `next.config.js`:
```javascript
module.exports = {
  experimental: {
    optimizeCss: false,
    chunking: 'disabled'
  }
}
```

## Status:
- ✅ Server körs på: http://192.168.1.228:3000
- ✅ PreStartChecklistModal-problem löst
- ⚠️ Chunk loading kan vara problem med Next.js 15.2.4

## Testa dessa URLs i ordning:
1. http://192.168.1.228:3000 (huvudsida)
2. http://192.168.1.228:3000/staff (staff login)
3. http://localhost:3000/staff (på din Mac)

Om huvudsidan fungerar men inte /staff, är det ett routing/chunk-problem.