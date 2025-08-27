-- =====================================================
-- NORDFLYTT SEO INFRASTRUCTURE DATABASE SCHEMA
-- Production-ready SEO data tracking system
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SEO RANKINGS TABLE
-- Tracks keyword positions and performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(255) NOT NULL,
  position INTEGER,
  previous_position INTEGER,
  url TEXT,
  search_volume INTEGER,
  competition_level VARCHAR(50) CHECK (competition_level IN ('low', 'medium', 'high', 'very_high')),
  cpc_estimate DECIMAL(10,2),
  difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  ai_advantage BOOLEAN DEFAULT FALSE,
  date_tracked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  domain VARCHAR(255) DEFAULT 'nordflytt.se',
  country_code VARCHAR(2) DEFAULT 'SE',
  device_type VARCHAR(20) DEFAULT 'desktop' CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_seo_rankings_keyword ON seo_rankings(keyword);
CREATE INDEX idx_seo_rankings_date ON seo_rankings(date_tracked);
CREATE INDEX idx_seo_rankings_position ON seo_rankings(position);
CREATE INDEX idx_seo_rankings_ai_advantage ON seo_rankings(ai_advantage) WHERE ai_advantage = TRUE;

-- =====================================================
-- COMPETITOR ANALYSIS TABLE
-- Monitors competitor rankings and strategies
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_domain VARCHAR(255) NOT NULL,
  competitor_name VARCHAR(255),
  keyword VARCHAR(255) NOT NULL,
  position INTEGER,
  estimated_traffic INTEGER,
  estimated_revenue DECIMAL(12,2),
  content_url TEXT,
  content_type VARCHAR(50),
  ai_mentioned BOOLEAN DEFAULT FALSE,
  ml_mentioned BOOLEAN DEFAULT FALSE,
  date_tracked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_seo_competitors_domain ON seo_competitors(competitor_domain);
CREATE INDEX idx_seo_competitors_keyword ON seo_competitors(keyword);
CREATE INDEX idx_seo_competitors_ai ON seo_competitors(ai_mentioned) WHERE ai_mentioned = TRUE;

-- =====================================================
-- CONTENT PERFORMANCE TABLE
-- Tracks content metrics and optimization status
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_url TEXT UNIQUE NOT NULL,
  page_type VARCHAR(50) CHECK (page_type IN ('landing', 'blog', 'service', 'area', 'tool')),
  target_keyword VARCHAR(255),
  secondary_keywords TEXT[],
  title TEXT,
  meta_description TEXT,
  h1_tag TEXT,
  word_count INTEGER,
  ai_optimized BOOLEAN DEFAULT FALSE,
  optimization_score INTEGER CHECK (optimization_score >= 0 AND optimization_score <= 100),
  organic_clicks INTEGER DEFAULT 0,
  organic_impressions INTEGER DEFAULT 0,
  average_position DECIMAL(5,2),
  ctr_percentage DECIMAL(5,2),
  bounce_rate DECIMAL(5,2),
  avg_time_on_page INTEGER, -- seconds
  conversion_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  revenue_attribution DECIMAL(12,2),
  schema_markup JSONB,
  internal_links INTEGER DEFAULT 0,
  external_links INTEGER DEFAULT 0,
  last_modified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_seo_content_url ON seo_content(page_url);
CREATE INDEX idx_seo_content_keyword ON seo_content(target_keyword);
CREATE INDEX idx_seo_content_type ON seo_content(page_type);
CREATE INDEX idx_seo_content_ai ON seo_content(ai_optimized) WHERE ai_optimized = TRUE;

-- =====================================================
-- KEYWORD OPPORTUNITIES TABLE
-- AI-identified keyword opportunities
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(255) NOT NULL,
  keyword_type VARCHAR(50) CHECK (keyword_type IN ('ai_focused', 'local', 'service', 'long_tail', 'competitor_gap')),
  search_volume INTEGER,
  competition_score DECIMAL(3,2) CHECK (competition_score >= 0 AND competition_score <= 1),
  cpc_estimate DECIMAL(10,2),
  difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  ai_advantage_potential BOOLEAN DEFAULT FALSE,
  estimated_traffic_potential INTEGER,
  estimated_revenue_potential DECIMAL(12,2),
  current_position INTEGER,
  target_position INTEGER DEFAULT 3,
  competitor_count INTEGER DEFAULT 0,
  implementation_effort VARCHAR(20) CHECK (implementation_effort IN ('low', 'medium', 'high')),
  recommended_content_type VARCHAR(50),
  recommended_action TEXT,
  status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'in_progress', 'implemented', 'monitoring', 'declined')),
  assigned_to VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_seo_opportunities_keyword ON seo_opportunities(keyword);
CREATE INDEX idx_seo_opportunities_score ON seo_opportunities(opportunity_score DESC);
CREATE INDEX idx_seo_opportunities_status ON seo_opportunities(status);
CREATE INDEX idx_seo_opportunities_ai ON seo_opportunities(ai_advantage_potential) WHERE ai_advantage_potential = TRUE;

-- =====================================================
-- SEARCH CONSOLE DATA TABLE
-- Stores Google Search Console metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_search_console (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  url TEXT,
  query VARCHAR(500),
  country VARCHAR(3) DEFAULT 'SWE',
  device VARCHAR(20) CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET')),
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,4),
  position DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_seo_search_console_date ON seo_search_console(date DESC);
CREATE INDEX idx_seo_search_console_url ON seo_search_console(url);
CREATE INDEX idx_seo_search_console_query ON seo_search_console(query);
CREATE UNIQUE INDEX idx_seo_search_console_unique ON seo_search_console(date, url, query, country, device);

-- =====================================================
-- TECHNICAL SEO AUDITS TABLE
-- Tracks technical SEO issues and fixes
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_technical_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  page_url TEXT,
  issue_type VARCHAR(100) NOT NULL,
  issue_category VARCHAR(50) CHECK (issue_category IN ('critical', 'error', 'warning', 'notice')),
  issue_description TEXT,
  impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
  ai_recommendation TEXT,
  fix_complexity VARCHAR(20) CHECK (fix_complexity IN ('easy', 'medium', 'hard')),
  estimated_fix_time INTEGER, -- minutes
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fixed', 'ignored', 'false_positive')),
  fixed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_seo_technical_audits_url ON seo_technical_audits(page_url);
CREATE INDEX idx_seo_technical_audits_status ON seo_technical_audits(status);
CREATE INDEX idx_seo_technical_audits_category ON seo_technical_audits(issue_category);

-- =====================================================
-- AI CONTENT GENERATION TABLE
-- Tracks AI-generated content and performance
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_ai_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type VARCHAR(50) CHECK (content_type IN ('blog_post', 'landing_page', 'meta_description', 'title_tag', 'schema_markup')),
  target_keyword VARCHAR(255),
  ai_model VARCHAR(50) DEFAULT 'gpt-4',
  prompt_template TEXT,
  generated_title TEXT,
  generated_content TEXT,
  generated_meta_description TEXT,
  optimization_score INTEGER,
  human_edited BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  published_url TEXT,
  published_date TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_seo_ai_content_keyword ON seo_ai_content(target_keyword);
CREATE INDEX idx_seo_ai_content_published ON seo_ai_content(published) WHERE published = TRUE;

-- =====================================================
-- LOCAL SEO TABLE
-- Stockholm area-specific SEO tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_local (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_name VARCHAR(255) NOT NULL,
  area_slug VARCHAR(255) NOT NULL,
  postal_codes TEXT[],
  population INTEGER,
  competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high')),
  monthly_searches INTEGER,
  local_pack_position INTEGER,
  gmb_ranking INTEGER,
  reviews_count INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),
  local_citations INTEGER DEFAULT 0,
  competitor_count INTEGER DEFAULT 0,
  market_share_estimate DECIMAL(5,2),
  revenue_potential DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_seo_local_area ON seo_local(area_slug);
CREATE INDEX idx_seo_local_competition ON seo_local(competition_level);

-- =====================================================
-- SEO TASKS AND AUTOMATION TABLE
-- Tracks SEO tasks and automation status
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_type VARCHAR(100) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  priority VARCHAR(20) CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  automated BOOLEAN DEFAULT FALSE,
  automation_schedule VARCHAR(50),
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'scheduled')),
  error_message TEXT,
  created_by VARCHAR(255),
  assigned_to VARCHAR(255),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_seo_tasks_status ON seo_tasks(status);
CREATE INDEX idx_seo_tasks_automated ON seo_tasks(automated) WHERE automated = TRUE;
CREATE INDEX idx_seo_tasks_next_run ON seo_tasks(next_run);

-- =====================================================
-- BACKLINKS TABLE
-- Tracks backlink profile and opportunities
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_backlinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url TEXT NOT NULL,
  source_domain VARCHAR(255) NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  link_type VARCHAR(20) CHECK (link_type IN ('dofollow', 'nofollow', 'sponsored', 'ugc')),
  domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
  page_authority INTEGER CHECK (page_authority >= 0 AND page_authority <= 100),
  spam_score INTEGER CHECK (spam_score >= 0 AND spam_score <= 100),
  first_seen DATE,
  last_seen DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'lost', 'broken')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_seo_backlinks_target ON seo_backlinks(target_url);
CREATE INDEX idx_seo_backlinks_source_domain ON seo_backlinks(source_domain);
CREATE INDEX idx_seo_backlinks_status ON seo_backlinks(status);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_seo_rankings_updated_at BEFORE UPDATE ON seo_rankings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_competitors_updated_at BEFORE UPDATE ON seo_competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_content_updated_at BEFORE UPDATE ON seo_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_opportunities_updated_at BEFORE UPDATE ON seo_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_technical_audits_updated_at BEFORE UPDATE ON seo_technical_audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_ai_content_updated_at BEFORE UPDATE ON seo_ai_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_local_updated_at BEFORE UPDATE ON seo_local FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_tasks_updated_at BEFORE UPDATE ON seo_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_backlinks_updated_at BEFORE UPDATE ON seo_backlinks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- AI Keyword Performance View
CREATE OR REPLACE VIEW seo_ai_keyword_performance AS
SELECT 
  r.keyword,
  r.position,
  r.search_volume,
  r.cpc_estimate,
  COUNT(DISTINCT c.competitor_domain) as competitor_count,
  BOOL_OR(c.ai_mentioned) as competitors_using_ai,
  r.ai_advantage,
  CASE 
    WHEN r.position <= 3 THEN 'top3'
    WHEN r.position <= 10 THEN 'page1'
    WHEN r.position <= 20 THEN 'page2'
    ELSE 'beyond'
  END as ranking_tier,
  r.date_tracked
FROM seo_rankings r
LEFT JOIN seo_competitors c ON r.keyword = c.keyword
WHERE r.keyword ILIKE '%ai%' OR r.keyword ILIKE '%ml%' OR r.keyword ILIKE '%smart%' OR r.ai_advantage = TRUE
GROUP BY r.id, r.keyword, r.position, r.search_volume, r.cpc_estimate, r.ai_advantage, r.date_tracked
ORDER BY r.search_volume DESC, r.position ASC;

-- Content ROI View
CREATE OR REPLACE VIEW seo_content_roi AS
SELECT 
  page_url,
  target_keyword,
  organic_clicks,
  conversion_count,
  revenue_attribution,
  CASE 
    WHEN organic_clicks > 0 THEN ROUND((conversion_count::DECIMAL / organic_clicks) * 100, 2)
    ELSE 0
  END as conversion_rate_percent,
  CASE 
    WHEN conversion_count > 0 THEN ROUND(revenue_attribution / conversion_count, 2)
    ELSE 0
  END as avg_order_value,
  ai_optimized,
  optimization_score
FROM seo_content
WHERE organic_clicks > 0
ORDER BY revenue_attribution DESC;

-- =====================================================
-- INITIAL DATA SEEDING
-- Stockholm areas for local SEO
-- =====================================================
INSERT INTO seo_local (area_name, area_slug, postal_codes, population, competition_level, monthly_searches) VALUES
('Östermalm', 'ostermalm', ARRAY['114', '115'], 71000, 'high', 1200),
('Södermalm', 'sodermalm', ARRAY['116', '117', '118'], 99000, 'high', 1500),
('Vasastan', 'vasastan', ARRAY['113'], 65000, 'medium', 800),
('Kungsholmen', 'kungsholmen', ARRAY['112'], 56000, 'medium', 600),
('Bromma', 'bromma', ARRAY['167', '168'], 75000, 'medium', 700),
('Täby', 'taby', ARRAY['183', '187'], 72000, 'low', 500),
('Nacka', 'nacka', ARRAY['131', '132', '133', '134'], 105000, 'medium', 900),
('Solna', 'solna', ARRAY['169', '170', '171'], 83000, 'high', 1000),
('Lidingö', 'lidingo', ARRAY['181'], 47000, 'low', 400),
('Danderyd', 'danderyd', ARRAY['182'], 33000, 'low', 300);

-- AI-focused keyword opportunities
INSERT INTO seo_opportunities (keyword, keyword_type, search_volume, competition_score, cpc_estimate, difficulty_score, opportunity_score, ai_advantage_potential, implementation_effort) VALUES
('ai flyttfirma stockholm', 'ai_focused', 50, 0.1, 10.00, 15, 95, TRUE, 'low'),
('smart flyttfirma', 'ai_focused', 30, 0.15, 18.00, 20, 90, TRUE, 'low'),
('flyttfirma med ai', 'ai_focused', 20, 0.05, 12.00, 10, 98, TRUE, 'low'),
('instant flyttpris', 'ai_focused', 80, 0.2, 12.00, 25, 85, TRUE, 'medium'),
('automatisk flyttoffert', 'ai_focused', 40, 0.1, 15.00, 18, 92, TRUE, 'low'),
('ml flyttplanering', 'ai_focused', 10, 0.02, 20.00, 5, 99, TRUE, 'low'),
('87% accuracy moving', 'ai_focused', 5, 0.0, 25.00, 2, 100, TRUE, 'low'),
('flyttkalkylator online', 'service', 500, 0.4, 8.00, 45, 70, FALSE, 'medium'),
('flyttfirma östermalm', 'local', 300, 0.6, 22.00, 55, 65, FALSE, 'medium'),
('kontorsflytt ai', 'ai_focused', 15, 0.05, 30.00, 8, 96, TRUE, 'low');

-- =====================================================
-- PERMISSIONS
-- =====================================================
ALTER TABLE seo_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_search_console ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_technical_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_local ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_backlinks ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth system)
-- Example: Allow authenticated users to read SEO data
CREATE POLICY "Allow authenticated read" ON seo_rankings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read" ON seo_competitors FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read" ON seo_content FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read" ON seo_opportunities FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read" ON seo_local FOR SELECT USING (true);