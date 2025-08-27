-- Creditsafe CAS Integration Schema
-- This migration adds support for credit checks and personal number storage

-- =====================================================
-- CREDIT CHECK RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers_enhanced(id) ON DELETE CASCADE,
    customer_id_legacy INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Personal identification
    personal_number VARCHAR(13) NOT NULL, -- Swedish personnummer (YYYYMMDD-XXXX)
    personal_number_hash VARCHAR(255) NOT NULL, -- SHA-256 hash for security
    
    -- Credit check details
    check_type VARCHAR(50) NOT NULL DEFAULT 'standard', -- standard, enhanced, business
    provider VARCHAR(50) NOT NULL DEFAULT 'creditsafe', -- creditsafe, uc, etc.
    provider_reference VARCHAR(255), -- External reference from provider
    
    -- Results
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, error
    risk_score INTEGER, -- 0-100
    credit_limit DECIMAL(10,2),
    reject_code VARCHAR(50), -- REJECT_1, REJECT_2, etc.
    reject_reason TEXT,
    
    -- Alternative payment options
    requires_deposit BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(10,2),
    requires_guarantor BOOLEAN DEFAULT false,
    payment_method_restrictions JSONB DEFAULT '[]', -- ['invoice'] means no invoice allowed
    
    -- Raw response data
    raw_response JSONB,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_recent_check UNIQUE (personal_number_hash, check_type, requested_at)
);

-- Create indexes for credit checks
CREATE INDEX idx_credit_checks_customer ON credit_checks(customer_id);
CREATE INDEX idx_credit_checks_customer_legacy ON credit_checks(customer_id_legacy);
CREATE INDEX idx_credit_checks_personal_number_hash ON credit_checks(personal_number_hash);
CREATE INDEX idx_credit_checks_status ON credit_checks(status);
CREATE INDEX idx_credit_checks_requested_at ON credit_checks(requested_at);

-- =====================================================
-- BANKID AUTHENTICATION LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS bankid_authentications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Session info
    session_id VARCHAR(255) UNIQUE NOT NULL,
    order_ref VARCHAR(255) UNIQUE NOT NULL,
    
    -- User info
    personal_number VARCHAR(13),
    personal_number_hash VARCHAR(255),
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, complete, failed, expired
    hint_code VARCHAR(50), -- outstandingTransaction, userSign, etc.
    completion_data JSONB, -- User info from BankID
    
    -- Security
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for BankID authentications
CREATE INDEX idx_bankid_auth_session ON bankid_authentications(session_id);
CREATE INDEX idx_bankid_auth_order_ref ON bankid_authentications(order_ref);
CREATE INDEX idx_bankid_auth_status ON bankid_authentications(status);

-- =====================================================
-- UPDATE EXISTING TABLES
-- =====================================================

-- Add personal number to customers table if not exists
DO $$
BEGIN
    -- For customers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'personal_number') THEN
        ALTER TABLE customers ADD COLUMN personal_number VARCHAR(13);
        ALTER TABLE customers ADD COLUMN personal_number_verified BOOLEAN DEFAULT false;
        ALTER TABLE customers ADD COLUMN personal_number_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- For customers_enhanced table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers_enhanced' AND column_name = 'personal_number') THEN
        ALTER TABLE customers_enhanced ADD COLUMN personal_number VARCHAR(13);
        ALTER TABLE customers_enhanced ADD COLUMN personal_number_verified BOOLEAN DEFAULT false;
        ALTER TABLE customers_enhanced ADD COLUMN personal_number_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to hash personal numbers
CREATE OR REPLACE FUNCTION hash_personal_number(pn VARCHAR) 
RETURNS VARCHAR AS $$
BEGIN
    -- Use SHA-256 with a salt (in production, use a proper salt)
    RETURN encode(digest(pn || 'nordflytt-salt-2025', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if a credit check is still valid
CREATE OR REPLACE FUNCTION is_credit_check_valid(check_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    check_record RECORD;
BEGIN
    SELECT * INTO check_record
    FROM credit_checks
    WHERE id = check_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if expired
    IF check_record.expires_at IS NOT NULL AND check_record.expires_at < NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Check if status is approved
    IF check_record.status != 'approved' THEN
        RETURN FALSE;
    END IF;
    
    -- Credit check is valid for 30 days by default
    IF check_record.completed_at < NOW() - INTERVAL '30 days' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest valid credit check for a personal number
CREATE OR REPLACE FUNCTION get_latest_credit_check(pn_hash VARCHAR) 
RETURNS UUID AS $$
DECLARE
    check_id UUID;
BEGIN
    SELECT id INTO check_id
    FROM credit_checks
    WHERE personal_number_hash = pn_hash
    AND status = 'approved'
    AND (expires_at IS NULL OR expires_at > NOW())
    AND completed_at > NOW() - INTERVAL '30 days'
    ORDER BY completed_at DESC
    LIMIT 1;
    
    RETURN check_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECURITY
-- =====================================================

-- Enable Row Level Security
ALTER TABLE credit_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankid_authentications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_checks
CREATE POLICY "Staff can view credit checks" ON credit_checks
    FOR SELECT USING (true); -- In production, check staff permissions

CREATE POLICY "System can insert credit checks" ON credit_checks
    FOR INSERT WITH CHECK (true); -- In production, check API key or service role

CREATE POLICY "System can update credit checks" ON credit_checks
    FOR UPDATE USING (status = 'pending'); -- Only pending checks can be updated

-- RLS Policies for bankid_authentications
CREATE POLICY "Users can view their own authentications" ON bankid_authentications
    FOR SELECT USING (session_id = current_setting('app.current_session_id', true));

CREATE POLICY "System can manage authentications" ON bankid_authentications
    FOR ALL USING (true); -- In production, check service role

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert test reject codes reference
INSERT INTO credit_checks (
    customer_id_legacy,
    personal_number,
    personal_number_hash,
    check_type,
    status,
    risk_score,
    reject_code,
    reject_reason,
    requires_deposit,
    deposit_amount,
    completed_at,
    expires_at
) VALUES 
(
    1, -- Assuming customer ID 1 exists
    '199001011234',
    hash_personal_number('199001011234'),
    'standard',
    'rejected',
    85,
    'REJECT_1',
    'Betalningsanmärkning',
    true,
    5000.00,
    NOW(),
    NOW() + INTERVAL '30 days'
),
(
    2, -- Assuming customer ID 2 exists
    '198502021234',
    hash_personal_number('198502021234'),
    'standard',
    'approved',
    15,
    NULL,
    NULL,
    false,
    0,
    NOW(),
    NOW() + INTERVAL '30 days'
);

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions
GRANT ALL ON credit_checks TO authenticated;
GRANT ALL ON bankid_authentications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically hash personal numbers
CREATE OR REPLACE FUNCTION hash_personal_number_trigger() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.personal_number IS NOT NULL THEN
        NEW.personal_number_hash = hash_personal_number(NEW.personal_number);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hash_pn_before_insert
    BEFORE INSERT ON credit_checks
    FOR EACH ROW
    EXECUTE FUNCTION hash_personal_number_trigger();

CREATE TRIGGER hash_pn_before_update
    BEFORE UPDATE ON credit_checks
    FOR EACH ROW
    WHEN (OLD.personal_number IS DISTINCT FROM NEW.personal_number)
    EXECUTE FUNCTION hash_personal_number_trigger();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Creditsafe integration schema created successfully';
    RAISE NOTICE '📊 New tables: credit_checks, bankid_authentications';
    RAISE NOTICE '🔧 Added personal_number fields to customers tables';
    RAISE NOTICE '🔒 Security: Personal numbers are hashed, RLS enabled';
    RAISE NOTICE '⚡ Functions: hash_personal_number, is_credit_check_valid, get_latest_credit_check';
END $$;