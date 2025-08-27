# 🔍 Kontrollera och Hantera Dubblett-Anställda

## Problem
Du får felet "En anställd med denna e-postadress finns redan i systemet" när du försöker lägga till dig själv.

## Lösningar

### Option 1: Rensa Alla Anställda (Om du vill börja om)
Kör detta i Supabase SQL Editor:
```sql
-- Ta bort alla anställda
DELETE FROM employees;

-- Återställ ID-sekvenser
ALTER SEQUENCE employees_id_seq RESTART WITH 1;
```

### Option 2: Ta Bort Specifik Anställd
```sql
-- Se alla anställda med din email
SELECT * FROM employees WHERE email = 'din-email@example.com';

-- Ta bort specifik anställd
DELETE FROM employees WHERE email = 'din-email@example.com';
```

### Option 3: Inaktivera Befintlig Anställd
```sql
-- Markera som inaktiv istället för att ta bort
UPDATE employees 
SET is_active = false, 
    status = 'terminated'
WHERE email = 'din-email@example.com';
```

## Förbättring i Koden
Jag har uppdaterat systemet så att:
1. Email-unikhet endast gäller för aktiva anställda
2. Bättre felmeddelanden på svenska
3. Kontroll av befintliga anställda innan skapande

## För Utveckling utan Supabase
Om du inte har Supabase konfigurerat kommer systemet automatiskt att:
- Använda mock-data
- Tillåta skapande av anställda utan databaskontroll
- Visa varningsmeddelanden om simulerad operation