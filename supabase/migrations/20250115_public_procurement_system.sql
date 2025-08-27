/**
 * NORDFLYTT OFFENTLIGA UPPHANDLINGAR - DATABASE SCHEMA
 * STOCKHOLM-FOCUSED PUBLIC PROCUREMENT DOMINATION SYSTEM
 */

-- Public Entities Database (Stockholm focus)
CREATE TABLE public_entities (
  id SERIAL PRIMARY KEY,
  entity_name VARCHAR(200) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'kommun', 'region', 'myndighet', 'bolag'
  org_number VARCHAR(20),
  municipality VARCHAR(100),
  region VARCHAR(100) DEFAULT 'Stockholm',
  contact_info JSONB DEFAULT '{}',
  annual_moving_budget INTEGER,
  procurement_system VARCHAR(100), -- 'Visma Commerce', 'TED', 'Internal', 'Mixed'
  decision_makers JSONB DEFAULT '[]',
  key_contacts JSONB DEFAULT '[]',
  political_context JSONB DEFAULT '{}',
  relationship_status VARCHAR(50) DEFAULT 'prospective', -- 'prospective', 'contacted', 'engaged', 'client', 'reference'
  last_contact DATE,
  ai_priority_score DECIMAL(3,2) DEFAULT 0.5,
  market_value_potential INTEGER DEFAULT 0,
  competitive_position VARCHAR(50) DEFAULT 'unknown',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Procurement Opportunities Tracking
CREATE TABLE procurement_opportunities (
  id SERIAL PRIMARY KEY,
  entity_id INTEGER REFERENCES public_entities(id),
  tender_id VARCHAR(100) UNIQUE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  estimated_value INTEGER,
  procurement_type VARCHAR(50), -- 'öppen', 'selektiv', 'direktupphandling', 'ramavtal'
  category VARCHAR(100), -- 'flyttjänster', 'städning', 'transport', 'logistik'
  subcategory VARCHAR(100), -- 'kontorsflytt', 'skolflyttar', 'biblioteksflytt'
  publication_date DATE,
  deadline_date TIMESTAMP,
  contract_period VARCHAR(100),
  contract_start_date DATE,
  requirements_document_url VARCHAR(500),
  technical_requirements JSONB DEFAULT '{}',
  environmental_requirements JSONB DEFAULT '{}',
  security_requirements JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'identified', -- 'identified', 'analyzing', 'offer_ready', 'submitted', 'awarded', 'lost', 'withdrawn'
  win_probability DECIMAL(3,2) DEFAULT 0.5,
  strategic_importance VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  ai_analysis JSONB DEFAULT '{}',
  competitor_analysis JSONB DEFAULT '{}',
  nordflytt_advantages JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  opportunity_source VARCHAR(100), -- 'Visma Commerce', 'TED', 'Website', 'Network', 'AI Scanner'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI-Generated Offers & Proposals
CREATE TABLE ai_generated_offers (
  id SERIAL PRIMARY KEY,
  opportunity_id INTEGER REFERENCES procurement_opportunities(id),
  offer_version INTEGER DEFAULT 1,
  generated_by_ai BOOLEAN DEFAULT true,
  generation_time_seconds INTEGER,
  total_price INTEGER NOT NULL,
  pricing_breakdown JSONB DEFAULT '{}',
  technical_solution JSONB DEFAULT '{}',
  compliance_checklist JSONB DEFAULT '{}',
  competitive_advantages JSONB DEFAULT '[]',
  risk_assessment JSONB DEFAULT '{}',
  environmental_plan JSONB DEFAULT '{}',
  quality_assurance JSONB DEFAULT '{}',
  team_presentation JSONB DEFAULT '{}',
  project_methodology JSONB DEFAULT '{}',
  references_included JSONB DEFAULT '[]',
  ai_confidence_score DECIMAL(3,2) DEFAULT 0.5,
  estimated_win_probability DECIMAL(3,2) DEFAULT 0.5,
  document_paths JSONB DEFAULT '{}', -- PDF paths for generated documents
  submission_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'submitted', 'withdrawn'
  submitted_at TIMESTAMP,
  result VARCHAR(50), -- 'won', 'lost', 'pending', 'qualified', 'disqualified'
  contract_value INTEGER, -- actual awarded value if won
  feedback TEXT,
  lessons_learned JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stakeholder Relationship Management
CREATE TABLE stakeholder_relationships (
  id SERIAL PRIMARY KEY,
  entity_id INTEGER REFERENCES public_entities(id),
  contact_name VARCHAR(200) NOT NULL,
  title VARCHAR(200),
  department VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(20),
  linkedin_url VARCHAR(500),
  influence_level VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  decision_authority VARCHAR(100), -- 'budget_approval', 'technical_approval', 'procurement_decision'
  relationship_quality VARCHAR(20) DEFAULT 'neutral', -- 'excellent', 'good', 'neutral', 'poor', 'hostile'
  last_interaction DATE,
  interaction_history JSONB DEFAULT '[]',
  communication_preferences JSONB DEFAULT '{}',
  political_affiliation VARCHAR(100),
  career_background JSONB DEFAULT '{}',
  decision_making_style VARCHAR(50), -- 'analytical', 'relationship', 'consensus', 'authoritative'
  key_interests JSONB DEFAULT '[]',
  pain_points JSONB DEFAULT '[]',
  preferred_communication_style VARCHAR(50),
  meeting_frequency VARCHAR(50),
  notes TEXT,
  ai_relationship_score DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Public Sector Project Execution
CREATE TABLE public_projects (
  id SERIAL PRIMARY KEY,
  opportunity_id INTEGER REFERENCES procurement_opportunities(id),
  offer_id INTEGER REFERENCES ai_generated_offers(id),
  contract_reference VARCHAR(100),
  contract_value INTEGER,
  start_date DATE,
  end_date DATE,
  project_status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'completed', 'cancelled', 'suspended'
  compliance_requirements JSONB DEFAULT '{}',
  reporting_schedule JSONB DEFAULT '{}',
  kpi_tracking JSONB DEFAULT '{}',
  stakeholder_communication JSONB DEFAULT '{}',
  quality_metrics JSONB DEFAULT '{}',
  environmental_impact JSONB DEFAULT '{}',
  security_protocols JSONB DEFAULT '{}',
  risk_management JSONB DEFAULT '{}',
  budget_tracking JSONB DEFAULT '{}',
  change_requests JSONB DEFAULT '[]',
  milestone_tracking JSONB DEFAULT '[]',
  client_satisfaction_score DECIMAL(3,2),
  reference_value VARCHAR(20) DEFAULT 'high', -- 'critical', 'high', 'medium', 'low'
  lessons_learned JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Compliance & Reporting
CREATE TABLE compliance_reports (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES public_projects(id),
  report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'milestone', 'final', 'incident'
  report_period VARCHAR(50),
  compliance_score DECIMAL(3,2),
  kpi_results JSONB DEFAULT '{}',
  environmental_metrics JSONB DEFAULT '{}',
  quality_scores JSONB DEFAULT '{}',
  safety_metrics JSONB DEFAULT '{}',
  stakeholder_feedback JSONB DEFAULT '{}',
  improvement_areas JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  generated_automatically BOOLEAN DEFAULT true,
  report_file_path VARCHAR(500),
  submitted_at TIMESTAMP,
  approved_by VARCHAR(200),
  client_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Market Intelligence & Competitive Analysis
CREATE TABLE market_intelligence (
  id SERIAL PRIMARY KEY,
  intelligence_type VARCHAR(50) NOT NULL, -- 'competitor', 'political', 'budget', 'trend', 'opportunity'
  entity_id INTEGER REFERENCES public_entities(id),
  data_source VARCHAR(100), -- 'web_scraping', 'network', 'public_records', 'media', 'ai_analysis'
  intelligence_data JSONB DEFAULT '{}',
  key_insights JSONB DEFAULT '[]',
  credibility_score DECIMAL(3,2) DEFAULT 0.5,
  strategic_importance VARCHAR(20) DEFAULT 'medium',
  action_items JSONB DEFAULT '[]',
  related_opportunities TEXT[],
  verification_status VARCHAR(50) DEFAULT 'unverified', -- 'verified', 'unverified', 'disputed', 'outdated'
  expiry_date DATE,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Competition Tracking
CREATE TABLE competitor_analysis (
  id SERIAL PRIMARY KEY,
  competitor_name VARCHAR(200) NOT NULL,
  competitor_type VARCHAR(50), -- 'traditional', 'tech_enabled', 'local', 'national'
  market_position VARCHAR(50), -- 'leader', 'challenger', 'follower', 'niche'
  geographic_focus TEXT[],
  estimated_revenue INTEGER,
  employee_count INTEGER,
  key_strengths JSONB DEFAULT '[]',
  key_weaknesses JSONB DEFAULT '[]',
  pricing_strategy JSONB DEFAULT '{}',
  technology_capabilities JSONB DEFAULT '{}',
  client_portfolio JSONB DEFAULT '[]',
  recent_wins JSONB DEFAULT '[]',
  recent_losses JSONB DEFAULT '[]',
  partnership_network JSONB DEFAULT '[]',
  threat_level VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low', 'minimal'
  competitive_response_strategy JSONB DEFAULT '{}',
  monitoring_frequency VARCHAR(50) DEFAULT 'monthly',
  last_analysis_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stockholm-Specific Political & Budget Intelligence
CREATE TABLE stockholm_political_intelligence (
  id SERIAL PRIMARY KEY,
  entity_id INTEGER REFERENCES public_entities(id),
  political_period VARCHAR(50), -- '2022-2026', '2026-2030'
  ruling_coalition JSONB DEFAULT '{}',
  key_political_figures JSONB DEFAULT '[]',
  political_priorities JSONB DEFAULT '[]',
  budget_cycle_info JSONB DEFAULT '{}',
  upcoming_elections JSONB DEFAULT '{}',
  policy_changes JSONB DEFAULT '[]',
  infrastructure_plans JSONB DEFAULT '{}',
  environmental_commitments JSONB DEFAULT '{}',
  digitalization_agenda JSONB DEFAULT '{}',
  procurement_policy_changes JSONB DEFAULT '[]',
  relationship_opportunities JSONB DEFAULT '[]',
  political_risk_factors JSONB DEFAULT '[]',
  intelligence_confidence DECIMAL(3,2) DEFAULT 0.5,
  strategic_implications TEXT,
  action_recommendations JSONB DEFAULT '[]',
  next_review_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for optimal performance
CREATE INDEX idx_procurement_opportunities_deadline ON procurement_opportunities(deadline_date);
CREATE INDEX idx_procurement_opportunities_status ON procurement_opportunities(status);
CREATE INDEX idx_procurement_opportunities_entity ON procurement_opportunities(entity_id);
CREATE INDEX idx_procurement_opportunities_value ON procurement_opportunities(estimated_value);
CREATE INDEX idx_public_entities_type ON public_entities(entity_type);
CREATE INDEX idx_public_entities_region ON public_entities(region);
CREATE INDEX idx_public_entities_priority ON public_entities(ai_priority_score);
CREATE INDEX idx_stakeholder_relationships_influence ON stakeholder_relationships(influence_level);
CREATE INDEX idx_stakeholder_relationships_entity ON stakeholder_relationships(entity_id);
CREATE INDEX idx_public_projects_status ON public_projects(project_status);
CREATE INDEX idx_ai_generated_offers_opportunity ON ai_generated_offers(opportunity_id);
CREATE INDEX idx_ai_generated_offers_confidence ON ai_generated_offers(ai_confidence_score);
CREATE INDEX idx_market_intelligence_type ON market_intelligence(intelligence_type);
CREATE INDEX idx_market_intelligence_entity ON market_intelligence(entity_id);
CREATE INDEX idx_competitor_analysis_threat ON competitor_analysis(threat_level);

-- Add RLS (Row Level Security) policies
ALTER TABLE public_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE stockholm_political_intelligence ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (Nordflytt staff)
CREATE POLICY "Enable all operations for authenticated users" ON public_entities
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON procurement_opportunities
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON ai_generated_offers
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON stakeholder_relationships
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public_projects
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON compliance_reports
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON market_intelligence
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON competitor_analysis
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON stockholm_political_intelligence
FOR ALL USING (auth.role() = 'authenticated');

-- Insert Stockholm-focused initial data
INSERT INTO public_entities (entity_name, entity_type, municipality, region, annual_moving_budget, procurement_system, relationship_status, ai_priority_score, market_value_potential) VALUES
('Stockholms Stad', 'kommun', 'Stockholm', 'Stockholm', 20000000, 'Visma Commerce', 'prospective', 0.95, 15000000),
('Region Stockholm', 'region', 'Stockholm', 'Stockholm', 15000000, 'TED + Visma Commerce', 'prospective', 0.90, 12000000),
('Solna Kommun', 'kommun', 'Solna', 'Stockholm', 3000000, 'Visma Commerce', 'prospective', 0.85, 2500000),
('Sundbybergs Kommun', 'kommun', 'Sundbyberg', 'Stockholm', 1500000, 'Visma Commerce', 'prospective', 0.80, 1200000),
('Nacka Kommun', 'kommun', 'Nacka', 'Stockholm', 2500000, 'Visma Commerce', 'prospective', 0.75, 2000000),
('Täby Kommun', 'kommun', 'Täby', 'Stockholm', 2000000, 'Visma Commerce', 'prospective', 0.70, 1800000),
('Danderyd Kommun', 'kommun', 'Danderyd', 'Stockholm', 1200000, 'Internal', 'prospective', 0.65, 1000000),
('Lidingö Kommun', 'kommun', 'Lidingö', 'Stockholm', 1800000, 'Visma Commerce', 'prospective', 0.70, 1500000),
('Huddinge Kommun', 'kommun', 'Huddinge', 'Stockholm', 4000000, 'Visma Commerce', 'prospective', 0.75, 3500000),
('Botkyrka Kommun', 'kommun', 'Botkyrka', 'Stockholm', 2200000, 'Visma Commerce', 'prospective', 0.65, 1800000),
('Skatteverket', 'myndighet', 'Stockholm', 'Stockholm', 8000000, 'TED', 'prospective', 0.85, 6000000),
('Försäkringskassan', 'myndighet', 'Stockholm', 'Stockholm', 6000000, 'TED', 'prospective', 0.80, 5000000),
('Arbetsförmedlingen', 'myndighet', 'Stockholm', 'Stockholm', 5000000, 'TED', 'prospective', 0.75, 4000000),
('Polismyndigheten Stockholm', 'myndighet', 'Stockholm', 'Stockholm', 7000000, 'TED', 'prospective', 0.90, 6000000);

-- Insert sample procurement opportunities
INSERT INTO procurement_opportunities (entity_id, tender_id, title, description, estimated_value, procurement_type, category, subcategory, deadline_date, status, win_probability, strategic_importance, ai_analysis) VALUES
(1, 'STHLM-2025-001', 'Kontorsflyttar för Stockholms Stad 2025', 'Ramavtal för kontorsflyttar inom Stockholms Stad', 5000000, 'ramavtal', 'flyttjänster', 'kontorsflytt', '2025-03-15 14:00:00', 'identified', 0.75, 'critical', '{"advantages": ["AI optimization", "Cost efficiency"], "challenges": ["Large scale", "Multiple locations"]}'),
(2, 'RSTHLM-2025-001', 'Sjukhusflyttar Region Stockholm', 'Flytt av medicinsk utrustning och administration', 3500000, 'öppen', 'flyttjänster', 'sjukhusflytt', '2025-02-28 12:00:00', 'identified', 0.65, 'high', '{"advantages": ["Specialized equipment handling"], "challenges": ["Security requirements", "24/7 operations"]}'),
(3, 'SOLNA-2025-001', 'Skolflyttar Solna Kommun', 'Flytt av undervisningsmaterial och utrustning', 800000, 'öppen', 'flyttjänster', 'skolflyttar', '2025-04-10 16:00:00', 'analyzing', 0.80, 'high', '{"advantages": ["AI route optimization", "Summer schedule flexibility"], "challenges": ["Sensitive equipment", "Time constraints"]}');

-- Insert competitor analysis data
INSERT INTO competitor_analysis (competitor_name, competitor_type, market_position, geographic_focus, estimated_revenue, key_strengths, key_weaknesses, threat_level) VALUES
('Flyttfirman Stockholm AB', 'traditional', 'leader', '["Stockholm", "Stockholms län"]', 50000000, '["Established relationships", "Local presence"]', '["No AI technology", "Higher costs", "Manual processes"]', 'high'),
('Nordic Moving Solutions', 'traditional', 'challenger', '["Stockholm", "Göteborg", "Malmö"]', 30000000, '["National presence", "Large capacity"]', '["No automation", "Slower adaptation", "Higher overhead"]', 'medium'),
('Smart Flytt AB', 'tech_enabled', 'follower', '["Stockholm"]', 15000000, '["Some digitalization", "Modern vehicles"]', '["Limited AI", "Smaller scale", "Less experience"]', 'low');

-- Add automated triggers for data consistency
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_public_entities_modtime BEFORE UPDATE ON public_entities FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_procurement_opportunities_modtime BEFORE UPDATE ON procurement_opportunities FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_ai_generated_offers_modtime BEFORE UPDATE ON ai_generated_offers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_stakeholder_relationships_modtime BEFORE UPDATE ON stakeholder_relationships FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_public_projects_modtime BEFORE UPDATE ON public_projects FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_market_intelligence_modtime BEFORE UPDATE ON market_intelligence FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_competitor_analysis_modtime BEFORE UPDATE ON competitor_analysis FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_stockholm_political_intelligence_modtime BEFORE UPDATE ON stockholm_political_intelligence FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Success message
SELECT 'Nordflytt Offentliga Upphandlingar Database Schema Created Successfully! Ready to dominate Stockholm public sector! 🏛️🚀' as message;