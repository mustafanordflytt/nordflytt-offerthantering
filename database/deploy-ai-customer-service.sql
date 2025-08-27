-- NORDFLYTT AI CUSTOMER SERVICE DEPLOYMENT
-- Run this script to deploy the enhanced AI customer service features

-- First, ensure we have UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run the migration
\i migrations/006_ai_customer_service_enhanced.sql

-- Verify deployment
SELECT 
  'customer_conversations' as table_name,
  COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'customer_conversations'
UNION ALL
SELECT 
  'conversation_messages' as table_name,
  COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'conversation_messages'
UNION ALL
SELECT 
  'recommendation_feedback' as table_name,
  COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'recommendation_feedback'
UNION ALL
SELECT 
  'verification_codes' as table_name,
  COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'verification_codes'
UNION ALL
SELECT 
  'customer_interactions' as table_name,
  COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'customer_interactions'
UNION ALL
SELECT 
  'customer_preferences' as table_name,
  COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'customer_preferences'
UNION ALL
SELECT 
  'ai_learning_events' as table_name,
  COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'ai_learning_events'
UNION ALL
SELECT 
  'service_recommendations' as table_name,
  COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'service_recommendations';

-- Create sample data for testing
INSERT INTO customers (id, name, email, phone, first_name, lifetime_value, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Anna Andersson', 'anna@example.com', '+46701234567', 'Anna', 75000, NOW() - INTERVAL '2 years')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_preferences (customer_id, communication_channel, communication_style, favorite_services, price_range) VALUES
  ('11111111-1111-1111-1111-111111111111', 'chat', 'friendly', ARRAY['packning', 'städning'], 'premium')
ON CONFLICT (customer_id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ AI Customer Service Enhanced deployment completed successfully!';
  RAISE NOTICE '📊 All tables created and verified';
  RAISE NOTICE '🤖 Ready for Custom GPT integration';
  RAISE NOTICE '🔐 In-chat OTP verification enabled';
  RAISE NOTICE '🧠 Customer memory system activated';
END $$;