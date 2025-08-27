-- NORDFLYTT PARTNER ECOSYSTEM DATABASE SCHEMA
-- Sweden's Most Profitable Partner Network for Moving Services
-- EXTENDS existing Nordflytt database - DO NOT create new database

-- Enable Row Level Security
ALTER DATABASE current SET row_security = on;

-- Partner Categories & Types
CREATE TABLE partner_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE, -- 'mäklare', 'begravningsbyråer', etc.
  category_description TEXT,
  base_kickback_rate DECIMAL(4,2) NOT NULL DEFAULT 0.08, -- Base kickback percentage
  target_market VARCHAR(100),
  business_model TEXT,
  value_proposition TEXT,
  market_potential_sek INTEGER, -- Annual market potential in SEK
  avg_deal_value INTEGER, -- Average deal value in SEK
  avg_deals_per_month INTEGER, -- Expected deals per partner per month
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Partner Organizations/Companies
CREATE TABLE partner_organizations (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES partner_categories(id),
  organization_name VARCHAR(200) NOT NULL,
  org_number VARCHAR(20),
  contact_person VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,
  website VARCHAR(500),
  size_category VARCHAR(50) DEFAULT 'medium', -- 'small', 'medium', 'large', 'enterprise'
  geographic_coverage JSONB, -- Areas they operate in
  partnership_status VARCHAR(50) DEFAULT 'prospective', -- 'prospective', 'negotiating', 'active', 'paused', 'terminated'
  onboarding_stage VARCHAR(50) DEFAULT 'initial_contact',
  contract_signed BOOLEAN DEFAULT false,
  contract_date DATE,
  contract_file_path VARCHAR(500),
  kickback_rate DECIMAL(4,2), -- Negotiated rate for this partner
  payment_terms JSONB,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer', -- 'bank_transfer', 'swish', 'invoice'
  payment_details JSONB, -- Bank account, Swish number, etc.
  exclusivity_agreement BOOLEAN DEFAULT false,
  exclusivity_areas JSONB,
  marketing_support_level VARCHAR(50) DEFAULT 'basic', -- 'none', 'basic', 'premium', 'exclusive'
  training_completed BOOLEAN DEFAULT false,
  system_access_granted BOOLEAN DEFAULT false,
  ai_priority_score DECIMAL(3,2) DEFAULT 0.5, -- AI-calculated partnership potential
  monthly_target_referrals INTEGER DEFAULT 10,
  performance_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual Partner Agents/Representatives
CREATE TABLE partner_agents (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES partner_organizations(id),
  agent_name VARCHAR(200) NOT NULL,
  agent_code VARCHAR(20) UNIQUE, -- Unique tracking code
  email VARCHAR(255),
  phone VARCHAR(20),
  position VARCHAR(100),
  specialization VARCHAR(100),
  personal_kickback_rate DECIMAL(4,2), -- Individual rate if different from org
  performance_tier VARCHAR(20) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  total_referrals INTEGER DEFAULT 0,
  total_revenue_generated INTEGER DEFAULT 0,
  monthly_referrals INTEGER DEFAULT 0,
  quarterly_referrals INTEGER DEFAULT 0,
  yearly_referrals INTEGER DEFAULT 0,
  avg_conversion_rate DECIMAL(3,2) DEFAULT 0.0,
  customer_satisfaction_score DECIMAL(3,2) DEFAULT 0.0,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  last_referral_date DATE,
  last_activity_date DATE,
  training_completed BOOLEAN DEFAULT false,
  training_completion_date DATE,
  system_access_granted BOOLEAN DEFAULT false,
  referral_link VARCHAR(500), -- Personalized referral link
  tracking_phone VARCHAR(20), -- Dedicated tracking phone number
  marketing_materials_access BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Referral Tracking & Attribution
CREATE TABLE partner_referrals (
  id SERIAL PRIMARY KEY,
  partner_organization_id INTEGER REFERENCES partner_organizations(id),
  partner_agent_id INTEGER REFERENCES partner_agents(id),
  referral_code VARCHAR(50) UNIQUE,
  customer_name VARCHAR(200),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_move_from VARCHAR(200),
  customer_move_to VARCHAR(200),
  move_date DATE,
  move_type VARCHAR(100), -- 'residential', 'office', 'storage', 'cleaning', 'dödsbo'
  referral_source VARCHAR(100), -- 'website', 'phone', 'email', 'in_person', 'social_media'
  referral_date TIMESTAMP DEFAULT NOW(),
  first_contact_date TIMESTAMP,
  quote_sent_date TIMESTAMP,
  quote_amount INTEGER,
  estimated_value INTEGER,
  actual_value INTEGER,
  services_included JSONB, -- Array of services requested
  conversion_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'contacted', 'quoted', 'converted', 'lost', 'cancelled'
  conversion_date TIMESTAMP,
  loss_reason VARCHAR(100), -- If lost, reason why
  kickback_amount INTEGER DEFAULT 0,
  kickback_calculated BOOLEAN DEFAULT false,
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'calculated', 'approved', 'paid'
  payment_date DATE,
  customer_satisfaction INTEGER, -- 1-5 rating
  customer_feedback TEXT,
  ai_conversion_probability DECIMAL(3,2), -- AI-predicted conversion chance
  quality_score INTEGER DEFAULT 0, -- Internal quality assessment 1-10
  follow_up_required BOOLEAN DEFAULT true,
  last_follow_up_date DATE,
  next_follow_up_date DATE,
  notes TEXT,
  uppdrag_id INTEGER, -- References existing uppdrag table when converted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Partner Performance Tracking
CREATE TABLE partner_performance (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES partner_organizations(id),
  agent_id INTEGER REFERENCES partner_agents(id),
  performance_period VARCHAR(20), -- 'monthly', 'quarterly', 'yearly'
  period_start DATE,
  period_end DATE,
  total_referrals INTEGER DEFAULT 0,
  successful_conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0.0,
  total_revenue_generated INTEGER DEFAULT 0,
  total_kickback_earned INTEGER DEFAULT 0,
  avg_customer_satisfaction DECIMAL(3,2) DEFAULT 0.0,
  avg_deal_value INTEGER DEFAULT 0,
  performance_tier VARCHAR(20),
  tier_bonus_earned INTEGER DEFAULT 0,
  volume_bonus_earned INTEGER DEFAULT 0,
  quality_bonus_earned INTEGER DEFAULT 0,
  target_achievement DECIMAL(5,2), -- Percentage of target achieved
  ranking_position INTEGER,
  market_share_percentage DECIMAL(3,2), -- Share of referrals in their category
  improvement_areas JSONB,
  achievements JSONB,
  performance_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kickback Calculations & Payments
CREATE TABLE kickback_payments (
  id SERIAL PRIMARY KEY,
  partner_organization_id INTEGER REFERENCES partner_organizations(id),
  partner_agent_id INTEGER REFERENCES partner_agents(id),
  payment_period VARCHAR(50), -- 'January 2025', 'Q1 2025', etc.
  period_start DATE,
  period_end DATE,
  referrals_included INTEGER DEFAULT 0,
  base_kickback_amount INTEGER DEFAULT 0,
  volume_bonus INTEGER DEFAULT 0,
  quality_bonus INTEGER DEFAULT 0,
  tier_bonus INTEGER DEFAULT 0,
  performance_bonus INTEGER DEFAULT 0,
  special_promotion_bonus INTEGER DEFAULT 0,
  total_gross_amount INTEGER DEFAULT 0,
  tax_deduction INTEGER DEFAULT 0,
  admin_fee INTEGER DEFAULT 0,
  net_payment_amount INTEGER DEFAULT 0,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'calculated', 'approved', 'processing', 'paid', 'failed'
  payment_date DATE,
  payment_confirmation VARCHAR(200),
  invoice_required BOOLEAN DEFAULT false,
  invoice_sent BOOLEAN DEFAULT false,
  invoice_file_path VARCHAR(500),
  bank_account JSONB, -- Bank details for payment
  swish_number VARCHAR(20),
  calculation_details JSONB, -- Detailed breakdown of calculation
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Partner Communication & Engagement
CREATE TABLE partner_communications (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES partner_organizations(id),
  agent_id INTEGER REFERENCES partner_agents(id),
  communication_type VARCHAR(50), -- 'email', 'phone', 'meeting', 'training', 'marketing', 'support'
  subject VARCHAR(200),
  content TEXT,
  communication_date TIMESTAMP DEFAULT NOW(),
  initiated_by VARCHAR(100), -- 'nordflytt', 'partner', 'system'
  response_required BOOLEAN DEFAULT false,
  response_received BOOLEAN DEFAULT false,
  response_content TEXT,
  follow_up_date DATE,
  effectiveness_score INTEGER, -- 1-5 rating
  engagement_level VARCHAR(50), -- 'low', 'medium', 'high', 'excellent'
  action_items JSONB,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partner Marketing Materials & Resources
CREATE TABLE partner_resources (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(50), -- 'marketing_material', 'training', 'system_access', 'documentation', 'video', 'presentation'
  resource_title VARCHAR(200),
  resource_description TEXT,
  file_path VARCHAR(500),
  file_type VARCHAR(20), -- 'pdf', 'video', 'image', 'doc', 'link'
  file_size INTEGER, -- In bytes
  target_categories JSONB, -- Which partner categories this applies to
  access_level VARCHAR(50), -- 'all', 'premium', 'gold', 'platinum', 'specific'
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  effectiveness_rating DECIMAL(3,2),
  partner_feedback JSONB,
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  expiry_date DATE,
  created_by VARCHAR(100),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partner Onboarding Process Tracking
CREATE TABLE partner_onboarding (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES partner_organizations(id),
  onboarding_stage VARCHAR(50), -- 'initial_contact', 'value_demo', 'negotiation', 'contract', 'integration', 'training', 'launch'
  stage_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped', 'failed'
  stage_started_date DATE,
  stage_completed_date DATE,
  stage_notes TEXT,
  assigned_to VARCHAR(100), -- Nordflytt team member responsible
  completion_percentage INTEGER DEFAULT 0,
  next_action VARCHAR(200),
  next_action_date DATE,
  documents_required JSONB,
  documents_received JSONB,
  training_modules_completed JSONB,
  system_setup_completed BOOLEAN DEFAULT false,
  first_referral_received BOOLEAN DEFAULT false,
  onboarding_feedback TEXT,
  success_probability DECIMAL(3,2), -- AI-predicted onboarding success
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Partner Training & Certification
CREATE TABLE partner_training (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES partner_organizations(id),
  agent_id INTEGER REFERENCES partner_agents(id),
  training_type VARCHAR(50), -- 'initial', 'advanced', 'refresher', 'specialized'
  training_module VARCHAR(100),
  training_date DATE,
  training_duration_minutes INTEGER,
  trainer VARCHAR(100),
  completion_status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled'
  completion_date DATE,
  test_score INTEGER, -- 0-100
  certification_earned BOOLEAN DEFAULT false,
  certification_expiry_date DATE,
  feedback_score INTEGER, -- 1-5 training quality rating
  feedback_comments TEXT,
  materials_provided JSONB,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stockholm Market Intelligence
INSERT INTO partner_categories (category_name, category_description, base_kickback_rate, target_market, business_model, value_proposition, market_potential_sek, avg_deal_value, avg_deals_per_month) VALUES
('mäklare', 'Real Estate Agents - Stockholm region focus', 0.10, 'Stockholm housing market', 'Commission-based referrals', 'Seamless customer experience + extra revenue stream', 50000000, 8500, 15),
('begravningsbyråer', 'Funeral Homes - Dödsbo clearing specialists', 0.12, 'Estate clearing market', 'Compassionate service partnerships', 'Professional dödsbo service + substantial kickbacks', 15000000, 12000, 8),
('fastighetsförvaltare', 'Property Management Companies', 0.08, 'Rental property moves', 'Tenant service automation', 'Streamlined moves + consistent revenue', 30000000, 7500, 25),
('bankRådgivare', 'Bank Mortgage Advisors', 0.06, 'New homeowners', 'Complete customer journey', 'Mortgage-to-move services + commission', 25000000, 9500, 12),
('flyttstädning', 'Cleaning Companies', 0.10, 'Move-out cleaning market', 'Service package partnerships', 'Complete service offering + revenue sharing', 20000000, 6500, 20),
('inredningsbutiker', 'Furniture & Interior Stores', 0.08, 'New home furnishing', 'Delivery service partnerships', 'Premium delivery + partnerships', 12000000, 8000, 10);

-- Sample Partner Organizations
INSERT INTO partner_organizations (category_id, organization_name, org_number, contact_person, email, phone, website, size_category, partnership_status, kickback_rate, ai_priority_score, monthly_target_referrals) VALUES
(1, 'Svensk Fastighetsförmedling Stockholm', '556188-8888', 'Anna Carlsson', 'anna.carlsson@svenskfast.se', '+46 8 123 45 67', 'svenskfast.se', 'large', 'active', 0.10, 0.95, 25),
(1, 'Hemnet Mäkleri AB', '556299-9999', 'Erik Johansson', 'erik.johansson@hemnet.se', '+46 8 234 56 78', 'hemnet.se', 'enterprise', 'negotiating', 0.11, 0.92, 40),
(2, 'Fonus Stockholm', '556077-7777', 'Maria Lindqvist', 'maria.lindqvist@fonus.se', '+46 8 345 67 89', 'fonus.se', 'large', 'active', 0.12, 0.88, 12),
(3, 'Stockholmshem', '556366-6666', 'Lars Andersson', 'lars.andersson@stockholmshem.se', '+46 8 456 78 90', 'stockholmshem.se', 'enterprise', 'prospective', 0.08, 0.85, 35),
(4, 'Handelsbanken Private Banking', '556455-5555', 'Karin Nilsson', 'karin.nilsson@handelsbanken.se', '+46 8 567 89 01', 'handelsbanken.se', 'large', 'active', 0.06, 0.82, 18),
(5, 'Stockholm Städservice', '556544-4444', 'Johan Petersson', 'johan.petersson@stockholmstäd.se', '+46 8 678 90 12', 'stockholmstäd.se', 'medium', 'active', 0.10, 0.79, 22);

-- Create performance optimization indexes
CREATE INDEX idx_partner_referrals_status ON partner_referrals(conversion_status, referral_date);
CREATE INDEX idx_partner_referrals_partner ON partner_referrals(partner_organization_id, partner_agent_id);
CREATE INDEX idx_partner_referrals_date ON partner_referrals(referral_date DESC);
CREATE INDEX idx_partner_organizations_status ON partner_organizations(partnership_status, category_id);
CREATE INDEX idx_partner_agents_performance ON partner_agents(performance_tier, total_referrals DESC);
CREATE INDEX idx_kickback_payments_status ON kickback_payments(payment_status, period_start);
CREATE INDEX idx_partner_performance_period ON partner_performance(performance_period, period_start DESC);
CREATE INDEX idx_partner_communications_date ON partner_communications(communication_date DESC);

-- Row Level Security Policies
ALTER TABLE partner_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE kickback_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_training ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for now - would be restricted in production)
CREATE POLICY "Allow all operations on partner_categories" ON partner_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on partner_organizations" ON partner_organizations FOR ALL USING (true);
CREATE POLICY "Allow all operations on partner_agents" ON partner_agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on partner_referrals" ON partner_referrals FOR ALL USING (true);
CREATE POLICY "Allow all operations on partner_performance" ON partner_performance FOR ALL USING (true);
CREATE POLICY "Allow all operations on kickback_payments" ON kickback_payments FOR ALL USING (true);
CREATE POLICY "Allow all operations on partner_communications" ON partner_communications FOR ALL USING (true);
CREATE POLICY "Allow all operations on partner_resources" ON partner_resources FOR ALL USING (true);
CREATE POLICY "Allow all operations on partner_onboarding" ON partner_onboarding FOR ALL USING (true);
CREATE POLICY "Allow all operations on partner_training" ON partner_training FOR ALL USING (true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_partner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER partner_organizations_updated_at
  BEFORE UPDATE ON partner_organizations
  FOR EACH ROW EXECUTE FUNCTION update_partner_updated_at();

CREATE TRIGGER partner_agents_updated_at
  BEFORE UPDATE ON partner_agents
  FOR EACH ROW EXECUTE FUNCTION update_partner_updated_at();

CREATE TRIGGER partner_referrals_updated_at
  BEFORE UPDATE ON partner_referrals
  FOR EACH ROW EXECUTE FUNCTION update_partner_updated_at();

CREATE TRIGGER kickback_payments_updated_at
  BEFORE UPDATE ON kickback_payments
  FOR EACH ROW EXECUTE FUNCTION update_partner_updated_at();

CREATE TRIGGER partner_onboarding_updated_at
  BEFORE UPDATE ON partner_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_partner_updated_at();

-- Sample referral data for demonstration
INSERT INTO partner_referrals (partner_organization_id, partner_agent_id, referral_code, customer_name, customer_email, customer_phone, customer_move_from, customer_move_to, move_date, move_type, referral_source, estimated_value, conversion_status, ai_conversion_probability, quality_score) VALUES
(1, NULL, 'MÄK001REF', 'Gustav Andersson', 'gustav.andersson@email.com', '+46 70 123 45 67', 'Södermalm, Stockholm', 'Östermalm, Stockholm', '2025-02-15', 'residential', 'website', 8500, 'quoted', 0.85, 8),
(1, NULL, 'MÄK002REF', 'Sarah Johnson', 'sarah.johnson@email.com', '+46 70 234 56 78', 'Gamla Stan, Stockholm', 'Vasastan, Stockholm', '2025-02-28', 'residential', 'phone', 12000, 'converted', 0.92, 9),
(3, NULL, 'BEG001REF', 'Familjen Svensson', 'erik.svensson@email.com', '+46 70 345 67 89', 'Bromma, Stockholm', 'Dödsbo clearing', '2025-02-10', 'dödsbo', 'in_person', 18000, 'pending', 0.78, 7),
(5, NULL, 'BAN001REF', 'Mikael Lindström', 'mikael.lindstrom@email.com', '+46 70 456 78 90', 'Sollentuna', 'Danderyd', '2025-03-05', 'residential', 'email', 9200, 'contacted', 0.75, 8),
(6, NULL, 'STÄ001REF', 'Anna Petersson', 'anna.petersson@email.com', '+46 70 567 89 01', 'Nacka', 'Täby', '2025-02-20', 'residential', 'website', 7800, 'quoted', 0.81, 8);

-- Sample kickback calculations
INSERT INTO kickback_payments (partner_organization_id, payment_period, period_start, period_end, referrals_included, base_kickback_amount, volume_bonus, quality_bonus, tier_bonus, total_gross_amount, net_payment_amount, payment_status) VALUES
(1, 'January 2025', '2025-01-01', '2025-01-31', 8, 6800, 680, 340, 200, 8020, 8020, 'calculated'),
(3, 'January 2025', '2025-01-01', '2025-01-31', 3, 4320, 0, 216, 100, 4636, 4636, 'approved'),
(5, 'January 2025', '2025-01-01', '2025-01-31', 6, 2550, 255, 128, 150, 3083, 3083, 'paid');

COMMENT ON TABLE partner_categories IS 'Partner categories with market intelligence and revenue potential';
COMMENT ON TABLE partner_organizations IS 'Partner companies and organizations in the ecosystem';
COMMENT ON TABLE partner_agents IS 'Individual agents/representatives within partner organizations';
COMMENT ON TABLE partner_referrals IS 'All referrals from partners with attribution and conversion tracking';
COMMENT ON TABLE partner_performance IS 'Performance metrics and analytics for partners and agents';
COMMENT ON TABLE kickback_payments IS 'Calculated and processed kickback payments to partners';
COMMENT ON TABLE partner_communications IS 'Communication history and engagement tracking';
COMMENT ON TABLE partner_resources IS 'Marketing materials and resources for partners';
COMMENT ON TABLE partner_onboarding IS 'Onboarding process tracking and management';
COMMENT ON TABLE partner_training IS 'Training and certification tracking for partners';