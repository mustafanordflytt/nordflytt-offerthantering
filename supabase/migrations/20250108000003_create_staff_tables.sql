-- Create Staff Management Tables for CRM
-- This migration creates all necessary tables for staff/employee management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    role VARCHAR(50) NOT NULL DEFAULT 'mover', -- admin, team_leader, mover, driver, cleaner, office
    department VARCHAR(50) DEFAULT 'Operations',
    employment_type VARCHAR(50) DEFAULT 'full_time', -- full_time, part_time, contractor, intern
    employment_status VARCHAR(50) DEFAULT 'active', -- active, on_leave, terminated
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    termination_date DATE,
    
    -- Personal information
    personal_number VARCHAR(50), -- Swedish personnummer
    address TEXT,
    postal_code VARCHAR(10),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Sweden',
    date_of_birth DATE,
    
    -- Emergency contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relation VARCHAR(100),
    
    -- Skills and qualifications
    skills TEXT[], -- Array of skills
    certifications JSONB DEFAULT '[]', -- [{name, issuer, date, expiry}]
    languages TEXT[] DEFAULT '{Swedish}',
    driver_license_types TEXT[], -- B, C, CE, etc
    
    -- Performance metrics
    total_jobs_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    performance_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Authentication (linked to CRM users)
    user_id UUID REFERENCES crm_users(id) ON DELETE SET NULL,
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    avatar_url TEXT,
    created_by UUID REFERENCES crm_users(id),
    updated_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STAFF AVAILABILITY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, busy, on_job, break, off_duty
    current_job_id UUID REFERENCES jobs(id),
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    last_location_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STAFF SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 30,
    schedule_type VARCHAR(50) DEFAULT 'work', -- work, vacation, sick_leave, training, meeting
    job_id UUID REFERENCES jobs(id),
    notes TEXT,
    created_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(staff_id, schedule_date, start_time)
);

-- =====================================================
-- STAFF TIME REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_time_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES jobs(id),
    report_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    break_minutes INTEGER DEFAULT 0,
    total_minutes INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN end_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (end_time - start_time))/60 - break_minutes
            ELSE NULL
        END
    ) STORED,
    hourly_rate DECIMAL(10,2),
    overtime_minutes INTEGER DEFAULT 0,
    overtime_rate DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, paid
    approved_by UUID REFERENCES crm_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STAFF DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- contract, id_copy, certificate, tax_form, etc
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    valid_from DATE,
    valid_until DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES crm_users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STAFF TRAINING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
    training_name VARCHAR(255) NOT NULL,
    training_type VARCHAR(100), -- safety, skill, certification, onboarding
    provider VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    completed BOOLEAN DEFAULT false,
    score DECIMAL(5,2),
    certificate_url TEXT,
    cost DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_department ON staff(department);
CREATE INDEX idx_staff_employment_status ON staff(employment_status);
CREATE INDEX idx_staff_user_id ON staff(user_id);

CREATE INDEX idx_staff_availability_staff_id ON staff_availability(staff_id);
CREATE INDEX idx_staff_availability_status ON staff_availability(status);
CREATE INDEX idx_staff_availability_current_job ON staff_availability(current_job_id);

CREATE INDEX idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX idx_staff_schedules_date ON staff_schedules(schedule_date);
CREATE INDEX idx_staff_schedules_job_id ON staff_schedules(job_id);

CREATE INDEX idx_staff_time_reports_staff_id ON staff_time_reports(staff_id);
CREATE INDEX idx_staff_time_reports_job_id ON staff_time_reports(job_id);
CREATE INDEX idx_staff_time_reports_date ON staff_time_reports(report_date);
CREATE INDEX idx_staff_time_reports_status ON staff_time_reports(status);

CREATE INDEX idx_staff_documents_staff_id ON staff_documents(staff_id);
CREATE INDEX idx_staff_documents_type ON staff_documents(document_type);

CREATE INDEX idx_staff_training_staff_id ON staff_training(staff_id);
CREATE INDEX idx_staff_training_type ON staff_training(training_type);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_time_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_training ENABLE ROW LEVEL SECURITY;

-- Staff table policies
CREATE POLICY "CRM users can view all staff" ON staff FOR SELECT 
USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Managers can manage staff" ON staff FOR ALL 
USING (
    auth.uid() IN (
        SELECT id FROM crm_users 
        WHERE role IN ('admin', 'manager')
    )
);

-- Staff can view their own record
CREATE POLICY "Staff can view own record" ON staff FOR SELECT 
USING (user_id = auth.uid());

-- Similar policies for other tables
CREATE POLICY "View staff availability" ON staff_availability FOR SELECT 
USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Staff can update own availability" ON staff_availability FOR UPDATE 
USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "View schedules" ON staff_schedules FOR SELECT 
USING (
    auth.uid() IN (SELECT id FROM crm_users) OR
    staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

CREATE POLICY "View time reports" ON staff_time_reports FOR SELECT 
USING (
    auth.uid() IN (SELECT id FROM crm_users) OR
    staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

CREATE POLICY "Staff can create own time reports" ON staff_time_reports FOR INSERT 
WITH CHECK (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON staff_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_time_reports_updated_at BEFORE UPDATE ON staff_time_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_training_updated_at BEFORE UPDATE ON staff_training
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =====================================================
INSERT INTO staff (
    employee_number, first_name, last_name, email, phone, mobile,
    role, department, hire_date, address, city,
    emergency_contact_name, emergency_contact_phone,
    skills, languages, driver_license_types
) VALUES 
(
    'EMP001',
    'Lars',
    'Andersson',
    'lars.andersson@nordflytt.se',
    '+46 8 123 45 67',
    '+46 70 123 45 67',
    'team_leader',
    'Operations',
    '2020-01-15',
    'Kungsgatan 10',
    'Stockholm',
    'Anna Andersson',
    '+46 70 987 65 43',
    ARRAY['Projektledning', 'Kundservice', 'Kvalitetssäkring'],
    ARRAY['Swedish', 'English'],
    ARRAY['B', 'C']
),
(
    'EMP002',
    'Emma',
    'Svensson',
    'emma.svensson@nordflytt.se',
    '+46 8 234 56 78',
    '+46 70 234 56 78',
    'mover',
    'Operations',
    '2021-03-20',
    'Vasagatan 25',
    'Stockholm',
    'Johan Svensson',
    '+46 70 876 54 32',
    ARRAY['Packning', 'Lastning', 'Möbelmontering'],
    ARRAY['Swedish', 'English', 'Polish'],
    ARRAY['B']
),
(
    'EMP003',
    'Mohamed',
    'Hassan',
    'mohamed.hassan@nordflytt.se',
    '+46 8 345 67 89',
    '+46 70 345 67 89',
    'driver',
    'Operations',
    '2019-06-01',
    'Rinkeby Allé 15',
    'Stockholm',
    'Fatima Hassan',
    '+46 70 765 43 21',
    ARRAY['Lastbilskörning', 'Ruteplanering', 'Fordonsvård'],
    ARRAY['Swedish', 'Arabic', 'English'],
    ARRAY['B', 'C', 'CE']
)
ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone;

-- Set initial availability
INSERT INTO staff_availability (staff_id, status)
SELECT id, 'available' FROM staff
ON CONFLICT DO NOTHING;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get available staff for a specific date/time
CREATE OR REPLACE FUNCTION get_available_staff(
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_skills TEXT[] DEFAULT NULL
)
RETURNS TABLE(
    staff_id UUID,
    full_name TEXT,
    role VARCHAR(50),
    skills TEXT[],
    average_rating DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.first_name || ' ' || s.last_name,
        s.role,
        s.skills,
        s.average_rating
    FROM staff s
    LEFT JOIN staff_schedules ss ON s.id = ss.staff_id 
        AND ss.schedule_date = p_date
        AND (
            (ss.start_time <= p_start_time AND ss.end_time > p_start_time) OR
            (ss.start_time < p_end_time AND ss.end_time >= p_end_time) OR
            (ss.start_time >= p_start_time AND ss.end_time <= p_end_time)
        )
    WHERE 
        s.employment_status = 'active'
        AND ss.id IS NULL -- Not already scheduled
        AND (p_skills IS NULL OR s.skills && p_skills) -- Has required skills
    ORDER BY s.average_rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate staff utilization
CREATE OR REPLACE FUNCTION calculate_staff_utilization(
    p_staff_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS DECIMAL AS $$
DECLARE
    total_work_minutes INTEGER;
    total_available_minutes INTEGER;
    utilization DECIMAL(5,2);
BEGIN
    -- Calculate total worked minutes
    SELECT COALESCE(SUM(total_minutes), 0) INTO total_work_minutes
    FROM staff_time_reports
    WHERE staff_id = p_staff_id
        AND report_date BETWEEN p_start_date AND p_end_date
        AND status = 'approved';
    
    -- Calculate total available minutes (8 hours per workday)
    SELECT COUNT(*) * 8 * 60 INTO total_available_minutes
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS d
    WHERE EXTRACT(DOW FROM d) NOT IN (0, 6); -- Exclude weekends
    
    IF total_available_minutes > 0 THEN
        utilization := (total_work_minutes::DECIMAL / total_available_minutes) * 100;
    ELSE
        utilization := 0;
    END IF;
    
    RETURN ROUND(utilization, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANTS
-- =====================================================
GRANT ALL ON staff TO authenticated;
GRANT ALL ON staff_availability TO authenticated;
GRANT ALL ON staff_schedules TO authenticated;
GRANT ALL ON staff_time_reports TO authenticated;
GRANT ALL ON staff_documents TO authenticated;
GRANT ALL ON staff_training TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION LOG
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Staff Management Schema created successfully';
    RAISE NOTICE '📊 Tables created: staff, staff_availability, staff_schedules, staff_time_reports, staff_documents, staff_training';
    RAISE NOTICE '🔐 RLS policies applied for data security';
    RAISE NOTICE '📈 Performance indexes created';
    RAISE NOTICE '🎯 Sample staff data inserted';
    RAISE NOTICE '⚡ Utility functions available: get_available_staff, calculate_staff_utilization';
END $$;