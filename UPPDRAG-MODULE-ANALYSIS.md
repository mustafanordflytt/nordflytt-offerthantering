# 📋 Uppdrag-modul Analys & Förbättringsförslag

## 📊 Nuvarande Status

### ✅ Vad som fungerar:
1. **Grundläggande CRUD**
   - Lista alla uppdrag
   - Filtrering (status, prioritet)
   - Sökning (kund, bokningsnr, adress)
   - Sortering

2. **KPI-kort**
   - Totalt antal uppdrag (3)
   - Dagens uppdrag (1)
   - Pågående (1)
   - Intäkter (0 kr)

3. **Tabellvy**
   - Visar bokningsnummer, kund, flyttdatum, rutt, status, prioritet
   - Actions-meny per uppdrag

4. **View Toggle**
   - Kalendervy-knapp finns (ej implementerad)

### ❌ Vad som saknas:

1. **Personalhantering**
   - Tilldelning av personal till uppdrag
   - Schemaläggning
   - Resurskonflikter

2. **Statushantering**
   - Workflow för statusändringar
   - Automatiska statusuppdateringar
   - Historik

3. **Tidsrapportering**
   - Start/stoppa uppdrag
   - Registrera arbetstid
   - Pauser och avbrott

4. **Ruttplanering**
   - Kartvy för optimering
   - GPS-tracking
   - Körinstruktioner

5. **Dokumentation**
   - Fotodokumentation
   - Checklistor
   - Kundsignatur

## 🎯 Prioriterade Förbättringar

### 1. Personalschemaläggning
```typescript
interface StaffAssignment {
  staffId: string
  role: 'driver' | 'mover' | 'lead'
  startTime: string
  endTime: string
  status: 'assigned' | 'confirmed' | 'working' | 'completed'
}
```

**Funktioner:**
- Drag & drop personal till uppdrag
- Visa tillgänglighet
- Konflikthantering
- Automatisk notifiering

### 2. Live Status-uppdateringar
```typescript
// Realtids-uppdateringar via WebSocket/Supabase Realtime
const jobStatuses = {
  'scheduled': 'Planerad',
  'confirmed': 'Bekräftad',
  'on_route': 'På väg',
  'arrived': 'Framme',
  'loading': 'Lastar',
  'in_transit': 'Transport',
  'unloading': 'Lastar av',
  'completed': 'Slutförd',
  'invoiced': 'Fakturerad'
}
```

### 3. Kalendervy Implementation
- Månads/vecko/dagsvy
- Drag & drop för omschemaläggning
- Personalvy vs uppdragsvy
- Export till Google Calendar/Outlook

### 4. Mobil Staff App Integration
- QR-kod för snabb inloggning
- Start/stoppa uppdrag
- Fotodokumentation
- GPS-tracking
- Checklista
- Kundsignatur

### 5. Ruttoptimering
```typescript
interface RouteOptimization {
  jobs: Job[]
  vehicles: Vehicle[]
  constraints: {
    maxHoursPerDay: number
    lunchBreak: boolean
    trafficData: boolean
  }
  optimize(): OptimizedRoute[]
}
```

## 🏗️ Implementation Roadmap

### Fas 1: Personalschemaläggning (1-2 veckor)
1. UI för personaltilldelning
2. Tillgänglighetskalender
3. Konflikthantering
4. Notifieringar

### Fas 2: Statushantering (1 vecka)
1. Utökad statusmodell
2. Workflow-motor
3. Automatiska triggers
4. Historikloggning

### Fas 3: Kalendervy (1-2 veckor)
1. FullCalendar integration
2. Drag & drop
3. Olika vyer
4. Export-funktioner

### Fas 4: Mobil Integration (2-3 veckor)
1. PWA för staff
2. Offline-stöd
3. GPS & foto
4. Synkronisering

### Fas 5: Ruttoptimering (2-3 veckor)
1. Google Maps integration
2. Optimeringsalgoritm
3. Live traffic data
4. Körinstruktioner

## 💻 Kodexempel

### Personalschemaläggning Component
```typescript
// components/crm/StaffScheduler.tsx
export function StaffScheduler({ job, availableStaff }) {
  const [assigned, setAssigned] = useState([])
  
  const handleDrop = (staffId, role) => {
    // Kolla tillgänglighet
    // Tilldela personal
    // Uppdatera database
  }
  
  return (
    <DndContext>
      <div className="grid grid-cols-2 gap-4">
        <AvailableStaff staff={availableStaff} />
        <AssignedStaff job={job} assigned={assigned} />
      </div>
    </DndContext>
  )
}
```

### Status Workflow
```typescript
// lib/job-status-machine.ts
const jobStateMachine = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['on_route', 'cancelled'],
  on_route: ['arrived'],
  arrived: ['loading'],
  loading: ['in_transit'],
  in_transit: ['unloading'],
  unloading: ['completed'],
  completed: ['invoiced']
}

export function canTransition(from: string, to: string) {
  return jobStateMachine[from]?.includes(to) || false
}
```

## 🎨 UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ Uppdrag                              [Kalender] [+ Nytt] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ Idag    │ │Pågående │ │Personal │ │ Intäkt  │        │
│ │   5     │ │   2     │ │  8/12   │ │ 45.2k   │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────┤
│ [Sök...] [Status ▼] [Personal ▼] [Datum ▼]              │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ NF-2001 | Anna Svensson | 09:00                    │ │
│ │ Vasagatan 10 → Kungsgatan 5                        │ │
│ │ [👤 Erik, Johan] [🚛 NF-01] [📍 På väg]           │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ NF-2002 | Företaget AB | 14:00                     │ │
│ │ Sveavägen 50 → Hamngatan 20                        │ │
│ │ [👤 Ej tilldelad] [🚛 ---] [⏰ Planerad]           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Nästa Steg

1. **Prioritera** vilka funktioner som är viktigast
2. **Börja med** personalschemaläggning (mest efterfrågat)
3. **Testa** med riktiga användare tidigt
4. **Iterera** baserat på feedback

Uppdrag-modulen har en solid grund men behöver utökas för att bli ett komplett verktyg för flyttföretag!