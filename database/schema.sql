-- NORDFLYTT CRM DATABASE SCHEMA
-- Core business tables for production use

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Customer Management
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  postal_code VARCHAR(20),
  city VARCHAR(100),
  company_name VARCHAR(255),
  personal_number VARCHAR(20),
  notes TEXT,
  customer_type VARCHAR(50) DEFAULT 'private', -- 'private', 'business'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead Management
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  source VARCHAR(100), -- 'website', 'phone', 'referral', 'offertformulär'
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'quoted', 'converted', 'lost'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  estimated_value DECIMAL(12,2),
  notes TEXT,
  follow_up_date DATE,
  assigned_to VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Job/Uppdrag Management
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  lead_id UUID REFERENCES leads(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  job_type VARCHAR(100), -- 'moving', 'cleaning', 'packing', 'storage'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
  priority VARCHAR(20) DEFAULT 'medium',
  estimated_hours DECIMAL(5,2),
  estimated_cost DECIMAL(12,2),
  final_cost DECIMAL(12,2),
  scheduled_date DATE,
  scheduled_time TIME,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  address_from TEXT,
  address_to TEXT,
  special_requirements TEXT,
  assigned_staff JSONB, -- Array of staff IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Staff Management
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  employee_id VARCHAR(50) UNIQUE,
  position VARCHAR(100),
  department VARCHAR(100),
  hire_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'on_leave'
  skills JSONB, -- Array of skills
  availability JSONB, -- Schedule availability
  hourly_rate DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Job Assignments
CREATE TABLE IF NOT EXISTS job_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) NOT NULL,
  staff_id UUID REFERENCES staff(id) NOT NULL,
  role VARCHAR(100), -- 'lead', 'assistant', 'driver'
  assigned_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'accepted', 'declined', 'completed'
  notes TEXT
);

-- Quotes/Offerter
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  lead_id UUID REFERENCES leads(id),
  quote_number VARCHAR(100) UNIQUE,
  title VARCHAR(255),
  description TEXT,
  line_items JSONB, -- Array of quote line items
  subtotal DECIMAL(12,2),
  tax_amount DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  valid_until DATE,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
  sent_at TIMESTAMP,
  accepted_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Communications Log
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  job_id UUID REFERENCES jobs(id),
  type VARCHAR(50), -- 'email', 'sms', 'phone', 'meeting'
  direction VARCHAR(20), -- 'inbound', 'outbound'
  subject VARCHAR(255),
  content TEXT,
  status VARCHAR(50), -- 'sent', 'delivered', 'failed', 'replied'
  sent_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  updated_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_job_assignments_job_id ON job_assignments(job_id);
CREATE INDEX idx_job_assignments_staff_id ON job_assignments(staff_id);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);

-- Add update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();