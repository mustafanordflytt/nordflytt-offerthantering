-- Complete CRM Integration Schema
-- Ensures all necessary tables and relationships exist for CRM functionality
-- Run this after 20250108000001_create_crm_users.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENSURE CORE CRM TABLES EXIST
-- =====================================================

-- Update customers table to match CRM expectations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        CREATE TABLE customers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(50),
            address TEXT,
            customer_type VARCHAR(50) DEFAULT 'private',
            notes TEXT,
            status VARCHAR(50) DEFAULT 'active',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Ensure customers has all CRM-required columns
DO $$
BEGIN
    -- Add columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
        ALTER TABLE customers ADD COLUMN customer_type VARCHAR(50) DEFAULT 'private';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'status') THEN
        ALTER TABLE customers ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'metadata') THEN
        ALTER TABLE customers ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create leads table if not exists
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    source VARCHAR(100) DEFAULT 'website',
    status VARCHAR(50) DEFAULT 'new',
    priority VARCHAR(20) DEFAULT 'medium',
    estimated_value DECIMAL(10,2) DEFAULT 0,
    expected_close_date DATE,
    assigned_to UUID REFERENCES crm_users(id),
    notes TEXT,
    activities JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table if not exists (or update existing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        CREATE TABLE jobs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            job_number VARCHAR(100) UNIQUE NOT NULL,
            customer_id UUID REFERENCES customers(id),
            customer_name VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'scheduled',
            total_price DECIMAL(10,2) DEFAULT 0,
            scheduled_date DATE,
            scheduled_time TIME,
            completed_at TIMESTAMP WITH TIME ZONE,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Ensure jobs has required columns for CRM dashboard
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'job_number') THEN
        ALTER TABLE jobs ADD COLUMN job_number VARCHAR(100) UNIQUE;
        -- Generate job numbers for existing records
        UPDATE jobs SET job_number = 'JOB' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0') WHERE job_number IS NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'customer_name') THEN
        ALTER TABLE jobs ADD COLUMN customer_name VARCHAR(255);
        -- Populate customer names from customers table
        UPDATE jobs SET customer_name = c.name FROM customers c WHERE c.id = jobs.customer_id AND jobs.customer_name IS NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'total_price') THEN
        ALTER TABLE jobs ADD COLUMN total_price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'scheduled_time') THEN
        ALTER TABLE jobs ADD COLUMN scheduled_time TIME;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'completed_at') THEN
        ALTER TABLE jobs ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- ACTIVITY LOGS FOR CRM
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES crm_users(id) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'customer_created', 'job_updated', etc.
    entity_type VARCHAR(50) NOT NULL,   -- 'customer', 'job', 'lead'
    entity_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CRM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES crm_users(id),
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB NOT NULL,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, setting_key)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at ON jobs(completed_at);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_crm_activities_user_id ON crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_entity ON crm_activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at ON crm_activities(created_at);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_crm_settings_user_key ON crm_settings(user_id, setting_key);

-- =====================================================
-- RLS POLICIES FOR CRM DATA
-- =====================================================

-- Enable RLS on all CRM tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_settings ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "crm_users_can_view_customers" ON customers FOR SELECT 
USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "crm_users_can_manage_customers" ON customers FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM crm_users 
    WHERE role IN ('admin', 'manager') 
    OR (role = 'employee' AND check_user_permission(auth.uid(), 'customers:write'))
  )
);

-- Leads policies
CREATE POLICY "crm_users_can_view_leads" ON leads FOR SELECT 
USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "crm_users_can_manage_leads" ON leads FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM crm_users 
    WHERE role IN ('admin', 'manager') 
    OR (role = 'employee' AND check_user_permission(auth.uid(), 'leads:write'))
    OR assigned_to = auth.uid()
  )
);

-- Jobs policies  
CREATE POLICY "crm_users_can_view_jobs" ON jobs FOR SELECT 
USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "crm_users_can_manage_jobs" ON jobs FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM crm_users 
    WHERE role IN ('admin', 'manager') 
    OR (role = 'employee' AND check_user_permission(auth.uid(), 'jobs:write'))
  )
);

-- Activities policies
CREATE POLICY "crm_users_can_view_activities" ON crm_activities FOR SELECT 
USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "crm_users_can_create_activities" ON crm_activities FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IN (SELECT id FROM crm_users));

-- Settings policies
CREATE POLICY "crm_users_can_manage_own_settings" ON crm_settings FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "crm_admins_can_manage_global_settings" ON crm_settings FOR ALL 
USING (
  is_global = true AND 
  auth.uid() IN (SELECT id FROM crm_users WHERE role = 'admin')
);

-- =====================================================
-- SAMPLE DATA FOR DEVELOPMENT/TESTING
-- =====================================================

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, customer_type, status) VALUES
  ('Anna Andersson', 'anna.andersson@example.com', '+46701234567', 'Gamla Stan 12, Stockholm', 'private', 'active'),
  ('Erik Johansson AB', 'erik@johansson-ab.se', '+46702345678', 'Vasagatan 15, Stockholm', 'business', 'active'),
  ('Maria Lindqvist', 'maria.lindqvist@example.com', '+46703456789', 'Södermalm 8, Stockholm', 'private', 'active')
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Insert sample leads
INSERT INTO leads (name, email, phone, source, status, priority, estimated_value, assigned_to) VALUES
  ('Sofia Karlsson', 'sofia.karlsson@example.com', '+46704567890', 'website', 'new', 'high', 15000, 
   (SELECT id FROM crm_users WHERE role = 'admin' LIMIT 1)),
  ('Mikael Blomberg', 'mikael.blomberg@example.com', '+46705678901', 'referral', 'contacted', 'medium', 8000,
   (SELECT id FROM crm_users WHERE role = 'manager' LIMIT 1))
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  source = EXCLUDED.source,
  status = EXCLUDED.status;

-- Insert sample jobs
INSERT INTO jobs (job_number, customer_id, customer_name, status, total_price, scheduled_date, scheduled_time) VALUES
  ('JOB2025001', 
   (SELECT id FROM customers WHERE email = 'anna.andersson@example.com'), 
   'Anna Andersson', 'scheduled', 12500, '2025-01-15', '08:00'),
  ('JOB2025002', 
   (SELECT id FROM customers WHERE email = 'erik@johansson-ab.se'), 
   'Erik Johansson AB', 'in_progress', 18750, '2025-01-10', '10:00'),
  ('JOB2025003', 
   (SELECT id FROM customers WHERE email = 'maria.lindqvist@example.com'), 
   'Maria Lindqvist', 'completed', 9500, '2024-12-20', '09:00')
ON CONFLICT (job_number) DO UPDATE SET 
  customer_name = EXCLUDED.customer_name,
  total_price = EXCLUDED.total_price,
  scheduled_date = EXCLUDED.scheduled_date;

-- Update completed job
UPDATE jobs SET completed_at = '2024-12-20 15:30:00+01' WHERE job_number = 'JOB2025003' AND completed_at IS NULL;

-- Insert sample CRM activities
INSERT INTO crm_activities (user_id, activity_type, entity_type, entity_id, title, description) VALUES
  ((SELECT id FROM crm_users WHERE role = 'admin' LIMIT 1), 
   'customer_created', 'customer', 
   (SELECT id FROM customers WHERE email = 'anna.andersson@example.com'),
   'Ny kund skapad', 'Anna Andersson registrerad som privatkund'),
  ((SELECT id FROM crm_users WHERE role = 'admin' LIMIT 1), 
   'job_completed', 'job',
   (SELECT id FROM jobs WHERE job_number = 'JOB2025003'),
   'Jobb slutfört', 'Flytt för Maria Lindqvist slutförd framgångsrikt')
ON CONFLICT DO NOTHING;

-- =====================================================
-- UTILITY FUNCTIONS FOR CRM
-- =====================================================

-- Function to log CRM activities
CREATE OR REPLACE FUNCTION log_crm_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_title VARCHAR(255),
    p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO crm_activities (user_id, activity_type, entity_type, entity_id, title, description)
    VALUES (p_user_id, p_activity_type, p_entity_type, p_entity_id, p_title, p_description)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's CRM dashboard stats
CREATE OR REPLACE FUNCTION get_crm_dashboard_stats(p_user_id UUID)
RETURNS TABLE(
    total_customers BIGINT,
    total_leads BIGINT,
    active_jobs BIGINT,
    completed_jobs_this_month BIGINT,
    total_revenue NUMERIC,
    revenue_this_month NUMERIC
) AS $$
BEGIN
    -- Check if user has permission
    IF NOT EXISTS (SELECT 1 FROM crm_users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found in CRM';
    END IF;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM customers WHERE status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM leads WHERE status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation'))::BIGINT,
        (SELECT COUNT(*) FROM jobs WHERE status IN ('scheduled', 'in_progress'))::BIGINT,
        (SELECT COUNT(*) FROM jobs WHERE status = 'completed' AND completed_at >= date_trunc('month', CURRENT_DATE))::BIGINT,
        (SELECT COALESCE(SUM(total_price), 0) FROM jobs WHERE status = 'completed'),
        (SELECT COALESCE(SUM(total_price), 0) FROM jobs WHERE status = 'completed' AND completed_at >= date_trunc('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update job status with activity logging
CREATE OR REPLACE FUNCTION update_job_status(
    p_job_id UUID,
    p_new_status VARCHAR(50),
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    old_status VARCHAR(50);
    job_number VARCHAR(100);
    customer_name VARCHAR(255);
BEGIN
    -- Get current job info
    SELECT status, job_number, customer_name INTO old_status, job_number, customer_name
    FROM jobs WHERE id = p_job_id;
    
    IF old_status IS NULL THEN
        RAISE EXCEPTION 'Job not found';
    END IF;
    
    -- Update job status
    UPDATE jobs 
    SET 
        status = p_new_status,
        completed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = p_job_id;
    
    -- Log activity
    PERFORM log_crm_activity(
        p_user_id,
        'job_status_changed',
        'job',
        p_job_id,
        'Jobbstatus ändrad',
        'Jobb ' || job_number || ' (' || customer_name || ') ändrat från ' || old_status || ' till ' || p_new_status
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC ACTIVITY LOGGING
-- =====================================================

-- Function to log customer changes
CREATE OR REPLACE FUNCTION log_customer_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO crm_activities (user_id, activity_type, entity_type, entity_id, title, description)
        VALUES (
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001'::UUID),
            'customer_created',
            'customer',
            NEW.id,
            'Ny kund skapad',
            'Kund ' || NEW.name || ' (' || NEW.email || ') har skapats'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO crm_activities (user_id, activity_type, entity_type, entity_id, title, description)
            VALUES (
                COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001'::UUID),
                'customer_status_changed',
                'customer',
                NEW.id,
                'Kundstatus ändrad',
                'Kund ' || NEW.name || ' status ändrad från ' || OLD.status || ' till ' || NEW.status
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS customer_activity_trigger ON customers;
CREATE TRIGGER customer_activity_trigger
    AFTER INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION log_customer_changes();

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to CRM tables
GRANT ALL ON customers TO authenticated;
GRANT ALL ON leads TO authenticated;
GRANT ALL ON jobs TO authenticated;
GRANT ALL ON crm_activities TO authenticated;
GRANT ALL ON crm_settings TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION LOG
-- =====================================================

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE '✅ CRM Integration Schema migration completed successfully';
    RAISE NOTICE '📊 Tables created/updated: customers, leads, jobs, crm_activities, crm_settings';
    RAISE NOTICE '🔐 RLS policies applied for data security';
    RAISE NOTICE '📈 Performance indexes created';
    RAISE NOTICE '🎯 Sample data inserted for development';
    RAISE NOTICE '⚡ Utility functions and triggers active';
END $$;