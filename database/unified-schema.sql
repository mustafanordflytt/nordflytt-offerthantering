-- =============================================================================
-- NORDFLYTT AI SYSTEM - UNIFIED DATABASE SCHEMA
-- Complete integration of Phase 1-5 into single database
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- PHASE 1: SMART CLUSTERING TABLES
-- =============================================================================

CREATE TABLE stockholm_areas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  postal_codes INTEGER[] NOT NULL,
  center_lat DECIMAL(10,8) NOT NULL,
  center_lng DECIMAL(11,8) NOT NULL,
  traffic_multiplier DECIMAL(3,2) DEFAULT 1.0,
  weather_sensitivity DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stockholm_weather (
  date DATE PRIMARY KEY,
  temperature_avg DECIMAL(4,1),
  temperature_min DECIMAL(4,1),
  temperature_max DECIMAL(4,1),
  precipitation_mm DECIMAL(5,2) DEFAULT 0,
  snow_depth_cm DECIMAL(5,2) DEFAULT 0,
  wind_speed_ms DECIMAL(4,1) DEFAULT 0,
  humidity_percent INTEGER,
  weather_condition VARCHAR(50),
  visibility_km DECIMAL(4,1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_schedule_optimizations (
  id SERIAL PRIMARY KEY,
  optimization_id UUID DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  cluster_data JSONB,
  route_suggestions JSONB,
  weather_adjustments JSONB,
  estimated_efficiency_percent DECIMAL(5,2),
  actual_efficiency_percent DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_by VARCHAR(100),
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PHASE 2: ROUTE OPTIMIZATION TABLES
-- =============================================================================

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  license_plate VARCHAR(20),
  capacity_cubic_meters DECIMAL(5,2),
  capacity_weight_kg DECIMAL(7,2),
  fuel_type VARCHAR(20) DEFAULT 'diesel',
  fuel_efficiency_km_per_liter DECIMAL(4,2),
  co2_emissions_kg_per_km DECIMAL(6,3),
  current_location_lat DECIMAL(10,8),
  current_location_lng DECIMAL(11,8),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
  maintenance_due_date DATE,
  insurance_expiry DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE route_optimizations (
  id SERIAL PRIMARY KEY,
  optimization_id UUID DEFAULT uuid_generate_v4(),
  optimization_date DATE NOT NULL,
  cluster_id INTEGER REFERENCES ai_schedule_optimizations(id),
  vehicle_routes JSONB,
  total_distance_km DECIMAL(8,2),
  total_duration_minutes INTEGER,
  estimated_fuel_cost DECIMAL(8,2),
  co2_emissions_kg DECIMAL(8,2),
  efficiency_score DECIMAL(4,2),
  traffic_factor DECIMAL(3,2),
  weather_impact DECIMAL(3,2),
  actual_distance_km DECIMAL(8,2),
  actual_duration_minutes INTEGER,
  actual_fuel_cost DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE traffic_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE,
  origin_lat DECIMAL(10,8),
  origin_lng DECIMAL(11,8),
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  distance_km DECIMAL(8,2),
  duration_minutes INTEGER,
  traffic_factor DECIMAL(3,2),
  time_of_day INTEGER,
  day_of_week INTEGER,
  weather_condition VARCHAR(50),
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour')
);

-- =============================================================================
-- PHASE 3: TEAM OPTIMIZATION TABLES
-- =============================================================================

CREATE TABLE staff_skills (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  skill_type VARCHAR(50) NOT NULL,
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 10),
  years_experience DECIMAL(4,2),
  certification_date DATE,
  certification_expiry DATE,
  training_hours INTEGER DEFAULT 0,
  assessment_score DECIMAL(4,2),
  last_assessment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_assignments (
  id SERIAL PRIMARY KEY,
  assignment_id UUID DEFAULT uuid_generate_v4(),
  assignment_date DATE NOT NULL,
  route_optimization_id INTEGER REFERENCES route_optimizations(id),
  team_compositions JSONB,
  skill_coverage_score DECIMAL(4,2),
  workload_balance_score DECIMAL(4,2),
  experience_balance_score DECIMAL(4,2),
  predicted_performance DECIMAL(4,2),
  actual_performance DECIMAL(4,2),
  customer_satisfaction_score DECIMAL(4,2),
  efficiency_rating DECIMAL(4,2),
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE performance_predictions (
  id SERIAL PRIMARY KEY,
  prediction_id UUID DEFAULT uuid_generate_v4(),
  team_assignment_id INTEGER REFERENCES team_assignments(id),
  team_id VARCHAR(50),
  prediction_date DATE,
  predicted_efficiency DECIMAL(4,2),
  predicted_quality_score DECIMAL(4,2),
  predicted_customer_satisfaction DECIMAL(4,2),
  confidence_score DECIMAL(4,2),
  risk_factors JSONB,
  mitigation_strategies JSONB,
  actual_efficiency DECIMAL(4,2),
  actual_quality_score DECIMAL(4,2),
  actual_customer_satisfaction DECIMAL(4,2),
  accuracy_score DECIMAL(4,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PHASE 4: PREDICTIVE ANALYTICS TABLES
-- =============================================================================

CREATE TABLE demand_forecasts (
  id SERIAL PRIMARY KEY,
  forecast_id UUID DEFAULT uuid_generate_v4(),
  forecast_date DATE NOT NULL,
  prediction_horizon_days INTEGER DEFAULT 30,
  predicted_demand INTEGER,
  confidence_interval_lower INTEGER,
  confidence_interval_upper INTEGER,
  weather_factor DECIMAL(3,2),
  seasonal_factor DECIMAL(3,2),
  holiday_factor DECIMAL(3,2),
  economic_factor DECIMAL(3,2),
  marketing_factor DECIMAL(3,2),
  actual_demand INTEGER,
  accuracy_score DECIMAL(4,2),
  model_version VARCHAR(20),
  feature_importance JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_segments (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  segment_name VARCHAR(50),
  segment_description TEXT,
  clv_predicted DECIMAL(10,2),
  clv_confidence DECIMAL(4,2),
  churn_probability DECIMAL(4,2),
  churn_risk_level VARCHAR(20),
  satisfaction_score DECIMAL(3,2),
  loyalty_score DECIMAL(3,2),
  profitability_score DECIMAL(3,2),
  recommended_actions JSONB,
  marketing_preferences JSONB,
  service_preferences JSONB,
  last_segment_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dynamic_pricing (
  id SERIAL PRIMARY KEY,
  pricing_id UUID DEFAULT uuid_generate_v4(),
  job_id INTEGER REFERENCES jobs(id),
  customer_segment_id INTEGER REFERENCES customer_segments(id),
  base_price DECIMAL(8,2),
  optimized_price DECIMAL(8,2),
  price_adjustment_percent DECIMAL(5,2),
  price_factors JSONB,
  demand_factor DECIMAL(3,2),
  competition_factor DECIMAL(3,2),
  customer_value_factor DECIMAL(3,2),
  urgency_factor DECIMAL(3,2),
  seasonal_factor DECIMAL(3,2),
  confidence_score DECIMAL(4,2),
  conversion_predicted DECIMAL(4,2),
  actual_conversion BOOLEAN,
  revenue_impact DECIMAL(8,2),
  margin_impact DECIMAL(5,2),
  model_version VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predictive_models (
  id SERIAL PRIMARY KEY,
  model_id UUID DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  model_type VARCHAR(50) NOT NULL,
  model_version VARCHAR(20) NOT NULL,
  model_data JSONB,
  hyperparameters JSONB,
  training_data_size INTEGER,
  validation_accuracy DECIMAL(5,4),
  feature_importance JSONB,
  deployment_status VARCHAR(20) DEFAULT 'development',
  last_training_date TIMESTAMP,
  next_retraining_date TIMESTAMP,
  performance_metrics JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PHASE 5: AUTONOMOUS DECISIONS TABLES
-- =============================================================================

CREATE TABLE autonomous_decisions (
  id SERIAL PRIMARY KEY,
  decision_id VARCHAR(100) UNIQUE NOT NULL,
  parent_decision_id VARCHAR(100),
  engine_type VARCHAR(50) NOT NULL CHECK (engine_type IN ('pricing', 'operational', 'strategic', 'quality')),
  context_data JSONB,
  decision_data JSONB,
  confidence_score DECIMAL(4,2),
  autonomous_execution BOOLEAN DEFAULT FALSE,
  human_review_required BOOLEAN DEFAULT FALSE,
  review_reason TEXT,
  execution_result JSONB,
  business_impact JSONB,
  financial_impact DECIMAL(10,2),
  risk_assessment JSONB,
  rollback_plan JSONB,
  executed_at TIMESTAMP,
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'failed', 'rolled_back')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_performance (
  id SERIAL PRIMARY KEY,
  metric_date DATE NOT NULL,
  phase_1_efficiency DECIMAL(4,2),
  phase_2_efficiency DECIMAL(4,2),
  phase_3_efficiency DECIMAL(4,2),
  phase_4_efficiency DECIMAL(4,2),
  phase_5_efficiency DECIMAL(4,2),
  total_decisions INTEGER,
  autonomous_decisions INTEGER,
  human_interventions INTEGER,
  accuracy_score DECIMAL(4,2),
  efficiency_improvement DECIMAL(4,2),
  cost_savings DECIMAL(10,2),
  revenue_generated DECIMAL(10,2),
  co2_reduction_kg DECIMAL(8,2),
  customer_satisfaction_improvement DECIMAL(4,2),
  system_uptime_percent DECIMAL(5,2),
  error_rate DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE decision_audit_log (
  id SERIAL PRIMARY KEY,
  decision_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by VARCHAR(100),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CROSS-PHASE INTEGRATION TABLES
-- =============================================================================

CREATE TABLE master_optimizations (
  id SERIAL PRIMARY KEY,
  optimization_id UUID DEFAULT uuid_generate_v4(),
  optimization_date DATE NOT NULL,
  phase_1_cluster_id INTEGER REFERENCES ai_schedule_optimizations(id),
  phase_2_route_id INTEGER REFERENCES route_optimizations(id),
  phase_3_team_id INTEGER REFERENCES team_assignments(id),
  phase_4_analytics_applied BOOLEAN DEFAULT FALSE,
  phase_5_autonomous_decisions INTEGER DEFAULT 0,
  overall_efficiency_score DECIMAL(4,2),
  cost_optimization_percent DECIMAL(5,2),
  co2_reduction_percent DECIMAL(5,2),
  customer_satisfaction_score DECIMAL(4,2),
  business_value_generated DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('planned', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  flag_name VARCHAR(100) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_users JSONB,
  environment VARCHAR(20) DEFAULT 'development',
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_configuration (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB,
  config_type VARCHAR(50),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  last_updated_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Phase 1 indexes
CREATE INDEX idx_stockholm_areas_postal_codes ON stockholm_areas USING GIN(postal_codes);
CREATE INDEX idx_stockholm_weather_date ON stockholm_weather(date);
CREATE INDEX idx_ai_schedule_optimizations_date ON ai_schedule_optimizations(date);
CREATE INDEX idx_ai_schedule_optimizations_status ON ai_schedule_optimizations(status);

-- Phase 2 indexes
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles(current_location_lat, current_location_lng);
CREATE INDEX idx_route_optimizations_date ON route_optimizations(optimization_date);
CREATE INDEX idx_traffic_cache_expires ON traffic_cache(expires_at);
CREATE INDEX idx_traffic_cache_location ON traffic_cache(origin_lat, origin_lng, destination_lat, destination_lng);

-- Phase 3 indexes
CREATE INDEX idx_staff_skills_staff_id ON staff_skills(staff_id);
CREATE INDEX idx_staff_skills_type ON staff_skills(skill_type);
CREATE INDEX idx_team_assignments_date ON team_assignments(assignment_date);
CREATE INDEX idx_team_assignments_status ON team_assignments(status);
CREATE INDEX idx_performance_predictions_date ON performance_predictions(prediction_date);

-- Phase 4 indexes
CREATE INDEX idx_demand_forecasts_date ON demand_forecasts(forecast_date);
CREATE INDEX idx_customer_segments_customer_id ON customer_segments(customer_id);
CREATE INDEX idx_customer_segments_segment ON customer_segments(segment_name);
CREATE INDEX idx_dynamic_pricing_job_id ON dynamic_pricing(job_id);
CREATE INDEX idx_dynamic_pricing_created_at ON dynamic_pricing(created_at);
CREATE INDEX idx_predictive_models_name_version ON predictive_models(model_name, model_version);

-- Phase 5 indexes
CREATE INDEX idx_autonomous_decisions_engine_type ON autonomous_decisions(engine_type);
CREATE INDEX idx_autonomous_decisions_status ON autonomous_decisions(status);
CREATE INDEX idx_autonomous_decisions_created_at ON autonomous_decisions(created_at);
CREATE INDEX idx_autonomous_decisions_confidence ON autonomous_decisions(confidence_score);
CREATE INDEX idx_system_performance_date ON system_performance(metric_date);
CREATE INDEX idx_decision_audit_log_decision_id ON decision_audit_log(decision_id);

-- Cross-phase indexes
CREATE INDEX idx_master_optimizations_date ON master_optimizations(optimization_date);
CREATE INDEX idx_master_optimizations_status ON master_optimizations(status);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX idx_system_configuration_key ON system_configuration(config_key);

-- =============================================================================
-- INITIAL DATA AND FEATURE FLAGS
-- =============================================================================

-- Insert initial feature flags
INSERT INTO feature_flags (flag_name, is_enabled, description, rollout_percentage) VALUES
('PHASE_1_CLUSTERING', true, 'Enable Phase 1 Smart Clustering', 100),
('PHASE_2_ROUTING', true, 'Enable Phase 2 Route Optimization', 100),
('PHASE_3_TEAMS', false, 'Enable Phase 3 Team Optimization', 0),
('PHASE_4_ANALYTICS', false, 'Enable Phase 4 Predictive Analytics', 0),
('PHASE_5_AUTONOMOUS', false, 'Enable Phase 5 Autonomous Decisions', 0),
('REAL_TIME_OPTIMIZATION', true, 'Enable real-time optimization features', 100),
('DYNAMIC_PRICING', false, 'Enable dynamic pricing engine', 0),
('WEATHER_INTEGRATION', true, 'Enable weather data integration', 100),
('TRAFFIC_OPTIMIZATION', true, 'Enable traffic-aware routing', 100),
('MACHINE_LEARNING', false, 'Enable ML-powered predictions', 0);

-- Insert initial system configuration
INSERT INTO system_configuration (config_key, config_value, config_type, description) VALUES
('system.version', '"1.0.0"', 'string', 'Current system version'),
('optimization.max_clusters', '20', 'integer', 'Maximum number of job clusters per day'),
('optimization.efficiency_threshold', '0.85', 'decimal', 'Minimum efficiency threshold for optimizations'),
('autonomous.confidence_threshold', '0.90', 'decimal', 'Minimum confidence for autonomous decisions'),
('autonomous.human_review_threshold', '0.75', 'decimal', 'Threshold below which human review is required'),
('pricing.max_adjustment_percent', '30', 'integer', 'Maximum price adjustment percentage'),
('system.maintenance_window', '{"start": "02:00", "end": "04:00"}', 'json', 'Daily maintenance window'),
('alerts.email_recipients', '["admin@nordflytt.se", "ops@nordflytt.se"]', 'json', 'Alert email recipients'),
('performance.monitoring_interval', '300', 'integer', 'Performance monitoring interval in seconds'),
('cache.ttl_minutes', '60', 'integer', 'Default cache TTL in minutes');

-- Insert Stockholm areas data
INSERT INTO stockholm_areas (name, postal_codes, center_lat, center_lng, traffic_multiplier) VALUES
('Stockholms Centrum', ARRAY[11120, 11121, 11122, 11123, 11124, 11125, 11126], 59.3293, 18.0686, 1.4),
('Östermalm', ARRAY[11434, 11435, 11436, 11437, 11438, 11439], 59.3378, 18.0895, 1.3),
('Södermalm', ARRAY[11825, 11826, 11827, 11828, 11829], 59.3165, 18.0731, 1.2),
('Vasastan', ARRAY[11351, 11352, 11353, 11354, 11355], 59.3467, 18.0594, 1.2),
('Kungsholmen', ARRAY[11256, 11257, 11258, 11259], 59.3333, 18.0500, 1.1),
('Norrmalm', ARRAY[11151, 11152, 11153, 11154, 11155], 59.3326, 18.0649, 1.3),
('Gamla Stan', ARRAY[11129, 11130], 59.3255, 18.0711, 1.5),
('Djurgården', ARRAY[11521, 11522], 59.3247, 18.1025, 1.0);

-- =============================================================================
-- VIEWS FOR UNIFIED REPORTING
-- =============================================================================

-- Master optimization performance view
CREATE VIEW master_optimization_performance AS
SELECT 
  mo.optimization_date,
  mo.optimization_id,
  mo.overall_efficiency_score,
  mo.cost_optimization_percent,
  mo.co2_reduction_percent,
  mo.customer_satisfaction_score,
  mo.business_value_generated,
  aso.estimated_efficiency_percent as phase1_efficiency,
  ro.efficiency_score as phase2_efficiency,
  ta.predicted_performance as phase3_efficiency,
  sp.phase_4_efficiency,
  sp.phase_5_efficiency,
  mo.status
FROM master_optimizations mo
LEFT JOIN ai_schedule_optimizations aso ON mo.phase_1_cluster_id = aso.id
LEFT JOIN route_optimizations ro ON mo.phase_2_route_id = ro.id
LEFT JOIN team_assignments ta ON mo.phase_3_team_id = ta.id
LEFT JOIN system_performance sp ON mo.optimization_date = sp.metric_date;

-- System health overview
CREATE VIEW system_health_overview AS
SELECT 
  COUNT(*) as total_optimizations,
  AVG(overall_efficiency_score) as avg_efficiency,
  AVG(cost_optimization_percent) as avg_cost_savings,
  AVG(co2_reduction_percent) as avg_co2_reduction,
  AVG(customer_satisfaction_score) as avg_satisfaction,
  SUM(business_value_generated) as total_business_value,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_optimizations,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_optimizations
FROM master_optimizations
WHERE optimization_date >= CURRENT_DATE - INTERVAL '30 days';

-- Autonomous decision summary
CREATE VIEW autonomous_decision_summary AS
SELECT 
  DATE(created_at) as decision_date,
  engine_type,
  COUNT(*) as total_decisions,
  COUNT(CASE WHEN autonomous_execution = true THEN 1 END) as autonomous_decisions,
  COUNT(CASE WHEN human_review_required = true THEN 1 END) as human_review_decisions,
  AVG(confidence_score) as avg_confidence,
  SUM(financial_impact) as total_financial_impact,
  COUNT(CASE WHEN status = 'executed' THEN 1 END) as executed_decisions,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_decisions
FROM autonomous_decisions
GROUP BY DATE(created_at), engine_type
ORDER BY decision_date DESC, engine_type;

-- =============================================================================
-- FUNCTIONS FOR SYSTEM OPERATIONS
-- =============================================================================

-- Function to check feature flag status
CREATE OR REPLACE FUNCTION is_feature_enabled(flag_name VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_enabled FROM feature_flags WHERE flag_name = $1 LIMIT 1),
    FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get system configuration
CREATE OR REPLACE FUNCTION get_config(config_key VARCHAR(100))
RETURNS JSONB AS $$
BEGIN
  RETURN COALESCE(
    (SELECT config_value FROM system_configuration WHERE config_key = $1 LIMIT 1),
    'null'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update system performance metrics
CREATE OR REPLACE FUNCTION update_system_performance()
RETURNS VOID AS $$
BEGIN
  INSERT INTO system_performance (
    metric_date,
    total_decisions,
    autonomous_decisions,
    human_interventions,
    accuracy_score,
    efficiency_improvement,
    cost_savings,
    revenue_generated
  )
  SELECT 
    CURRENT_DATE,
    COUNT(*),
    COUNT(CASE WHEN autonomous_execution = true THEN 1 END),
    COUNT(CASE WHEN human_review_required = true THEN 1 END),
    AVG(confidence_score),
    AVG(COALESCE((business_impact->>'efficiency_improvement')::decimal, 0)),
    SUM(COALESCE((business_impact->>'cost_savings')::decimal, 0)),
    SUM(COALESCE((business_impact->>'revenue_generated')::decimal, 0))
  FROM autonomous_decisions 
  WHERE DATE(created_at) = CURRENT_DATE
  ON CONFLICT (metric_date) DO UPDATE SET
    total_decisions = EXCLUDED.total_decisions,
    autonomous_decisions = EXCLUDED.autonomous_decisions,
    human_interventions = EXCLUDED.human_interventions,
    accuracy_score = EXCLUDED.accuracy_score,
    efficiency_improvement = EXCLUDED.efficiency_improvement,
    cost_savings = EXCLUDED.cost_savings,
    revenue_generated = EXCLUDED.revenue_generated;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- =============================================================================

-- Trigger function for autonomous decisions audit log
CREATE OR REPLACE FUNCTION log_autonomous_decision_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO decision_audit_log (decision_id, action, old_values, new_values, changed_by)
    VALUES (NEW.decision_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), session_user);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO decision_audit_log (decision_id, action, new_values, changed_by)
    VALUES (NEW.decision_id, 'INSERT', to_jsonb(NEW), session_user);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
CREATE TRIGGER autonomous_decisions_audit_trigger
  AFTER INSERT OR UPDATE ON autonomous_decisions
  FOR EACH ROW EXECUTE FUNCTION log_autonomous_decision_changes();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update timestamp triggers for all relevant tables
CREATE TRIGGER update_stockholm_areas_updated_at BEFORE UPDATE ON stockholm_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_schedule_optimizations_updated_at BEFORE UPDATE ON ai_schedule_optimizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_route_optimizations_updated_at BEFORE UPDATE ON route_optimizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_skills_updated_at BEFORE UPDATE ON staff_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_assignments_updated_at BEFORE UPDATE ON team_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_predictions_updated_at BEFORE UPDATE ON performance_predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dynamic_pricing_updated_at BEFORE UPDATE ON dynamic_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_autonomous_decisions_updated_at BEFORE UPDATE ON autonomous_decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_optimizations_updated_at BEFORE UPDATE ON master_optimizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================

COMMENT ON SCHEMA public IS 'Unified Nordflytt AI System Database - Phases 1-5 Integrated';