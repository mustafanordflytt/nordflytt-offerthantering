-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'staff-001'
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  status VARCHAR(50) DEFAULT 'available', -- available, busy, scheduled, off_duty, terminated
  hire_date DATE NOT NULL,
  employment_type VARCHAR(50) DEFAULT 'full_time', -- full_time, part_time, contract
  salary DECIMAL(10, 2),
  address TEXT,
  emergency_contact TEXT,
  avatar_url TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Employee skills
CREATE TABLE IF NOT EXISTS employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts table
CREATE TABLE IF NOT EXISTS employee_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  contract_type VARCHAR(50) NOT NULL, -- permanent, fixed_term, trial
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, signed, expired, terminated
  pdf_url TEXT,
  sent_date TIMESTAMPTZ,
  signed_date TIMESTAMPTZ,
  expiry_date DATE,
  salary DECIMAL(10, 2),
  working_hours INTEGER DEFAULT 40,
  vacation_days INTEGER DEFAULT 25,
  probation_months INTEGER DEFAULT 6,
  notice_period_months INTEGER DEFAULT 3,
  additional_terms JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Assets table
CREATE TABLE IF NOT EXISTS employee_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL, -- clothing, equipment, tools, tech
  asset_name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  size VARCHAR(20),
  quantity INTEGER DEFAULT 1,
  original_cost DECIMAL(10, 2),
  current_value DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'utdelad', -- utdelad, återlämnad, förlorad, skadat
  condition VARCHAR(50) DEFAULT 'new', -- new, good, fair, poor
  serial_number VARCHAR(100),
  supplier VARCHAR(255),
  distributed_date DATE,
  return_date DATE,
  expected_lifespan_months INTEGER,
  notes TEXT,
  receipt_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding steps
CREATE TABLE IF NOT EXISTS employee_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  step_id VARCHAR(50) NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- document, training, equipment, access
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_date TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle access
CREATE TABLE IF NOT EXISTS employee_vehicle_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  personal_code VARCHAR(10) UNIQUE NOT NULL,
  access_level VARCHAR(50) DEFAULT 'basic',
  authorized_vehicles TEXT[], -- Array of vehicle IDs
  issued_date DATE NOT NULL,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  revoked_date DATE,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Time reports
CREATE TABLE IF NOT EXISTS employee_time_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  job_id UUID, -- Removed reference to jobs table as it might not exist
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(4, 2),
  overtime_hours DECIMAL(4, 2) DEFAULT 0,
  hourly_rate DECIMAL(10, 2),
  total_pay DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, paid
  approved_by UUID REFERENCES auth.users(id),
  approved_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_staff_id ON employees(staff_id);
CREATE INDEX idx_contracts_employee ON employee_contracts(employee_id);
CREATE INDEX idx_contracts_status ON employee_contracts(status);
CREATE INDEX idx_assets_employee ON employee_assets(employee_id);
CREATE INDEX idx_onboarding_employee ON employee_onboarding(employee_id);
CREATE INDEX idx_time_reports_employee ON employee_time_reports(employee_id);
CREATE INDEX idx_time_reports_date ON employee_time_reports(date);

-- Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_vehicle_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_time_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - should be refined based on your auth strategy)
CREATE POLICY "Employees are viewable by authenticated users" ON employees
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Employees can be created by authenticated users" ON employees
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Employees can be updated by authenticated users" ON employees
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON employee_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON employee_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();