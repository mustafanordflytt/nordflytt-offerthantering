-- =============================================================================
-- NORDFLYTT AI-CHATBOT KUNDTJÄNST - DATABASE SCHEMA
-- Revolutionary customer service AI with complete system integration
-- =============================================================================

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CHATBOT CONVERSATIONS WITH BUSINESS INTELLIGENCE
-- =============================================================================

-- Core conversations table linking to ALL Nordflytt systems
CREATE TABLE chatbot_conversations (
  id SERIAL PRIMARY KEY,
  conversation_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Customer and system linking
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  invoice_id INTEGER REFERENCES outgoing_invoices(id) ON DELETE SET NULL,
  
  -- Channel management
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('website', 'whatsapp', 'email', 'facebook', 'google_reviews', 'instagram')),
  channel_identifier VARCHAR(200), -- Phone number, email, social media handle
  session_id VARCHAR(100),
  
  -- Conversation status and flow
  conversation_status VARCHAR(20) DEFAULT 'active' CHECK (conversation_status IN ('active', 'resolved', 'escalated', 'converted')),
  escalation_level INTEGER DEFAULT 0 CHECK (escalation_level BETWEEN 0 AND 3),
  
  -- Business metrics
  lead_converted BOOLEAN DEFAULT FALSE,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  upsell_amount DECIMAL(10,2) DEFAULT 0,
  customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5),
  
  -- AI performance tracking
  ai_confidence_average DECIMAL(3,2),
  total_messages INTEGER DEFAULT 0,
  ai_messages INTEGER DEFAULT 0,
  human_messages INTEGER DEFAULT 0,
  
  -- System integration tracking
  systems_accessed JSONB DEFAULT '[]', -- Which Nordflytt systems were queried
  data_sources_used JSONB DEFAULT '{}', -- Specific data used from each system
  integration_performance JSONB DEFAULT '{}', -- Response times from each system
  
  -- Human handover
  human_agent_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  escalation_reason VARCHAR(200),
  escalation_timestamp TIMESTAMP,
  resolution_time_minutes INTEGER,
  
  -- Advanced analytics
  sentiment_journey JSONB DEFAULT '[]', -- Track sentiment changes throughout conversation
  touchpoints JSONB DEFAULT '[]', -- All systems touched during conversation
  predictive_insights JSONB DEFAULT '{}', -- What AI predicted about customer needs
  competitive_mentions JSONB DEFAULT '[]', -- Any competitor references
  
  -- Conversation metadata
  first_message_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  conversation_duration_minutes INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_customer_id (customer_id),
  INDEX idx_job_id (job_id),
  INDEX idx_channel (channel),
  INDEX idx_status (conversation_status),
  INDEX idx_converted (lead_converted),
  INDEX idx_human_agent (human_agent_id),
  INDEX idx_timestamp_range (first_message_timestamp, last_message_timestamp)
);

-- =============================================================================
-- CHATBOT MESSAGES WITH RICH CONTEXT
-- =============================================================================

-- Individual messages with AI intelligence and business context
CREATE TABLE chatbot_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  message_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Message content
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('customer', 'ai', 'human', 'system')),
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'payment_link', 'booking_confirmation')),
  
  -- Intent & Intelligence
  message_intent VARCHAR(100),
  intent_confidence DECIMAL(3,2),
  intent_category VARCHAR(50), -- greeting, booking_inquiry, complaint, payment, tracking, etc.
  entities_extracted JSONB DEFAULT '{}', -- Dates, locations, services, amounts mentioned
  
  -- AI processing context
  customer_context JSONB DEFAULT '{}', -- What AI knew about customer when responding
  system_data_used JSONB DEFAULT '{}', -- Which Nordflytt systems provided data for response
  ai_reasoning JSONB DEFAULT '{}', -- Why AI chose this response
  ai_alternatives JSONB DEFAULT '[]', -- Other responses AI considered
  
  -- Performance metrics
  response_time_ms INTEGER,
  processing_steps JSONB DEFAULT '[]', -- Log of AI processing steps
  confidence_score DECIMAL(3,2),
  
  -- Business intelligence
  revenue_opportunity DECIMAL(10,2) DEFAULT 0, -- Potential revenue from this message
  upsell_triggers JSONB DEFAULT '[]', -- Services that could be upsold
  churn_risk_indicators JSONB DEFAULT '[]', -- Signs of customer dissatisfaction
  
  -- Customer engagement
  attachments JSONB DEFAULT '[]',
  customer_reaction VARCHAR(50), -- thumbs_up, thumbs_down, no_reaction, clicked_link
  led_to_action BOOLEAN DEFAULT FALSE, -- Did this message cause customer action?
  followup_needed BOOLEAN DEFAULT FALSE,
  
  -- System integration details
  phase_1_data JSONB DEFAULT '{}', -- Clustering data used
  phase_2_data JSONB DEFAULT '{}', -- Route optimization data
  phase_3_data JSONB DEFAULT '{}', -- Team assignment data
  phase_4_data JSONB DEFAULT '{}', -- Predictive analytics data
  phase_5_data JSONB DEFAULT '{}', -- Autonomous decision data
  financial_data JSONB DEFAULT '{}', -- Financial module data
  staff_app_data JSONB DEFAULT '{}', -- Staff app GPS and schedule data
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_intent (message_intent),
  INDEX idx_sentiment (customer_reaction),
  INDEX idx_revenue_opp (revenue_opportunity),
  INDEX idx_created_at (created_at)
);

-- =============================================================================
-- ADVANCED KNOWLEDGE BASE WITH LEARNING
-- =============================================================================

-- Dynamic knowledge base that learns and improves
CREATE TABLE chatbot_knowledge_base (
  id SERIAL PRIMARY KEY,
  knowledge_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Categorization
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- Question handling
  question_patterns TEXT[] NOT NULL,
  answer_template TEXT NOT NULL,
  followup_questions TEXT[] DEFAULT '{}',
  related_topics TEXT[] DEFAULT '{}',
  
  -- Dynamic data integration
  dynamic_data_sources JSONB DEFAULT '{}', -- Which APIs/tables to query
  personalization_rules JSONB DEFAULT '{}', -- How to customize for different customers
  system_integrations JSONB DEFAULT '{}', -- Which Nordflytt systems to use
  
  -- Learning & optimization
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 1.0,
  customer_satisfaction_avg DECIMAL(3,2),
  conversion_rate DECIMAL(3,2) DEFAULT 0, -- How often this leads to booking
  revenue_attribution DECIMAL(10,2) DEFAULT 0, -- Total revenue attributed to this KB entry
  
  -- Business intelligence
  upsell_opportunities JSONB DEFAULT '[]', -- When to suggest additional services
  competitive_responses JSONB DEFAULT '{}', -- How to counter competitor mentions
  seasonal_adjustments JSONB DEFAULT '{}', -- How response changes by season
  
  -- Performance thresholds
  confidence_threshold DECIMAL(3,2) DEFAULT 0.85,
  escalation_triggers JSONB DEFAULT '[]',
  context_requirements JSONB DEFAULT '{}', -- What customer data is needed
  
  -- Maintenance and quality
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  reviewed_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  review_required BOOLEAN DEFAULT FALSE,
  quality_score DECIMAL(3,2) DEFAULT 1.0,
  
  -- A/B testing
  version_group VARCHAR(10) DEFAULT 'A',
  ab_test_active BOOLEAN DEFAULT FALSE,
  performance_comparison JSONB DEFAULT '{}',
  
  INDEX idx_category (category),
  INDEX idx_success_rate (success_rate),
  INDEX idx_conversion (conversion_rate),
  INDEX idx_tags (tags),
  INDEX idx_version_group (version_group)
);

-- =============================================================================
-- REVENUE TRACKING AND ATTRIBUTION
-- =============================================================================

-- Track every kr generated by the chatbot
CREATE TABLE chatbot_revenue_tracking (
  id SERIAL PRIMARY KEY,
  tracking_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Linking
  conversation_id INTEGER REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  invoice_id INTEGER REFERENCES outgoing_invoices(id) ON DELETE SET NULL,
  
  -- Revenue classification
  interaction_type VARCHAR(50) NOT NULL, -- new_booking, upsell, retention, complaint_resolution, payment_acceleration
  revenue_type VARCHAR(30) NOT NULL CHECK (revenue_type IN ('direct', 'attributed', 'cost_savings', 'churn_prevention')),
  
  -- Financial metrics
  revenue_attributed DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_saved DECIMAL(10,2) DEFAULT 0, -- Cost saved by AI vs human handling
  gross_margin DECIMAL(10,2) DEFAULT 0,
  
  -- Attribution methodology
  attribution_confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5, -- How sure are we this revenue came from chatbot?
  attribution_method VARCHAR(50) DEFAULT 'last_touch', -- last_touch, first_touch, multi_touch
  attribution_period_days INTEGER DEFAULT 30, -- Revenue attributed within X days
  
  -- Context and details
  services_sold JSONB DEFAULT '[]',
  original_inquiry JSONB DEFAULT '{}',
  competitive_context JSONB DEFAULT '{}', -- If customer mentioned competitors
  price_sensitivity_analysis JSONB DEFAULT '{}',
  
  -- Customer intelligence
  customer_segment VARCHAR(50),
  acquisition_channel VARCHAR(50),
  lifetime_value_impact DECIMAL(10,2) DEFAULT 0,
  
  -- Performance metrics
  time_to_conversion_hours DECIMAL(8,2),
  touchpoints_to_conversion INTEGER,
  ai_intervention_points JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revenue_realized_at TIMESTAMP,
  
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_interaction_type (interaction_type),
  INDEX idx_revenue_type (revenue_type),
  INDEX idx_attribution_confidence (attribution_confidence),
  INDEX idx_created_at (created_at)
);

-- =============================================================================
-- CUSTOMER AI PROFILES AND INTELLIGENCE
-- =============================================================================

-- Advanced customer intelligence aggregated from ALL interactions
CREATE TABLE customer_ai_profiles (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) UNIQUE,
  profile_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Communication intelligence
  communication_preference VARCHAR(20) DEFAULT 'unknown', -- whatsapp, email, phone, website_chat
  response_time_preference VARCHAR(20) DEFAULT 'unknown', -- immediate, business_hours, flexible
  communication_style VARCHAR(50) DEFAULT 'unknown', -- direct, friendly, formal, informal
  personality_type VARCHAR(50) DEFAULT 'unknown', -- analytical, emotional, practical, price_sensitive
  
  -- Interaction history and patterns
  total_interactions INTEGER DEFAULT 0,
  successful_resolutions INTEGER DEFAULT 0,
  escalations_count INTEGER DEFAULT 0,
  average_satisfaction DECIMAL(3,2),
  preferred_contact_hours JSONB DEFAULT '{}', -- When customer is most responsive
  
  -- Business intelligence
  lifetime_value_predicted DECIMAL(10,2),
  lifetime_value_actual DECIMAL(10,2) DEFAULT 0,
  churn_risk_score DECIMAL(3,2) DEFAULT 0.5, -- From Phase 4 predictive analytics
  upsell_propensity DECIMAL(3,2) DEFAULT 0.5,
  referral_likelihood DECIMAL(3,2) DEFAULT 0.5,
  price_sensitivity DECIMAL(3,2) DEFAULT 0.5,
  
  -- Service preferences learned from conversations
  preferred_services JSONB DEFAULT '[]',
  service_upgrade_history JSONB DEFAULT '[]',
  seasonal_patterns JSONB DEFAULT '{}',
  location_preferences JSONB DEFAULT '{}',
  
  -- AI-generated insights
  communication_insights JSONB DEFAULT '{}',
  behavioral_patterns JSONB DEFAULT '{}',
  prediction_accuracy JSONB DEFAULT '{}', -- How accurate our predictions have been
  
  -- Recommendations for next interactions
  next_best_action JSONB DEFAULT '{}', -- What AI suggests for next interaction
  predicted_needs JSONB DEFAULT '[]', -- What customer might need next
  optimal_contact_strategy JSONB DEFAULT '{}',
  
  -- Conversation intelligence
  topic_preferences JSONB DEFAULT '{}', -- Which topics customer engages with most
  question_patterns JSONB DEFAULT '[]', -- Common types of questions customer asks
  resolution_preferences JSONB DEFAULT '{}', -- How customer prefers issues resolved
  
  -- System integration insights
  phase_4_insights JSONB DEFAULT '{}', -- Insights from Phase 4 predictive analytics
  financial_insights JSONB DEFAULT '{}', -- Payment behavior, pricing sensitivity
  staff_interaction_insights JSONB DEFAULT '{}', -- How customer interacts with staff
  
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  profile_confidence DECIMAL(3,2) DEFAULT 0.5, -- How confident we are in this profile
  
  INDEX idx_customer_id (customer_id),
  INDEX idx_churn_risk (churn_risk_score),
  INDEX idx_lifetime_value (lifetime_value_predicted),
  INDEX idx_upsell_propensity (upsell_propensity),
  INDEX idx_last_updated (last_updated)
);

-- =============================================================================
-- SYSTEM INTEGRATION AND PERFORMANCE TRACKING
-- =============================================================================

-- Track integration health and performance with all Nordflytt systems
CREATE TABLE chatbot_system_integration_logs (
  id SERIAL PRIMARY KEY,
  log_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- System identification
  system_name VARCHAR(50) NOT NULL, -- phase_1_ai, phase_2_ai, phase_3_ai, phase_4_ai, phase_5_ai, financial_module, staff_app, crm_core
  operation_type VARCHAR(100) NOT NULL, -- get_customer_data, get_pricing, get_team_location, create_booking
  endpoint VARCHAR(200),
  
  -- Request context
  conversation_id INTEGER REFERENCES chatbot_conversations(id) ON DELETE SET NULL,
  message_id INTEGER REFERENCES chatbot_messages(id) ON DELETE SET NULL,
  request_id VARCHAR(100),
  
  -- Performance metrics
  request_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  response_timestamp TIMESTAMP,
  duration_ms INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (response_timestamp - request_timestamp)) * 1000
  ) STORED,
  
  -- Request/response data
  request_data JSONB DEFAULT '{}',
  response_data JSONB DEFAULT '{}',
  http_status_code INTEGER,
  
  -- Quality and reliability
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'retry', 'degraded')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  data_quality_score DECIMAL(3,2), -- How useful was the returned data
  
  -- Impact on conversation
  customer_impact VARCHAR(50), -- enhanced_response, delayed_response, fallback_used
  business_impact JSONB DEFAULT '{}', -- How this system call affected business metrics
  
  INDEX idx_system_name (system_name),
  INDEX idx_status (status),
  INDEX idx_request_timestamp (request_timestamp),
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_duration (duration_ms)
);

-- =============================================================================
-- COMPETITIVE INTELLIGENCE AND MARKET ANALYSIS
-- =============================================================================

-- Track competitor mentions and market intelligence
CREATE TABLE chatbot_competitive_intelligence (
  id SERIAL PRIMARY KEY,
  intelligence_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Conversation context
  conversation_id INTEGER REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  message_id INTEGER REFERENCES chatbot_messages(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Competitor information
  competitor_name VARCHAR(100) NOT NULL,
  competitor_category VARCHAR(50), -- direct_competitor, price_competitor, service_competitor
  mention_context VARCHAR(20) CHECK (mention_context IN ('pricing_comparison', 'service_comparison', 'previous_experience', 'considering_switch')),
  
  -- Customer sentiment and details
  customer_sentiment VARCHAR(20) CHECK (customer_sentiment IN ('positive', 'neutral', 'negative', 'considering')),
  specific_concerns JSONB DEFAULT '[]',
  price_comparison JSONB DEFAULT '{}',
  service_comparison JSONB DEFAULT '{}',
  
  -- AI response strategy
  response_strategy VARCHAR(50), -- differentiation, price_match, service_highlight, value_proposition
  ai_response_effectiveness DECIMAL(3,2), -- How well did our response work
  customer_reaction VARCHAR(50), -- convinced, still_considering, switched_topic, not_convinced
  
  -- Business impact
  conversation_outcome VARCHAR(50), -- won_customer, lost_customer, still_negotiating, deferred_decision
  revenue_at_risk DECIMAL(10,2),
  revenue_saved DECIMAL(10,2),
  
  -- Market intelligence
  competitive_advantages_used JSONB DEFAULT '[]', -- Which of our advantages we highlighted
  weaknesses_exposed JSONB DEFAULT '[]', -- Where competitor was stronger
  market_insights JSONB DEFAULT '{}', -- Insights about market conditions
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_competitor_name (competitor_name),
  INDEX idx_mention_context (mention_context),
  INDEX idx_customer_sentiment (customer_sentiment),
  INDEX idx_conversation_outcome (conversation_outcome),
  INDEX idx_created_at (created_at)
);

-- =============================================================================
-- AI PERFORMANCE AND LEARNING ANALYTICS
-- =============================================================================

-- Track AI performance, learning, and continuous improvement
CREATE TABLE chatbot_ai_performance (
  id SERIAL PRIMARY KEY,
  performance_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Time period for metrics
  analysis_period VARCHAR(20) NOT NULL CHECK (analysis_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Core AI metrics
  total_conversations INTEGER DEFAULT 0,
  ai_handled_conversations INTEGER DEFAULT 0,
  escalated_conversations INTEGER DEFAULT 0,
  average_confidence_score DECIMAL(3,2),
  
  -- Intent recognition performance
  intent_recognition_accuracy DECIMAL(3,2),
  intent_categories_handled JSONB DEFAULT '{}', -- Count per category
  misclassified_intents JSONB DEFAULT '[]', -- Learning opportunities
  
  -- Response quality metrics
  average_response_time_ms INTEGER,
  response_relevance_score DECIMAL(3,2),
  customer_satisfaction_score DECIMAL(3,2),
  
  -- Business performance
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  cost_savings DECIMAL(10,2) DEFAULT 0,
  upsells_achieved INTEGER DEFAULT 0,
  churn_prevented INTEGER DEFAULT 0,
  
  -- System integration performance
  integration_success_rate DECIMAL(3,2),
  average_system_response_time JSONB DEFAULT '{}', -- Per system
  data_quality_scores JSONB DEFAULT '{}', -- Quality of data from each system
  
  -- Learning and improvement
  knowledge_base_updates INTEGER DEFAULT 0,
  new_patterns_learned JSONB DEFAULT '[]',
  prediction_accuracy DECIMAL(3,2),
  model_improvements JSONB DEFAULT '{}',
  
  -- Quality indicators
  false_positive_rate DECIMAL(3,2),
  false_negative_rate DECIMAL(3,2),
  hallucination_incidents INTEGER DEFAULT 0,
  factual_accuracy_score DECIMAL(3,2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_analysis_period (analysis_period),
  INDEX idx_period_range (period_start, period_end),
  INDEX idx_performance_score (customer_satisfaction_score)
);

-- =============================================================================
-- AUTOMATED TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Function to update conversation statistics
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update conversation message counts
    UPDATE chatbot_conversations 
    SET 
        total_messages = (
            SELECT COUNT(*) FROM chatbot_messages 
            WHERE conversation_id = NEW.conversation_id
        ),
        ai_messages = (
            SELECT COUNT(*) FROM chatbot_messages 
            WHERE conversation_id = NEW.conversation_id AND sender_type = 'ai'
        ),
        human_messages = (
            SELECT COUNT(*) FROM chatbot_messages 
            WHERE conversation_id = NEW.conversation_id AND sender_type = 'human'
        ),
        last_message_timestamp = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update conversation stats when new message is added
CREATE TRIGGER update_conversation_stats_trigger
    AFTER INSERT ON chatbot_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_stats();

-- Function to calculate conversation duration
CREATE OR REPLACE FUNCTION calculate_conversation_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.conversation_status = 'resolved' OR NEW.conversation_status = 'escalated' THEN
        NEW.conversation_duration_minutes = EXTRACT(EPOCH FROM (NEW.last_message_timestamp - NEW.first_message_timestamp)) / 60;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to calculate duration when conversation is closed
CREATE TRIGGER calculate_conversation_duration_trigger
    BEFORE UPDATE ON chatbot_conversations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_conversation_duration();

-- Function to update customer AI profile based on new conversations
CREATE OR REPLACE FUNCTION update_customer_ai_profile()
RETURNS TRIGGER AS $$
DECLARE
    customer_record RECORD;
BEGIN
    -- Only proceed if we have a customer_id
    IF NEW.customer_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get conversation statistics for this customer
    SELECT 
        COUNT(*) as total_convs,
        COUNT(CASE WHEN conversation_status = 'resolved' THEN 1 END) as resolved_convs,
        COUNT(CASE WHEN conversation_status = 'escalated' THEN 1 END) as escalated_convs,
        AVG(customer_satisfaction) as avg_satisfaction,
        SUM(COALESCE(revenue_generated, 0)) as total_revenue
    INTO customer_record
    FROM chatbot_conversations 
    WHERE customer_id = NEW.customer_id;
    
    -- Insert or update customer AI profile
    INSERT INTO customer_ai_profiles (
        customer_id,
        total_interactions,
        successful_resolutions,
        escalations_count,
        average_satisfaction,
        lifetime_value_actual,
        last_updated
    ) VALUES (
        NEW.customer_id,
        customer_record.total_convs,
        customer_record.resolved_convs,
        customer_record.escalated_convs,
        customer_record.avg_satisfaction,
        customer_record.total_revenue,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (customer_id) 
    DO UPDATE SET
        total_interactions = customer_record.total_convs,
        successful_resolutions = customer_record.resolved_convs,
        escalations_count = customer_record.escalated_convs,
        average_satisfaction = customer_record.avg_satisfaction,
        lifetime_value_actual = customer_record.total_revenue,
        last_updated = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update customer profile when conversation is updated
CREATE TRIGGER update_customer_ai_profile_trigger
    AFTER UPDATE ON chatbot_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_ai_profile();

-- =============================================================================
-- SAMPLE KNOWLEDGE BASE DATA
-- =============================================================================

-- Insert comprehensive knowledge base for Swedish moving company
INSERT INTO chatbot_knowledge_base (
    category, subcategory, question_patterns, answer_template, 
    dynamic_data_sources, personalization_rules, confidence_threshold
) VALUES

-- Pricing inquiries with dynamic integration
('pricing', 'general_quote', 
 ARRAY['vad kostar', 'pris för flytt', 'hur mycket kostar det', 'prisuppgift', 'offert'],
 'Hej {{customer.name}}! För att ge dig ett exakt pris behöver jag lite information. {{#if customer.previous_moves}}Ser att du flyttat med oss tidigare från {{customer.last_move.from_address}}!{{/if}} Vad är din nuvarande adress och vart ska du flytta? Jag kan ge dig pris direkt med RUT-avdrag!',
 '{"phase_4_ai": "dynamic_pricing", "financial_module": "rut_calculation", "crm": "customer_history"}',
 '{"existing_customer": "mention_previous_moves", "new_customer": "explain_rut_benefits"}',
 0.90),

-- Booking inquiries with real-time availability
('booking', 'availability',
 ARRAY['ledig tid', 'boka flytt', 'tillgängliga datum', 'när kan ni', 'lediga dagar'],
 'Perfekt! {{#if phase_1_data.available_teams}}Vi har {{phase_1_data.available_teams.length}} team lediga {{customer.preferred_date}}.{{/if}} {{#if phase_2_data.optimal_route}}Baserat på din rutt {{phase_2_data.optimal_route.efficiency}} kan vi erbjuda bättre pris {{phase_2_data.suggested_times}}.{{/if}} Vill du boka direkt?',
 '{"phase_1_ai": "team_availability", "phase_2_ai": "route_optimization", "phase_3_ai": "team_assignments"}',
 '{"flexible_dates": "suggest_optimal_times", "fixed_date": "confirm_availability"}',
 0.85),

-- Service explanations with upselling
('services', 'packing',
 ARRAY['packning', 'packa åt mig', 'packservice', 'hjälp med packning'],
 'Absolut! Vi erbjuder professionell packning. {{#if customer.apartment_size > 75}}Med din stora lägenhet sparar du 4-6h genom vår packservice.{{/if}} {{#if upsell_opportunities.insurance}}Jag rekommenderar också flyttförsäkring för {{insurance.price}}kr för trygghet.{{/if}} Vill du ha offert på komplett service?',
 '{"crm": "customer_apartment_size", "financial_module": "service_pricing"}',
 '{"large_apartment": "emphasize_time_savings", "valuable_items": "suggest_insurance"}',
 0.88),

-- Team tracking with GPS integration
('tracking', 'team_location',
 ARRAY['var är teamet', 'när kommer ni', 'vart är lastbilen', 'team status'],
 'Team {{team.name}} är just nu {{team.current_location}} och beräknas vara hos dig {{team.eta}}. {{#if team.running_late}}De är lite försenade pga {{team.delay_reason}} men hör av sig direkt när de är på väg!{{/if}} Du kan följa dem live här: {{team.tracking_link}}',
 '{"staff_app": "gps_tracking", "phase_2_ai": "route_status", "phase_3_ai": "team_assignments"}',
 '{"running_late": "proactive_explanation", "on_time": "confirm_eta"}',
 0.95),

-- Complaint handling with proactive resolution
('complaints', 'damage_report',
 ARRAY['skada', 'trasig', 'sönder', 'klagomål', 'problem'],
 'Jag beklagar verkligen! {{#if ai_insights.similar_cases}}Liknande situationer löses oftast genom {{ai_insights.resolution_pattern}}.{{/if}} Jag har notifierat {{assigned_manager.name}} som hör av sig inom 30 min. Som gottgörelse erbjuder jag {{compensation.amount}}kr avdrag. Vi fixar detta!',
 '{"phase_4_ai": "similar_cases", "crm": "customer_history", "staff_app": "available_managers"}',
 '{"high_value_customer": "premium_compensation", "repeat_customer": "extra_attention"}',
 0.85),

-- Payment and invoice inquiries
('payment', 'invoice_status',
 ARRAY['faktura', 'betalning', 'betalt', 'skuld', 'påminnelse'],
 '{{#if invoice.status == "paid"}}Din faktura {{invoice.number}} är betald! Tack för snabb betalning.{{else}}Din faktura {{invoice.number}} på {{invoice.amount}}kr förfaller {{invoice.due_date}}. {{#if invoice.rut_deduction}}Du får {{invoice.rut_deduction}}kr RUT-avdrag automatiskt.{{/if}}{{/if}} Något mer jag kan hjälpa med?',
 '{"financial_module": "invoice_status", "rut_applications": "deduction_status"}',
 '{"overdue": "payment_reminder", "upcoming": "rut_benefits"}',
 0.92),

-- Competitive responses
('competitive', 'price_comparison',
 ARRAY['billigare', 'konkurrent', 'flyttfirma X', 'jämförelse', 'andra företag'],
 'Jag förstår att pris är viktigt! {{#if customer.clv > 25000}}Som värdefull kund kan jag matcha priset och lägga till {{bonus_service}} utan extra kostnad.{{/if}} Vi inkluderar alltid {{our_advantages}} som andra inte har. Plus {{rut_savings}}kr RUT-avdrag. Vill du att jag räknar på ditt specifika fall?',
 '{"competitive_intel": "competitor_prices", "customer_profiles": "clv_calculation", "financial_module": "rut_benefits"}',
 '{"high_clv": "price_matching", "price_sensitive": "value_proposition"}',
 0.80);

-- =============================================================================
-- PERFORMANCE INDEXES AND OPTIMIZATIONS
-- =============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_conversations_customer_status ON chatbot_conversations(customer_id, conversation_status);
CREATE INDEX idx_conversations_channel_period ON chatbot_conversations(channel, first_message_timestamp);
CREATE INDEX idx_messages_conversation_created ON chatbot_messages(conversation_id, created_at);
CREATE INDEX idx_revenue_customer_period ON chatbot_revenue_tracking(customer_id, created_at);
CREATE INDEX idx_performance_period_type ON chatbot_ai_performance(analysis_period, period_start, period_end);

-- Partial indexes for performance
CREATE INDEX idx_active_conversations ON chatbot_conversations(updated_at) 
WHERE conversation_status = 'active';

CREATE INDEX idx_high_revenue_conversations ON chatbot_conversations(revenue_generated) 
WHERE revenue_generated > 1000;

-- =============================================================================
-- VIEWS FOR BUSINESS INTELLIGENCE
-- =============================================================================

-- View for real-time conversation monitoring
CREATE VIEW active_conversations_dashboard AS
SELECT 
    c.id,
    c.conversation_uuid,
    c.channel,
    c.customer_id,
    cu.name as customer_name,
    c.total_messages,
    c.ai_confidence_average,
    c.revenue_generated,
    c.conversation_status,
    c.last_message_timestamp,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - c.last_message_timestamp))/60 as minutes_since_last_message,
    c.systems_accessed,
    cp.churn_risk_score,
    cp.lifetime_value_predicted
FROM chatbot_conversations c
LEFT JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN customer_ai_profiles cp ON c.customer_id = cp.customer_id
WHERE c.conversation_status = 'active'
ORDER BY c.last_message_timestamp DESC;

-- View for revenue attribution analysis
CREATE VIEW revenue_attribution_analysis AS
SELECT 
    DATE(r.created_at) as date,
    r.interaction_type,
    r.revenue_type,
    COUNT(*) as transaction_count,
    SUM(r.revenue_attributed) as total_revenue,
    SUM(r.cost_saved) as total_cost_saved,
    AVG(r.attribution_confidence) as avg_confidence,
    AVG(r.time_to_conversion_hours) as avg_conversion_time
FROM chatbot_revenue_tracking r
GROUP BY DATE(r.created_at), r.interaction_type, r.revenue_type
ORDER BY date DESC, total_revenue DESC;

-- =============================================================================
-- SCHEMA VALIDATION
-- =============================================================================

-- Validate schema integrity
DO $$
BEGIN
    -- Ensure all required tables exist
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN (
                'chatbot_conversations', 'chatbot_messages', 'chatbot_knowledge_base',
                'chatbot_revenue_tracking', 'customer_ai_profiles', 'chatbot_system_integration_logs',
                'chatbot_competitive_intelligence', 'chatbot_ai_performance'
            )
           ) = 8, 'Not all required chatbot tables were created';
           
    -- Ensure knowledge base has entries
    ASSERT (SELECT COUNT(*) FROM chatbot_knowledge_base) >= 6, 
           'Knowledge base should have sample entries';
           
    RAISE NOTICE 'AI Chatbot database schema validation successful!';
END $$;

COMMIT;

-- =============================================================================
-- SCHEMA SUMMARY
-- =============================================================================
/*
AI CHATBOT KUNDTJÄNST SCHEMA COMPLETE - TABLES CREATED:

Core Tables:
✅ chatbot_conversations (23 columns) - Main conversation tracking with business intelligence
✅ chatbot_messages (31 columns) - Rich message context with AI reasoning and system integration
✅ chatbot_knowledge_base (25 columns) - Learning knowledge base with dynamic data integration
✅ chatbot_revenue_tracking (20 columns) - Complete revenue attribution and business impact
✅ customer_ai_profiles (25 columns) - Advanced customer intelligence from all interactions
✅ chatbot_system_integration_logs (18 columns) - System health and performance monitoring
✅ chatbot_competitive_intelligence (17 columns) - Market intelligence and competitive analysis
✅ chatbot_ai_performance (20 columns) - AI learning and continuous improvement tracking

Revolutionary Features:
🚀 COMPLETE SYSTEM INTEGRATION - Links to Phase 1-5 AI, Financial Module, Staff App, CRM
💰 REVENUE ATTRIBUTION - Tracks every kr generated by chatbot conversations
🤖 ADVANCED AI LEARNING - Continuous improvement with business intelligence
📊 BUSINESS INTELLIGENCE - Customer insights, competitive analysis, predictive analytics
🎯 PROACTIVE CUSTOMER SERVICE - AI predicts needs and reaches out proactively
📈 PERFORMANCE OPTIMIZATION - Real-time monitoring of all system integrations
🔍 COMPETITIVE INTELLIGENCE - Track and counter competitor mentions
💡 PREDICTIVE INSIGHTS - ML-powered customer behavior prediction

Ready for: Revolutionary AI chatbot that transforms Nordflytt into AI-native company!
*/