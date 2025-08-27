-- =============================================================================
-- NORDFLYTT PARTNER NETWORK MODULE - DATABASE SCHEMA
-- Komplett partnernätverk med onboarding, jobbspårning och finansiell avräkning
-- =============================================================================

-- Partner företag/individer
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    organization_number VARCHAR(20),
    partner_type VARCHAR(50) NOT NULL DEFAULT 'individual', -- 'individual', 'company', 'subcontractor'
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    
    -- Specialiseringar
    specializations JSONB DEFAULT '[]', -- ['moving', 'packing', 'cleaning', 'storage', 'transport']
    service_areas JSONB DEFAULT '[]', -- ['stockholm', 'goteborg', 'malmo', 'uppsala']
    capacity_level VARCHAR(20) DEFAULT 'small', -- 'small', 'medium', 'large', 'enterprise'
    
    -- Status och kvalitet
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'terminated'
    quality_rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 - 5.00
    completed_jobs INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    
    -- Onboarding
    onboarding_step VARCHAR(50) DEFAULT 'application', -- 'application', 'documents', 'interview', 'contract', 'training', 'completed'
    onboarding_progress INTEGER DEFAULT 0, -- 0-100%
    onboarding_notes TEXT,
    
    -- Certifieringar och dokument
    certifications JSONB DEFAULT '[]',
    insurance_valid_until DATE,
    contract_signed_at TIMESTAMP,
    
    -- AI-analys
    ai_performance_score DECIMAL(3,2) DEFAULT 0.00,
    ai_reliability_score DECIMAL(3,2) DEFAULT 0.00,
    ai_customer_satisfaction DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    -- Indexering
    CONSTRAINT partners_email_unique UNIQUE (email),
    CONSTRAINT partners_org_number_unique UNIQUE (organization_number)
);

-- Partner onboarding steg och checklista
CREATE TABLE partner_onboarding_steps (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    required_documents JSONB DEFAULT '[]',
    uploaded_documents JSONB DEFAULT '[]',
    notes TEXT,
    completed_at TIMESTAMP,
    completed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner jobb-tilldelningar
CREATE TABLE partner_jobs (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'primary', 'support', 'specialist'
    
    -- Jobbetallar
    base_rate DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Procent av totalt värde
    bonus_eligibility BOOLEAN DEFAULT false,
    
    -- Status och spårning
    status VARCHAR(20) DEFAULT 'assigned', -- 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Prestanda
    quality_score DECIMAL(3,2),
    customer_rating DECIMAL(3,2),
    time_efficiency DECIMAL(3,2), -- Planerad tid vs faktisk tid
    
    -- Kostnader och intäkter
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    partner_payment DECIMAL(10,2),
    nordflytt_revenue DECIMAL(10,2),
    
    -- Anteckningar
    partner_notes TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner finansiell avräkning
CREATE TABLE partner_payments (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    
    -- Betalningsdetaljer
    total_jobs INTEGER DEFAULT 0,
    total_hours DECIMAL(8,2) DEFAULT 0.00,
    base_payment DECIMAL(10,2) DEFAULT 0.00,
    commission_payment DECIMAL(10,2) DEFAULT 0.00,
    bonus_payment DECIMAL(10,2) DEFAULT 0.00,
    deductions DECIMAL(10,2) DEFAULT 0.00,
    net_payment DECIMAL(10,2) DEFAULT 0.00,
    
    -- Skatter och avgifter
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    social_fees DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'disputed'
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP,
    
    -- Dokument
    invoice_number VARCHAR(50),
    invoice_pdf_url TEXT,
    
    -- Anteckningar
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Partner prestanda och kvalitet
CREATE TABLE partner_performance_metrics (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Prestanda KPI:er
    jobs_completed INTEGER DEFAULT 0,
    jobs_cancelled INTEGER DEFAULT 0,
    average_quality_score DECIMAL(3,2) DEFAULT 0.00,
    average_customer_rating DECIMAL(3,2) DEFAULT 0.00,
    on_time_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Finansiella metrics
    revenue_generated DECIMAL(10,2) DEFAULT 0.00,
    cost_efficiency DECIMAL(5,2) DEFAULT 0.00,
    profit_margin DECIMAL(5,2) DEFAULT 0.00,
    
    -- Kundnöjdhet
    customer_complaints INTEGER DEFAULT 0,
    customer_compliments INTEGER DEFAULT 0,
    repeat_customer_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- AI-beräknade scores
    ai_reliability_score DECIMAL(3,2) DEFAULT 0.00,
    ai_growth_potential DECIMAL(3,2) DEFAULT 0.00,
    ai_risk_assessment DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner kontrakt och dokument
CREATE TABLE partner_contracts (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL, -- 'service_agreement', 'nda', 'insurance', 'certification'
    contract_title VARCHAR(255) NOT NULL,
    
    -- Kontraktsdetaljer
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renewal BOOLEAN DEFAULT false,
    renewal_period INTEGER, -- Månader
    
    -- Dokument
    document_url TEXT,
    signed_document_url TEXT,
    digital_signature_id VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'signed', 'active', 'expired', 'terminated'
    signed_at TIMESTAMP,
    signed_by_partner VARCHAR(255),
    signed_by_nordflytt VARCHAR(255),
    
    -- Villkor
    terms_and_conditions TEXT,
    special_clauses TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Partner kommunikation och meddelanden
CREATE TABLE partner_communications (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    
    -- Meddelandedetaljer
    type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'phone', 'meeting', 'notification'
    subject VARCHAR(255),
    message TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'sent', -- 'draft', 'sent', 'delivered', 'read', 'replied'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Spårning
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    replied_at TIMESTAMP,
    
    -- Metadata
    sender_type VARCHAR(20) DEFAULT 'nordflytt', -- 'nordflytt', 'partner'
    sender_name VARCHAR(255),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    
    -- Bilagor
    attachments JSONB DEFAULT '[]',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Partner reviews och feedback
CREATE TABLE partner_reviews (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Review detaljer
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    
    -- Kategorier
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderated_at TIMESTAMP,
    moderated_by INTEGER REFERENCES users(id),
    
    -- Svar från partner
    partner_response TEXT,
    partner_responded_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXER FÖR PRESTANDA
-- =============================================================================

-- Partner indexer
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_specializations ON partners USING GIN(specializations);
CREATE INDEX idx_partners_service_areas ON partners USING GIN(service_areas);
CREATE INDEX idx_partners_quality_rating ON partners(quality_rating);
CREATE INDEX idx_partners_onboarding_step ON partners(onboarding_step);

-- Partner jobb indexer
CREATE INDEX idx_partner_jobs_partner_id ON partner_jobs(partner_id);
CREATE INDEX idx_partner_jobs_booking_id ON partner_jobs(booking_id);
CREATE INDEX idx_partner_jobs_status ON partner_jobs(status);
CREATE INDEX idx_partner_jobs_assigned_at ON partner_jobs(assigned_at);

-- Partner betalningar indexer
CREATE INDEX idx_partner_payments_partner_id ON partner_payments(partner_id);
CREATE INDEX idx_partner_payments_period ON partner_payments(payment_period_start, payment_period_end);
CREATE INDEX idx_partner_payments_status ON partner_payments(status);

-- Partner prestanda indexer
CREATE INDEX idx_partner_performance_partner_id ON partner_performance_metrics(partner_id);
CREATE INDEX idx_partner_performance_date ON partner_performance_metrics(metric_date);

-- Partner kontrakt indexer
CREATE INDEX idx_partner_contracts_partner_id ON partner_contracts(partner_id);
CREATE INDEX idx_partner_contracts_type ON partner_contracts(contract_type);
CREATE INDEX idx_partner_contracts_status ON partner_contracts(status);

-- Partner reviews indexer
CREATE INDEX idx_partner_reviews_partner_id ON partner_reviews(partner_id);
CREATE INDEX idx_partner_reviews_booking_id ON partner_reviews(booking_id);
CREATE INDEX idx_partner_reviews_rating ON partner_reviews(rating);

-- =============================================================================
-- TRIGGERS FÖR AUTOMATISK UPPDATERING
-- =============================================================================

-- Uppdatera partner updated_at automatiskt
CREATE OR REPLACE FUNCTION update_partner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_updated_at();

-- Uppdatera partner statistik när jobb slutförs
CREATE OR REPLACE FUNCTION update_partner_stats_on_job_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE partners 
        SET 
            completed_jobs = completed_jobs + 1,
            total_revenue = total_revenue + COALESCE(NEW.nordflytt_revenue, 0)
        WHERE id = NEW.partner_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_stats
    AFTER UPDATE ON partner_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_stats_on_job_completion();

-- =============================================================================
-- VIEWS FÖR ANALYS OCH RAPPORTER
-- =============================================================================

-- Partner dashboard overview
CREATE VIEW partner_dashboard_overview AS
SELECT 
    p.id,
    p.name,
    p.company_name,
    p.status,
    p.quality_rating,
    p.completed_jobs,
    p.total_revenue,
    p.specializations,
    p.service_areas,
    COUNT(pj.id) as active_jobs,
    AVG(pr.rating) as average_customer_rating,
    COUNT(pr.id) as total_reviews
FROM partners p
LEFT JOIN partner_jobs pj ON p.id = pj.partner_id AND pj.status IN ('assigned', 'accepted', 'in_progress')
LEFT JOIN partner_reviews pr ON p.id = pr.partner_id AND pr.status = 'approved'
GROUP BY p.id, p.name, p.company_name, p.status, p.quality_rating, p.completed_jobs, p.total_revenue, p.specializations, p.service_areas;

-- Partner finansiell sammanfattning
CREATE VIEW partner_financial_summary AS
SELECT 
    p.id,
    p.name,
    COUNT(pp.id) as payment_periods,
    SUM(pp.net_payment) as total_earnings,
    AVG(pp.net_payment) as average_payment,
    SUM(pp.total_hours) as total_hours_worked,
    COUNT(CASE WHEN pp.status = 'paid' THEN 1 END) as paid_periods,
    COUNT(CASE WHEN pp.status = 'pending' THEN 1 END) as pending_payments
FROM partners p
LEFT JOIN partner_payments pp ON p.id = pp.partner_id
GROUP BY p.id, p.name;

-- Partner prestanda ranking
CREATE VIEW partner_performance_ranking AS
SELECT 
    p.id,
    p.name,
    p.quality_rating,
    p.completed_jobs,
    AVG(pr.rating) as customer_rating,
    AVG(pj.quality_score) as job_quality_score,
    COUNT(CASE WHEN pj.status = 'completed' THEN 1 END) as successful_jobs,
    COUNT(CASE WHEN pj.status = 'cancelled' THEN 1 END) as cancelled_jobs,
    ROUND(
        (COUNT(CASE WHEN pj.status = 'completed' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(pj.id), 0)) * 100, 2
    ) as completion_rate
FROM partners p
LEFT JOIN partner_jobs pj ON p.id = pj.partner_id
LEFT JOIN partner_reviews pr ON p.id = pr.partner_id AND pr.status = 'approved'
GROUP BY p.id, p.name, p.quality_rating, p.completed_jobs
ORDER BY p.quality_rating DESC, customer_rating DESC, completion_rate DESC;

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Standard onboarding steg
INSERT INTO partner_onboarding_steps (partner_id, step_name, step_order, required_documents) VALUES 
(1, 'Ansökan och initial kontakt', 1, '["application_form"]'),
(1, 'Dokumentverifiering', 2, '["id_document", "insurance_certificate", "tax_certificate"]'),
(1, 'Intervju och bedömning', 3, '["interview_notes", "skill_assessment"]'),
(1, 'Kontraktsignering', 4, '["service_agreement", "nda", "safety_agreement"]'),
(1, 'Utbildning och certifiering', 5, '["training_completion", "safety_certification"]'),
(1, 'Slutlig godkännande', 6, '["final_approval", "system_access"]');

-- Standard kontraktstyper
INSERT INTO partner_contracts (partner_id, contract_type, contract_title, start_date, terms_and_conditions) VALUES
(1, 'service_agreement', 'Serviceavtal för Nordflytt Partners', CURRENT_DATE, 'Standard serviceavtal för partners inom Nordflytt-nätverket'),
(1, 'nda', 'Sekretessavtal', CURRENT_DATE, 'Sekretessavtal för hantering av kunddata och affärsinformation'),
(1, 'insurance', 'Försäkringsavtal', CURRENT_DATE, 'Försäkringsvillkor och täckning för partnerverksamhet');

-- =============================================================================
-- KOMMENTARER
-- =============================================================================

COMMENT ON TABLE partners IS 'Huvudtabell för alla partners i Nordflytt-nätverket';
COMMENT ON TABLE partner_onboarding_steps IS 'Spårning av onboarding-process för nya partners';
COMMENT ON TABLE partner_jobs IS 'Jobbuppdrag tilldelade till partners';
COMMENT ON TABLE partner_payments IS 'Finansiell avräkning och betalningar till partners';
COMMENT ON TABLE partner_performance_metrics IS 'Prestanda-KPI:er för partners';
COMMENT ON TABLE partner_contracts IS 'Kontrakt och juridiska dokument';
COMMENT ON TABLE partner_communications IS 'Kommunikation mellan Nordflytt och partners';
COMMENT ON TABLE partner_reviews IS 'Kundrecensioner och feedback om partners';