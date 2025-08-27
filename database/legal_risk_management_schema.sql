-- =============================================================================
-- NORDFLYTT LEGAL & RISK MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Extends existing database with legal dispute resolution and risk assessment
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- LEGAL CASE MANAGEMENT TABLES
-- =============================================================================

-- Legal Case Categories
CREATE TABLE legal_case_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL, -- 'damage_claim', 'service_complaint', etc.
  category_description TEXT,
  typical_resolution TEXT,
  legal_framework TEXT, -- Reference to Swedish law
  severity_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  average_resolution_time INTEGER DEFAULT 7, -- days
  typical_cost_range JSONB DEFAULT '{"min": 0, "max": 10000}', -- SEK
  automation_eligible BOOLEAN DEFAULT true,
  success_rate DECIMAL(4,2) DEFAULT 0.85, -- Historical success rate
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Disputes & Cases
CREATE TABLE legal_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  booking_id UUID REFERENCES bookings(id),
  category_id UUID REFERENCES legal_case_categories(id),
  dispute_title VARCHAR(200) NOT NULL,
  dispute_description TEXT NOT NULL,
  customer_claim TEXT,
  customer_contact_info JSONB, -- Email, phone, address
  reported_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  incident_date DATE,
  estimated_value INTEGER DEFAULT 0, -- SEK value of claim
  urgency_level VARCHAR(20) DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'responding', 'negotiating', 'resolved', 'escalated', 'closed')),
  assigned_to UUID REFERENCES anstallda_extended(id),
  resolution_method VARCHAR(100),
  resolution_date TIMESTAMP WITH TIME ZONE,
  final_cost INTEGER DEFAULT 0,
  customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5), -- 1-5 rating
  lessons_learned TEXT,
  attachments JSONB, -- File paths and metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Legal Analysis Results
CREATE TABLE ai_legal_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES legal_disputes(id) ON DELETE CASCADE,
  analysis_version INTEGER DEFAULT 1,
  ai_model_version VARCHAR(50) DEFAULT 'v1.0',
  ai_classification JSONB NOT NULL, -- AI's categorization of the dispute
  legal_strength_assessment DECIMAL(4,2) CHECK (legal_strength_assessment BETWEEN 0 AND 1), -- 0-1 score
  risk_factors JSONB, -- Identified risk factors
  similar_cases JSONB, -- References to similar historical cases
  recommended_strategy VARCHAR(100),
  estimated_resolution_time INTEGER DEFAULT 7, -- days
  estimated_cost_range JSONB DEFAULT '{"min": 0, "max": 5000}',
  confidence_score DECIMAL(4,2) CHECK (confidence_score BETWEEN 0 AND 1), -- AI confidence
  generated_response TEXT, -- AI-generated initial response
  escalation_recommended BOOLEAN DEFAULT false,
  escalation_reasons JSONB,
  insurance_claim_recommended BOOLEAN DEFAULT false,
  settlement_recommendation JSONB, -- Recommended settlement terms
  analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Communications & Responses
CREATE TABLE legal_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES legal_disputes(id) ON DELETE CASCADE,
  communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('initial_response', 'follow_up', 'settlement_offer', 'final_notice', 'closure')),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  sender VARCHAR(200),
  recipient VARCHAR(200),
  subject VARCHAR(300),
  content TEXT NOT NULL,
  communication_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_deadline DATE,
  ai_generated BOOLEAN DEFAULT false,
  template_used VARCHAR(100),
  effectiveness_score DECIMAL(4,2) CHECK (effectiveness_score BETWEEN 0 AND 1),
  customer_response TEXT,
  escalation_triggered BOOLEAN DEFAULT false,
  attachments JSONB, -- File paths and metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INSURANCE CLAIMS INTEGRATION
-- =============================================================================

-- Insurance Claims
CREATE TABLE insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES legal_disputes(id) ON DELETE CASCADE,
  claim_number VARCHAR(100) UNIQUE NOT NULL,
  insurance_company VARCHAR(200) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  claim_type VARCHAR(100) NOT NULL CHECK (claim_type IN ('property_damage', 'liability', 'professional_indemnity', 'public_liability')),
  claim_amount INTEGER NOT NULL,
  claim_status VARCHAR(50) DEFAULT 'draft' CHECK (claim_status IN ('draft', 'submitted', 'under_review', 'approved', 'denied', 'settled')),
  submitted_date DATE,
  response_date DATE,
  settlement_amount INTEGER DEFAULT 0,
  settlement_date DATE,
  claim_documents JSONB, -- File paths and document references
  adjuster_contact JSONB, -- Contact information for insurance adjuster
  correspondence_log JSONB, -- Log of all communications
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- RISK ASSESSMENT & PREDICTION
-- =============================================================================

-- Risk Assessments
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('booking_risk', 'customer_risk', 'general_risk', 'route_risk')),
  reference_id UUID, -- Could reference bookings, customers, or routes
  reference_type VARCHAR(50) CHECK (reference_type IN ('booking', 'customer', 'route', 'general')),
  risk_factors JSONB NOT NULL, -- Identified risk factors
  risk_score DECIMAL(5,2) CHECK (risk_score BETWEEN 0 AND 100), -- Overall risk score 0-100
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  mitigation_strategies JSONB, -- Recommended risk mitigation actions
  predicted_issues JSONB, -- What might go wrong
  prevention_measures JSONB, -- How to prevent issues
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessed_by VARCHAR(50) DEFAULT 'ai_system', -- 'ai_system', 'manual', 'hybrid'
  validity_period INTEGER DEFAULT 30, -- days this assessment is valid
  actual_outcome VARCHAR(100), -- What actually happened (for learning)
  accuracy_score DECIMAL(4,2) CHECK (accuracy_score BETWEEN 0 AND 1), -- How accurate was the prediction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- LEGAL TEMPLATES & KNOWLEDGE BASE
-- =============================================================================

-- Legal Templates
CREATE TABLE legal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(200) NOT NULL,
  template_type VARCHAR(100) NOT NULL CHECK (template_type IN ('response_letter', 'settlement_offer', 'denial_letter', 'escalation_notice', 'closure_letter')),
  applicable_categories JSONB, -- Which dispute categories this applies to
  template_content TEXT NOT NULL,
  variables JSONB, -- Template variables that get replaced
  legal_review_date DATE,
  approved_by VARCHAR(200),
  usage_count INTEGER DEFAULT 0,
  effectiveness_rating DECIMAL(4,2) CHECK (effectiveness_rating BETWEEN 0 AND 1),
  language VARCHAR(10) DEFAULT 'sv' CHECK (language IN ('sv', 'en')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Knowledge Base
CREATE TABLE legal_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'law', 'precedent', 'policy', 'procedure'
  tags JSONB, -- Searchable tags
  legal_framework VARCHAR(200), -- Reference to specific law
  last_verified DATE,
  verified_by VARCHAR(200),
  relevance_score DECIMAL(4,2) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- LEGAL COSTS & BUDGET TRACKING
-- =============================================================================

-- Legal Costs
CREATE TABLE legal_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES legal_disputes(id) ON DELETE CASCADE,
  cost_type VARCHAR(100) NOT NULL CHECK (cost_type IN ('settlement', 'legal_fees', 'court_costs', 'expert_witness', 'administrative', 'opportunity_cost')),
  cost_description TEXT,
  estimated_cost INTEGER DEFAULT 0,
  actual_cost INTEGER DEFAULT 0,
  cost_date DATE DEFAULT CURRENT_DATE,
  paid_date DATE,
  payment_method VARCHAR(50),
  cost_category VARCHAR(50) DEFAULT 'direct' CHECK (cost_category IN ('direct', 'indirect', 'opportunity_cost')),
  budget_impact INTEGER DEFAULT 0, -- Impact on monthly legal budget
  recovery_possible BOOLEAN DEFAULT false, -- Can this cost be recovered?
  recovery_amount INTEGER DEFAULT 0,
  invoice_reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Budget
CREATE TABLE legal_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_budget INTEGER NOT NULL,
  allocated_budget INTEGER NOT NULL,
  spent_budget INTEGER DEFAULT 0,
  remaining_budget INTEGER GENERATED ALWAYS AS (total_budget - spent_budget) STORED,
  budget_alerts JSONB, -- Alert thresholds and notifications
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DISPUTE ESCALATION WORKFLOW
-- =============================================================================

-- Escalation Rules
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(200) NOT NULL,
  trigger_conditions JSONB NOT NULL, -- Conditions that trigger escalation
  escalation_level VARCHAR(50) NOT NULL CHECK (escalation_level IN ('supervisor', 'manager', 'legal_counsel', 'external_lawyer')),
  escalation_actions JSONB, -- Actions to take when escalated
  auto_escalate BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalation Log
CREATE TABLE escalation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES legal_disputes(id) ON DELETE CASCADE,
  escalation_rule_id UUID REFERENCES escalation_rules(id),
  escalated_from VARCHAR(200),
  escalated_to VARCHAR(200),
  escalation_reason TEXT,
  escalation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolution_deadline DATE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'failed')),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE METRICS & REPORTING
-- =============================================================================

-- Legal Performance Metrics
CREATE TABLE legal_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  total_disputes INTEGER DEFAULT 0,
  new_disputes INTEGER DEFAULT 0,
  resolved_disputes INTEGER DEFAULT 0,
  ai_resolved_disputes INTEGER DEFAULT 0,
  escalated_disputes INTEGER DEFAULT 0,
  average_resolution_time DECIMAL(5,2) DEFAULT 0, -- days
  total_legal_costs INTEGER DEFAULT 0,
  settlement_costs INTEGER DEFAULT 0,
  customer_satisfaction_average DECIMAL(3,2) DEFAULT 0,
  ai_accuracy_score DECIMAL(4,2) DEFAULT 0,
  cost_per_dispute DECIMAL(8,2) DEFAULT 0,
  success_rate DECIMAL(4,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Legal disputes indexes
CREATE INDEX idx_legal_disputes_status ON legal_disputes(status);
CREATE INDEX idx_legal_disputes_customer_id ON legal_disputes(customer_id);
CREATE INDEX idx_legal_disputes_booking_id ON legal_disputes(booking_id);
CREATE INDEX idx_legal_disputes_category_id ON legal_disputes(category_id);
CREATE INDEX idx_legal_disputes_urgency_level ON legal_disputes(urgency_level);
CREATE INDEX idx_legal_disputes_reported_date ON legal_disputes(reported_date);
CREATE INDEX idx_legal_disputes_case_number ON legal_disputes(case_number);

-- AI analysis indexes
CREATE INDEX idx_ai_legal_analysis_dispute_id ON ai_legal_analysis(dispute_id);
CREATE INDEX idx_ai_legal_analysis_confidence_score ON ai_legal_analysis(confidence_score);
CREATE INDEX idx_ai_legal_analysis_escalation_recommended ON ai_legal_analysis(escalation_recommended);

-- Communications indexes
CREATE INDEX idx_legal_communications_dispute_id ON legal_communications(dispute_id);
CREATE INDEX idx_legal_communications_type ON legal_communications(communication_type);
CREATE INDEX idx_legal_communications_date ON legal_communications(communication_date);

-- Insurance claims indexes
CREATE INDEX idx_insurance_claims_dispute_id ON insurance_claims(dispute_id);
CREATE INDEX idx_insurance_claims_status ON insurance_claims(claim_status);
CREATE INDEX idx_insurance_claims_claim_number ON insurance_claims(claim_number);

-- Risk assessments indexes
CREATE INDEX idx_risk_assessments_type ON risk_assessments(assessment_type);
CREATE INDEX idx_risk_assessments_reference_id ON risk_assessments(reference_id);
CREATE INDEX idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_date ON risk_assessments(assessment_date);

-- Legal templates indexes
CREATE INDEX idx_legal_templates_type ON legal_templates(template_type);
CREATE INDEX idx_legal_templates_active ON legal_templates(active);

-- Legal costs indexes
CREATE INDEX idx_legal_costs_dispute_id ON legal_costs(dispute_id);
CREATE INDEX idx_legal_costs_type ON legal_costs(cost_type);
CREATE INDEX idx_legal_costs_date ON legal_costs(cost_date);

-- Performance metrics indexes
CREATE INDEX idx_legal_performance_metrics_date ON legal_performance_metrics(metric_date);

-- =============================================================================
-- TRIGGERS FOR AUTOMATION
-- =============================================================================

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_legal_case_categories_updated_at BEFORE UPDATE ON legal_case_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_disputes_updated_at BEFORE UPDATE ON legal_disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON risk_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_templates_updated_at BEFORE UPDATE ON legal_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_knowledge_base_updated_at BEFORE UPDATE ON legal_knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_costs_updated_at BEFORE UPDATE ON legal_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_budget_updated_at BEFORE UPDATE ON legal_budget FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escalation_rules_updated_at BEFORE UPDATE ON escalation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.case_number = 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('case_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for case numbers
CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1;

-- Create trigger for case number generation
CREATE TRIGGER generate_case_number_trigger
    BEFORE INSERT ON legal_disputes
    FOR EACH ROW
    WHEN (NEW.case_number IS NULL)
    EXECUTE FUNCTION generate_case_number();

-- =============================================================================
-- INITIAL DATA SEEDING
-- =============================================================================

-- Insert default legal case categories
INSERT INTO legal_case_categories (category_name, category_description, typical_resolution, legal_framework, severity_level, average_resolution_time, typical_cost_range) VALUES
('damage_claim', 'Skadeanmälan för förstörd egendom', 'Försäkringsersättning eller kompensation', 'Konsumenttjänstlagen § 24-25', 'high', 7, '{"min": 500, "max": 50000}'),
('service_complaint', 'Klagomål på servicekvalitet', 'Serviceåtgärd eller rabatt', 'Konsumenttjänstlagen § 11-12', 'medium', 3, '{"min": 0, "max": 5000}'),
('pricing_dispute', 'Prisrelaterad tvist', 'Prisjustering eller förklaring', 'Konsumenttjänstlagen § 15', 'medium', 2, '{"min": 0, "max": 10000}'),
('contract_breach', 'Avtalsbrott', 'Kontraktsåtgärd eller skadestånd', 'Avtalslagen + Konsumenttjänstlagen', 'high', 14, '{"min": 1000, "max": 100000}'),
('delay_complaint', 'Klagomål på försening', 'Förklaring och goodwill', 'Konsumenttjänstlagen § 9', 'low', 1, '{"min": 0, "max": 2000}'),
('payment_dispute', 'Betalningsrelaterad tvist', 'Betalningsplan eller justering', 'Konsumenttjänstlagen § 15-16', 'medium', 5, '{"min": 0, "max": 15000}');

-- Insert default legal templates
INSERT INTO legal_templates (template_name, template_type, template_content, variables, language) VALUES
('Skadeanmälan - Stark Position', 'response_letter', 
'Hej {{customer_name}},

Tack för er kontakt angående {{dispute_title}}.

Vi har genomfört en noggrann utredning av det rapporterade ärendet. Baserat på vår dokumentation från flytten den {{incident_date}} kan vi konstatera följande:

{{evidence_summary}}

Enligt våra avtalsvillkor och Konsumenttjänstlagen {{legal_position}}.

{{proposed_solution}}

Vi är öppna för dialog och ser fram emot er återkoppling inom 10 arbetsdagar.

Med vänlig hälsning,
Nordflytt Juridiska Avdelningen

Referensnummer: {{case_number}}
Telefon: 010-555 12 89
E-post: juridik@nordflytt.se',
'["customer_name", "dispute_title", "incident_date", "evidence_summary", "legal_position", "proposed_solution", "case_number"]',
'sv'),

('Serviceklagomål - Försonande', 'response_letter',
'Hej {{customer_name}},

Tack för er feedback angående {{dispute_title}}.

Vi beklagar verkligen att ni upplevt problem med vår service. Detta motsvarar inte de höga standarder vi strävar efter på Nordflytt.

{{service_recovery_plan}}

Som en gest av god vilja och för att återställa förtroendet erbjuder vi följande:

{{compensation_offer}}

Vi hoppas detta löser situationen till er tillfredsställelse. Ert feedback hjälper oss att bli bättre.

Med vänlig hälsning,
Nordflytt Kundservice

Referensnummer: {{case_number}}
Direktkontakt: {{handler_contact}}',
'["customer_name", "dispute_title", "service_recovery_plan", "compensation_offer", "case_number", "handler_contact"]',
'sv');

-- Insert default escalation rules
INSERT INTO escalation_rules (rule_name, trigger_conditions, escalation_level, escalation_actions, auto_escalate) VALUES
('Hög värdetvist', '{"claim_value": {"min": 50000}, "risk_level": "high"}', 'manager', '{"notify": "manager", "assign": "senior_legal", "timeline": "24h"}', true),
('Kritisk kundklagomål', '{"urgency_level": "critical", "customer_tier": "vip"}', 'supervisor', '{"notify": "supervisor", "priority": "high", "timeline": "4h"}', true),
('AI låg konfidensgrad', '{"ai_confidence": {"max": 0.5}}', 'supervisor', '{"notify": "supervisor", "review": "human", "timeline": "8h"}', true),
('Återkommande kund', '{"customer_complaints": {"min": 3}}', 'manager', '{"notify": "manager", "assign": "senior_handler", "timeline": "12h"}', false);

-- Insert initial legal budget
INSERT INTO legal_budget (budget_period, period_start, period_end, total_budget, allocated_budget, budget_alerts) VALUES
('monthly', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE, 20000, 15000, '{"warning": 12000, "critical": 16000}');

-- =============================================================================
-- VIEWS FOR REPORTING
-- =============================================================================

-- Legal Dashboard Overview
CREATE VIEW legal_dashboard_overview AS
SELECT 
    COUNT(*) as total_active_disputes,
    COUNT(*) FILTER (WHERE status = 'new') as new_disputes,
    COUNT(*) FILTER (WHERE urgency_level = 'critical') as critical_disputes,
    COUNT(*) FILTER (WHERE assigned_to IS NULL) as unassigned_disputes,
    AVG(estimated_value) as avg_claim_value,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as disputes_last_month,
    COUNT(*) FILTER (WHERE status = 'resolved' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as resolved_last_month
FROM legal_disputes 
WHERE status NOT IN ('resolved', 'closed');

-- AI Performance View
CREATE VIEW ai_performance_overview AS
SELECT 
    DATE_TRUNC('month', analysis_timestamp) as month,
    COUNT(*) as total_analyses,
    AVG(confidence_score) as avg_confidence,
    COUNT(*) FILTER (WHERE escalation_recommended = false) as auto_handled,
    COUNT(*) FILTER (WHERE escalation_recommended = true) as escalated,
    AVG(legal_strength_assessment) as avg_legal_strength
FROM ai_legal_analysis
GROUP BY DATE_TRUNC('month', analysis_timestamp)
ORDER BY month DESC;

-- Legal Costs Summary
CREATE VIEW legal_costs_summary AS
SELECT 
    DATE_TRUNC('month', cost_date) as month,
    cost_type,
    COUNT(*) as number_of_costs,
    SUM(actual_cost) as total_actual_cost,
    SUM(estimated_cost) as total_estimated_cost,
    AVG(actual_cost) as avg_cost_per_case
FROM legal_costs
GROUP BY DATE_TRUNC('month', cost_date), cost_type
ORDER BY month DESC, cost_type;

-- =============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =============================================================================

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_dispute_risk_score(dispute_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    risk_score DECIMAL(5,2) := 0;
    claim_value INTEGER;
    customer_history INTEGER;
    case_complexity DECIMAL(3,2);
BEGIN
    -- Get dispute details
    SELECT estimated_value INTO claim_value
    FROM legal_disputes 
    WHERE id = dispute_uuid;
    
    -- Calculate risk based on claim value
    risk_score := risk_score + LEAST(claim_value / 1000.0, 50);
    
    -- Add customer history factor
    SELECT COUNT(*) INTO customer_history
    FROM legal_disputes ld1
    WHERE ld1.customer_id = (SELECT customer_id FROM legal_disputes WHERE id = dispute_uuid)
    AND ld1.id != dispute_uuid;
    
    risk_score := risk_score + (customer_history * 10);
    
    -- Cap at 100
    RETURN LEAST(risk_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to check if dispute should be escalated
CREATE OR REPLACE FUNCTION should_escalate_dispute(dispute_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    dispute_risk DECIMAL(5,2);
    ai_confidence DECIMAL(4,2);
    claim_value INTEGER;
BEGIN
    -- Get dispute details
    SELECT estimated_value INTO claim_value
    FROM legal_disputes 
    WHERE id = dispute_uuid;
    
    -- Get AI confidence
    SELECT confidence_score INTO ai_confidence
    FROM ai_legal_analysis 
    WHERE dispute_id = dispute_uuid 
    ORDER BY analysis_timestamp DESC 
    LIMIT 1;
    
    -- Calculate risk score
    dispute_risk := calculate_dispute_risk_score(dispute_uuid);
    
    -- Escalate if high risk, low confidence, or high value
    RETURN (
        dispute_risk > 75 OR 
        COALESCE(ai_confidence, 0) < 0.6 OR 
        claim_value > 25000
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE legal_case_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_legal_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users full access to legal case categories" ON legal_case_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to legal disputes" ON legal_disputes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to ai legal analysis" ON ai_legal_analysis FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to legal communications" ON legal_communications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to insurance claims" ON insurance_claims FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to risk assessments" ON risk_assessments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to legal templates" ON legal_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to legal knowledge base" ON legal_knowledge_base FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to legal costs" ON legal_costs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to legal budget" ON legal_budget FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to escalation rules" ON escalation_rules FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to escalation log" ON escalation_log FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to legal performance metrics" ON legal_performance_metrics FOR ALL TO authenticated USING (true);

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================

COMMENT ON SCHEMA public IS 'Extended with Nordflytt Legal & Risk Management System';