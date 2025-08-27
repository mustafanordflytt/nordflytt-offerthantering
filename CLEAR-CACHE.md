# 🧹 Rensa Cache - Lösning för Chunk Loading Error

## Snabblösning:

1. **Stoppa Next.js** (Ctrl+C i terminalen)

2. **Rensa all cache:**
```bash
rm -rf .next
rm -rf node_modules/.cache
```

3. **Starta om:**
```bash
npm run dev
```

4. **I webbläsaren:**
   - Öppna Developer Tools (F12)
   - Gå till Application/Storage
   - Clear Site Data
   - Eller bara tryck Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

## Om felet kvarstår:

1. **Stäng ALLA flikar** med localhost
2. **Öppna inkognito/privat fönster**
3. **Gå till** http://localhost:3000/crm/anstallda

## Varför händer detta?

- Next.js bygger om filer dynamiskt
- Gamla JavaScript-chunks blir inaktuella
- Webbläsaren försöker ladda filer som inte finns längre

Detta är normalt under utveckling och händer inte i produktion!