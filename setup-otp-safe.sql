-- Säker setup som inte kraschar om saker redan finns

-- 1. Skapa tabell om den inte finns
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Skapa index om de inte finns
CREATE INDEX IF NOT EXISTS idx_otp_phone_code ON public.otp_codes(phone, code);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_codes(expires_at);

-- 3. Aktivera RLS (kommer inte ge fel om redan aktiverat)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- 4. Droppa policy om den finns och skapa på nytt
DROP POLICY IF EXISTS "Service role can manage OTP codes" ON public.otp_codes;
CREATE POLICY "Service role can manage OTP codes" ON public.otp_codes
  FOR ALL
  TO service_role
  USING (true);

-- 5. Ge rättigheter (ignorerar om redan finns)
GRANT ALL ON public.otp_codes TO service_role;

-- 6. Skapa eller ersätt cleanup-funktionen
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Visa status
SELECT 'OTP-tabell konfigurerad!' AS status;