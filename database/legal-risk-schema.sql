-- NORDFLYTT LEGAL AI & RISK MANAGEMENT SCHEMA
-- Extends existing Nordflytt database with legal protection features
-- DO NOT create new database - ADD to existing database

-- Legal Case Categories
CREATE TABLE IF NOT EXISTS legal_case_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL, -- 'damage_claim', 'service_complaint', etc.
  category_description TEXT,
  typical_resolution TEXT,
  legal_framework TEXT, -- Reference to Swedish law
  severity_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  average_resolution_time INTEGER, -- days
  typical_cost_range JSONB, -- min/max cost estimates
  automation_eligible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Legal Disputes & Cases
CREATE TABLE IF NOT EXISTS legal_disputes (
  id SERIAL PRIMARY KEY,
  case_number VARCHAR(50) UNIQUE,
  customer_id INTEGER REFERENCES kunder(id),
  uppdrag_id INTEGER REFERENCES uppdrag(id),
  category_id INTEGER REFERENCES legal_case_categories(id),
  dispute_title VARCHAR(200),
  dispute_description TEXT,
  customer_claim TEXT,
  reported_date TIMESTAMP DEFAULT NOW(),
  incident_date DATE,
  estimated_value INTEGER, -- SEK value of claim
  urgency_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'investigating', 'responding', 'resolved', 'escalated'
  assigned_to INTEGER REFERENCES anställda(id),
  resolution_method VARCHAR(100),
  resolution_date TIMESTAMP,
  final_cost INTEGER,
  customer_satisfaction INTEGER, -- 1-5 rating of resolution
  lessons_learned TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Legal Analysis Results
CREATE TABLE IF NOT EXISTS ai_legal_analysis (
  id SERIAL PRIMARY KEY,
  dispute_id INTEGER REFERENCES legal_disputes(id),
  analysis_version INTEGER DEFAULT 1,
  ai_classification JSONB, -- AI's categorization of the dispute
  legal_strength_assessment DECIMAL(3,2), -- 0-1 score of legal position
  risk_factors JSONB, -- Identified risk factors
  similar_cases JSONB, -- References to similar historical cases
  recommended_strategy VARCHAR(100),
  estimated_resolution_time INTEGER, -- days
  estimated_cost_range JSONB,
  confidence_score DECIMAL(3,2), -- AI confidence in analysis
  generated_response TEXT, -- AI-generated initial response
  escalation_recommended BOOLEAN DEFAULT false,
  escalation_reasons JSONB,
  insurance_claim_recommended BOOLEAN DEFAULT false,
  analysis_timestamp TIMESTAMP DEFAULT NOW()
);

-- Legal Communications & Responses
CREATE TABLE IF NOT EXISTS legal_communications (
  id SERIAL PRIMARY KEY,
  dispute_id INTEGER REFERENCES legal_disputes(id),
  communication_type VARCHAR(50), -- 'initial_response', 'follow_up', 'settlement_offer'
  direction VARCHAR(20), -- 'outbound', 'inbound'
  sender VARCHAR(200),
  recipient VARCHAR(200),
  subject VARCHAR(300),
  content TEXT,
  communication_date TIMESTAMP DEFAULT NOW(),
  response_deadline DATE,
  ai_generated BOOLEAN DEFAULT false,
  template_used VARCHAR(100),
  effectiveness_score DECIMAL(3,2), -- How effective was this communication
  customer_response TEXT,
  escalation_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insurance Claims Integration
CREATE TABLE IF NOT EXISTS insurance_claims (
  id SERIAL PRIMARY KEY,
  dispute_id INTEGER REFERENCES legal_disputes(id),
  claim_number VARCHAR(100),
  insurance_company VARCHAR(200),
  policy_number VARCHAR(100),
  claim_type VARCHAR(100), -- 'property_damage', 'liability', 'professional_indemnity'
  claim_amount INTEGER,
  claim_status VARCHAR(50), -- 'submitted', 'under_review', 'approved', 'denied'
  submitted_date DATE,
  response_date DATE,
  settlement_amount INTEGER,
  settlement_date DATE,
  claim_documents JSONB, -- File paths and document references
  adjuster_contact JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Risk Assessment & Prediction
CREATE TABLE IF NOT EXISTS risk_assessments (
  id SERIAL PRIMARY KEY,
  assessment_type VARCHAR(50), -- 'job_risk', 'customer_risk', 'general_risk'
  reference_id INTEGER, -- Could reference uppdrag, customer, or be null for general
  reference_type VARCHAR(50), -- 'uppdrag', 'customer', 'general'
  risk_factors JSONB, -- Identified risk factors
  risk_score DECIMAL(4,2), -- Overall risk score 0-100
  risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  mitigation_strategies JSONB, -- Recommended risk mitigation actions
  predicted_issues JSONB, -- What might go wrong
  prevention_measures JSONB, -- How to prevent issues
  assessment_date TIMESTAMP DEFAULT NOW(),
  assessed_by VARCHAR(50), -- 'ai_system', 'manual', 'hybrid'
  validity_period INTEGER, -- days this assessment is valid
  actual_outcome VARCHAR(100), -- What actually happened (for learning)
  accuracy_score DECIMAL(3,2), -- How accurate was the prediction
  created_at TIMESTAMP DEFAULT NOW()
);

-- Legal Templates & Knowledge Base
CREATE TABLE IF NOT EXISTS legal_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(200),
  template_type VARCHAR(100), -- 'response_letter', 'settlement_offer', 'denial_letter'
  applicable_categories JSONB, -- Which dispute categories this applies to
  template_content TEXT,
  variables JSONB, -- Template variables that get replaced
  legal_review_date DATE,
  approved_by VARCHAR(200),
  usage_count INTEGER DEFAULT 0,
  effectiveness_rating DECIMAL(3,2),
  last_updated TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Legal Costs & Budget Tracking
CREATE TABLE IF NOT EXISTS legal_costs (
  id SERIAL PRIMARY KEY,
  dispute_id INTEGER REFERENCES legal_disputes(id),
  cost_type VARCHAR(100), -- 'settlement', 'legal_fees', 'court_costs', 'expert_witness'
  cost_description TEXT,
  estimated_cost INTEGER,
  actual_cost INTEGER,
  cost_date DATE,
  paid_date DATE,
  payment_method VARCHAR(50),
  cost_category VARCHAR(50), -- 'direct', 'indirect', 'opportunity_cost'
  budget_impact INTEGER, -- Impact on monthly legal budget
  recovery_possible BOOLEAN DEFAULT false, -- Can this cost be recovered?
  recovery_amount INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_disputes_status ON legal_disputes(status);
CREATE INDEX IF NOT EXISTS idx_legal_disputes_customer ON legal_disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_legal_disputes_category ON legal_disputes(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_legal_analysis_dispute ON ai_legal_analysis(dispute_id);
CREATE INDEX IF NOT EXISTS idx_legal_communications_dispute ON legal_communications(dispute_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_type ON risk_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_level ON risk_assessments(risk_level);

-- Insert default legal case categories
INSERT INTO legal_case_categories (category_name, category_description, typical_resolution, legal_framework, severity_level, average_resolution_time, typical_cost_range, automation_eligible) VALUES
('damage_claim', 'Skador på kundens egendom under flytt', 'insurance_claim_or_compensation', 'Konsumenttjänstlagen § 24-25', 'high', 7, '{"min": 1000, "max": 50000}', true),
('service_complaint', 'Klagomål på service kvalitet', 'service_recovery_or_discount', 'Konsumenttjänstlagen § 11-12', 'medium', 3, '{"min": 500, "max": 5000}', true),
('pricing_dispute', 'Tvist om pris eller faktura', 'price_adjustment_or_explanation', 'Konsumenttjänstlagen § 15', 'medium', 2, '{"min": 100, "max": 10000}', true),
('contract_breach', 'Påstått avtalsbrott', 'contract_remediation_or_damages', 'Avtalslagen + Konsumenttjänstlagen', 'high', 14, '{"min": 5000, "max": 100000}', false),
('delay_complaint', 'Försenad leverans eller utförande', 'explanation_and_goodwill', 'Konsumenttjänstlagen § 9', 'low', 1, '{"min": 0, "max": 2000}', true),
('payment_dispute', 'Tvist om betalning', 'payment_plan_or_adjustment', 'Konsumenttjänstlagen § 15-16', 'medium', 5, '{"min": 1000, "max": 20000}', true);