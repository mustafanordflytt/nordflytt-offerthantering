-- =============================================================================
-- NORDFLYTT AI MARKETING & SEO REVOLUTION - DATABASE SCHEMA
-- Revolutionary marketing automation with iDraw + Hemnet integration
-- =============================================================================

-- AI Marketing Campaigns Table
CREATE TABLE marketing_campaigns (
    id SERIAL PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- 'idraw_postcards', 'seo_content', 'social_media', 'email_automation'
    target_audience JSONB DEFAULT '{}', -- Customer segmentation data
    ai_generated_content JSONB DEFAULT '{}', -- AI-generated content variations
    nordflytt_voice_score DECIMAL(3,2) DEFAULT 0.0, -- How well it matches Nordflytt brand voice
    stockholm_seo_keywords JSONB DEFAULT '[]', -- SEO keywords for Stockholm domination
    hemnet_integration_data JSONB DEFAULT '{}', -- Hemnet scraped data for targeting
    idraw_postcard_data JSONB DEFAULT '{}', -- iDraw API integration data
    
    -- Performance metrics
    impressions_generated INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(10,2) DEFAULT 0.0,
    cost_per_lead DECIMAL(8,2) DEFAULT 0.0,
    conversion_rate DECIMAL(5,4) DEFAULT 0.0,
    
    -- AI optimization
    ai_optimization_score DECIMAL(3,2) DEFAULT 0.0,
    a_b_test_variants JSONB DEFAULT '[]',
    auto_optimization_enabled BOOLEAN DEFAULT true,
    
    -- Status and tracking
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    launched_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Budget and ROI
    budget_allocated DECIMAL(10,2) DEFAULT 0.0,
    budget_spent DECIMAL(10,2) DEFAULT 0.0,
    roi_percentage DECIMAL(5,2) DEFAULT 0.0,
    
    -- Geographic targeting
    stockholm_areas JSONB DEFAULT '[]', -- Specific Stockholm areas to target
    competitor_analysis JSONB DEFAULT '{}', -- Competitor insights
    
    UNIQUE(campaign_name),
    INDEX idx_campaign_type (campaign_type),
    INDEX idx_status (status),
    INDEX idx_stockholm_areas USING GIN (stockholm_areas),
    INDEX idx_created_at (created_at)
);

-- AI Content Library Table
CREATE TABLE ai_content_library (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'postcard_text', 'seo_article', 'social_post', 'email_template'
    content_title VARCHAR(255) NOT NULL,
    content_body TEXT NOT NULL,
    content_metadata JSONB DEFAULT '{}', -- Additional content data
    
    -- Nordflytt brand voice analysis
    nordflytt_voice_compliance DECIMAL(3,2) DEFAULT 0.0,
    avoid_generic_phrases BOOLEAN DEFAULT true,
    personality_traits JSONB DEFAULT '[]', -- Professional, trustworthy, Stockholm-focused
    
    -- SEO optimization
    seo_keywords JSONB DEFAULT '[]',
    stockholm_mentions INTEGER DEFAULT 0,
    moving_keywords_density DECIMAL(5,4) DEFAULT 0.0,
    
    -- Performance tracking
    usage_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0.0,
    engagement_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- AI generation data
    ai_model_used VARCHAR(100),
    generation_confidence DECIMAL(3,2) DEFAULT 0.0,
    human_approved BOOLEAN DEFAULT false,
    approval_date TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    
    INDEX idx_content_type (content_type),
    INDEX idx_nordflytt_voice_compliance (nordflytt_voice_compliance),
    INDEX idx_seo_keywords USING GIN (seo_keywords),
    INDEX idx_created_at (created_at)
);

-- iDraw Postcard Campaigns Table
CREATE TABLE idraw_campaigns (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    
    -- Hemnet integration data
    hemnet_listings_scraped JSONB DEFAULT '[]', -- Recently sold properties data
    target_property_owners JSONB DEFAULT '[]', -- Property owners to target
    geographic_targeting JSONB DEFAULT '{}', -- Stockholm areas and postal codes
    
    -- iDraw API integration
    idraw_template_id VARCHAR(100),
    idraw_postcard_design JSONB DEFAULT '{}',
    personalization_data JSONB DEFAULT '{}', -- Personal messages per recipient
    
    -- Postcard content
    headline TEXT,
    main_message TEXT,
    call_to_action TEXT,
    contact_information JSONB DEFAULT '{}',
    
    -- Sending and tracking
    postcards_designed INTEGER DEFAULT 0,
    postcards_sent INTEGER DEFAULT 0,
    delivery_confirmations INTEGER DEFAULT 0,
    response_rate DECIMAL(5,4) DEFAULT 0.0,
    leads_generated INTEGER DEFAULT 0,
    
    -- Cost tracking
    design_cost DECIMAL(8,2) DEFAULT 0.0,
    printing_cost DECIMAL(8,2) DEFAULT 0.0,
    postage_cost DECIMAL(8,2) DEFAULT 0.0,
    total_cost DECIMAL(10,2) DEFAULT 0.0,
    
    -- Performance metrics
    cost_per_lead DECIMAL(8,2) DEFAULT 0.0,
    roi_percentage DECIMAL(5,2) DEFAULT 0.0,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'planning', -- 'planning', 'designing', 'sending', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_status (status),
    INDEX idx_geographic_targeting USING GIN (geographic_targeting),
    INDEX idx_created_at (created_at)
);

-- SEO Rankings and Performance Table
CREATE TABLE seo_rankings (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    
    -- Keyword tracking
    keyword VARCHAR(255) NOT NULL,
    current_position INTEGER,
    previous_position INTEGER,
    position_change INTEGER DEFAULT 0,
    
    -- Stockholm-specific metrics
    stockholm_relevance_score DECIMAL(3,2) DEFAULT 0.0,
    local_search_volume INTEGER DEFAULT 0,
    competitor_positions JSONB DEFAULT '{}',
    
    -- Content performance
    content_url VARCHAR(500),
    content_type VARCHAR(50), -- 'blog_post', 'service_page', 'landing_page'
    content_word_count INTEGER DEFAULT 0,
    nordflytt_mentions INTEGER DEFAULT 0,
    
    -- Traffic and engagement
    organic_traffic_generated INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,4) DEFAULT 0.0,
    bounce_rate DECIMAL(5,4) DEFAULT 0.0,
    conversion_rate DECIMAL(5,4) DEFAULT 0.0,
    
    -- Revenue attribution
    leads_from_seo INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(10,2) DEFAULT 0.0,
    
    -- Timestamps
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_keyword (keyword),
    INDEX idx_current_position (current_position),
    INDEX idx_stockholm_relevance_score (stockholm_relevance_score),
    INDEX idx_measured_at (measured_at)
);

-- Marketing Lead Attribution Table
CREATE TABLE marketing_lead_attribution (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    customer_id INTEGER, -- Reference to customers table when available
    
    -- Lead source tracking
    lead_source VARCHAR(50) NOT NULL, -- 'idraw_postcard', 'seo_organic', 'social_media', 'email'
    source_campaign_type VARCHAR(50),
    attribution_confidence DECIMAL(3,2) DEFAULT 0.0,
    
    -- Lead information
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    
    -- Interaction tracking
    first_touchpoint TIMESTAMP,
    last_touchpoint TIMESTAMP,
    touchpoint_count INTEGER DEFAULT 1,
    interaction_journey JSONB DEFAULT '[]',
    
    -- Qualification and conversion
    lead_quality_score DECIMAL(3,2) DEFAULT 0.0,
    qualification_status VARCHAR(20) DEFAULT 'new', -- 'new', 'qualified', 'converted', 'lost'
    conversion_probability DECIMAL(3,2) DEFAULT 0.0,
    
    -- Revenue tracking
    estimated_value DECIMAL(10,2) DEFAULT 0.0,
    actual_revenue DECIMAL(10,2) DEFAULT 0.0,
    conversion_date TIMESTAMP,
    
    -- Geographic and demographic data
    stockholm_area VARCHAR(100),
    property_type VARCHAR(50), -- 'apartment', 'house', 'office'
    moving_distance_km INTEGER,
    
    -- AI insights
    ai_lead_score DECIMAL(3,2) DEFAULT 0.0,
    ai_recommendations JSONB DEFAULT '{}',
    follow_up_priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- Status and tracking
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_lead_source (lead_source),
    INDEX idx_qualification_status (qualification_status),
    INDEX idx_stockholm_area (stockholm_area),
    INDEX idx_ai_lead_score (ai_lead_score),
    INDEX idx_created_at (created_at)
);

-- Marketing Analytics Dashboard Table
CREATE TABLE marketing_analytics (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    
    -- Date and time tracking
    analytics_date DATE NOT NULL,
    measurement_hour INTEGER DEFAULT 0, -- 0-23 for hourly tracking
    
    -- Core metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0.0,
    
    -- Cost metrics
    cost_spent DECIMAL(10,2) DEFAULT 0.0,
    cost_per_click DECIMAL(8,2) DEFAULT 0.0,
    cost_per_lead DECIMAL(8,2) DEFAULT 0.0,
    cost_per_conversion DECIMAL(8,2) DEFAULT 0.0,
    
    -- Performance ratios
    click_through_rate DECIMAL(5,4) DEFAULT 0.0,
    conversion_rate DECIMAL(5,4) DEFAULT 0.0,
    return_on_ad_spend DECIMAL(5,2) DEFAULT 0.0,
    
    -- Stockholm-specific metrics
    stockholm_market_share DECIMAL(5,4) DEFAULT 0.0,
    stockholm_brand_awareness DECIMAL(3,2) DEFAULT 0.0,
    competitor_comparison JSONB DEFAULT '{}',
    
    -- AI optimization metrics
    ai_optimization_suggestions JSONB DEFAULT '[]',
    auto_optimization_applied BOOLEAN DEFAULT false,
    predicted_performance JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(campaign_id, analytics_date, measurement_hour),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_analytics_date (analytics_date),
    INDEX idx_revenue (revenue DESC),
    INDEX idx_conversion_rate (conversion_rate DESC)
);

-- AI Marketing Intelligence Table
CREATE TABLE ai_marketing_intelligence (
    id SERIAL PRIMARY KEY,
    
    -- Intelligence type and data
    intelligence_type VARCHAR(50) NOT NULL, -- 'market_trend', 'competitor_analysis', 'customer_behavior', 'seo_opportunity'
    intelligence_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    
    -- Stockholm market insights
    stockholm_market_impact DECIMAL(3,2) DEFAULT 0.0,
    geographic_relevance JSONB DEFAULT '{}',
    seasonal_patterns JSONB DEFAULT '{}',
    
    -- Actionable recommendations
    recommendations JSONB DEFAULT '[]',
    priority_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    implementation_effort VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    expected_roi DECIMAL(5,2) DEFAULT 0.0,
    
    -- Action tracking
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'reviewed', 'implemented', 'dismissed'
    action_taken JSONB DEFAULT '{}',
    results_achieved JSONB DEFAULT '{}',
    
    -- Timestamps
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    implemented_at TIMESTAMP,
    
    INDEX idx_intelligence_type (intelligence_type),
    INDEX idx_confidence_score (confidence_score DESC),
    INDEX idx_stockholm_market_impact (stockholm_market_impact DESC),
    INDEX idx_priority_level (priority_level),
    INDEX idx_status (status),
    INDEX idx_discovered_at (discovered_at)
);

-- Marketing Automation Rules Table
CREATE TABLE marketing_automation_rules (
    id SERIAL PRIMARY KEY,
    
    -- Rule definition
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- 'trigger_campaign', 'optimize_content', 'adjust_budget', 'alert_team'
    
    -- Trigger conditions
    trigger_conditions JSONB NOT NULL, -- Complex conditions for rule activation
    trigger_frequency VARCHAR(20) DEFAULT 'real_time', -- 'real_time', 'hourly', 'daily', 'weekly'
    
    -- Actions to take
    automation_actions JSONB NOT NULL, -- Actions to execute when triggered
    nordflytt_brand_compliance BOOLEAN DEFAULT true,
    
    -- Performance tracking
    times_triggered INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4) DEFAULT 0.0,
    business_impact DECIMAL(10,2) DEFAULT 0.0,
    
    -- Rule status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at TIMESTAMP,
    
    INDEX idx_rule_type (rule_type),
    INDEX idx_is_active (is_active),
    INDEX idx_success_rate (success_rate DESC),
    INDEX idx_last_triggered_at (last_triggered_at)
);

-- =============================================================================
-- INITIAL DATA SEEDING
-- =============================================================================

-- Insert sample marketing campaigns
INSERT INTO marketing_campaigns (campaign_name, campaign_type, target_audience, ai_generated_content, nordflytt_voice_score, stockholm_seo_keywords, status, budget_allocated, stockholm_areas) VALUES
('Stockholm Vinterflyttning 2025', 'idraw_postcards', '{"age_range": "25-45", "income_level": "medium_high", "property_type": "apartment"}', '{"headlines": ["Flytta tryggt i vinter", "Nordflytts vinterexperter"], "messages": ["Vi tar hand om din flytt även i snö och kyla"]}', 0.92, '["flytt stockholm", "vinterflyttning", "flyttfirma stockholm"]', 'active', 25000.00, '["Östermalm", "Södermalm", "Vasastan"]'),
('Stockholm SEO Domination', 'seo_content', '{"search_intent": "moving_services", "location": "stockholm", "urgency": "high"}', '{"blog_posts": ["Flytta i Stockholm - Komplett guide", "Bästa flytttips för Stockholmare"], "service_pages": ["Flyttfirma Stockholm", "Professionell flytt i Stockholm"]}', 0.88, '["flyttfirma stockholm", "flytt stockholm", "bästa flyttfirma stockholm", "flytthjälp stockholm"]', 'active', 35000.00, '["Alla Stockholm områden"]'),
('Hemnet Ägarfokus', 'idraw_postcards', '{"property_owners": true, "recently_sold": true, "stockholm_areas": ["Östermalm", "Djurgården"]}', '{"personalized_messages": ["Grattis till din nya bostad!", "Vi hjälper dig med nästa flytt"]}', 0.95, '["flytt stockholm", "flytthjälp"]', 'planning', 18000.00, '["Östermalm", "Djurgården"]');

-- Insert sample AI content library
INSERT INTO ai_content_library (content_type, content_title, content_body, nordflytt_voice_compliance, seo_keywords, stockholm_mentions, moving_keywords_density) VALUES
('postcard_text', 'Vinterflyttning Stockholm', 'Flytta tryggt i vinter med Nordflytts erfarna team. Vi tar hand om allt från packning till transport - även i snö och kyla. Kontakta oss idag!', 0.94, '["vinterflyttning", "flytt stockholm", "trygg flytt"]', 2, 0.08),
('seo_article', 'Flytta i Stockholm - Komplett guide', 'Att flytta i Stockholm kan vara stressande, men med rätt flyttfirma blir det smidigt. Nordflytt har hjälpt tusentals stockholmare med professionell flytthjälp sedan 1995...', 0.91, '["flytta stockholm", "flyttfirma stockholm", "flytthjälp"]', 8, 0.12),
('social_post', 'Stockholm Flytttips', 'Planerar du flytt i Stockholm? Här är våra bästa tips för en smidig flytt i huvudstaden! 📦🚛 #FlyttStockholm #Nordflytt', 0.87, '["flytt stockholm", "flytttips"]', 3, 0.15);

-- Insert sample iDraw campaigns
INSERT INTO idraw_campaigns (campaign_id, hemnet_listings_scraped, target_property_owners, idraw_template_id, headline, main_message, call_to_action, postcards_designed, postcards_sent, design_cost, printing_cost, postage_cost, total_cost, status) VALUES
(1, '[{"address": "Östermalm Villa", "sold_price": 8500000, "sold_date": "2024-12-15"}]', '[{"name": "Erik Larsson", "address": "Östermalm 123", "property_value": 8500000}]', 'nordflytt_winter_2025', 'Flytta tryggt i vinter', 'Grattis till din nya bostad! Vi på Nordflytt hjälper dig med nästa flytt - professionellt och tryggt.', 'Ring 08-123456 för gratis offert', 150, 150, 2250.00, 1875.00, 1125.00, 5250.00, 'completed'),
(3, '[{"address": "Djurgården Lägenhet", "sold_price": 12000000, "sold_date": "2024-12-20"}]', '[{"name": "Anna Andersson", "address": "Djurgården 456", "property_value": 12000000}]', 'nordflytt_premium_2025', 'Premiumflytt för ditt nya hem', 'Välkommen till ditt nya hem! Nordflytt erbjuder premiumflytttjänster för dig som vill ha det bästa.', 'Boka kostnadsfri konsultation', 75, 0, 1125.00, 0, 0, 1125.00, 'designing');

-- Insert sample SEO rankings
INSERT INTO seo_rankings (campaign_id, keyword, current_position, previous_position, position_change, stockholm_relevance_score, local_search_volume, content_url, content_type, organic_traffic_generated, click_through_rate, leads_from_seo, revenue_attributed) VALUES
(2, 'flyttfirma stockholm', 3, 5, 2, 0.98, 1200, '/flytt-stockholm', 'service_page', 450, 0.08, 12, 48000.00),
(2, 'flytt stockholm', 7, 8, 1, 0.95, 800, '/flytt-stockholm', 'service_page', 280, 0.06, 8, 32000.00),
(2, 'bästa flyttfirma stockholm', 2, 3, 1, 0.92, 400, '/om-oss', 'landing_page', 180, 0.12, 6, 24000.00);

-- Insert sample marketing lead attribution
INSERT INTO marketing_lead_attribution (campaign_id, lead_source, customer_name, customer_email, customer_phone, stockholm_area, property_type, estimated_value, actual_revenue, lead_quality_score, qualification_status, ai_lead_score, follow_up_priority) VALUES
(1, 'idraw_postcard', 'Maria Johansson', 'maria.j@email.com', '070-1234567', 'Östermalm', 'apartment', 15000.00, 15000.00, 0.89, 'converted', 0.92, 'high'),
(2, 'seo_organic', 'Lars Nilsson', 'lars.n@email.com', '070-2345678', 'Södermalm', 'house', 25000.00, 0.00, 0.76, 'qualified', 0.81, 'medium'),
(1, 'idraw_postcard', 'Karin Eriksson', 'karin.e@email.com', '070-3456789', 'Vasastan', 'apartment', 18000.00, 18000.00, 0.93, 'converted', 0.95, 'high');

-- Insert sample marketing analytics
INSERT INTO marketing_analytics (campaign_id, analytics_date, impressions, clicks, leads, conversions, revenue, cost_spent, click_through_rate, conversion_rate, return_on_ad_spend, stockholm_market_share, stockholm_brand_awareness) VALUES
(1, '2025-01-15', 2500, 125, 8, 3, 48000.00, 5250.00, 0.05, 0.024, 9.14, 0.0234, 0.67),
(2, '2025-01-15', 1800, 144, 12, 6, 104000.00, 8500.00, 0.08, 0.0417, 12.24, 0.0289, 0.72),
(3, '2025-01-15', 0, 0, 0, 0, 0.00, 1125.00, 0.00, 0.00, 0.00, 0.0156, 0.62);

-- Insert sample AI marketing intelligence
INSERT INTO ai_marketing_intelligence (intelligence_type, intelligence_data, confidence_score, stockholm_market_impact, recommendations, priority_level, expected_roi, status) VALUES
('market_trend', '{"trend": "Increased winter moving demand", "data": {"increase_percentage": 23, "peak_months": ["January", "February"], "target_demographics": ["young_professionals", "families"]}}', 0.87, 0.92, '["Increase winter-focused campaigns", "Target young professionals with specific messaging", "Expand service capacity for January-February"]', 'high', 15.6, 'new'),
('competitor_analysis', '{"competitor": "Stockholm Flyttar AB", "analysis": {"pricing_strategy": "15% below market", "service_gaps": ["No weekend service", "Limited packing options"], "market_share": 0.18}}', 0.82, 0.78, '["Emphasize weekend availability", "Promote comprehensive packing services", "Competitive pricing adjustment"]', 'medium', 8.9, 'reviewed'),
('seo_opportunity', '{"keyword": "akutflytt stockholm", "opportunity": {"monthly_searches": 320, "competition": "low", "estimated_traffic": 85, "revenue_potential": 34000}}', 0.91, 0.89, '["Create emergency moving service page", "Optimize for akutflytt stockholm", "Develop 24/7 service offering"]', 'high', 22.3, 'new');

-- Insert sample marketing automation rules
INSERT INTO marketing_automation_rules (rule_name, rule_description, rule_type, trigger_conditions, automation_actions, times_triggered, success_rate, business_impact, is_active) VALUES
('High-Value Lead Alert', 'Alert team when high-value lead is detected', 'alert_team', '{"lead_score": {"min": 0.85}, "estimated_value": {"min": 20000}}', '{"send_notification": true, "assign_to": "senior_sales", "priority": "urgent", "follow_up_time": "15_minutes"}', 23, 0.87, 125000.00, true),
('Budget Optimization', 'Automatically adjust campaign budgets based on performance', 'adjust_budget', '{"roi": {"min": 3.0}, "remaining_budget": {"min": 1000}}', '{"increase_budget": {"percentage": 20}, "reallocate_from": "underperforming_campaigns"}', 8, 0.75, 67500.00, true),
('Content Refresh Trigger', 'Trigger content refresh when performance drops', 'optimize_content', '{"conversion_rate": {"decrease": 0.02}, "days_since_update": {"min": 30}}', '{"generate_new_content": true, "a_b_test": true, "nordflytt_voice_check": true}', 5, 0.80, 23000.00, true);

-- =============================================================================
-- VIEWS FOR DASHBOARD ANALYTICS
-- =============================================================================

-- Marketing Campaign Performance View
CREATE VIEW marketing_campaign_performance AS
SELECT 
    mc.id,
    mc.campaign_name,
    mc.campaign_type,
    mc.status,
    mc.budget_allocated,
    mc.budget_spent,
    mc.roi_percentage,
    mc.leads_generated,
    mc.revenue_attributed,
    mc.conversion_rate,
    mc.nordflytt_voice_score,
    COUNT(mla.id) as total_leads,
    SUM(mla.actual_revenue) as total_revenue,
    AVG(mla.lead_quality_score) as avg_lead_quality,
    mc.created_at,
    mc.launched_at
FROM marketing_campaigns mc
LEFT JOIN marketing_lead_attribution mla ON mc.id = mla.campaign_id
GROUP BY mc.id, mc.campaign_name, mc.campaign_type, mc.status, mc.budget_allocated, mc.budget_spent, mc.roi_percentage, mc.leads_generated, mc.revenue_attributed, mc.conversion_rate, mc.nordflytt_voice_score, mc.created_at, mc.launched_at;

-- Stockholm SEO Performance View
CREATE VIEW stockholm_seo_performance AS
SELECT 
    sr.campaign_id,
    sr.keyword,
    sr.current_position,
    sr.position_change,
    sr.stockholm_relevance_score,
    sr.local_search_volume,
    sr.organic_traffic_generated,
    sr.click_through_rate,
    sr.leads_from_seo,
    sr.revenue_attributed,
    mc.campaign_name,
    sr.measured_at
FROM seo_rankings sr
JOIN marketing_campaigns mc ON sr.campaign_id = mc.id
WHERE sr.stockholm_relevance_score > 0.7
ORDER BY sr.stockholm_relevance_score DESC, sr.current_position ASC;

-- iDraw Campaign ROI View
CREATE VIEW idraw_campaign_roi AS
SELECT 
    ic.id,
    ic.campaign_id,
    mc.campaign_name,
    ic.postcards_designed,
    ic.postcards_sent,
    ic.total_cost,
    ic.leads_generated,
    ic.roi_percentage,
    ic.response_rate,
    ic.cost_per_lead,
    ic.status,
    ic.created_at,
    ic.sent_at
FROM idraw_campaigns ic
JOIN marketing_campaigns mc ON ic.campaign_id = mc.id
WHERE ic.postcards_sent > 0
ORDER BY ic.roi_percentage DESC;

-- Marketing Intelligence Priority View
CREATE VIEW marketing_intelligence_priority AS
SELECT 
    ami.id,
    ami.intelligence_type,
    ami.confidence_score,
    ami.stockholm_market_impact,
    ami.priority_level,
    ami.expected_roi,
    ami.status,
    ami.recommendations,
    ami.discovered_at,
    ami.reviewed_at,
    ami.implemented_at
FROM ai_marketing_intelligence ami
WHERE ami.status IN ('new', 'reviewed')
ORDER BY 
    CASE ami.priority_level 
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    ami.expected_roi DESC,
    ami.discovered_at DESC;

-- Lead Attribution Performance View
CREATE VIEW lead_attribution_performance AS
SELECT 
    mla.campaign_id,
    mc.campaign_name,
    mla.lead_source,
    COUNT(mla.id) as total_leads,
    AVG(mla.lead_quality_score) as avg_quality_score,
    AVG(mla.ai_lead_score) as avg_ai_score,
    SUM(mla.estimated_value) as total_estimated_value,
    SUM(mla.actual_revenue) as total_actual_revenue,
    SUM(CASE WHEN mla.qualification_status = 'converted' THEN 1 ELSE 0 END) as converted_leads,
    (SUM(CASE WHEN mla.qualification_status = 'converted' THEN 1 ELSE 0 END) * 100.0 / COUNT(mla.id)) as conversion_rate,
    mla.stockholm_area,
    mla.property_type
FROM marketing_lead_attribution mla
JOIN marketing_campaigns mc ON mla.campaign_id = mc.id
GROUP BY mla.campaign_id, mc.campaign_name, mla.lead_source, mla.stockholm_area, mla.property_type
ORDER BY total_actual_revenue DESC;

-- =============================================================================
-- TRIGGERS FOR AUTOMATION
-- =============================================================================

-- Update campaign metrics when new leads are attributed
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign lead count and revenue
    UPDATE marketing_campaigns 
    SET 
        leads_generated = (
            SELECT COUNT(*) 
            FROM marketing_lead_attribution 
            WHERE campaign_id = NEW.campaign_id
        ),
        revenue_attributed = (
            SELECT COALESCE(SUM(actual_revenue), 0) 
            FROM marketing_lead_attribution 
            WHERE campaign_id = NEW.campaign_id
        ),
        conversion_rate = (
            SELECT 
                CASE 
                    WHEN COUNT(*) > 0 THEN 
                        (COUNT(CASE WHEN qualification_status = 'converted' THEN 1 END) * 1.0 / COUNT(*))
                    ELSE 0
                END
            FROM marketing_lead_attribution 
            WHERE campaign_id = NEW.campaign_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.campaign_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_metrics
    AFTER INSERT OR UPDATE ON marketing_lead_attribution
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_metrics();

-- Update ROI when budget is spent
CREATE OR REPLACE FUNCTION calculate_campaign_roi()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate ROI percentage
    IF NEW.budget_spent > 0 THEN
        NEW.roi_percentage = ((NEW.revenue_attributed - NEW.budget_spent) / NEW.budget_spent) * 100;
    ELSE
        NEW.roi_percentage = 0;
    END IF;
    
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_campaign_roi
    BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION calculate_campaign_roi();

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Additional indexes for complex queries
CREATE INDEX idx_marketing_campaigns_performance ON marketing_campaigns(campaign_type, status, roi_percentage DESC, created_at);
CREATE INDEX idx_lead_attribution_conversion ON marketing_lead_attribution(campaign_id, qualification_status, ai_lead_score DESC);
CREATE INDEX idx_seo_rankings_performance ON seo_rankings(campaign_id, stockholm_relevance_score DESC, current_position ASC);
CREATE INDEX idx_marketing_analytics_date_performance ON marketing_analytics(analytics_date, campaign_id, return_on_ad_spend DESC);
CREATE INDEX idx_ai_intelligence_actionable ON ai_marketing_intelligence(priority_level, status, expected_roi DESC);