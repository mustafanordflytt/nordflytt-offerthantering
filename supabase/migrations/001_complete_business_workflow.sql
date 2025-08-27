-- Complete Database Schema for Nordflytt Business Workflow
-- This migration creates all necessary tables for the complete business workflow

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS staff_schedules CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) UNIQUE NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,
    customer_type VARCHAR(50) DEFAULT 'private', -- private, business
    organization_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX idx_customers_email ON customers(customer_email);

-- Offers/Quotes table  
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    offer_id VARCHAR(50) UNIQUE NOT NULL, -- OFFER001, OFFER002, etc.
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    volume DECIMAL(5,2),
    from_address TEXT,
    to_address TEXT,
    moving_date DATE,
    moving_time TIME,
    services JSONB, -- Array of services like ['Packning', 'Flytt', 'Städning']
    additional_services JSONB,
    total_price DECIMAL(10,2),
    estimated_hours INTEGER,
    status VARCHAR(50) DEFAULT 'active', -- active, expired, accepted, rejected
    ml_confidence DECIMAL(5,4),
    pricing_breakdown JSONB,
    expiry_date DATE,
    discount_percentage INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for offer lookups
CREATE INDEX idx_offers_customer_id ON offers(customer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_moving_date ON offers(moving_date);

-- Leads table
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) UNIQUE NOT NULL, -- LEAD001, LEAD002, etc.
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active', -- active, contacted, qualified, converted, lost
    source VARCHAR(100), -- website, phone, referral, etc.
    notes TEXT,
    follow_up_date DATE,
    assigned_to VARCHAR(255),
    conversion_date TIMESTAMP WITH TIME ZONE,
    lost_reason VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    last_contact_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lead lookups
CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_offer_id ON leads(offer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);

-- Jobs/Uppdrag table
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) UNIQUE NOT NULL, -- JOB001, JOB002, etc.
    booking_number VARCHAR(50) UNIQUE, -- BOOK001, BOOK002, etc.
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    end_time TIME,
    estimated_duration INTEGER, -- in hours
    actual_duration INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    team_assigned JSONB, -- array of staff member objects [{id, name, role}]
    services_requested JSONB, -- ['Packning', 'Flytt', 'Städning']
    additional_services JSONB,
    equipment_needed JSONB,
    special_requirements TEXT,
    from_address TEXT,
    to_address TEXT,
    distance DECIMAL(5,2),
    volume DECIMAL(5,2),
    final_price DECIMAL(10,2),
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, partial, refunded
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    internal_notes TEXT,
    photos JSONB, -- Array of photo URLs for before/during/after
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for job lookups
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_booking_number ON jobs(booking_number);

-- Calendar/Schedule table
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    staff_member_id VARCHAR(255),
    staff_member_name VARCHAR(255),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    event_type VARCHAR(100) DEFAULT 'job', -- job, break, training, meeting, etc.
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for calendar lookups
CREATE INDEX idx_calendar_events_job_id ON calendar_events(job_id);
CREATE INDEX idx_calendar_events_staff_member_id ON calendar_events(staff_member_id);
CREATE INDEX idx_calendar_events_event_date ON calendar_events(event_date);

-- Staff Schedules table
CREATE TABLE staff_schedules (
    id SERIAL PRIMARY KEY,
    staff_member_id VARCHAR(255) NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    shift_start TIME,
    shift_end TIME,
    assigned_jobs JSONB, -- array of job IDs
    availability_status VARCHAR(50) DEFAULT 'available', -- available, busy, off, sick, vacation
    break_start TIME,
    break_end TIME,
    overtime_hours DECIMAL(3,1) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_member_id, date)
);

-- Create indexes for staff schedule lookups
CREATE INDEX idx_staff_schedules_staff_member_id ON staff_schedules(staff_member_id);
CREATE INDEX idx_staff_schedules_date ON staff_schedules(date);
CREATE INDEX idx_staff_schedules_availability ON staff_schedules(availability_status);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries

-- Active jobs view
CREATE VIEW active_jobs AS
SELECT 
    j.*,
    c.customer_name,
    c.customer_email,
    c.customer_phone,
    o.offer_id,
    o.total_price as offer_price
FROM jobs j
JOIN customers c ON j.customer_id = c.id
LEFT JOIN offers o ON j.offer_id = o.id
WHERE j.status IN ('scheduled', 'in_progress');

-- Today's schedule view
CREATE VIEW todays_schedule AS
SELECT 
    ce.*,
    j.booking_number,
    j.from_address,
    j.to_address,
    j.services_requested,
    c.customer_name,
    c.customer_phone
FROM calendar_events ce
LEFT JOIN jobs j ON ce.job_id = j.id
LEFT JOIN customers c ON j.customer_id = c.id
WHERE ce.event_date = CURRENT_DATE
ORDER BY ce.start_time;

-- Lead conversion funnel view
CREATE VIEW lead_conversion_funnel AS
SELECT 
    l.*,
    c.customer_name,
    c.customer_email,
    o.offer_id,
    o.total_price,
    o.moving_date,
    CASE 
        WHEN l.status = 'converted' THEN j.job_id
        ELSE NULL
    END as converted_to_job
FROM leads l
JOIN customers c ON l.customer_id = c.id
LEFT JOIN offers o ON l.offer_id = o.id
LEFT JOIN jobs j ON j.lead_id = l.id;

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Insert sample data for testing
INSERT INTO customers (customer_name, customer_email, customer_phone, customer_type) VALUES
('Maria Johansson', 'maria.johansson@example.com', '+46 70 345 67 89', 'private'),
('Anders Lindberg', 'anders.lindberg@foretag.se', '+46 70 123 45 67', 'business'),
('Lisa Svensson', 'lisa.svensson@gmail.com', '+46 70 987 65 43', 'private');

-- Add more sample data as needed...