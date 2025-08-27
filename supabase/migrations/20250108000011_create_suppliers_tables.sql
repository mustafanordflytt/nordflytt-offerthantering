-- Suppliers Management System
-- Comprehensive supplier tracking, contracts, and performance management

-- Drop existing tables if they exist
DROP TABLE IF EXISTS supplier_performance_metrics CASCADE;
DROP TABLE IF EXISTS supplier_contracts CASCADE;
DROP TABLE IF EXISTS supplier_contacts CASCADE;
DROP TABLE IF EXISTS supplier_risk_assessments CASCADE;
DROP TABLE IF EXISTS supplier_categories CASCADE;

-- Create supplier categories table
CREATE TABLE supplier_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance existing suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(50) UNIQUE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES supplier_categories(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS organization_number VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS vat_number VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplier_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS delivery_terms VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS minimum_order_value INTEGER DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lead_time_days INTEGER;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplier_rating DECIMAL(3,2);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_critical_supplier BOOLEAN DEFAULT false;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES crm_users(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES crm_users(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create supplier contacts table
CREATE TABLE supplier_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_role VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_mobile VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supplier contracts table
CREATE TABLE supplier_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
    contract_type VARCHAR(50) NOT NULL, -- framework, fixed, subscription, adhoc
    contract_status VARCHAR(50) DEFAULT 'active', -- draft, active, expired, terminated
    
    -- Contract period
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    renewal_notice_days INTEGER DEFAULT 30,
    
    -- Financial terms
    contract_value INTEGER, -- Total contract value in minor units
    currency VARCHAR(3) DEFAULT 'SEK',
    discount_percentage DECIMAL(5,2),
    
    -- SLA and terms
    sla_response_time INTEGER, -- hours
    sla_resolution_time INTEGER, -- hours
    penalty_clauses TEXT,
    
    -- Insurance and compliance
    insurance_amount INTEGER,
    insurance_expiry DATE,
    f_skatt_verified BOOLEAN DEFAULT false,
    f_skatt_expiry DATE,
    
    -- Documents
    contract_url TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Audit
    signed_date DATE,
    signed_by VARCHAR(255),
    created_by UUID REFERENCES crm_users(id),
    updated_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supplier performance metrics table
CREATE TABLE supplier_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
    metric_date DATE NOT NULL,
    
    -- Delivery metrics
    on_time_delivery_rate DECIMAL(5,2), -- percentage
    quality_score DECIMAL(5,2), -- 0-5 scale
    defect_rate DECIMAL(5,2), -- percentage
    
    -- Financial metrics
    invoice_accuracy_rate DECIMAL(5,2), -- percentage
    price_competitiveness DECIMAL(5,2), -- 0-5 scale
    total_spend INTEGER, -- in minor units
    
    -- Service metrics
    response_time_avg INTEGER, -- hours
    issue_resolution_rate DECIMAL(5,2), -- percentage
    customer_satisfaction DECIMAL(5,2), -- 0-5 scale
    
    -- Compliance metrics
    compliance_score DECIMAL(5,2), -- percentage
    safety_incidents INTEGER DEFAULT 0,
    environmental_score DECIMAL(5,2), -- 0-5 scale
    
    -- Overall scores
    overall_performance_score DECIMAL(3,2), -- 0-5 scale
    performance_tier VARCHAR(20), -- premium, standard, review, at_risk
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_supplier_metric_date UNIQUE(supplier_id, metric_date)
);

-- Create supplier risk assessments table
CREATE TABLE supplier_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Risk categories (0-100 scale, higher = more risk)
    financial_risk_score DECIMAL(5,2),
    operational_risk_score DECIMAL(5,2),
    compliance_risk_score DECIMAL(5,2),
    reputational_risk_score DECIMAL(5,2),
    supply_chain_risk_score DECIMAL(5,2),
    
    -- Overall risk
    overall_risk_score DECIMAL(5,2),
    risk_level VARCHAR(20), -- low, medium, high, critical
    
    -- Risk factors
    identified_risks JSONB DEFAULT '[]',
    mitigation_actions JSONB DEFAULT '[]',
    
    -- Review
    reviewed_by UUID REFERENCES crm_users(id),
    review_notes TEXT,
    next_review_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX idx_suppliers_category_id ON suppliers(category_id);
CREATE INDEX idx_suppliers_supplier_status ON suppliers(supplier_status);
CREATE INDEX idx_supplier_contacts_supplier_id ON supplier_contacts(supplier_id);
CREATE INDEX idx_supplier_contracts_supplier_id ON supplier_contracts(supplier_id);
CREATE INDEX idx_supplier_contracts_end_date ON supplier_contracts(end_date);
CREATE INDEX idx_supplier_contracts_status ON supplier_contracts(contract_status);
CREATE INDEX idx_supplier_performance_supplier_id ON supplier_performance_metrics(supplier_id);
CREATE INDEX idx_supplier_performance_date ON supplier_performance_metrics(metric_date);
CREATE INDEX idx_supplier_risk_supplier_id ON supplier_risk_assessments(supplier_id);

-- Enable Row Level Security
ALTER TABLE supplier_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CRM users can view supplier data" ON suppliers
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Users with supplier write can manage suppliers" ON suppliers
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM crm_users 
            WHERE role IN ('admin', 'manager') 
            OR permissions @> '["suppliers:write"]'
        )
    );

-- Similar policies for other tables
CREATE POLICY "CRM users can view categories" ON supplier_categories
    FOR SELECT USING (true);

CREATE POLICY "CRM users can view contacts" ON supplier_contacts
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "CRM users can view contracts" ON supplier_contracts
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Managers can manage contracts" ON supplier_contracts
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM crm_users 
            WHERE role IN ('admin', 'manager')
        )
    );

-- Create function to generate supplier code
CREATE OR REPLACE FUNCTION generate_supplier_code(p_supplier_name VARCHAR) RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(3);
    v_next_number INTEGER;
    v_supplier_code VARCHAR(50);
BEGIN
    -- Get first 3 letters of supplier name
    v_prefix := UPPER(LEFT(REGEXP_REPLACE(p_supplier_name, '[^a-zA-Z]', '', 'g'), 3));
    
    -- If less than 3 letters, pad with 'X'
    WHILE LENGTH(v_prefix) < 3 LOOP
        v_prefix := v_prefix || 'X';
    END LOOP;
    
    -- Get next number for this prefix
    SELECT COALESCE(MAX(SUBSTRING(supplier_code FROM 5)::INTEGER), 0) + 1
    INTO v_next_number
    FROM suppliers
    WHERE supplier_code LIKE v_prefix || '-%';
    
    v_supplier_code := v_prefix || '-' || LPAD(v_next_number::TEXT, 3, '0');
    
    RETURN v_supplier_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate supplier performance score
CREATE OR REPLACE FUNCTION calculate_supplier_performance(p_supplier_id INTEGER) RETURNS DECIMAL AS $$
DECLARE
    v_latest_metrics RECORD;
    v_score DECIMAL(3,2);
BEGIN
    -- Get latest metrics
    SELECT * INTO v_latest_metrics
    FROM supplier_performance_metrics
    WHERE supplier_id = p_supplier_id
    ORDER BY metric_date DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Calculate weighted score
    v_score := (
        COALESCE(v_latest_metrics.on_time_delivery_rate, 0) * 0.25 / 20 +  -- Convert % to 0-5
        COALESCE(v_latest_metrics.quality_score, 0) * 0.25 +
        COALESCE(v_latest_metrics.price_competitiveness, 0) * 0.20 +
        COALESCE(v_latest_metrics.customer_satisfaction, 0) * 0.20 +
        COALESCE(v_latest_metrics.compliance_score, 0) * 0.10 / 20  -- Convert % to 0-5
    );
    
    RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Create function to check contract expiry
CREATE OR REPLACE FUNCTION get_expiring_contracts(p_days_ahead INTEGER DEFAULT 30) 
RETURNS TABLE (
    contract_id UUID,
    supplier_id INTEGER,
    supplier_name VARCHAR,
    contract_number VARCHAR,
    end_date DATE,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.supplier_id,
        s.supplier_name,
        sc.contract_number,
        sc.end_date,
        (sc.end_date - CURRENT_DATE)::INTEGER as days_until_expiry
    FROM supplier_contracts sc
    JOIN suppliers s ON s.id = sc.supplier_id
    WHERE sc.contract_status = 'active'
    AND sc.end_date IS NOT NULL
    AND sc.end_date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
    AND sc.end_date >= CURRENT_DATE
    ORDER BY sc.end_date;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate supplier code
CREATE OR REPLACE FUNCTION trigger_generate_supplier_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.supplier_code IS NULL THEN
        NEW.supplier_code := generate_supplier_code(NEW.supplier_name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_supplier_code_on_insert
    BEFORE INSERT ON suppliers
    FOR EACH ROW
    WHEN (NEW.supplier_code IS NULL)
    EXECUTE FUNCTION trigger_generate_supplier_code();

-- Update timestamp triggers
CREATE TRIGGER trigger_update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_supplier_contacts_updated_at
    BEFORE UPDATE ON supplier_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_supplier_contracts_updated_at
    BEFORE UPDATE ON supplier_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_supplier_risk_updated_at
    BEFORE UPDATE ON supplier_risk_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO supplier_categories (category_name, description) VALUES
('Inventory Suppliers', 'Suppliers of moving boxes, packing materials, and equipment'),
('Service Providers', 'Insurance, legal, and professional services'),
('Vehicle Suppliers', 'Vehicle leasing, maintenance, and fuel'),
('Facility Services', 'Warehouse, office, and facility management'),
('Technology Vendors', 'Software, hardware, and IT services'),
('Logistics Partners', 'Third-party logistics and transportation'),
('Other', 'Miscellaneous suppliers');

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Supplier management system created successfully';
    RAISE NOTICE '🏢 Tables: suppliers, contacts, contracts, performance, risk';
    RAISE NOTICE '📊 Automatic performance scoring and risk assessment';
    RAISE NOTICE '📅 Contract expiry monitoring';
    RAISE NOTICE '🔐 RLS policies applied for security';
END $$;