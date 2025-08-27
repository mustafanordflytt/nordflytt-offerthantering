-- Security tables for Nordflytt

-- 1. OTP codes table (for staff login)
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_code ON public.otp_codes(phone, code);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_codes(expires_at);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage OTP codes" ON public.otp_codes
  FOR ALL
  TO service_role
  USING (true);

GRANT ALL ON public.otp_codes TO service_role;

-- 2. Staff table (if not exists)
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mover',
  department TEXT,
  permissions TEXT[] DEFAULT ARRAY['schedule', 'checkin'],
  personal_code_hash TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_phone ON public.staff(phone);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);

-- 3. Staff login attempts (for security monitoring)
CREATE TABLE IF NOT EXISTS public.staff_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_staff ON public.staff_login_attempts(staff_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON public.staff_login_attempts(created_at);

-- 4. Staff schedules
CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_staff_date ON public.staff_schedules(staff_id, date);

-- 5. User profiles (for CRM users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  role TEXT DEFAULT 'employee',
  permissions TEXT[] DEFAULT ARRAY['customers:read', 'jobs:read'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. API keys (for partner integrations)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['read'],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

-- Enable RLS on all security tables
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view own profile" ON public.staff
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND 'admin' = ANY(permissions)
  ));

CREATE POLICY "Only admins can manage staff" ON public.staff
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND 'admin' = ANY(permissions)
  ));

-- Insert some test staff (with bcrypt hashed codes)
-- Password: 1234 => $2a$10$YpJj7VfNKh8m5.BFyC.MJuLmKYV9kY5JZqZQqDqFhZQ3B3bH.Jqmq
-- Password: 5678 => $2a$10$HfQjSgQJgFkKxQzQxHqLaO7VfJPDnZQvGQqY2TqjSVvDDeGwBqB1e
INSERT INTO public.staff (staff_id, name, email, phone, role, department, permissions, personal_code_hash)
VALUES 
  ('staff-001', 'Lars Andersson', 'lars@nordflytt.se', '+46701234567', 'admin', 'Ledning', ARRAY['all'], '$2a$10$YpJj7VfNKh8m5.BFyC.MJuLmKYV9kY5JZqZQqDqFhZQ3B3bH.Jqmq'),
  ('staff-002', 'Maria Eriksson', 'maria@nordflytt.se', '+46732345678', 'manager', 'Operations', ARRAY['schedule', 'checkin', 'chat', 'reports'], '$2a$10$HfQjSgQJgFkKxQzQxHqLaO7VfJPDnZQvGQqY2TqjSVvDDeGwBqB1e')
ON CONFLICT (staff_id) DO NOTHING;