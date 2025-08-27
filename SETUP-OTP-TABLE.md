# 🔐 OTP-tabell Setup för Nordflytt

## Snabbguide

### 1. Kör SQL direkt i Supabase Dashboard

Gå till SQL Editor i Supabase Dashboard och kör:

```sql
-- Skapa OTP-tabell för säker autentisering
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lägg till index för snabba sökningar
CREATE INDEX IF NOT EXISTS idx_otp_phone_code ON public.otp_codes(phone, code);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_codes(expires_at);

-- Aktivera Row Level Security
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Endast service role kan hantera OTP-koder
CREATE POLICY "Service role can manage OTP codes" ON public.otp_codes
  FOR ALL
  TO service_role
  USING (true);

-- Ge rättigheter
GRANT ALL ON public.otp_codes TO service_role;

-- Automatisk rensning av gamla OTP-koder (valfritt)
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schemalägg rensning var 6:e timme (kräver pg_cron extension)
-- SELECT cron.schedule('cleanup-otp-codes', '0 */6 * * *', 'SELECT cleanup_expired_otp_codes();');
```

### 2. Verifiera att tabellen skapades

```sql
-- Kontrollera tabellstruktur
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'otp_codes'
ORDER BY ordinal_position;

-- Kontrollera policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'otp_codes';
```

### 3. Testa OTP-funktionalitet

```sql
-- Skapa test-OTP
INSERT INTO public.otp_codes (phone, code, expires_at)
VALUES (
  '+46701234567', 
  '123456', 
  NOW() + INTERVAL '5 minutes'
);

-- Verifiera OTP
SELECT * FROM public.otp_codes 
WHERE phone = '+46701234567' 
  AND code = '123456' 
  AND expires_at > NOW()
  AND used = false;

-- Markera som använd
UPDATE public.otp_codes 
SET used = true 
WHERE phone = '+46701234567' 
  AND code = '123456';

-- Rensa test-data
DELETE FROM public.otp_codes WHERE phone = '+46701234567';
```

## 📱 Integration med Staff App

OTP-tabellen används av `/api/staff/auth` endpoint:

```typescript
// Generera OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString()
const { error } = await supabase
  .from('otp_codes')
  .insert({
    phone: staffPhone,
    code: otp,
    expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 min
  })

// Skicka SMS via Twilio/annan tjänst
await sendSMS(staffPhone, `Din inloggningskod: ${otp}`)
```

## 🔒 Säkerhetsnoteringar

1. **Begränsad åtkomst**: Endast service role kan läsa/skriva OTP-koder
2. **Tidsbegränsning**: OTP-koder gäller endast 5 minuter
3. **Engångsanvändning**: Koder markeras som använda efter verifiering
4. **Rate limiting**: Implementerat i API-endpoint (5 försök/15 min)

## 🚀 Produktions-checklist

- [ ] Aktivera pg_cron för automatisk rensning
- [ ] Konfigurera SMS-tjänst (Twilio/46elks)
- [ ] Sätt upp monitoring för misslyckade inloggningar
- [ ] Implementera brute-force skydd
- [ ] Lägg till 2FA som extra säkerhetslager

---

**Status**: Redo att implementeras i Supabase
**Prioritet**: Hög (krävs för säker staff-autentisering)a