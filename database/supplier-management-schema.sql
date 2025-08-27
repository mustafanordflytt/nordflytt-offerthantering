-- EXTEND existing database - Advanced Supplier Management
-- DO NOT create new database

-- Supplier Categories & Classifications
CREATE TABLE supplier_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  category_code VARCHAR(20) UNIQUE,
  description TEXT,
  risk_profile VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  compliance_requirements JSONB,
  approval_workflow JSONB,
  budget_category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comprehensive Supplier Profiles
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  supplier_code VARCHAR(50) UNIQUE,
  company_name VARCHAR(200) NOT NULL,
  category_id INTEGER REFERENCES supplier_categories(id),
  org_number VARCHAR(20), -- Swedish organization number
  vat_number VARCHAR(30),
  f_skatt_number VARCHAR(20), -- Swedish F-skatt number
  contact_person VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  backup_contact JSONB,
  website VARCHAR(500),
  
  -- Address Information
  business_address JSONB,
  billing_address JSONB,
  delivery_address JSONB,
  
  -- Financial Information
  payment_terms JSONB, -- {'net_days': 30, 'early_payment_discount': 2, 'currency': 'SEK'}
  credit_limit INTEGER,
  payment_method VARCHAR(50), -- 'bank_transfer', 'invoice', 'card'
  bank_details JSONB,
  
  -- Contract Information
  contract_start_date DATE,
  contract_end_date DATE,
  contract_type VARCHAR(50), -- 'annual', 'project', 'framework', 'spot'
  contract_value INTEGER,
  contract_documents JSONB, -- file paths and references
  
  -- Performance & Status
  supplier_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended', 'blacklisted'
  preferred_supplier BOOLEAN DEFAULT false,
  strategic_supplier BOOLEAN DEFAULT false,
  performance_tier VARCHAR(20) DEFAULT 'standard', -- 'premium', 'standard', 'basic', 'probation'
  
  -- Risk & Compliance
  risk_score DECIMAL(4,2) DEFAULT 0, -- 0-100 risk score
  compliance_status VARCHAR(50) DEFAULT 'compliant',
  last_audit_date DATE,
  next_audit_date DATE,
  
  -- Certifications & Standards
  quality_certifications JSONB,
  environmental_certifications JSONB,
  insurance_info JSONB,
  
  -- GDPR Compliance
  gdpr_consent_date TIMESTAMP,
  gdpr_consent_purpose TEXT,
  data_retention_period INTEGER, -- months
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER,
  updated_by INTEGER
);

-- Real-time Supplier Monitoring
CREATE TABLE supplier_monitoring (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  monitoring_date DATE DEFAULT CURRENT_DATE,
  f_skatt_status VARCHAR(50), -- 'active', 'inactive', 'revoked'
  credit_score INTEGER,
  credit_rating VARCHAR(10), -- 'AAA', 'AA', 'A', 'BBB', etc.
  bankruptcy_risk_score DECIMAL(4,2),
  payment_behavior_score DECIMAL(4,2),
  public_records_flags JSONB, -- legal issues, fines, etc.
  financial_health_indicators JSONB,
  market_reputation_score DECIMAL(4,2),
  monitoring_source VARCHAR(100), -- 'automatic', 'manual', 'external_api'
  alerts_triggered JSONB,
  action_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Supplier Performance Tracking
CREATE TABLE supplier_performance (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  evaluation_period VARCHAR(50), -- 'monthly', 'quarterly', 'annual'
  period_start DATE,
  period_end DATE,
  
  -- Delivery Performance
  total_deliveries INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  delivery_reliability DECIMAL(5,2), -- percentage
  average_delivery_time DECIMAL(6,2), -- days
  
  -- Quality Performance
  total_orders INTEGER DEFAULT 0,
  defect_rate DECIMAL(5,2), -- percentage
  quality_score DECIMAL(4,2), -- 1-10 scale
  return_rate DECIMAL(5,2), -- percentage
  
  -- Service Performance
  response_time_hours DECIMAL(6,2),
  communication_quality DECIMAL(4,2), -- 1-10 scale
  problem_resolution_time DECIMAL(6,2), -- days
  customer_satisfaction DECIMAL(4,2), -- 1-10 scale
  
  -- Financial Performance
  invoice_accuracy DECIMAL(5,2), -- percentage
  payment_disputes INTEGER DEFAULT 0,
  cost_competitiveness DECIMAL(4,2), -- 1-10 scale
  total_spend INTEGER,
  
  -- Overall Scoring
  overall_performance_score DECIMAL(4,2), -- 1-10 scale
  performance_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
  
  -- Recommendations
  strengths TEXT,
  improvement_areas TEXT,
  recommendations TEXT,
  
  -- Evaluation Details
  evaluated_by INTEGER,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  approved_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Orders & Procurement
CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE,
  supplier_id INTEGER REFERENCES suppliers(id),
  category_id INTEGER REFERENCES supplier_categories(id),
  
  -- Request Information
  requested_by INTEGER,
  request_date DATE DEFAULT CURRENT_DATE,
  business_justification TEXT,
  urgency_level VARCHAR(20) DEFAULT 'normal', -- 'urgent', 'normal', 'low'
  
  -- Approval Workflow
  approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  approved_by INTEGER,
  approval_date DATE,
  approval_notes TEXT,
  
  -- Order Details
  order_date DATE,
  requested_delivery_date DATE,
  confirmed_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- Financial Information
  currency VARCHAR(10) DEFAULT 'SEK',
  subtotal INTEGER,
  tax_amount INTEGER,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER,
  
  -- Items & Specifications
  order_items JSONB, -- detailed item list with quantities, prices, specifications
  delivery_address JSONB,
  special_instructions TEXT,
  
  -- Status Tracking
  order_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'confirmed', 'delivered', 'completed', 'cancelled'
  delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'shipped', 'delivered', 'rejected'
  
  -- Quality & Completion
  quality_check_passed BOOLEAN,
  quality_notes TEXT,
  completion_date DATE,
  
  -- Integration References
  asset_requests JSONB, -- references to asset_movements if applicable
  project_reference VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Supplier Contracts & Agreements
CREATE TABLE supplier_contracts (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  contract_number VARCHAR(50) UNIQUE,
  contract_type VARCHAR(50), -- 'framework', 'annual', 'project', 'master'
  contract_title VARCHAR(200),
  
  -- Contract Periods
  start_date DATE,
  end_date DATE,
  renewal_option BOOLEAN DEFAULT false,
  auto_renewal BOOLEAN DEFAULT false,
  notice_period_days INTEGER DEFAULT 30,
  
  -- Financial Terms
  contract_value INTEGER,
  payment_terms JSONB,
  price_adjustment_mechanism JSONB,
  penalties_clauses JSONB,
  
  -- Performance Requirements
  service_level_agreements JSONB,
  quality_standards JSONB,
  delivery_requirements JSONB,
  performance_metrics JSONB,
  
  -- Legal & Compliance
  governing_law VARCHAR(100) DEFAULT 'Swedish Law',
  dispute_resolution VARCHAR(100),
  confidentiality_terms JSONB,
  data_protection_clauses JSONB,
  
  -- Contract Management
  contract_manager INTEGER,
  contract_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'negotiation', 'active', 'expired', 'terminated'
  
  -- Documents & Attachments
  contract_documents JSONB, -- file paths and document references
  amendments JSONB,
  
  -- Notifications & Alerts
  renewal_alert_days INTEGER DEFAULT 60,
  expiry_alert_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Supplier Audit & Compliance
CREATE TABLE supplier_audits (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  audit_type VARCHAR(50), -- 'compliance', 'quality', 'financial', 'security'
  audit_date DATE,
  auditor_name VARCHAR(200),
  audit_scope TEXT,
  
  -- Audit Results
  overall_score DECIMAL(4,2), -- 1-10 scale
  compliance_score DECIMAL(4,2),
  quality_score DECIMAL(4,2),
  financial_score DECIMAL(4,2),
  
  -- Findings
  strengths TEXT,
  weaknesses TEXT,
  critical_issues TEXT,
  recommendations TEXT,
  
  -- Action Items
  corrective_actions JSONB,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Certification
  certification_awarded BOOLEAN DEFAULT false,
  certification_type VARCHAR(100),
  certification_expiry DATE,
  
  -- Status
  audit_status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER
);

-- Supplier Communication Log
CREATE TABLE supplier_communications (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  communication_type VARCHAR(50), -- 'email', 'phone', 'meeting', 'document', 'alert'
  direction VARCHAR(20), -- 'inbound', 'outbound'
  
  -- Communication Details
  subject VARCHAR(300),
  content TEXT,
  communication_date TIMESTAMP DEFAULT NOW(),
  
  -- Participants
  nordflytt_contact INTEGER,
  supplier_contact VARCHAR(200),
  
  -- Context
  related_po_id INTEGER REFERENCES purchase_orders(id),
  related_contract_id INTEGER REFERENCES supplier_contracts(id),
  priority VARCHAR(20) DEFAULT 'normal', -- 'urgent', 'high', 'normal', 'low'
  
  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT false,
  
  -- Attachments
  attachments JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- GDPR Compliance Tracking
CREATE TABLE gdpr_compliance_log (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  data_subject_type VARCHAR(50), -- 'supplier_contact', 'employee', 'representative'
  data_subject_name VARCHAR(200),
  
  -- GDPR Actions
  action_type VARCHAR(50), -- 'consent_given', 'data_updated', 'data_exported', 'data_deleted'
  action_date TIMESTAMP DEFAULT NOW(),
  legal_basis VARCHAR(100), -- 'contract', 'legitimate_interest', 'consent'
  
  -- Data Details
  data_categories JSONB, -- what types of data are affected
  retention_period INTEGER, -- months
  
  -- Consent Management
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP,
  consent_withdrawn BOOLEAN DEFAULT false,
  consent_withdrawn_date TIMESTAMP,
  
  -- Compliance Status
  compliance_status VARCHAR(50) DEFAULT 'compliant',
  notes TEXT,
  
  performed_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_suppliers_org_number ON suppliers(org_number);
CREATE INDEX idx_suppliers_category ON suppliers(category_id);
CREATE INDEX idx_suppliers_status ON suppliers(supplier_status);
CREATE INDEX idx_suppliers_risk_score ON suppliers(risk_score);
CREATE INDEX idx_supplier_monitoring_date ON supplier_monitoring(monitoring_date);
CREATE INDEX idx_supplier_performance_supplier ON supplier_performance(supplier_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(order_status);
CREATE INDEX idx_supplier_contracts_supplier ON supplier_contracts(supplier_id);
CREATE INDEX idx_supplier_contracts_end_date ON supplier_contracts(end_date);
CREATE INDEX idx_supplier_audits_supplier ON supplier_audits(supplier_id);
CREATE INDEX idx_supplier_communications_supplier ON supplier_communications(supplier_id);
CREATE INDEX idx_gdpr_compliance_supplier ON gdpr_compliance_log(supplier_id);

-- Insert initial supplier categories
INSERT INTO supplier_categories (category_name, category_code, description, risk_profile, budget_category) VALUES
('Inventory Suppliers', 'INV', 'Suppliers of packaging materials, cleaning supplies, and equipment', 'low', 'Operations'),
('Service Providers', 'SVC', 'Insurance, legal, IT, and maintenance services', 'medium', 'Services'),
('Subcontractors', 'SUB', 'Partner network and specialist moving services', 'high', 'Operations'),
('Equipment Suppliers', 'EQP', 'Tools, vehicles, and specialized equipment', 'low', 'Capital'),
('Professional Services', 'PRO', 'Consulting, auditing, and professional services', 'low', 'Services');