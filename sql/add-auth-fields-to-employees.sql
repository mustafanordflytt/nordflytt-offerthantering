-- Add authentication fields to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS 
  supabase_user_id UUID REFERENCES auth.users(id),
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  phone_verified BOOLEAN DEFAULT false,
  otp_secret TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_phone ON public.employees(phone);
CREATE INDEX IF NOT EXISTS idx_employees_supabase_user_id ON public.employees(supabase_user_id);

-- Create OTP codes table for tracking
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  employee_id UUID REFERENCES public.employees(id)
);

-- Index for OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_code ON public.otp_codes(phone, code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Function to clean expired OTP codes
CREATE OR REPLACE FUNCTION clean_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_codes 
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for employees table (only authenticated users can read their own data)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own data" ON public.employees
  FOR SELECT
  USING (auth.uid() = supabase_user_id);

CREATE POLICY "Service role can manage all employees" ON public.employees
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS for OTP codes (service role only)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage OTP codes" ON public.otp_codes
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');