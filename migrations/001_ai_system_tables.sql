-- AI System Database Migration
-- Creates all tables needed for AI functionality

-- 1. Customer Intelligence Table
CREATE TABLE IF NOT EXISTS customer_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  lead_score INTEGER CHECK (lead_score >= 0 AND lead_score <= 100),
  lead_confidence FLOAT CHECK (lead_confidence >= 0 AND lead_confidence <= 1),
  lifetime_value_prediction DECIMAL(12,2),
  churn_risk_score FLOAT CHECK (churn_risk_score >= 0 AND churn_risk_score <= 1),
  upsell_potential FLOAT CHECK (upsell_potential >= 0 AND upsell_potential <= 1),
  next_likely_service VARCHAR(100),
  personalization_profile JSONB DEFAULT '{}',
  ai_recommendations TEXT[],
  last_ai_analysis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- 2. Workflow Automation Table
CREATE TABLE IF NOT EXISTS workflow_automation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  automation_type VARCHAR(50) NOT NULL,
  ai_assigned_team UUID[],
  optimization_score FLOAT CHECK (optimization_score >= 0 AND optimization_score <= 1),
  predicted_completion_time INTERVAL,
  actual_completion_time INTERVAL,
  dynamic_price DECIMAL(10,2),
  base_price DECIMAL(10,2),
  price_adjustments JSONB DEFAULT '{}',
  automation_confidence FLOAT CHECK (automation_confidence >= 0 AND automation_confidence <= 1),
  human_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Business Insights Table
CREATE TABLE IF NOT EXISTS business_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ai_recommendation TEXT,
  expected_impact JSONB DEFAULT '{}',
  actual_impact JSONB,
  auto_implemented BOOLEAN DEFAULT FALSE,
  implementation_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending',
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  data_sources TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. AI Performance Metrics Table
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  value DECIMAL(15,4),
  unit VARCHAR(20),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  source VARCHAR(100),
  component VARCHAR(100),
  tags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI Decision Log Table
CREATE TABLE IF NOT EXISTS ai_decision_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  decision_data JSONB NOT NULL,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning TEXT,
  alternatives_considered JSONB DEFAULT '[]',
  selected_option JSONB,
  human_review_required BOOLEAN DEFAULT FALSE,
  human_reviewed BOOLEAN DEFAULT FALSE,
  review_outcome VARCHAR(50),
  review_notes TEXT,
  execution_status VARCHAR(50) DEFAULT 'pending',
  execution_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Market Intelligence Table
CREATE TABLE IF NOT EXISTS market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_type VARCHAR(50) NOT NULL,
  competitor_name VARCHAR(255),
  data_point VARCHAR(100),
  value JSONB,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  source VARCHAR(255),
  insights TEXT,
  opportunities JSONB DEFAULT '[]',
  threats JSONB DEFAULT '[]',
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Demand Forecast Table
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  service_type VARCHAR(100),
  geographic_area VARCHAR(255),
  predicted_demand INTEGER,
  confidence_interval JSONB,
  seasonality_factor FLOAT,
  external_factors JSONB DEFAULT '{}',
  actual_demand INTEGER,
  accuracy_score FLOAT,
  model_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(forecast_date, service_type, geographic_area)
);

-- 8. AI Learning Data Table
CREATE TABLE IF NOT EXISTS ai_learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type VARCHAR(100) NOT NULL,
  training_data JSONB NOT NULL,
  outcome JSONB,
  feedback_score FLOAT,
  used_for_training BOOLEAN DEFAULT FALSE,
  model_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_customer_intelligence_customer_id ON customer_intelligence(customer_id);
CREATE INDEX idx_customer_intelligence_lead_score ON customer_intelligence(lead_score DESC);
CREATE INDEX idx_customer_intelligence_churn_risk ON customer_intelligence(churn_risk_score DESC);
CREATE INDEX idx_workflow_automation_job_id ON workflow_automation(job_id);
CREATE INDEX idx_workflow_automation_created_at ON workflow_automation(created_at DESC);
CREATE INDEX idx_business_insights_priority ON business_insights(priority, status);
CREATE INDEX idx_business_insights_type ON business_insights(insight_type, created_at DESC);
CREATE INDEX idx_ai_performance_metrics_type ON ai_performance_metrics(metric_type, timestamp DESC);
CREATE INDEX idx_ai_decision_log_type ON ai_decision_log(decision_type, created_at DESC);
CREATE INDEX idx_ai_decision_log_entity ON ai_decision_log(entity_type, entity_id);
CREATE INDEX idx_market_intelligence_type ON market_intelligence(intelligence_type, collected_at DESC);
CREATE INDEX idx_demand_forecasts_date ON demand_forecasts(forecast_date, service_type);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_intelligence_updated_at BEFORE UPDATE ON customer_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_automation_updated_at BEFORE UPDATE ON workflow_automation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for easy access
CREATE OR REPLACE VIEW high_value_leads AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    ci.lead_score,
    ci.lifetime_value_prediction,
    ci.ai_recommendations
FROM customers c
JOIN customer_intelligence ci ON c.id = ci.customer_id
WHERE ci.lead_score >= 80
ORDER BY ci.lead_score DESC;

CREATE OR REPLACE VIEW automation_performance AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_automations,
    AVG(optimization_score) as avg_optimization_score,
    AVG(automation_confidence) as avg_confidence,
    SUM(CASE WHEN human_override = true THEN 1 ELSE 0 END) as human_overrides,
    AVG(EXTRACT(EPOCH FROM predicted_completion_time)/3600) as avg_predicted_hours,
    AVG(EXTRACT(EPOCH FROM actual_completion_time)/3600) as avg_actual_hours
FROM workflow_automation
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant permissions (adjust based on your user setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;