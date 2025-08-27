-- ML Recruitment Database Schema
-- Stores ML predictions, training data, and insights

-- ML Predictions table
CREATE TABLE IF NOT EXISTS ml_predictions (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES recruitment_applications(id),
  model_version VARCHAR(50) NOT NULL,
  success_probability DECIMAL(3,2) NOT NULL,
  confidence_interval_lower DECIMAL(3,2),
  confidence_interval_upper DECIMAL(3,2),
  
  -- Performance predictions
  predicted_customer_satisfaction DECIMAL(2,1),
  predicted_punctuality DECIMAL(3,2),
  predicted_team_fit DECIMAL(3,2),
  predicted_retention_probability DECIMAL(3,2),
  predicted_promotion_potential DECIMAL(3,2),
  
  -- Optimal placement
  recommended_position VARCHAR(100),
  recommended_location VARCHAR(100),
  recommended_team VARCHAR(50),
  recommended_shift VARCHAR(20),
  placement_match_score DECIMAL(3,2),
  
  -- Metadata
  model_confidence DECIMAL(3,2),
  features_used TEXT[],
  prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk factors table
CREATE TABLE IF NOT EXISTS ml_risk_factors (
  id SERIAL PRIMARY KEY,
  prediction_id INTEGER REFERENCES ml_predictions(id),
  risk_type VARCHAR(50) NOT NULL,
  probability DECIMAL(3,2) NOT NULL,
  description TEXT,
  mitigation_strategy TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Development plans table
CREATE TABLE IF NOT EXISTS ml_development_plans (
  id SERIAL PRIMARY KEY,
  prediction_id INTEGER REFERENCES ml_predictions(id),
  immediate_training TEXT[],
  long_term_development TEXT[],
  mentorship_recommended BOOLEAN DEFAULT false,
  estimated_productivity_days INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation metrics table
CREATE TABLE IF NOT EXISTS ml_conversation_metrics (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES recruitment_applications(id),
  avg_response_time DECIMAL(10,2), -- seconds
  avg_message_length INTEGER,
  sentiment_score DECIMAL(3,2), -- -1 to 1
  engagement_level DECIMAL(3,2), -- 0 to 1
  clarity_score DECIMAL(3,2), -- 0 to 1
  professionalism_score DECIMAL(3,2), -- 0 to 1
  total_messages INTEGER,
  conversation_duration INTEGER, -- minutes
  metrics_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML insights table
CREATE TABLE IF NOT EXISTS ml_insights (
  id SERIAL PRIMARY KEY,
  insight_id VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- trend, anomaly, recommendation, prediction
  category VARCHAR(50) NOT NULL, -- recruitment, performance, retention, optimization
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  impact VARCHAR(20) NOT NULL, -- high, medium, low
  actionable BOOLEAN DEFAULT false,
  confidence DECIMAL(3,2) NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  related_candidates INTEGER[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML insight actions table
CREATE TABLE IF NOT EXISTS ml_insight_actions (
  id SERIAL PRIMARY KEY,
  insight_id INTEGER REFERENCES ml_insights(id),
  action TEXT NOT NULL,
  expected_outcome TEXT,
  effort VARCHAR(20), -- low, medium, high
  priority INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML training data table
CREATE TABLE IF NOT EXISTS ml_training_data (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES recruitment_applications(id),
  feature_data JSONB NOT NULL,
  actual_outcome JSONB,
  used_for_training BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model performance tracking
CREATE TABLE IF NOT EXISTS ml_model_performance (
  id SERIAL PRIMARY KEY,
  model_id VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  accuracy DECIMAL(3,2),
  precision_score DECIMAL(3,2),
  recall DECIMAL(3,2),
  f1_score DECIMAL(3,2),
  training_samples INTEGER,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feature importance tracking
CREATE TABLE IF NOT EXISTS ml_feature_importance (
  id SERIAL PRIMARY KEY,
  model_version VARCHAR(50) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  importance_score DECIMAL(3,2) NOT NULL,
  feature_category VARCHAR(50),
  evaluation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_ml_predictions_candidate_id ON ml_predictions(candidate_id);
CREATE INDEX idx_ml_predictions_timestamp ON ml_predictions(prediction_timestamp);
CREATE INDEX idx_ml_risk_factors_prediction_id ON ml_risk_factors(prediction_id);
CREATE INDEX idx_ml_insights_valid_until ON ml_insights(valid_until);
CREATE INDEX idx_ml_insights_category ON ml_insights(category);
CREATE INDEX idx_ml_conversation_metrics_candidate_id ON ml_conversation_metrics(candidate_id);

-- Create views for easy access
CREATE OR REPLACE VIEW ml_candidate_overview AS
SELECT 
  ra.id as candidate_id,
  ra.first_name,
  ra.last_name,
  ra.desired_position,
  mp.success_probability,
  mp.predicted_retention_probability,
  COUNT(rf.id) as risk_factors_count,
  mp.recommended_position,
  mp.prediction_timestamp
FROM recruitment_applications ra
LEFT JOIN ml_predictions mp ON ra.id = mp.candidate_id
LEFT JOIN ml_risk_factors rf ON mp.id = rf.prediction_id
WHERE mp.id = (
  SELECT id FROM ml_predictions 
  WHERE candidate_id = ra.id 
  ORDER BY prediction_timestamp DESC 
  LIMIT 1
)
GROUP BY ra.id, ra.first_name, ra.last_name, ra.desired_position, 
         mp.success_probability, mp.predicted_retention_probability,
         mp.recommended_position, mp.prediction_timestamp;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ml_insights_updated_at BEFORE UPDATE
ON ml_insights FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();