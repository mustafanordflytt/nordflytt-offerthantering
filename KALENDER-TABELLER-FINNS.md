# ✅ Kalendertabeller finns redan!

## Status: Tabellerna existerar i Supabase

### Vad detta betyder:
1. `calendar_events` tabell finns redan ✅
2. API:erna kan läsa från tabellen
3. Kalendern borde visa data om det finns events

### Kontrollera i Supabase:

#### 1. Se tabellstruktur:
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'calendar_events';
```

#### 2. Kontrollera om det finns data:
```sql
SELECT COUNT(*) FROM calendar_events;
```

#### 3. Lägg till test-event:
```sql
INSERT INTO calendar_events (
    title,
    start_datetime,
    end_datetime,
    event_type,
    event_status
) VALUES (
    'Test Flyttuppdrag - Stockholm',
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '4 hours',
    'job',
    'scheduled'
);
```

### Felsökning om kalendern fortfarande är tom:

1. **Kontrollera RLS (Row Level Security)**:
```sql
-- Se om RLS är aktiverat
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'calendar_events';

-- Om RLS är på, skapa en policy för att läsa:
CREATE POLICY "Enable read for all users" 
ON calendar_events FOR SELECT 
USING (true);
```

2. **Kontrollera API-anrop i webbläsaren**:
- Öppna Developer Tools (F12)
- Gå till Network-fliken
- Ladda om kalendersidan
- Kolla om `/api/crm/calendar/events` returnerar data

3. **Om API returnerar tom array** men data finns:
- Kontrollera datumfilter (kanske visar bara denna månad)
- Kontrollera event_status (kanske filtrerar bort 'cancelled')

---
**Status**: ✅ TABELLER FINNS
**Nästa steg**: Lägg till test-data eller kontrollera RLS
**Testad**: 2025-01-25