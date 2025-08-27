# Test Guide - Tilläggstjänster i Staff App

## Snabbtest i Staff App

### 1. Öppna Staff App
```
http://localhost:3000/staff
```

### 2. Logga in
Använd testinloggning eller din vanliga inloggning

### 3. Hitta ett aktivt jobb
- Om du inte har ett aktivt jobb, starta ett från dashboard

### 4. Lägg till tjänster
1. Klicka på jobbet för att öppna detaljer
2. Klicka på "Lägg till tjänster" knappen
3. Välj några tjänster (t.ex. "Flyttkartonger", "Tunga lyft")
4. Klicka "Lägg till"

### 5. Verifiera i konsollen
Öppna webbläsarens konsoll (F12) och kolla efter:
```
Services saved to database: {success: true, ...}
```

### 6. Kontrollera i Supabase
Gå till Supabase Dashboard > Table Editor > job_additional_services
- Du bör se de tillagda tjänsterna
- Kolla även jobs-tabellen att final_price har uppdaterats

## Felsökning

### Om det inte fungerar:
1. **Kontrollera konsollen** för felmeddelanden
2. **Verifiera API** genom att köra:
   ```bash
   node test-api-directly.mjs
   ```
3. **Kontrollera Supabase-anslutning** i .env.development.local

### Vanliga problem:
- **404 på API**: Servern har inte startat om efter API-ändringen
- **Permission denied**: RLS policies behöver uppdateras
- **Trigger error**: Kör fix-trigger-complete.sql igen

## Nästa steg efter test

När tilläggstjänster sparas korrekt:

### 1. Uppdatera bekräftelsesidan
Filen: `/app/order-confirmation/[id]/page.tsx`
- Hämta tjänster från job_additional_services
- Visa i tjänstelistan
- Inkludera i totalpris

### 2. Verifiera Fortnox-integration
- Kontrollera att tilläggstjänster kommer med när faktura skapas
- Testa RUT-avdrag på tilläggstjänster

### 3. Test med riktigt flöde
1. Skapa bokning i offertformuläret
2. Personal lägger till tjänster under jobbet
3. Kund ser tjänsterna på bekräftelsesidan
4. Faktura innehåller alla tjänster

## SQL för att kontrollera data

```sql
-- Se alla tilläggstjänster
SELECT 
  jas.*,
  j.original_price,
  j.final_price,
  j.added_services_total
FROM job_additional_services jas
JOIN jobs j ON j.id = jas.job_id
ORDER BY jas.created_at DESC;

-- Se sammanfattning per jobb
SELECT * FROM job_services_summary;
```