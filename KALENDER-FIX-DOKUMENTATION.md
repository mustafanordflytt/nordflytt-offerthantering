# 🔧 Kalender Fix - Dokumentation

## Problem
Kalendern visade bara "Laddar kalender..." och laddade aldrig klart.

## Orsak
Kalendertabellen i databasen använder en gammal struktur med separata `date` och `time` fält istället för de förväntade `start_datetime` och `end_datetime` fälten.

### Gammal struktur (nuvarande i databasen):
```javascript
{
  id: '7b6c5aa9-5654-41bb-b9ef-65f5c2fc13e6',
  title: 'Flyttuppdrag - Eva Eriksson',
  type: 'Flyttning',
  date: '2025-04-14',
  time: '12:00:00',
  duration: '6h',
  participants: ['Team C'],
  status: 'Preliminär',
  customer_id: '0dbc3569-4273-44e6-9213-fea49a9848ea',
  booking_id: 'ccb585e1-5d46-4237-ac70-256a29ea66d9',
  created_at: '2025-04-10T16:23:31.267064+00:00'
}
```

### Förväntad struktur (enligt SQL-migration):
```javascript
{
  id: 'uuid',
  event_id: 'EVENT000001',
  title: 'Flyttuppdrag: JOB-001',
  event_type: 'job',
  event_status: 'scheduled',
  start_datetime: '2025-04-14T12:00:00Z',
  end_datetime: '2025-04-14T18:00:00Z',
  assigned_staff: ['uuid1', 'uuid2'],
  // ... etc
}
```

## Lösning
Uppdaterade `/api/crm/calendar/events/route.ts` för att hantera båda strukturerna:

1. **Strukturdetektering**: API:et kontrollerar först vilken struktur som används
2. **Dynamisk query**: Använder rätt fält beroende på struktur
3. **Datakonvertering**: Transformerar gamla strukturen till det format frontend förväntar sig

### Konverteringslogik:
- `date` + `time` → `start_datetime`
- `duration` (t.ex. "6h") → beräkna `end_datetime`
- `type` → `event_type` (default: 'job')
- `participants` → `assignedStaff`
- `status` → `event_status`

## Status
✅ **Kalendern fungerar nu!** Den kan visa händelser från den gamla strukturen medan vi väntar på fullständig databasmigrering.

## Nästa steg (valfritt)
För att få full funktionalitet kan vi köra en databasmigrering som:
1. Lägger till nya kolumner (start_datetime, end_datetime, etc.)
2. Migrerar befintlig data till nya kolumner
3. Uppdaterar triggers och funktioner

Men detta är **inte kritiskt** då API:et nu hanterar båda strukturerna.

---
**Fixat**: 2025-01-25
**Av**: Claude