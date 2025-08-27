-- AI Customer Service Tables Setup
-- Version utan crm_users referens

-- AI Customer Sessions
CREATE TABLE IF NOT EXISTS ai_customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_id UUID REFERENCES customers(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  messages_count INTEGER DEFAULT 0,
  revenue_potential DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  agent_name VARCHAR(100) DEFAULT 'Maja',
  conversation_topic TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  subject TEXT,
  description TEXT,
  gpt_session_id VARCHAR(100),
  assigned_to UUID,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Events/Activities
CREATE TABLE IF NOT EXISTS ai_customer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) REFERENCES ai_customer_sessions(session_id),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) REFERENCES ai_customer_sessions(session_id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Insights
CREATE TABLE IF NOT EXISTS ai_customer_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  lifetime_value DECIMAL(12,2),
  churn_risk_score DECIMAL(3,2),
  satisfaction_score DECIMAL(3,2),
  total_interactions INTEGER DEFAULT 0,
  last_interaction TIMESTAMP,
  preferred_channel VARCHAR(50),
  topics_of_interest TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ai_sessions_email ON ai_customer_sessions(customer_email);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON ai_customer_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_created ON ai_customer_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON support_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_session ON ai_customer_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_type ON ai_customer_events(event_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_insights_email ON ai_customer_insights(customer_email);

-- Enable Realtime
ALTER TABLE ai_customer_sessions REPLICA IDENTITY FULL;
ALTER TABLE support_tickets REPLICA IDENTITY FULL;
ALTER TABLE ai_customer_events REPLICA IDENTITY FULL;
ALTER TABLE ai_chat_messages REPLICA IDENTITY FULL;
ALTER TABLE ai_customer_insights REPLICA IDENTITY FULL;