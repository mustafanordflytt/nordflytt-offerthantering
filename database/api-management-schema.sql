-- API Management System Database Schema
-- EXTEND existing database - DO NOT create new database

-- API Status Tracking
CREATE TABLE api_status (
  id SERIAL PRIMARY KEY,
  api_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'healthy', 'warning', 'failed'
  uptime DECIMAL(5,2) DEFAULT 99.9,
  response_time INTEGER DEFAULT 0,
  error_message TEXT,
  last_success TIMESTAMP,
  endpoint VARCHAR(500),
  auth_type VARCHAR(50),
  api_type VARCHAR(50), -- 'email', 'sms', 'maps', 'ai', 'weather', 'accounting', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Tracking
CREATE TABLE api_usage (
  id SERIAL PRIMARY KEY,
  api_name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  usage_limit INTEGER DEFAULT 1000,
  reset_time VARCHAR(50) DEFAULT 'Daily',
  cost_per_call DECIMAL(8,4) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Cost Tracking
CREATE TABLE api_costs (
  id SERIAL PRIMARY KEY,
  api_name VARCHAR(100) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  current_cost DECIMAL(10,2) DEFAULT 0,
  budget DECIMAL(10,2) DEFAULT 500,
  percentage DECIMAL(5,2) DEFAULT 0,
  projection DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'good', -- 'good', 'warning', 'danger'
  cost_breakdown JSONB, -- detailed cost breakdown
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Alerts
CREATE TABLE api_alerts (
  id SERIAL PRIMARY KEY,
  api_name VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL, -- 'critical', 'warning', 'info'
  message TEXT NOT NULL,
  impact TEXT,
  recommended_action TEXT,
  alert_type VARCHAR(50), -- 'usage_threshold', 'cost_threshold', 'failure', 'response_time'
  threshold_value DECIMAL(10,2),
  current_value DECIMAL(10,2),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by INTEGER, -- reference to user who resolved
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Configuration
CREATE TABLE api_config (
  id SERIAL PRIMARY KEY,
  api_name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200),
  endpoint VARCHAR(500),
  auth_type VARCHAR(50), -- 'bearer', 'basic', 'api_key', 'oauth'
  api_type VARCHAR(50), -- 'email', 'sms', 'maps', 'ai', 'weather', 'accounting'
  usage_threshold INTEGER DEFAULT 80,
  cost_threshold DECIMAL(10,2) DEFAULT 500,
  response_time_threshold INTEGER DEFAULT 5000,
  uptime_threshold DECIMAL(5,2) DEFAULT 95,
  enabled BOOLEAN DEFAULT TRUE,
  critical BOOLEAN DEFAULT FALSE, -- is this API critical for business operations?
  backup_api VARCHAR(100), -- name of backup API if available
  documentation_url VARCHAR(500),
  support_contact VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Health History
CREATE TABLE api_health_history (
  id SERIAL PRIMARY KEY,
  api_name VARCHAR(100) NOT NULL,
  check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  response_time INTEGER,
  uptime DECIMAL(5,2),
  error_message TEXT,
  metadata JSONB -- additional health check data
);

-- API Notifications
CREATE TABLE api_notifications (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER REFERENCES api_alerts(id),
  notification_type VARCHAR(50), -- 'email', 'sms', 'slack', 'webhook'
  recipient VARCHAR(200),
  message TEXT,
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Dependencies
CREATE TABLE api_dependencies (
  id SERIAL PRIMARY KEY,
  api_name VARCHAR(100) NOT NULL,
  depends_on VARCHAR(100) NOT NULL,
  dependency_type VARCHAR(50), -- 'required', 'optional', 'backup'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_api_status_name ON api_status(api_name);
CREATE INDEX idx_api_status_status ON api_status(status);
CREATE INDEX idx_api_usage_name_date ON api_usage(api_name, date);
CREATE INDEX idx_api_costs_name_month ON api_costs(api_name, month, year);
CREATE INDEX idx_api_alerts_resolved ON api_alerts(resolved);
CREATE INDEX idx_api_alerts_level ON api_alerts(level);
CREATE INDEX idx_api_health_name_time ON api_health_history(api_name, check_time);
CREATE INDEX idx_api_notifications_status ON api_notifications(status);

-- Insert initial API configurations
INSERT INTO api_config (api_name, display_name, endpoint, auth_type, api_type, usage_threshold, cost_threshold, critical, backup_api, documentation_url) VALUES
('SendGrid', 'SendGrid Email API', 'https://api.sendgrid.com/v3', 'bearer', 'email', 80, 1000, true, 'Mailgun', 'https://docs.sendgrid.com/'),
('Mailgun', 'Mailgun Email API', 'https://api.mailgun.net/v3', 'basic', 'email', 80, 800, false, 'SendGrid', 'https://documentation.mailgun.com/'),
('Twilio', 'Twilio SMS API', 'https://api.twilio.com/2010-04-01', 'basic', 'sms', 85, 1200, true, null, 'https://www.twilio.com/docs/'),
('Google Maps', 'Google Maps API', 'https://maps.googleapis.com/maps/api', 'api_key', 'maps', 75, 2000, true, null, 'https://developers.google.com/maps/documentation/'),
('SMHI Weather', 'SMHI Weather API', 'https://opendata-download-metfcst.smhi.se/api', 'none', 'weather', 95, 0, false, null, 'https://opendata.smhi.se/apidocs/'),
('Fortnox', 'Fortnox Accounting API', 'https://api.fortnox.se/3', 'bearer', 'accounting', 70, 1500, true, null, 'https://developer.fortnox.se/documentation/'),
('OpenAI Pricing Expert', 'OpenAI Pricing Expert GPT', 'https://api.openai.com/v1/chat/completions', 'bearer', 'ai', 80, 3000, true, null, 'https://platform.openai.com/docs/'),
('OpenAI Logistics Expert', 'OpenAI Logistics Expert GPT', 'https://api.openai.com/v1/chat/completions', 'bearer', 'ai', 80, 2500, false, null, 'https://platform.openai.com/docs/'),
('OpenAI Customer Service Expert', 'OpenAI Customer Service Expert GPT', 'https://api.openai.com/v1/chat/completions', 'bearer', 'ai', 80, 2000, true, null, 'https://platform.openai.com/docs/'),
('OpenAI Business Intelligence Expert', 'OpenAI Business Intelligence Expert GPT', 'https://api.openai.com/v1/chat/completions', 'bearer', 'ai', 80, 2000, false, null, 'https://platform.openai.com/docs/'),
('Google Cloud ML', 'Google Cloud ML API', 'https://ml.googleapis.com/v1', 'bearer', 'ml', 75, 1800, false, null, 'https://cloud.google.com/ml-engine/docs/'),
('Hemnet Scraping', 'Hemnet Property Scraping', 'internal', 'none', 'scraping', 90, 500, false, null, 'internal');

-- Insert initial API dependencies
INSERT INTO api_dependencies (api_name, depends_on, dependency_type) VALUES
('SendGrid', 'Mailgun', 'backup'),
('Mailgun', 'SendGrid', 'backup'),
('OpenAI Pricing Expert', 'OpenAI Logistics Expert', 'optional'),
('OpenAI Customer Service Expert', 'OpenAI Business Intelligence Expert', 'optional'),
('Google Maps', 'SMHI Weather', 'optional');

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_api_status_updated_at BEFORE UPDATE ON api_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_usage_updated_at BEFORE UPDATE ON api_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_costs_updated_at BEFORE UPDATE ON api_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_config_updated_at BEFORE UPDATE ON api_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();