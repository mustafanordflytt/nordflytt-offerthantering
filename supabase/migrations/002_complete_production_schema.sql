-- Complete Production Schema for Nordflytt CRM
-- This migration creates all necessary tables for the complete business workflow
-- Run this after ensuring 001_complete_business_workflow.sql has been executed

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENHANCED CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_number VARCHAR(50) UNIQUE NOT NULL, -- CUST001, CUST002, etc.
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    mobile_phone VARCHAR(50),
    address TEXT,
    postal_code VARCHAR(10),
    city VARCHAR(100),
    customer_type VARCHAR(50) DEFAULT 'private', -- private, business
    organization_number VARCHAR(50),
    vat_number VARCHAR(50),
    billing_address TEXT,
    billing_postal_code VARCHAR(10),
    billing_city VARCHAR(100),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    preferred_communication VARCHAR(50) DEFAULT 'email', -- email, sms, phone
    tags JSONB DEFAULT '[]', -- ['VIP', 'Recurring', 'Problem']
    notes TEXT,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- days
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, blacklisted
    blacklist_reason TEXT,
    source VARCHAR(100), -- website, referral, google, facebook, etc.
    referrer_customer_id UUID REFERENCES customers_enhanced(id),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_enhanced_email ON customers_enhanced(email);
CREATE INDEX IF NOT EXISTS idx_customers_enhanced_phone ON customers_enhanced(phone);
CREATE INDEX IF NOT EXISTS idx_customers_enhanced_status ON customers_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_customers_enhanced_type ON customers_enhanced(customer_type);

-- =====================================================
-- ENHANCED OFFERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS offers_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_number VARCHAR(50) UNIQUE NOT NULL, -- OFF2025001, OFF2025002, etc.
    customer_id UUID REFERENCES customers_enhanced(id) ON DELETE CASCADE,
    
    -- Move details
    move_date DATE NOT NULL,
    move_time TIME NOT NULL,
    flexible_date BOOLEAN DEFAULT false,
    alternative_dates JSONB DEFAULT '[]',
    
    -- Addresses
    from_address TEXT NOT NULL,
    from_postal_code VARCHAR(10),
    from_city VARCHAR(100),
    from_floor INTEGER,
    from_elevator BOOLEAN DEFAULT false,
    from_parking_distance INTEGER DEFAULT 0,
    from_access_codes TEXT,
    from_living_area DECIMAL(6,2),
    
    to_address TEXT NOT NULL,
    to_postal_code VARCHAR(10),
    to_city VARCHAR(100),
    to_floor INTEGER,
    to_elevator BOOLEAN DEFAULT false,
    to_parking_distance INTEGER DEFAULT 0,
    to_access_codes TEXT,
    to_living_area DECIMAL(6,2),
    
    -- Services and pricing
    services JSONB NOT NULL DEFAULT '[]', -- ['Flytt', 'Packning', 'Städning']
    additional_services JSONB DEFAULT '[]',
    volume_m3 DECIMAL(6,2),
    estimated_hours DECIMAL(5,2),
    hourly_rate DECIMAL(8,2),
    fixed_price DECIMAL(10,2),
    rut_deduction DECIMAL(10,2) DEFAULT 0,
    vat_rate DECIMAL(4,2) DEFAULT 25,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_reason TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- ML predictions
    ml_estimated_hours DECIMAL(5,2),
    ml_confidence DECIMAL(5,4),
    ml_model_version VARCHAR(50),
    
    -- Status and validity
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, expired
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    valid_until DATE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Terms and conditions
    payment_terms TEXT,
    special_conditions TEXT,
    insurance_included BOOLEAN DEFAULT true,
    insurance_details JSONB,
    
    -- Attachments and notes
    attachments JSONB DEFAULT '[]', -- [{name, url, type}]
    internal_notes TEXT,
    customer_notes TEXT,
    
    -- Metadata
    source VARCHAR(100), -- website, phone, email, sales_visit
    campaign_code VARCHAR(50),
    sales_person VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for offers
CREATE INDEX IF NOT EXISTS idx_offers_enhanced_customer ON offers_enhanced(customer_id);
CREATE INDEX IF NOT EXISTS idx_offers_enhanced_status ON offers_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_offers_enhanced_move_date ON offers_enhanced(move_date);
CREATE INDEX IF NOT EXISTS idx_offers_enhanced_created ON offers_enhanced(created_at);

-- =====================================================
-- ENHANCED JOBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_number VARCHAR(50) UNIQUE NOT NULL, -- JOB2025001, etc.
    offer_id UUID REFERENCES offers_enhanced(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers_enhanced(id) ON DELETE CASCADE,
    
    -- Schedule
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Team assignment
    team_leader_id UUID,
    team_members JSONB DEFAULT '[]', -- [{id, name, role, hours_worked}]
    vehicles JSONB DEFAULT '[]', -- [{id, registration, type}]
    
    -- Job details (copy from offer)
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    services JSONB NOT NULL,
    volume_m3 DECIMAL(6,2),
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled
    sub_status VARCHAR(100), -- on_way, loading, transit, unloading, cleaning
    progress_percentage INTEGER DEFAULT 0,
    
    -- Quality and documentation
    pre_inspection_done BOOLEAN DEFAULT false,
    pre_inspection_notes TEXT,
    post_inspection_done BOOLEAN DEFAULT false,
    post_inspection_notes TEXT,
    photos JSONB DEFAULT '[]', -- [{phase, url, timestamp, location, notes}]
    damages JSONB DEFAULT '[]', -- [{item, description, photos, reported_by}]
    
    -- Customer communication
    customer_notified BOOLEAN DEFAULT false,
    customer_confirmed BOOLEAN DEFAULT false,
    arrival_notification_sent BOOLEAN DEFAULT false,
    completion_notification_sent BOOLEAN DEFAULT false,
    
    -- Financial
    additional_charges JSONB DEFAULT '[]', -- [{description, amount, reason}]
    final_price DECIMAL(10,2),
    invoice_id UUID,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, invoiced, paid
    
    -- Ratings and feedback
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    internal_rating INTEGER CHECK (internal_rating >= 1 AND internal_rating <= 5),
    internal_feedback TEXT,
    
    -- Metadata
    weather_conditions VARCHAR(100),
    traffic_conditions VARCHAR(100),
    completion_notes TEXT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_enhanced_customer ON jobs_enhanced(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_enhanced_offer ON jobs_enhanced(offer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_enhanced_status ON jobs_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_jobs_enhanced_scheduled ON jobs_enhanced(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_enhanced_team_leader ON jobs_enhanced(team_leader_id);

-- =====================================================
-- STAFF/EMPLOYEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Employment details
    role VARCHAR(50) NOT NULL, -- admin, team_leader, mover, driver, cleaner
    department VARCHAR(50),
    employment_type VARCHAR(50) DEFAULT 'full_time', -- full_time, part_time, contractor
    hire_date DATE NOT NULL,
    termination_date DATE,
    
    -- Access and authentication
    username VARCHAR(100) UNIQUE,
    password_hash TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    
    -- Personal details
    personal_number VARCHAR(50),
    address TEXT,
    postal_code VARCHAR(10),
    city VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    
    -- Skills and certifications
    skills JSONB DEFAULT '[]', -- ['heavy_lifting', 'driving_license_b', 'forklift']
    certifications JSONB DEFAULT '[]', -- [{type, number, expires_at}]
    languages JSONB DEFAULT '["swedish"]',
    
    -- Work preferences
    preferred_hours_per_week INTEGER DEFAULT 40,
    available_days JSONB DEFAULT '["mon","tue","wed","thu","fri"]',
    unavailable_dates JSONB DEFAULT '[]',
    
    -- Performance
    total_jobs_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    performance_notes TEXT,
    
    -- Payroll
    hourly_rate DECIMAL(8,2),
    monthly_salary DECIMAL(10,2),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    
    -- Metadata
    profile_photo_url TEXT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for staff
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);

-- =====================================================
-- VEHICLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- van, truck, trailer
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    
    -- Capacity
    cargo_volume_m3 DECIMAL(6,2),
    max_weight_kg INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'available', -- available, in_use, maintenance, retired
    current_job_id UUID REFERENCES jobs_enhanced(id),
    current_driver_id UUID REFERENCES staff(id),
    
    -- Maintenance
    last_service_date DATE,
    next_service_date DATE,
    mileage INTEGER,
    fuel_card_number VARCHAR(50),
    
    -- Insurance and compliance
    insurance_company VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    insurance_expires DATE,
    inspection_expires DATE,
    
    -- Tracking
    gps_enabled BOOLEAN DEFAULT false,
    gps_device_id VARCHAR(100),
    last_known_location JSONB,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers_enhanced(id),
    job_id UUID REFERENCES jobs_enhanced(id),
    
    -- Invoice details
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Line items
    line_items JSONB NOT NULL, -- [{description, quantity, unit_price, vat_rate, total}]
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2) NOT NULL,
    rut_deduction DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, partial, overdue
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_date DATE,
    payment_method VARCHAR(50), -- bank_transfer, card, cash
    payment_reference VARCHAR(100),
    
    -- Communication
    sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE[],
    
    -- Metadata
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COMMUNICATIONS LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers_enhanced(id),
    job_id UUID REFERENCES jobs_enhanced(id),
    offer_id UUID REFERENCES offers_enhanced(id),
    
    type VARCHAR(50) NOT NULL, -- email, sms, phone, meeting
    direction VARCHAR(20) NOT NULL, -- inbound, outbound
    subject TEXT,
    content TEXT,
    
    -- Contact details
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, failed, read
    
    -- Metadata
    attachments JSONB DEFAULT '[]',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REAL-TIME NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_type VARCHAR(50), -- staff, customer, admin
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- info, warning, error, success
    category VARCHAR(50), -- job_update, payment, system, offer
    
    -- References
    related_id UUID,
    related_type VARCHAR(50), -- job, offer, invoice
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Action
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Scheduling
    send_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- create, update, delete
    
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    user_id VARCHAR(255),
    user_ip VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- =====================================================
-- FUNCTIONS FOR AUTOMATIC WORKFLOWS
-- =====================================================

-- Function to generate next number in sequence
CREATE OR REPLACE FUNCTION generate_next_number(prefix TEXT, table_name TEXT, column_name TEXT)
RETURNS TEXT AS $$
DECLARE
    last_number INTEGER;
    new_number TEXT;
BEGIN
    EXECUTE format('SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM %L) AS INTEGER)), 0) FROM %I WHERE %I LIKE %L',
        column_name, length(prefix) + 1, table_name, column_name, prefix || '%')
    INTO last_number;
    
    new_number := prefix || LPAD((last_number + 1)::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate customer number
CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_number IS NULL THEN
        NEW.customer_number := generate_next_number('CUST', 'customers_enhanced', 'customer_number');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_customer_number
BEFORE INSERT ON customers_enhanced
FOR EACH ROW
EXECUTE FUNCTION generate_customer_number();

-- Trigger to auto-generate offer number
CREATE OR REPLACE FUNCTION generate_offer_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.offer_number IS NULL THEN
        NEW.offer_number := generate_next_number('OFF' || EXTRACT(YEAR FROM NOW())::TEXT, 'offers_enhanced', 'offer_number');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_offer_number
BEFORE INSERT ON offers_enhanced
FOR EACH ROW
EXECUTE FUNCTION generate_offer_number();

-- Trigger to auto-generate job number
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.job_number IS NULL THEN
        NEW.job_number := generate_next_number('JOB' || EXTRACT(YEAR FROM NOW())::TEXT, 'jobs_enhanced', 'job_number');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_job_number
BEFORE INSERT ON jobs_enhanced
FOR EACH ROW
EXECUTE FUNCTION generate_job_number();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_customers_timestamp
BEFORE UPDATE ON customers_enhanced
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_offers_timestamp
BEFORE UPDATE ON offers_enhanced
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_jobs_timestamp
BEFORE UPDATE ON jobs_enhanced
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_staff_timestamp
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- VIEWS FOR EASIER QUERYING
-- =====================================================

-- Active jobs view
CREATE OR REPLACE VIEW active_jobs AS
SELECT 
    j.*,
    c.name as customer_name,
    c.phone as customer_phone,
    c.email as customer_email,
    o.total_price as offer_price
FROM jobs_enhanced j
JOIN customers_enhanced c ON j.customer_id = c.id
LEFT JOIN offers_enhanced o ON j.offer_id = o.id
WHERE j.status IN ('scheduled', 'confirmed', 'in_progress')
AND j.scheduled_date >= CURRENT_DATE;

-- Customer lifetime value view
CREATE OR REPLACE VIEW customer_statistics AS
SELECT 
    c.id,
    c.name,
    c.email,
    COUNT(DISTINCT j.id) as total_jobs,
    COUNT(DISTINCT o.id) as total_offers,
    SUM(CASE WHEN j.status = 'completed' THEN j.final_price ELSE 0 END) as lifetime_value,
    AVG(j.customer_rating) as average_rating,
    MAX(j.scheduled_date) as last_job_date
FROM customers_enhanced c
LEFT JOIN jobs_enhanced j ON c.id = j.customer_id
LEFT JOIN offers_enhanced o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.email;

-- Staff performance view
CREATE OR REPLACE VIEW staff_performance AS
SELECT 
    s.id,
    s.first_name || ' ' || s.last_name as full_name,
    s.role,
    COUNT(DISTINCT j.id) as jobs_completed,
    SUM(j.actual_hours) as total_hours_worked,
    AVG(j.customer_rating) as average_customer_rating
FROM staff s
LEFT JOIN jobs_enhanced j ON j.team_members @> jsonb_build_array(jsonb_build_object('id', s.id::text))
WHERE j.status = 'completed'
GROUP BY s.id, s.first_name, s.last_name, s.role;

-- =====================================================
-- SEED DATA FOR TESTING
-- =====================================================

-- Insert test staff members
INSERT INTO staff (employee_number, first_name, last_name, email, phone, role, hire_date, hourly_rate)
VALUES 
    ('EMP001', 'Anders', 'Andersson', 'anders@nordflytt.se', '070-111-2222', 'team_leader', '2020-01-15', 250),
    ('EMP002', 'Björn', 'Björnsson', 'bjorn@nordflytt.se', '070-222-3333', 'mover', '2021-03-20', 200),
    ('EMP003', 'Carl', 'Carlsson', 'carl@nordflytt.se', '070-333-4444', 'driver', '2019-06-10', 220)
ON CONFLICT (email) DO NOTHING;

-- Insert test vehicles
INSERT INTO vehicles (registration_number, type, make, model, cargo_volume_m3, max_weight_kg)
VALUES 
    ('ABC123', 'truck', 'Volvo', 'FL', 35, 7500),
    ('XYZ789', 'van', 'Mercedes', 'Sprinter', 20, 3500)
ON CONFLICT (registration_number) DO NOTHING;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable Row Level Security
ALTER TABLE customers_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example for customers)
CREATE POLICY "Users can view all customers" ON customers_enhanced
    FOR SELECT USING (true);

CREATE POLICY "Users can insert customers" ON customers_enhanced
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update customers" ON customers_enhanced
    FOR UPDATE USING (true);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================