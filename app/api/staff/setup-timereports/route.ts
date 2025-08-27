// API endpoint för att sätta upp tidsrapporterings-tabeller i Supabase
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    // Skapa tabell för tidsrapportering
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
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
        CREATE INDEX IF NOT EXISTS idx_timereports_employee_id ON staff_timereports(employee_id);
        CREATE INDEX IF NOT EXISTS idx_timereports_job_id ON staff_timereports(job_id);
        CREATE INDEX IF NOT EXISTS idx_timereports_booking_number ON staff_timereports(booking_number);
        CREATE INDEX IF NOT EXISTS idx_timereports_start_time ON staff_timereports(start_time);
        CREATE INDEX IF NOT EXISTS idx_timereports_status ON staff_timereports(status);

        -- Trigger för att uppdatera updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_staff_timereports_updated_at ON staff_timereports;
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
      `
    })

    if (createTableError) {
      console.error('Error creating table:', createTableError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create table',
        details: createTableError.message 
      }, { status: 500 })
    }

    // Kontrollera att tabellen skapades
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'staff_timereports')
      .single()

    if (checkError || !tables) {
      // Försök alternativ metod
      const { data, error } = await supabase
        .from('staff_timereports')
        .select('count')
        .limit(0)

      if (error) {
        return NextResponse.json({ 
          success: false, 
          error: 'Table creation verification failed',
          details: error.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Time reports table created successfully',
      table: 'staff_timereports'
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint för att kontrollera om tabellen finns
export async function GET() {
  try {
    const { count, error } = await supabase
      .from('staff_timereports')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({ 
        exists: false, 
        error: error.message 
      })
    }

    return NextResponse.json({ 
      exists: true, 
      count: count || 0,
      message: 'Table exists and is accessible'
    })

  } catch (error) {
    return NextResponse.json({ 
      exists: false, 
      error: 'Failed to check table'
    }, { status: 500 })
  }
}