-- GPT RAG Integration Schema
-- Support for Custom GPT API endpoints

-- Support tickets table for create-ticket endpoint
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  issue_type VARCHAR(50) NOT NULL, -- damage_claim, booking_change, complaint, cleaning_issue, general
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  booking_reference VARCHAR(50),
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
  assigned_team VARCHAR(100),
  assigned_agent_id UUID,
  
  -- Resolution tracking
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  resolution_time_hours INTEGER,
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'gpt_api', -- gpt_api, web, email, phone
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_support_tickets_email (customer_email),
  INDEX idx_support_tickets_status (status),
  INDEX idx_support_tickets_type (issue_type),
  INDEX idx_support_tickets_created (created_at DESC)
);

-- GPT Analytics for tracking API usage
CREATE TABLE IF NOT EXISTS gpt_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint VARCHAR(100) NOT NULL, -- customer-lookup, booking-details, create-ticket, calculate-price
  customer_email VARCHAR(255),
  success BOOLEAN DEFAULT true,
  response_time_ms INTEGER,
  error_message TEXT,
  
  -- Request/Response data (for debugging and improvement)
  request_data JSONB,
  response_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- API key tracking (hashed)
  api_key_hash VARCHAR(64),
  
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_gpt_analytics_endpoint (endpoint),
  INDEX idx_gpt_analytics_timestamp (timestamp DESC),
  INDEX idx_gpt_analytics_success (success)
);

-- Add reference_number to jobs table if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS packed_by_nordflytt BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS volume_m3 DECIMAL(5,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Create index for reference number lookup
CREATE INDEX IF NOT EXISTS idx_jobs_reference_number ON jobs(reference_number);

-- Function to generate reference numbers for existing jobs
CREATE OR REPLACE FUNCTION generate_job_reference_numbers()
RETURNS void AS $$
DECLARE
  job_record RECORD;
  ref_number VARCHAR(50);
  counter INTEGER := 1000;
BEGIN
  FOR job_record IN 
    SELECT id, created_at 
    FROM jobs 
    WHERE reference_number IS NULL
    ORDER BY created_at ASC
  LOOP
    ref_number := 'BK-' || EXTRACT(YEAR FROM job_record.created_at) || '-' || LPAD(counter::text, 6, '0');
    
    UPDATE jobs 
    SET reference_number = ref_number 
    WHERE id = job_record.id;
    
    counter := counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to generate reference numbers
SELECT generate_job_reference_numbers();

-- Create view for GPT API metrics
CREATE OR REPLACE VIEW gpt_api_metrics AS
SELECT 
  endpoint,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN success THEN 1 END) as successful_calls,
  COUNT(CASE WHEN NOT success THEN 1 END) as failed_calls,
  ROUND(AVG(response_time_ms), 2) as avg_response_time_ms,
  MAX(response_time_ms) as max_response_time_ms,
  MIN(response_time_ms) as min_response_time_ms,
  DATE_TRUNC('hour', timestamp) as hour
FROM gpt_analytics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC, endpoint;

-- Create view for support ticket metrics
CREATE OR REPLACE VIEW support_ticket_metrics AS
SELECT 
  issue_type,
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
  AVG(resolution_time_hours) as avg_resolution_hours,
  AVG(customer_satisfaction) as avg_satisfaction,
  DATE_TRUNC('day', created_at) as day
FROM support_tickets
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY issue_type, DATE_TRUNC('day', created_at)
ORDER BY day DESC, issue_type;

-- Trigger to update timestamps
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON support_tickets TO authenticated;
GRANT ALL ON gpt_analytics TO authenticated;
GRANT SELECT ON gpt_api_metrics TO authenticated;
GRANT SELECT ON support_ticket_metrics TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ GPT RAG Integration deployment completed!';
  RAISE NOTICE '📊 Support tickets table created';
  RAISE NOTICE '📈 Analytics tracking enabled';
  RAISE NOTICE '🔗 Reference numbers generated for existing jobs';
  RAISE NOTICE '🚀 Ready for Custom GPT integration';
END $$;