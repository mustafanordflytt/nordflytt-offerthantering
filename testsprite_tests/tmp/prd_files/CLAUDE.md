# 🧠 CLAUDE.md - Systemintelligens för Nordflytt CRM

> **VIKTIGT**: Läs alltid denna fil FÖRST innan du gör ändringar!

## 🎯 Projektöversikt
- **Typ**: Progressive Web App (PWA) för flyttfirma
- **Huvudfokus**: Staff-app för flyttpersonal
- **Status**: MVP med fungerande dashboard, jobbhantering, fotodokumentation

## 🏗️ Arkitektur

### Tech Stack
- **Frontend**: Next.js 15.2.4 (App Router)
- **UI**: shadcn/ui komponenter
- **Språk**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (mock för demo)
- **Auth**: localStorage (för demo)

### Filstruktur
```
/app
  /staff           # Personalapp
    /dashboard     # Huvudvy med jobbkort
    /components    # Modaler och komponenter
  /api             # Mock API endpoints
/components
  /staff           # Återanvändbara staff-komponenter
  /ui              # shadcn/ui komponenter
/lib               # Utilities och services
```

## 💰 Kritiska Affärsregler

### Prissättning (ALDRIG ändra dessa)
```typescript
const PRICING = {
  volumeAdjustment: 240,      // kr/m³ efter RUT-avdrag
  parkingDistance: 99,        // kr/meter över 5m
  materials: {
    boxes: 79,                // flyttkartonger
    tape: 99,                 // packtejp
    plasticBags: 20          // plastpåsar
  },
  stairs: {
    noElevator: 500,         // fast avgift våning 3+
    brokenElevator: 300      // trasig hiss
  }
}
```

### Workflow-regler
1. **Fotodokumentation**: ALLTID före → under → efter
2. **Checklista**: Dynamisk baserat på jobbdata
3. **Volymjustering**: Endast om faktisk > bokad volym
4. **Smart pricing**: Auto-tillägg för parkering/trappor

## 🎨 UI/UX Principer

### Mobile-First
- Min touch-target: 44px (Apple HIG)
- Sticky action bar för aktiva jobb
- Scrollbara modaler med momentum

### Förenklad Vy
- Jobbkort visar ENDAST essentiell info
- Detaljer i modal vid klick
- Smart gruppering av funktioner

### Färgschema
```css
primary: #002A5C      /* Nordflytt blå */
success: green-600    
warning: orange-600
danger: red-600
```

## 🔧 Kodkonventioner

### Components
```typescript
// ALLTID functional components med TypeScript
export default function ComponentName({ prop }: Props) {
  // Hooks först
  const [state, setState] = useState()
  
  // Handlers
  const handleClick = () => {}
  
  // Render
  return <div>...</div>
}
```

### API Calls
```typescript
// ALLTID med error handling
try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error()
} catch (error) {
  // Visa användarvänligt fel
}
```

### State Management
- useState för lokal state
- localStorage för persistence
- Ingen Redux/Zustand (för enkelt nu)

## 🚀 Senaste Ändringar

### 2025-01-06
- ✅ Förenklad dashboard med rena jobbkort
- ✅ Smart fotopåminnelse-system (PhotoReminderSystem)
- ✅ Dynamisk checklista (PreStartChecklistModal)
- ✅ Automatisk prisberäkning (SmartPricingEngine)
- ✅ Mobile-first action bar
- ✅ MCP och Puppeteer installerat

## ⚠️ Kända Problem
- Login redirect fungerar inte i test-miljö
- Vissa knappar är 33px (bör vara 44px)
- Next.js server kastar ibland 404 på static files

## 📋 TODO (Prioritetsordning)
1. Fixa knappstorlekar till 44px minimum
2. Implementera riktig Supabase-integration
3. Lägg till offline-support (PWA)
4. Förbättra error handling
5. Implementera push-notifikationer

## 🧪 Testning

### Kör tester
```bash
npm run test:e2e
```

### Manuell testning
```bash
node manual-test.js
```

## 💬 Kommunikation mellan AI-agenter

När du ber en AI om hjälp:
1. **ALLTID** be den läsa denna fil först
2. Referera till `mcp-config.json` för djupare kontext
3. Kör tester efter ändringar
4. Uppdatera denna fil med viktiga beslut

### Exempel-prompt:
```
"Läs CLAUDE.md och mcp-config.json först. 
Implementera [feature] enligt etablerade mönster.
Kör test:e2e efteråt."
```

## 🔒 Säkerhetsregler
- ALDRIG committa känslig data
- ALDRIG exponera API-nycklar
- ALLTID validera input
- ALLTID använd HTTPS i produktion

---

**Senast uppdaterad**: 2025-01-06
**Av**: Claude (AI Assistant)
**Version**: 1.0.0