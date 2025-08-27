-- Ta bort den unika begränsningen på email om den finns
-- Detta tillåter samma email för olika anställda (t.ex. om någon slutar och återanställs)

-- Först, hitta namnet på eventuell constraint
DO $$ 
BEGIN
    -- Ta bort unik constraint om den finns
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname LIKE '%email%' 
        AND conrelid = 'employees'::regclass
    ) THEN
        ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_email_key;
    END IF;
END $$;

-- Lägg till en partiell unik index istället
-- Detta gör email unikt endast för aktiva anställda
CREATE UNIQUE INDEX IF NOT EXISTS employees_email_active_unique 
ON employees(LOWER(email)) 
WHERE is_active = true;

-- Lägg till kommentar för dokumentation
COMMENT ON INDEX employees_email_active_unique IS 'Säkerställer att endast aktiva anställda har unika e-postadresser';