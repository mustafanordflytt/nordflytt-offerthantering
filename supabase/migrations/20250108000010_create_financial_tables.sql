-- Financial System Tables
-- Comprehensive financial management for invoicing, payments, and accounting

-- Drop existing tables if they exist
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS invoice_payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS expense_line_items CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS financial_accounts CASCADE;
DROP TABLE IF EXISTS tax_rates CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- Create tax rates table
CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- vat, rut, rot
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment methods table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- bank_transfer, card, swish, cash
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create financial accounts table (chart of accounts)
CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    parent_account_id UUID REFERENCES financial_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table (outgoing)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
    
    -- Invoice details
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'SEK',
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, paid, overdue, cancelled
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Amounts (all in minor units to avoid floating point issues)
    subtotal_amount INTEGER NOT NULL DEFAULT 0,
    vat_amount INTEGER NOT NULL DEFAULT 0,
    rut_deduction_amount INTEGER NOT NULL DEFAULT 0,
    discount_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    paid_amount INTEGER NOT NULL DEFAULT 0,
    
    -- RUT specific fields
    rut_eligible BOOLEAN DEFAULT false,
    rut_hours DECIMAL(10,2),
    rut_personal_number VARCHAR(20), -- Customer's personal number for RUT
    
    -- External integrations
    fortnox_id VARCHAR(100),
    fortnox_status VARCHAR(50),
    fortnox_synced_at TIMESTAMP WITH TIME ZONE,
    
    -- AI and automation
    auto_created BOOLEAN DEFAULT false,
    ai_review_score DECIMAL(3,2), -- 0.00 to 1.00
    ai_approved BOOLEAN DEFAULT false,
    ai_notes TEXT,
    
    -- Additional data
    payment_terms VARCHAR(100),
    notes TEXT,
    internal_notes TEXT,
    reference VARCHAR(255),
    
    -- Audit fields
    created_by UUID REFERENCES crm_users(id),
    updated_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice line items table
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    line_number INTEGER NOT NULL,
    
    -- Item details
    type VARCHAR(50) NOT NULL, -- service, material, expense, discount
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL, -- Price per unit in minor units
    
    -- Amounts in minor units
    subtotal_amount INTEGER NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 25,
    vat_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL,
    
    -- RUT eligibility
    rut_eligible BOOLEAN DEFAULT false,
    rut_hours DECIMAL(10,2),
    
    -- References
    service_code VARCHAR(50),
    account_id UUID REFERENCES financial_accounts(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_invoice_line_number UNIQUE(invoice_id, line_number)
);

-- Create invoice payments table
CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(id),
    
    -- Payment details
    amount INTEGER NOT NULL, -- Amount in minor units
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference VARCHAR(255),
    
    -- Bank transaction details
    bank_transaction_id VARCHAR(100),
    bank_account VARCHAR(50),
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed, refunded
    
    -- Audit
    created_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_payment_amount CHECK (amount > 0)
);

-- Create expenses table (incoming invoices)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
    
    -- Expense details
    supplier_invoice_number VARCHAR(100),
    invoice_date DATE NOT NULL,
    due_date DATE,
    currency VARCHAR(3) DEFAULT 'SEK',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid, rejected
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES crm_users(id),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Amounts in minor units
    subtotal_amount INTEGER NOT NULL DEFAULT 0,
    vat_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    paid_amount INTEGER NOT NULL DEFAULT 0,
    
    -- Categorization
    expense_category VARCHAR(100),
    cost_center VARCHAR(50),
    project_code VARCHAR(50),
    
    -- External integrations
    billo_invoice_id VARCHAR(100),
    billo_status VARCHAR(50),
    billo_synced_at TIMESTAMP WITH TIME ZONE,
    
    -- AI analysis
    ai_category_suggestion VARCHAR(100),
    ai_fraud_risk_score DECIMAL(3,2), -- 0.00 to 1.00
    ai_approval_recommendation BOOLEAN,
    ai_notes TEXT,
    
    -- Attachments
    receipt_url TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Additional fields
    description TEXT,
    internal_notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES crm_users(id),
    updated_by UUID REFERENCES crm_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense line items table
CREATE TABLE expense_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
    line_number INTEGER NOT NULL,
    
    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL,
    
    -- Amounts in minor units
    subtotal_amount INTEGER NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 25,
    vat_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL,
    
    -- Accounting
    account_id UUID REFERENCES financial_accounts(id),
    cost_center VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_expense_line_number UNIQUE(expense_id, line_number)
);

-- Create indexes for performance
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_due_date ON expenses(due_date);
CREATE INDEX idx_expense_line_items_expense_id ON expense_line_items(expense_id);

-- Enable Row Level Security
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "CRM users can view all invoices" ON invoices
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Users with financial write can create invoices" ON invoices
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM crm_users 
            WHERE role IN ('admin', 'manager') 
            OR permissions @> '["financial:write"]'
        )
    );

CREATE POLICY "Users with financial write can update invoices" ON invoices
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM crm_users 
            WHERE role IN ('admin', 'manager') 
            OR permissions @> '["financial:write"]'
        )
    );

-- Similar policies for other tables
CREATE POLICY "CRM users can view expenses" ON expenses
    FOR SELECT USING (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Users can create expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM crm_users));

CREATE POLICY "Managers can approve expenses" ON expenses
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM crm_users 
            WHERE role IN ('admin', 'manager')
        )
    );

-- View policies for read-only tables
CREATE POLICY "All users can view tax rates" ON tax_rates
    FOR SELECT USING (true);

CREATE POLICY "All users can view payment methods" ON payment_methods
    FOR SELECT USING (true);

CREATE POLICY "All users can view financial accounts" ON financial_accounts
    FOR SELECT USING (true);

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_next_number INTEGER;
    v_invoice_number VARCHAR(50);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get the next number for this year
    SELECT COALESCE(MAX(SUBSTRING(invoice_number FROM 5)::INTEGER), 0) + 1
    INTO v_next_number
    FROM invoices
    WHERE invoice_number LIKE v_year || '%';
    
    v_invoice_number := v_year || LPAD(v_next_number::TEXT, 4, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(p_invoice_id UUID) RETURNS VOID AS $$
DECLARE
    v_subtotal INTEGER;
    v_vat_amount INTEGER;
    v_rut_deduction INTEGER;
    v_total INTEGER;
BEGIN
    -- Calculate subtotal and VAT from line items
    SELECT 
        COALESCE(SUM(subtotal_amount), 0),
        COALESCE(SUM(vat_amount), 0)
    INTO v_subtotal, v_vat_amount
    FROM invoice_line_items
    WHERE invoice_id = p_invoice_id;
    
    -- Get RUT deduction
    SELECT COALESCE(rut_deduction_amount, 0)
    INTO v_rut_deduction
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Calculate total
    v_total := v_subtotal + v_vat_amount - v_rut_deduction;
    
    -- Update invoice
    UPDATE invoices
    SET 
        subtotal_amount = v_subtotal,
        vat_amount = v_vat_amount,
        total_amount = v_total,
        updated_at = NOW()
    WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update invoice totals
CREATE OR REPLACE FUNCTION trigger_update_invoice_totals() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_invoice_totals(OLD.invoice_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_invoice_totals(NEW.invoice_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_totals_on_line_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_invoice_totals();

-- Create function to check if invoice is fully paid
CREATE OR REPLACE FUNCTION check_invoice_payment_status(p_invoice_id UUID) RETURNS VOID AS $$
DECLARE
    v_total_amount INTEGER;
    v_paid_amount INTEGER;
    v_new_status VARCHAR(50);
BEGIN
    -- Get invoice total
    SELECT total_amount
    INTO v_total_amount
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Calculate paid amount
    SELECT COALESCE(SUM(amount), 0)
    INTO v_paid_amount
    FROM invoice_payments
    WHERE invoice_id = p_invoice_id
    AND status = 'completed';
    
    -- Determine new status
    IF v_paid_amount >= v_total_amount THEN
        v_new_status := 'paid';
    ELSIF v_paid_amount > 0 THEN
        v_new_status := 'partially_paid';
    ELSE
        -- Check if overdue
        SELECT CASE 
            WHEN due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled') THEN 'overdue'
            ELSE status
        END
        INTO v_new_status
        FROM invoices
        WHERE id = p_invoice_id;
    END IF;
    
    -- Update invoice
    UPDATE invoices
    SET 
        paid_amount = v_paid_amount,
        status = v_new_status,
        paid_at = CASE WHEN v_new_status = 'paid' THEN NOW() ELSE paid_at END,
        updated_at = NOW()
    WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update payment status
CREATE OR REPLACE FUNCTION trigger_update_payment_status() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM check_invoice_payment_status(OLD.invoice_id);
        RETURN OLD;
    ELSE
        PERFORM check_invoice_payment_status(NEW.invoice_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_status_on_payment_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_payment_status();

-- Insert default data
INSERT INTO tax_rates (name, rate, type, description) VALUES
('Moms 25%', 25.00, 'vat', 'Standard Swedish VAT rate'),
('Moms 12%', 12.00, 'vat', 'Reduced VAT rate for food and hotels'),
('Moms 6%', 6.00, 'vat', 'Reduced VAT rate for books, newspapers, culture'),
('RUT-avdrag', 50.00, 'rut', 'RUT deduction for household services');

INSERT INTO payment_methods (name, type) VALUES
('Bankgiro', 'bank_transfer'),
('Swish', 'swish'),
('Kort', 'card'),
('Kontant', 'cash');

-- Insert basic chart of accounts
INSERT INTO financial_accounts (account_number, account_name, account_type) VALUES
('1910', 'Kassa', 'asset'),
('1930', 'Företagskonto', 'asset'),
('1510', 'Kundfordringar', 'asset'),
('2440', 'Leverantörsskulder', 'liability'),
('3000', 'Försäljning tjänster', 'revenue'),
('3001', 'Försäljning RUT', 'revenue'),
('4000', 'Inköp material', 'expense'),
('5000', 'Lokalkostnader', 'expense'),
('7000', 'Löner', 'expense');

-- Update timestamp triggers
CREATE TRIGGER trigger_update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Financial system tables created successfully';
    RAISE NOTICE '💰 Tables: invoices, expenses, payments, accounts';
    RAISE NOTICE '🧮 Automatic calculations for totals and payment status';
    RAISE NOTICE '🔐 RLS policies applied for security';
END $$;