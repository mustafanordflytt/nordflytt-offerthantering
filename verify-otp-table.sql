-- Verifiera OTP-tabell status
-- Kör detta i Supabase SQL Editor

-- 1. Kontrollera om tabellen finns och dess struktur
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'otp_codes'
ORDER BY ordinal_position;

-- 2. Kontrollera befintliga index
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'otp_codes';

-- 3. Kontrollera RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'otp_codes';

-- 4. Kontrollera befintliga policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'otp_codes';

-- 5. Testa att tabellen fungerar
-- Skapa test-OTP
INSERT INTO public.otp_codes (phone, code, expires_at)
VALUES (
  '+46701234567', 
  '999999', 
  NOW() + INTERVAL '5 minutes'
)
RETURNING *;

-- Verifiera att den skapades
SELECT * FROM public.otp_codes 
WHERE phone = '+46701234567' 
  AND code = '999999';

-- Rensa test-data
DELETE FROM public.otp_codes 
WHERE phone = '+46701234567' 
  AND code = '999999';

-- 6. Kontrollera om cleanup-funktionen finns
SELECT 
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname = 'cleanup_expired_otp_codes';