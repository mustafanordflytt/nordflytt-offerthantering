-- Add Lowisa conversation fields to recruitment_applications
ALTER TABLE recruitment_applications 
ADD COLUMN IF NOT EXISTS lowisa_conversation JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS information_status JSONB DEFAULT '{
  "korkort": false,
  "arbetserfarenhet": false,
  "tillganglighet": false,
  "svenska": false,
  "isComplete": false,
  "completionRate": 0
}',
ADD COLUMN IF NOT EXISTS lowisa_completion_date TIMESTAMP;

-- Create table for storing Lowisa conversation history
CREATE TABLE IF NOT EXISTS lowisa_conversations (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES recruitment_applications(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender VARCHAR(10) CHECK (sender IN ('lowisa', 'candidate')),
  information_status JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lowisa_conversations_application_id 
ON lowisa_conversations(application_id);

CREATE INDEX IF NOT EXISTS idx_lowisa_conversations_created_at 
ON lowisa_conversations(created_at);

-- Create view for conversation summaries
CREATE OR REPLACE VIEW lowisa_conversation_summaries AS
SELECT 
  ra.id as application_id,
  ra.first_name,
  ra.last_name,
  ra.desired_position,
  ra.information_status,
  ra.lowisa_completion_date,
  COUNT(lc.id) as message_count,
  MAX(lc.created_at) as last_message_at,
  ra.information_status->>'completionRate' as completion_rate
FROM recruitment_applications ra
LEFT JOIN lowisa_conversations lc ON ra.id = lc.application_id
GROUP BY ra.id;

-- Function to update information status
CREATE OR REPLACE FUNCTION update_lowisa_information_status(
  p_application_id INTEGER,
  p_information_status JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE recruitment_applications
  SET 
    information_status = p_information_status,
    lowisa_completion_date = CASE 
      WHEN (p_information_status->>'isComplete')::boolean = true 
      THEN NOW() 
      ELSE lowisa_completion_date 
    END,
    current_stage = CASE 
      WHEN (p_information_status->>'isComplete')::boolean = true 
      THEN 'typeform_sent' 
      ELSE current_stage 
    END
  WHERE id = p_application_id;
END;
$$ LANGUAGE plpgsql;

-- Function to save Lowisa conversation
CREATE OR REPLACE FUNCTION save_lowisa_conversation(
  p_application_id INTEGER,
  p_message TEXT,
  p_sender VARCHAR(10),
  p_information_status JSONB DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_conversation_id INTEGER;
BEGIN
  -- Insert conversation message
  INSERT INTO lowisa_conversations (
    application_id,
    message,
    sender,
    information_status
  ) VALUES (
    p_application_id,
    p_message,
    p_sender,
    p_information_status
  ) RETURNING id INTO v_conversation_id;
  
  -- Update application information status if provided
  IF p_information_status IS NOT NULL THEN
    PERFORM update_lowisa_information_status(p_application_id, p_information_status);
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
-- INSERT INTO lowisa_conversations (application_id, message, sender) VALUES
-- (1, 'Hej Anna! Tack för din ansökan...', 'lowisa'),
-- (1, 'Hej! Ja, jag har B-körkort.', 'candidate'),
-- (1, 'Perfekt! Kan du berätta om din arbetserfarenhet?', 'lowisa');

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON recruitment_applications TO your_app_user;
-- GRANT SELECT, INSERT ON lowisa_conversations TO your_app_user;
-- GRANT EXECUTE ON FUNCTION save_lowisa_conversation TO your_app_user;
-- GRANT EXECUTE ON FUNCTION update_lowisa_information_status TO your_app_user;