// Skript för att sätta upp tidsrapporterings-tabellen i Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Ladda environment variabler
dotenv.config({ path: '.env.development.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupTimeReports() {
  console.log('🚀 Setting up time reports table...')

  try {
    // Testa om tabellen redan finns
    const { data: existingData, error: checkError } = await supabase
      .from('staff_timereports')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ Table staff_timereports already exists!')
      return
    }

    console.log('📝 Table does not exist, please create it manually in Supabase dashboard')
    console.log('\nSQL to run in Supabase SQL editor:\n')
    
    const sql = `
-- Skapa tabell för tidsrapportering från staff-appen
CREATE TABLE IF NOT EXISTS staff_timereports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
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
  status TEXT NOT NULL DEFAULT 'active',
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
  SUM(COALESCE(duration_minutes, 0) - COALESCE(break_minutes, 0)) as net_work_minutes
FROM staff_timereports
WHERE status = 'completed'
GROUP BY employee_id, employee_name, DATE(start_time);
    `
    
    console.log(sql)
    console.log('\n📋 Steps to complete setup:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the SQL above')
    console.log('4. Click "Run"')
    console.log('5. The table will be created!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

setupTimeReports()