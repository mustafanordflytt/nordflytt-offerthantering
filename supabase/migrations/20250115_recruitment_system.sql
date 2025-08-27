-- NORDFLYTT AI RECRUITMENT & ONBOARDING SYSTEM
-- Database migration for comprehensive recruitment pipeline

-- Recruitment Applications
CREATE TABLE recruitment_applications (
  id SERIAL PRIMARY KEY,
  application_date TIMESTAMP DEFAULT NOW(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  desired_position VARCHAR(100),
  current_stage VARCHAR(50) DEFAULT 'cv_screening',
  overall_score DECIMAL(3,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  geographic_preference VARCHAR(100),
  availability_date DATE,
  salary_expectation INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CV & Document Analysis
CREATE TABLE document_analysis (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES recruitment_applications(id),
  document_type VARCHAR(50), -- 'cv', 'personal_letter'
  file_path VARCHAR(500),
  analysis_results JSONB,
  score DECIMAL(3,2),
  red_flags JSONB,
  strengths JSONB,
  analyzed_at TIMESTAMP DEFAULT NOW()
);

-- Email Conversations
CREATE TABLE email_conversations (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES recruitment_applications(id),
  conversation_thread JSONB,
  current_question_set INTEGER DEFAULT 1,
  response_scores JSONB,
  communication_style JSONB,
  enthusiasm_level DECIMAL(3,2),
  service_orientation DECIMAL(3,2),
  ai_recruiter_notes TEXT,
  last_interaction TIMESTAMP DEFAULT NOW()
);

-- Personality & Cognitive Tests
CREATE TABLE assessment_results (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES recruitment_applications(id),
  personality_results JSONB,
  cognitive_results JSONB,
  situational_judgment JSONB,
  service_fitness_score DECIMAL(3,2),
  nordflyckt_alignment DECIMAL(3,2),
  red_flag_personalities JSONB,
  recommended_position VARCHAR(100),
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Video Analysis
CREATE TABLE video_analysis (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES recruitment_applications(id),
  video_file_path VARCHAR(500),
  transcript TEXT,
  facial_analysis JSONB,
  voice_analysis JSONB,
  content_analysis JSONB,
  service_communication_score DECIMAL(3,2),
  authenticity_score DECIMAL(3,2),
  overall_video_score DECIMAL(3,2),
  analyzed_at TIMESTAMP DEFAULT NOW()
);

-- Final Assessment & Decision
CREATE TABLE final_assessments (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES recruitment_applications(id),
  weighted_scores JSONB,
  risk_assessment JSONB,
  fit_prediction JSONB,
  hiring_decision VARCHAR(50), -- 'hire', 'hire_conditional', 'reject'
  recommended_position VARCHAR(100),
  recommended_salary INTEGER,
  confidence_level DECIMAL(3,2),
  decision_reasoning TEXT,
  assessed_at TIMESTAMP DEFAULT NOW()
);

-- Automated Contract Generation
CREATE TABLE employment_contracts (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES recruitment_applications(id),
  contract_template VARCHAR(100),
  position_title VARCHAR(100),
  salary_amount INTEGER,
  start_date DATE,
  probation_period INTEGER,
  contract_terms JSONB,
  pdf_file_path VARCHAR(500),
  digital_signature_required BOOLEAN DEFAULT true,
  signature_status VARCHAR(50) DEFAULT 'pending',
  generated_at TIMESTAMP DEFAULT NOW(),
  signed_at TIMESTAMP
);

-- Onboarding Pipeline
CREATE TABLE onboarding_pipeline (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES recruitment_applications(id),
  employee_id INTEGER, -- Will reference anställda table after hiring
  onboarding_stage VARCHAR(50) DEFAULT 'contract_signing',
  checklist_items JSONB,
  completed_items JSONB,
  ai_training_progress JSONB,
  mentor_assigned INTEGER,
  equipment_assigned JSONB,
  first_day_scheduled DATE,
  completion_percentage INTEGER DEFAULT 0,
  estimated_completion DATE,
  notes TEXT
);

-- Smart Recruitment Triggers
CREATE TABLE recruitment_triggers (
  id SERIAL PRIMARY KEY,
  trigger_type VARCHAR(50), -- 'geographic', 'seasonal', 'efficiency', 'manual'
  trigger_reason TEXT,
  location VARCHAR(100),
  positions_needed INTEGER,
  urgency_level VARCHAR(20),
  skills_required JSONB,
  duration VARCHAR(50), -- 'temporary', 'seasonal', 'permanent'
  deadline DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nordflytt Position Structure
CREATE TABLE nordflytt_positions (
  id SERIAL PRIMARY KEY,
  position_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  base_salary INTEGER NOT NULL,
  hourly_rate INTEGER NOT NULL,
  benefits JSONB,
  requirements JSONB,
  probation_period INTEGER DEFAULT 3,
  work_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert Nordflytt positions
INSERT INTO nordflytt_positions (position_key, title, base_salary, hourly_rate, benefits, requirements, probation_period, work_type) VALUES
('flyttpersonal', 'Flyttpersonal', 28000, 165, '["RUT-avdrag handling", "GPS tracking", "Team bonus"]', '["Physical fitness", "Customer service", "Team collaboration"]', 3, 'field'),
('team_leader', 'Teamledare Flytt', 35000, 205, '["Leadership bonus", "Performance incentives", "AI training"]', '["Leadership experience", "Stress handling", "Problem solving"]', 3, 'field_leadership'),
('kundservice', 'Kundservice & Support', 32000, 185, '["AI chatbot collaboration", "Customer satisfaction bonus"]', '["Communication skills", "Empathy", "Technology adoption"]', 2, 'office'),
('chauffor', 'Chaufför & Logistik', 31000, 180, '["Fuel card", "Vehicle maintenance", "Route optimization bonus"]', '["Valid driver license", "Navigation skills", "Reliability"]', 3, 'driving'),
('koordinator', 'Koordinator & Planeringsstöd', 38000, 220, '["AI system access", "Planning bonus", "Efficiency rewards"]', '["Organizational skills", "AI aptitude", "Multi-tasking"]', 2, 'office'),
('kvalitetskontroll', 'Kvalitetskontrollant', 34000, 195, '["Quality bonus", "Training certification", "Improvement rewards"]', '["Attention to detail", "Documentation skills", "Authority"]', 2, 'field_office');

-- Add indexes for performance
CREATE INDEX idx_recruitment_applications_stage ON recruitment_applications(current_stage);
CREATE INDEX idx_recruitment_applications_status ON recruitment_applications(status);
CREATE INDEX idx_recruitment_applications_email ON recruitment_applications(email);
CREATE INDEX idx_email_conversations_application ON email_conversations(application_id);
CREATE INDEX idx_final_assessments_decision ON final_assessments(hiring_decision);
CREATE INDEX idx_document_analysis_application ON document_analysis(application_id);
CREATE INDEX idx_assessment_results_application ON assessment_results(application_id);
CREATE INDEX idx_video_analysis_application ON video_analysis(application_id);
CREATE INDEX idx_employment_contracts_application ON employment_contracts(application_id);
CREATE INDEX idx_onboarding_pipeline_application ON onboarding_pipeline(application_id);
CREATE INDEX idx_recruitment_triggers_status ON recruitment_triggers(status);

-- Add RLS policies for security
ALTER TABLE recruitment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_triggers ENABLE ROW LEVEL SECURITY;

-- Simple policy for authenticated users (can be refined later)
CREATE POLICY "Enable all for authenticated users" ON recruitment_applications
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON document_analysis
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON email_conversations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON assessment_results
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON video_analysis
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON final_assessments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON employment_contracts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON onboarding_pipeline
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON recruitment_triggers
  FOR ALL USING (auth.role() = 'authenticated');

-- Functions for recruitment automation
CREATE OR REPLACE FUNCTION update_application_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update overall score when assessments are completed
  UPDATE recruitment_applications 
  SET overall_score = (
    SELECT AVG(score) FROM (
      SELECT COALESCE(AVG(score), 0) as score FROM document_analysis WHERE application_id = NEW.application_id
      UNION ALL
      SELECT COALESCE(service_fitness_score, 0) FROM assessment_results WHERE application_id = NEW.application_id
      UNION ALL
      SELECT COALESCE(overall_video_score, 0) FROM video_analysis WHERE application_id = NEW.application_id
    ) scores
  ),
  updated_at = NOW()
  WHERE id = NEW.application_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update scores
CREATE TRIGGER update_score_on_document_analysis
  AFTER INSERT OR UPDATE ON document_analysis
  FOR EACH ROW EXECUTE FUNCTION update_application_score();

CREATE TRIGGER update_score_on_assessment
  AFTER INSERT OR UPDATE ON assessment_results
  FOR EACH ROW EXECUTE FUNCTION update_application_score();

CREATE TRIGGER update_score_on_video
  AFTER INSERT OR UPDATE ON video_analysis
  FOR EACH ROW EXECUTE FUNCTION update_application_score();