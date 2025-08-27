-- Kontrollera befintlig tabellstruktur
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'calendar_events'
ORDER BY 
    ordinal_position;

-- Kontrollera om det finns data
SELECT COUNT(*) as antal_events FROM calendar_events;

-- Visa de första 5 raderna
SELECT * FROM calendar_events LIMIT 5;

-- Kontrollera calendar_resources också
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'calendar_resources'
ORDER BY 
    ordinal_position;

-- Lägg till test-event om tabellen är tom
INSERT INTO calendar_events (
    event_id,
    title,
    description,
    event_type,
    event_status,
    start_datetime,
    end_datetime,
    location_name,
    location_address
) 
SELECT 
    'EVENT000001',
    'Test Flyttuppdrag',
    'Test av kalendersystemet',
    'job',
    'scheduled',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '4 hours',
    'Testvägen 123',
    'Testvägen 123, 123 45 Stockholm'
WHERE NOT EXISTS (
    SELECT 1 FROM calendar_events WHERE event_id = 'EVENT000001'
);