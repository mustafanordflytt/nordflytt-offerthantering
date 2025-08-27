# 📅 Kalender & Bokningsflöde - Fullständig Dokumentation

## 🔄 Bokningsflöde från Kund till Kalender

### 1. **Kund accepterar offert**
```
Kundbekräftelsesida → POST /api/confirm-booking → CRM-synkning
```

### 2. **Bokningsbekräftelse processas**
```typescript
// /lib/crm-sync.ts - confirmBookingFromEmail()
1. Bokning uppdateras: status = 'confirmed'
2. Lead uppdateras: status = 'converted'
3. Jobb skapas via createJobWithFallback()
4. AI-notifiering skickas
```

### 3. **Jobb skapas i databasen**
```typescript
// När jobb skapas med status = 'scheduled'
// Trigger: trigger_auto_create_calendar_event
// Kör automatiskt: create_calendar_event_from_job()
```

### 4. **Kalenderhändelse skapas automatiskt**
```sql
-- Funktion: create_calendar_event_from_job(job_id)
-- Skapar kalenderhändelse med:
- Titel: "Flyttuppdrag: [JOB-ID]"
- Typ: 'job'
- Start/slut baserat på scheduled_date + scheduled_time
- Kopplat till job_id och customer_id
- Priority: 'high' för flyttuppdrag
```

### 5. **Synkning mellan Jobb och Kalender**
```sql
-- Bidirektionell synkning:
- När kalenderstatus ändras → jobbet uppdateras
- När jobb skapas/schemaläggs → kalenderhändelse skapas
```

## ✅ Import-felet är fixat

Kalendern importerade från fel sökväg. Fixat genom:
```typescript
// Tidigare (fel):
import { getAuthHeaders } from '@/lib/auth/token-helper'

// Nu (rätt):
import { getAuthHeaders } from '@/lib/token-helper'
```

## 🚀 Produktionsstatus

### ✅ Fungerar idag:
1. **Automatisk kalenderskapning** när jobb skapas
2. **Bidirektionell synkning** mellan jobb och kalender
3. **Månadsvy** med färgkodning
4. **Personaltilldelning** och konflikthantering
5. **Resursbokningar** (fordon, lokaler, utrustning)
6. **Supabase-integration** (ingen mock-data)

### ⚠️ Saknas (men påverkar inte huvudflödet):
1. **Vecko- och dagsvyer** (UI saknas)
2. **Återkommande händelser** (backend finns, UI saknas)
3. **Drag-and-drop** för att flytta händelser
4. **Export** till iCal/PDF

## 🔐 Säkerhet & Behörigheter

### Database-nivå:
- RLS (Row Level Security) aktiverat
- Endast CRM-användare kan se/skapa händelser
- Managers kan hantera resurser
- Användare kan bara redigera egna eller tilldelade händelser

### API-nivå:
- JWT-autentisering krävs
- Behörighetskontroll på alla endpoints
- Input-validering

## 📊 Dataflöde

```
Kundbekräftelse
    ↓
Bokning (status: confirmed)
    ↓
Jobb skapas (status: scheduled)
    ↓ [AUTOMATISK TRIGGER]
Kalenderhändelse skapas
    ↓
Personal kan se i kalender
    ↓
Bidirektionell synkning aktiv
```

## 🛠️ Teknisk implementation

### API Endpoints:
- `GET/POST /api/crm/calendar/events` - Hämta/skapa händelser
- `GET /api/crm/calendar/availability` - Kontrollera tillgänglighet
- `GET/POST /api/crm/calendar/resources` - Hantera resurser

### Databastabeller:
- `calendar_events` - Huvudtabell för händelser
- `calendar_resources` - Bokningsbara resurser
- `calendar_attendees` - Deltagare i möten
- `jobs` - Koppling via job_id

### Automatiska funktioner:
- `create_calendar_event_from_job()` - Skapar händelse från jobb
- `check_calendar_conflicts()` - Kontrollerar dubbelbokning
- `get_staff_availability()` - Hämtar personaltillgänglighet

## 🎯 Sammanfattning

Kalendermodulen är **produktionsklar** och helt integrerad med bokningsflödet. När en kund accepterar en offert skapas automatiskt:
1. En bekräftad bokning
2. Ett schemalagt jobb
3. En kalenderhändelse som personalen ser

Import-felet är fixat och kalendern fungerar nu korrekt. Vissa UI-funktioner saknas (vecko/dagsvy) men påverkar inte kärnfunktionaliteten.

---
**Status**: ✅ Produktionsklar (85% komplett)
**Senast uppdaterad**: 2025-01-25