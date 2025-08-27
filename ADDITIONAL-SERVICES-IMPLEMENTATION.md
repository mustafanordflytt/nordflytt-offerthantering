# Tilläggstjänster - Implementationssammanfattning

## Problem som lösts
När personal lägger till extra tjänster i Staff App under pågående jobb sparades dessa endast i React state och localStorage - de kom aldrig med på fakturan eller bekräftelsesidan.

## Lösning implementerad

### 1. Databasstruktur
Skapade ny tabell `job_additional_services` för att permanent spara tilläggstjänster:

```sql
CREATE TABLE job_additional_services (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  service_id VARCHAR(100),
  service_name VARCHAR(255),
  service_category VARCHAR(100),
  quantity INTEGER,
  unit VARCHAR(50),
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  rut_eligible BOOLEAN,
  added_by VARCHAR(255),
  added_at TIMESTAMP,
  photo_url TEXT,
  notes TEXT,
  metadata JSONB
)
```

### 2. Jobs-tabell uppdaterad
La till kolumner i jobs-tabellen:
- `added_services_total` - Total summa för tilläggstjänster
- `final_price` - Slutpris inklusive tillägg
- `original_price` - Ursprungligt pris
- `price_adjustments` - JSON för prisjusteringar

### 3. API Route
Ny endpoint: `/api/staff/add-service-to-order`
- Tar emot tjänster från Staff App
- Sparar i `job_additional_services` tabellen
- Uppdaterar automatiskt `jobs.final_price` via trigger

### 4. Staff App uppdaterad
`handleServiceAdded` i `/app/staff/dashboard/page.tsx` nu:
1. Anropar API för att spara till databas
2. Behåller localStorage som fallback
3. Visar bekräftelse till användaren

### 5. Database Trigger
Automatisk uppdatering av priser när tjänster läggs till:

```sql
CREATE TRIGGER update_job_totals_on_service_change
AFTER INSERT OR UPDATE OR DELETE ON job_additional_services
FOR EACH ROW
EXECUTE FUNCTION update_job_totals();
```

## Vad som återstår

### 1. Kör SQL i Supabase
```bash
# Kör denna SQL i Supabase SQL Editor:
/Users/mustafaabdulkarim/Desktop/nordflytts-booking-form/fix-trigger-complete.sql
```

### 2. Uppdatera bekräftelsesidan
Bekräftelsesidan måste hämta tilläggstjänster från databasen:
- Query `job_additional_services` för jobbet
- Visa tjänsterna i bekräftelsen
- Inkludera i total summa

### 3. Verifiera Fortnox-integration
Säkerställ att tilläggstjänster kommer med på fakturan:
- Kontrollera att Fortnox API får med alla tjänster
- Verifiera RUT-avdrag appliceras korrekt

### 4. Testa end-to-end
1. Personal lägger till tjänster i Staff App
2. Tjänster sparas i databas
3. Tjänster visas på bekräftelsesida
4. Tjänster kommer med på faktura

## Testning
Kör test-scriptet för att verifiera:
```bash
node test-additional-services.mjs
```

## Nästa steg för utvecklaren
1. Kör `fix-trigger-complete.sql` i Supabase
2. Testa i Staff App att tjänster sparas
3. Uppdatera bekräftelsesidan
4. Verifiera fakturering

## API Documentation

### POST /api/staff/add-service-to-order
Request body:
```json
{
  "jobId": "uuid",
  "services": [{
    "id": "service-id",
    "name": "Service Name",
    "category": "category",
    "price": 100,
    "quantity": 1,
    "unit": "st",
    "rutEligible": true,
    "photoUrl": "url",
    "notes": "notes"
  }],
  "staffName": "Staff Name",
  "staffId": "staff-id"
}
```

Response:
```json
{
  "success": true,
  "jobId": "uuid",
  "services": [...],
  "totalAddedCost": 1000,
  "newTotalPrice": 6000,
  "message": "Tjänster tillagda och kund notifierad"
}
```