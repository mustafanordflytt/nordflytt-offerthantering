-- Enhanced AI Customer Service Schema with Grok's Improvements
-- JSONB structures for better organization

-- Enhanced customer conversations with structured JSONB
CREATE TABLE IF NOT EXISTS customer_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  channel VARCHAR(50) NOT NULL, -- chat, email, phone, sms
  subject VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, escalated
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  category VARCHAR(100),
  sentiment_score DECIMAL(3,2),
  customer_value_score DECIMAL(5,2) DEFAULT 50.0,
  identification_confidence DECIMAL(3,2) DEFAULT 1.0,
  verification_required BOOLEAN DEFAULT FALSE,
  
  -- GROK'S IMPROVEMENT: Structured JSONB schemas
  tone_template JSONB NOT NULL DEFAULT '{
    "tone": "helpful", 
    "style": "professional", 
    "keywords": ["RUT-avdrag", "CO2-optimerad", "effektivitet", "Stockholm"],
    "avoid": ["pressure", "pushy", "generic"]
  }'::jsonb,
  
  service_context JSONB NOT NULL DEFAULT '{
    "services": ["flytt", "förvaring", "packning", "städning"], 
    "features": ["24/7", "försäkring", "RUT-avdrag", "miljövänlig"],
    "locations": ["Stockholm", "Göteborg", "Malmö"]
  }'::jsonb,
  
  memory_context JSONB DEFAULT '{
    "lastInteraction": null, 
    "keyPoints": [], 
    "customerMood": "neutral",
    "resolvedIssues": []
  }'::jsonb,
  
  proactive_suggestions JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_customer_conversations_customer (customer_id),
  INDEX idx_customer_conversations_status (status),
  INDEX idx_customer_conversations_created (created_at DESC)
);

-- Conversation messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES customer_conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- customer, ai, agent
  sender_id VARCHAR(255),
  content TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  intent_detected VARCHAR(100),
  entities_extracted JSONB DEFAULT '[]'::jsonb,
  requires_verification BOOLEAN DEFAULT FALSE,
  verification_id UUID,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_conversation_messages_conversation (conversation_id),
  INDEX idx_conversation_messages_created (created_at)
);

-- Customer feedback tracking for recommendations
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  recommendation_id UUID REFERENCES service_recommendations(id),
  feedback_type VARCHAR(50) NOT NULL, -- interested, not_interested, already_have, maybe_later
  feedback_text TEXT,
  conversion_value DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_recommendation_feedback_customer (customer_id),
  INDEX idx_recommendation_feedback_type (feedback_type)
);

-- Verification codes for secure operations
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'booking_change', -- booking_change, identity_verification, payment
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_verification_codes_customer (customer_id),
  INDEX idx_verification_codes_expires (expires_at)
);

-- Customer interaction history for memory
CREATE TABLE IF NOT EXISTS customer_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  interaction_type VARCHAR(50) NOT NULL, -- chat, email, phone, booking, complaint, feedback
  topic VARCHAR(100),
  summary TEXT,
  sentiment VARCHAR(20),
  outcome VARCHAR(50),
  agent_id UUID,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_customer_interactions_customer (customer_id),
  INDEX idx_customer_interactions_type (interaction_type),
  INDEX idx_customer_interactions_created (created_at DESC)
);

-- Customer preferences for personalization
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) UNIQUE,
  communication_channel VARCHAR(50) DEFAULT 'email',
  communication_style VARCHAR(50) DEFAULT 'professional',
  favorite_services TEXT[] DEFAULT '{}',
  price_range VARCHAR(20) DEFAULT 'standard', -- budget, standard, premium
  preferred_times TEXT[] DEFAULT '{}', -- morning, afternoon, evening, weekend
  environmental_conscious BOOLEAN DEFAULT FALSE,
  accessibility_needs TEXT,
  language_preference VARCHAR(10) DEFAULT 'sv',
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI learning events for continuous improvement
CREATE TABLE IF NOT EXISTS ai_learning_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module VARCHAR(50) NOT NULL, -- recommendations, chat, security, pricing
  event_type VARCHAR(50) NOT NULL, -- feedback_received, pattern_detected, error_corrected
  customer_id UUID REFERENCES customers(id),
  data JSONB NOT NULL,
  impact_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_ai_learning_events_module (module),
  INDEX idx_ai_learning_events_type (event_type),
  INDEX idx_ai_learning_events_created (created_at DESC)
);

-- Service recommendations with tracking
CREATE TABLE IF NOT EXISTS service_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  service_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  estimated_value DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, presented, accepted, rejected
  presented_at TIMESTAMP,
  response_at TIMESTAMP,
  conversion_value DECIMAL(10,2),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_service_recommendations_customer (customer_id),
  INDEX idx_service_recommendations_status (status),
  INDEX idx_service_recommendations_confidence (confidence_score DESC)
);

-- Stored procedures for common operations
CREATE OR REPLACE FUNCTION get_customer_context(p_customer_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_context JSONB;
  v_customer RECORD;
  v_active_booking RECORD;
  v_interactions JSONB;
  v_preferences RECORD;
BEGIN
  -- Get customer basic info
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;
  
  -- Get active booking
  SELECT * INTO v_active_booking 
  FROM jobs 
  WHERE customer_id = p_customer_id 
    AND status = 'confirmed' 
    AND scheduled_date > NOW()
  ORDER BY scheduled_date ASC
  LIMIT 1;
  
  -- Get recent interactions
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', interaction_type,
      'topic', topic,
      'date', created_at,
      'sentiment', sentiment
    ) ORDER BY created_at DESC
  ) INTO v_interactions
  FROM (
    SELECT * FROM customer_interactions 
    WHERE customer_id = p_customer_id 
    ORDER BY created_at DESC 
    LIMIT 3
  ) t;
  
  -- Get preferences
  SELECT * INTO v_preferences 
  FROM customer_preferences 
  WHERE customer_id = p_customer_id;
  
  -- Build context
  v_context := jsonb_build_object(
    'customer', jsonb_build_object(
      'id', v_customer.id,
      'name', v_customer.name,
      'preferredName', COALESCE(v_customer.first_name, split_part(v_customer.name, ' ', 1)),
      'isVIP', COALESCE(v_customer.lifetime_value, 0) > 50000,
      'lifetimeValue', COALESCE(v_customer.lifetime_value, 0),
      'totalMoves', (SELECT COUNT(*) FROM jobs WHERE customer_id = p_customer_id AND status = 'completed')
    ),
    'activeBooking', CASE 
      WHEN v_active_booking.id IS NOT NULL THEN jsonb_build_object(
        'id', v_active_booking.id,
        'date', v_active_booking.scheduled_date,
        'status', v_active_booking.status
      )
      ELSE NULL
    END,
    'recentInteractions', COALESCE(v_interactions, '[]'::jsonb),
    'preferences', CASE
      WHEN v_preferences.id IS NOT NULL THEN jsonb_build_object(
        'communicationStyle', v_preferences.communication_style,
        'favoriteServices', v_preferences.favorite_services,
        'priceRange', v_preferences.price_range
      )
      ELSE jsonb_build_object(
        'communicationStyle', 'professional',
        'favoriteServices', ARRAY[]::text[],
        'priceRange', 'standard'
      )
    END
  );
  
  RETURN v_context;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_conversations_updated_at
  BEFORE UPDATE ON customer_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_preferences_updated_at
  BEFORE UPDATE ON customer_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add customer columns if they don't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_communication_style VARCHAR(50) DEFAULT 'professional';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS favorite_services TEXT[] DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS price_preference VARCHAR(20) DEFAULT 'standard';

-- Add job columns if they don't exist
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS from_address TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS to_address TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS customer_satisfaction INTEGER;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;