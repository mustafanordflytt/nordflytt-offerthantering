-- Enhanced Leads Module for CRM System
-- This migration enhances the leads table to match frontend requirements

-- First, let's add missing columns to the existing leads table
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'name') THEN
        ALTER TABLE leads ADD COLUMN name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email') THEN
        ALTER TABLE leads ADD COLUMN email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'phone') THEN
        ALTER TABLE leads ADD COLUMN phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'company_name') THEN
        ALTER TABLE leads ADD COLUMN company_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'estimated_value') THEN
        ALTER TABLE leads ADD COLUMN estimated_value DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'expected_close_date') THEN
        ALTER TABLE leads ADD COLUMN expected_close_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_score') THEN
        ALTER TABLE leads ADD COLUMN lead_score INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'tags') THEN
        ALTER TABLE leads ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'metadata') THEN
        ALTER TABLE leads ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'created_by') THEN
        ALTER TABLE leads ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'updated_by') THEN
        ALTER TABLE leads ADD COLUMN updated_by UUID;
    END IF;
END $$;

-- Update status values to match frontend expectations
UPDATE leads 
SET status = CASE 
    WHEN status = 'active' THEN 'new'
    WHEN status = 'Ny' THEN 'new'
    WHEN status = 'Kontaktad' THEN 'contacted'
    WHEN status = 'Kvalificerad' THEN 'qualified'
    WHEN status = 'Offert skickad' THEN 'proposal'
    WHEN status = 'Förhandling' THEN 'negotiation'
    WHEN status = 'Vunnen' THEN 'closed_won'
    WHEN status = 'Förlorad' THEN 'closed_lost'
    WHEN status = 'converted' THEN 'closed_won'
    WHEN status = 'lost' THEN 'closed_lost'
    ELSE status
END
WHERE status IS NOT NULL;

-- Create lead_activities table for tracking interactions
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL, -- call, email, meeting, note, task
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_source_tracking table for analytics
CREATE TABLE IF NOT EXISTS lead_source_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    source VARCHAR(100) NOT NULL,
    medium VARCHAR(100),
    campaign VARCHAR(255),
    content TEXT,
    referrer_url TEXT,
    landing_page TEXT,
    utm_params JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_status_history table for tracking pipeline movement
CREATE TABLE IF NOT EXISTS lead_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES crm_users(id),
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_assignments table for tracking assignment history
CREATE TABLE IF NOT EXISTS lead_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    assigned_to UUID REFERENCES crm_users(id),
    assigned_by UUID REFERENCES crm_users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unassigned_at TIMESTAMP WITH TIME ZONE,
    reason TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_estimated_value ON leads(estimated_value);
CREATE INDEX IF NOT EXISTS idx_leads_expected_close_date ON leads(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_source_tracking_lead_id ON lead_source_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_source_tracking_source ON lead_source_tracking(source);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_to ON lead_assignments(assigned_to);

-- Enable Row Level Security
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_source_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_activities
CREATE POLICY "CRM users can view all lead activities" ON lead_activities
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "CRM users can create lead activities" ON lead_activities
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "CRM users can update their own activities" ON lead_activities
    FOR UPDATE USING (created_by = auth.uid() OR auth.uid() IN (
        SELECT id FROM crm_users WHERE role IN ('admin', 'manager')
    ));

-- RLS Policies for lead_source_tracking
CREATE POLICY "CRM users can view lead sources" ON lead_source_tracking
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

-- RLS Policies for lead_status_history
CREATE POLICY "CRM users can view status history" ON lead_status_history
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

-- RLS Policies for lead_assignments
CREATE POLICY "CRM users can view assignments" ON lead_assignments
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

-- Create function to calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(p_lead_id INTEGER) 
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    lead_record RECORD;
    activity_count INTEGER;
    days_since_creation INTEGER;
BEGIN
    -- Get lead details
    SELECT * INTO lead_record FROM leads WHERE id = p_lead_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Score based on estimated value
    IF lead_record.estimated_value >= 50000 THEN
        score := score + 30;
    ELSIF lead_record.estimated_value >= 25000 THEN
        score := score + 20;
    ELSIF lead_record.estimated_value >= 10000 THEN
        score := score + 10;
    END IF;
    
    -- Score based on source
    CASE lead_record.source
        WHEN 'referral' THEN score := score + 25;
        WHEN 'website' THEN score := score + 15;
        WHEN 'marketing' THEN score := score + 10;
        WHEN 'cold_call' THEN score := score + 5;
        ELSE score := score + 5;
    END CASE;
    
    -- Score based on status progression
    CASE lead_record.status
        WHEN 'contacted' THEN score := score + 10;
        WHEN 'qualified' THEN score := score + 20;
        WHEN 'proposal' THEN score := score + 30;
        WHEN 'negotiation' THEN score := score + 40;
        ELSE score := score + 0;
    END CASE;
    
    -- Score based on activity count
    SELECT COUNT(*) INTO activity_count 
    FROM lead_activities 
    WHERE lead_id = p_lead_id;
    
    score := score + LEAST(activity_count * 5, 20);
    
    -- Score based on recency
    days_since_creation := EXTRACT(DAY FROM NOW() - lead_record.created_at);
    IF days_since_creation <= 7 THEN
        score := score + 10;
    ELSIF days_since_creation <= 14 THEN
        score := score + 5;
    END IF;
    
    -- Cap score at 100
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-assign leads
CREATE OR REPLACE FUNCTION auto_assign_lead(p_lead_id INTEGER) 
RETURNS UUID AS $$
DECLARE
    assigned_user_id UUID;
    min_lead_count INTEGER;
BEGIN
    -- Find user with least number of active leads
    SELECT cu.id INTO assigned_user_id
    FROM crm_users cu
    LEFT JOIN (
        SELECT assigned_to, COUNT(*) as lead_count
        FROM leads
        WHERE status NOT IN ('closed_won', 'closed_lost')
        GROUP BY assigned_to
    ) lc ON lc.assigned_to::UUID = cu.id
    WHERE cu.role IN ('admin', 'manager', 'employee')
    ORDER BY COALESCE(lc.lead_count, 0) ASC
    LIMIT 1;
    
    -- Update lead assignment
    IF assigned_user_id IS NOT NULL THEN
        UPDATE leads 
        SET assigned_to = assigned_user_id::TEXT
        WHERE id = p_lead_id;
        
        -- Log assignment
        INSERT INTO lead_assignments (lead_id, assigned_to, assigned_by)
        VALUES (p_lead_id, assigned_user_id, assigned_user_id);
    END IF;
    
    RETURN assigned_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to convert lead to customer
CREATE OR REPLACE FUNCTION convert_lead_to_customer(p_lead_id INTEGER) 
RETURNS INTEGER AS $$
DECLARE
    new_customer_id INTEGER;
    lead_record RECORD;
BEGIN
    -- Get lead details
    SELECT * INTO lead_record FROM leads WHERE id = p_lead_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;
    
    -- Check if already converted
    IF lead_record.customer_id IS NOT NULL THEN
        RETURN lead_record.customer_id;
    END IF;
    
    -- Create customer if doesn't exist
    INSERT INTO customers (
        customer_name,
        customer_email,
        customer_phone,
        customer_type,
        created_at
    ) VALUES (
        lead_record.name,
        lead_record.email,
        lead_record.phone,
        CASE WHEN lead_record.company_name IS NOT NULL THEN 'business' ELSE 'private' END,
        NOW()
    ) RETURNING id INTO new_customer_id;
    
    -- Update lead with customer reference
    UPDATE leads 
    SET 
        customer_id = new_customer_id,
        status = 'closed_won',
        conversion_date = NOW(),
        updated_at = NOW()
    WHERE id = p_lead_id;
    
    -- Log status change
    INSERT INTO lead_status_history (lead_id, old_status, new_status, reason)
    VALUES (p_lead_id, lead_record.status, 'closed_won', 'Lead converted to customer');
    
    RETURN new_customer_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update lead score on changes
CREATE OR REPLACE FUNCTION update_lead_score_trigger() RETURNS TRIGGER AS $$
BEGIN
    NEW.lead_score := calculate_lead_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_score
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_score_trigger();

-- Create trigger to log status changes
CREATE OR REPLACE FUNCTION log_lead_status_change() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lead_status_history (
            lead_id,
            old_status,
            new_status,
            changed_by,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.updated_by,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_lead_status_change
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_leads_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();

-- Grant permissions
GRANT ALL ON leads TO authenticated;
GRANT ALL ON lead_activities TO authenticated;
GRANT ALL ON lead_source_tracking TO authenticated;
GRANT ALL ON lead_status_history TO authenticated;
GRANT ALL ON lead_assignments TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add sample data for development
INSERT INTO leads (
    lead_id,
    name,
    email,
    phone,
    company_name,
    source,
    status,
    priority,
    estimated_value,
    expected_close_date,
    assigned_to,
    notes
) VALUES 
(
    'LEAD001',
    'Anna Andersson',
    'anna.andersson@example.com',
    '+46 70 123 45 67',
    NULL,
    'website',
    'new',
    'high',
    25000,
    CURRENT_DATE + INTERVAL '14 days',
    NULL,
    'Interested in private moving service for 3-room apartment'
),
(
    'LEAD002',
    'Företaget AB',
    'kontakt@foretaget.se',
    '+46 8 123 45 67',
    'Företaget AB',
    'referral',
    'contacted',
    'high',
    75000,
    CURRENT_DATE + INTERVAL '30 days',
    NULL,
    'Office relocation, 50 employees'
),
(
    'LEAD003',
    'Erik Nilsson',
    'erik.nilsson@email.com',
    '+46 73 234 56 78',
    NULL,
    'marketing',
    'qualified',
    'medium',
    15000,
    CURRENT_DATE + INTERVAL '7 days',
    NULL,
    'Small apartment move, price sensitive'
)
ON CONFLICT (lead_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Leads module enhancement completed successfully';
    RAISE NOTICE '📊 Tables created/enhanced: leads, lead_activities, lead_source_tracking, lead_status_history, lead_assignments';
    RAISE NOTICE '🔐 RLS policies applied for security';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🎯 Lead scoring and auto-assignment functions available';
    RAISE NOTICE '🔄 Automatic status tracking and lead conversion enabled';
END $$;