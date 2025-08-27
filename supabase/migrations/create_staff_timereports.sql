-- Skapa tabell för tidsrapportering från staff-appen
CREATE TABLE IF NOT EXISTS staff_timereports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL, -- För redundans/snabb visning
  job_id TEXT NOT NULL,
  booking_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  
  -- Tidsstämplar
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INT,
  overtime_minutes INT DEFAULT 0,
  overtime_reason TEXT,
  
  -- GPS-data
  start_gps JSONB DEFAULT '{}',
  end_gps JSONB DEFAULT '{}',
  start_address TEXT,
  end_address TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
  break_minutes INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  CONSTRAINT valid_duration CHECK (duration_minutes >= 0 OR duration_minutes IS NULL)
);

-- Index för snabba sökningar
CREATE INDEX idx_timereports_employee_id ON staff_timereports(employee_id);
CREATE INDEX idx_timereports_job_id ON staff_timereports(job_id);
CREATE INDEX idx_timereports_booking_number ON staff_timereports(booking_number);
CREATE INDEX idx_timereports_start_time ON staff_timereports(start_time);
CREATE INDEX idx_timereports_status ON staff_timereports(status);

-- Trigger för att uppdatera updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_timereports_updated_at 
  BEFORE UPDATE ON staff_timereports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Vy för att enkelt se pågående arbeten
CREATE OR REPLACE VIEW active_staff_work AS
SELECT 
  st.*,
  EXTRACT(EPOCH FROM (NOW() - st.start_time))/60 AS current_duration_minutes
FROM staff_timereports st
WHERE st.status = 'active';

-- Vy för rapportering
CREATE OR REPLACE VIEW staff_timereports_summary AS
SELECT 
  employee_id,
  employee_name,
  DATE(start_time) as work_date,
  COUNT(*) as jobs_count,
  SUM(duration_minutes) as total_minutes,
  SUM(overtime_minutes) as total_overtime_minutes,
  SUM(duration_minutes) - SUM(break_minutes) as net_work_minutes
FROM staff_timereports
WHERE status = 'completed'
GROUP BY employee_id, employee_name, DATE(start_time);

-- RLS (Row Level Security)
ALTER TABLE staff_timereports ENABLE ROW LEVEL SECURITY;

-- Policy för anställda att se och uppdatera sina egna rapporter
CREATE POLICY "Employees can view own timereports" ON staff_timereports
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Employees can insert own timereports" ON staff_timereports
  FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

CREATE POLICY "Employees can update own timereports" ON staff_timereports
  FOR UPDATE USING (auth.uid()::text = employee_id::text);

-- Policy för admins att se alla rapporter
CREATE POLICY "Admins can view all timereports" ON staff_timereports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );