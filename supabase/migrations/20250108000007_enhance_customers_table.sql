-- Enhanced Customers Table
-- This migration adds missing fields to the customers table

-- Add missing columns to customers table if they don't exist
DO $$
BEGIN
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'status') THEN
        ALTER TABLE customers ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
    
    -- Add notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'notes') THEN
        ALTER TABLE customers ADD COLUMN notes TEXT;
    END IF;
    
    -- Add tags column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tags') THEN
        ALTER TABLE customers ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add metadata column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'metadata') THEN
        ALTER TABLE customers ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Add created_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'created_by') THEN
        ALTER TABLE customers ADD COLUMN created_by UUID;
    END IF;
    
    -- Add updated_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'updated_by') THEN
        ALTER TABLE customers ADD COLUMN updated_by UUID;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING GIN(tags);

-- Create customer_activities table for tracking interactions
CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL, -- call, email, meeting, note, booking
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_documents table for storing documents
CREATE TABLE IF NOT EXISTS customer_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- contract, invoice, agreement, other
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES crm_users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_notes table for detailed notes
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general', -- general, complaint, feedback, request
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_type ON customer_activities(type);
CREATE INDEX IF NOT EXISTS idx_customer_activities_date ON customer_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_customer_documents_customer_id ON customer_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type ON customer_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_type ON customer_notes(note_type);

-- Enable Row Level Security
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_activities
CREATE POLICY "CRM users can view all customer activities" ON customer_activities
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "CRM users can create customer activities" ON customer_activities
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "CRM users can update their own activities" ON customer_activities
    FOR UPDATE USING (created_by = auth.uid() OR auth.uid() IN (
        SELECT id FROM crm_users WHERE role IN ('admin', 'manager')
    ));

-- RLS Policies for customer_documents
CREATE POLICY "CRM users can view customer documents" ON customer_documents
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "CRM users with write permission can upload documents" ON customer_documents
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT id FROM crm_users WHERE role IN ('admin', 'manager', 'employee')
    ));

-- RLS Policies for customer_notes
CREATE POLICY "CRM users can view customer notes" ON customer_notes
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "CRM users can create notes" ON customer_notes
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Users can update their own notes" ON customer_notes
    FOR UPDATE USING (created_by = auth.uid() OR auth.uid() IN (
        SELECT id FROM crm_users WHERE role IN ('admin', 'manager')
    ));

-- Create function to calculate customer lifetime value
CREATE OR REPLACE FUNCTION calculate_customer_lifetime_value(p_customer_id INTEGER) 
RETURNS DECIMAL AS $$
DECLARE
    total_value DECIMAL := 0;
BEGIN
    -- Calculate from accepted offers
    SELECT COALESCE(SUM(total_price), 0) INTO total_value
    FROM offers
    WHERE customer_id = p_customer_id
    AND status = 'accepted';
    
    -- Add completed job values
    SELECT total_value + COALESCE(SUM(final_price), 0) INTO total_value
    FROM jobs
    WHERE customer_id = p_customer_id
    AND status = 'completed';
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql;

-- Create function to get customer statistics
CREATE OR REPLACE FUNCTION get_customer_statistics(p_customer_id INTEGER) 
RETURNS TABLE (
    total_bookings INTEGER,
    total_jobs INTEGER,
    total_offers INTEGER,
    accepted_offers INTEGER,
    completed_jobs INTEGER,
    total_revenue DECIMAL,
    avg_job_value DECIMAL,
    last_activity_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM bookings WHERE customer_id = p_customer_id)::INTEGER as total_bookings,
        (SELECT COUNT(*) FROM jobs WHERE customer_id = p_customer_id)::INTEGER as total_jobs,
        (SELECT COUNT(*) FROM offers WHERE customer_id = p_customer_id)::INTEGER as total_offers,
        (SELECT COUNT(*) FROM offers WHERE customer_id = p_customer_id AND status = 'accepted')::INTEGER as accepted_offers,
        (SELECT COUNT(*) FROM jobs WHERE customer_id = p_customer_id AND status = 'completed')::INTEGER as completed_jobs,
        calculate_customer_lifetime_value(p_customer_id) as total_revenue,
        (SELECT AVG(final_price) FROM jobs WHERE customer_id = p_customer_id AND status = 'completed' AND final_price > 0) as avg_job_value,
        (SELECT MAX(created_at) FROM (
            SELECT created_at FROM bookings WHERE customer_id = p_customer_id
            UNION ALL
            SELECT created_at FROM jobs WHERE customer_id = p_customer_id
            UNION ALL
            SELECT created_at FROM offers WHERE customer_id = p_customer_id
        ) activities) as last_activity_date;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update customer updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- Create trigger to log customer activities
CREATE OR REPLACE FUNCTION log_customer_activity() RETURNS TRIGGER AS $$
BEGIN
    -- Log when a new booking is created
    IF TG_TABLE_NAME = 'bookings' AND TG_OP = 'INSERT' THEN
        INSERT INTO customer_activities (customer_id, type, title, description, created_by)
        VALUES (NEW.customer_id, 'booking', 'Ny bokning skapad', 
                'Bokning ' || NEW.booking_id || ' skapad', NEW.created_by);
    END IF;
    
    -- Log when a job is completed
    IF TG_TABLE_NAME = 'jobs' AND TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO customer_activities (customer_id, type, title, description)
        VALUES (NEW.customer_id, 'job', 'Uppdrag slutfört', 
                'Uppdrag ' || NEW.job_id || ' har slutförts');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for activity logging
CREATE TRIGGER trigger_log_booking_activity
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION log_customer_activity();

CREATE TRIGGER trigger_log_job_completion
    AFTER UPDATE ON jobs
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION log_customer_activity();

-- Grant permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON customer_activities TO authenticated;
GRANT ALL ON customer_documents TO authenticated;
GRANT ALL ON customer_notes TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Update sample customers with new fields
UPDATE customers 
SET 
    status = 'active',
    tags = ARRAY['vip', 'återkommande']::TEXT[]
WHERE customer_email = 'maria.johansson@example.com';

UPDATE customers 
SET 
    status = 'active',
    tags = ARRAY['företag', 'stor-kund']::TEXT[],
    notes = 'Företagskund med regelbundna kontorsflytt'
WHERE customer_email = 'anders.lindberg@foretag.se';

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Customers module enhanced successfully';
    RAISE NOTICE '📊 New tables created: customer_activities, customer_documents, customer_notes';
    RAISE NOTICE '🔧 Added columns: status, notes, tags, metadata, created_by, updated_by';
    RAISE NOTICE '📈 Statistics functions available: calculate_customer_lifetime_value, get_customer_statistics';
    RAISE NOTICE '🔐 RLS policies applied for security';
    RAISE NOTICE '⚡ Performance indexes created';
END $$;