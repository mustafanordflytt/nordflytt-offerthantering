// =============================================================================
// NORDFLYTT STOCKHOLM SEO DOMINATION SYSTEM
// Advanced SEO automation for Stockholm market leadership
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/marketing/seo
 * Get Stockholm SEO performance and rankings
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Stockholm SEO data requested');
    
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const stockholmArea = url.searchParams.get('stockholm_area');
    const timeRange = url.searchParams.get('time_range') || '30d';
    const includeCompetitors = url.searchParams.get('include_competitors') === 'true';
    
    // Get SEO performance data
    const seoData = await getStockholmSEOData(keyword, stockholmArea, timeRange);
    
    // Get competitor analysis if requested
    const competitorData = includeCompetitors ? await getStockholmCompetitorAnalysis() : null;
    
    // Get SEO opportunities
    const opportunities = await getStockholmSEOOpportunities();
    
    console.log('✅ Stockholm SEO data retrieved', {
      keywordCount: seoData.length,
      averagePosition: seoData.reduce((sum, k) => sum + k.current_position, 0) / seoData.length,
      stockholmRelevance: seoData.reduce((sum, k) => sum + k.stockholm_relevance_score, 0) / seoData.length
    });

    return NextResponse.json({
      success: true,
      seo_performance: seoData,
      competitor_analysis: competitorData,
      seo_opportunities: opportunities,
      stockholm_market_summary: {
        total_keywords_tracked: seoData.length,
        top_3_positions: seoData.filter(k => k.current_position <= 3).length,
        average_position: seoData.reduce((sum, k) => sum + k.current_position, 0) / seoData.length,
        total_organic_traffic: seoData.reduce((sum, k) => sum + k.organic_traffic_generated, 0),
        total_leads_from_seo: seoData.reduce((sum, k) => sum + k.leads_from_seo, 0),
        total_revenue_attributed: seoData.reduce((sum, k) => sum + k.revenue_attributed, 0),
        stockholm_domination_score: calculateStockholmDominationScore(seoData)
      }
    });

  } catch (error) {
    console.error('❌ Failed to retrieve Stockholm SEO data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve Stockholm SEO data',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/marketing/seo
 * Create new Stockholm SEO campaign or optimize existing content
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Creating Stockholm SEO campaign');
    
    const body = await request.json();
    const {
      campaign_name,
      target_keywords,
      stockholm_areas,
      content_strategy,
      competition_analysis,
      automation_level
    } = body;

    // Validate required fields
    if (!campaign_name || !target_keywords || !stockholm_areas) {
      return NextResponse.json({
        success: false,
        error: 'campaign_name, target_keywords, and stockholm_areas are required'
      }, { status: 400 });
    }

    // Analyze Stockholm market for keywords
    const marketAnalysis = await analyzeStockholmMarket(target_keywords, stockholm_areas);
    
    // Create SEO campaign with Stockholm optimization
    const seoCampaign = await createStockholmSEOCampaign({
      campaign_name,
      target_keywords,
      stockholm_areas,
      content_strategy: content_strategy || 'comprehensive',
      automation_level: automation_level || 'high',
      market_analysis: marketAnalysis
    });

    // Generate content strategy
    const contentStrategy = await generateStockholmContentStrategy(seoCampaign, marketAnalysis);
    
    // Set up automated monitoring
    const monitoringSetup = await setupStockholmSEOMonitoring(seoCampaign);

    console.log('✅ Stockholm SEO campaign created', {
      campaignId: seoCampaign.id,
      keywordCount: target_keywords.length,
      stockholmAreasCount: stockholm_areas.length,
      expectedROI: marketAnalysis.expected_roi
    });

    return NextResponse.json({
      success: true,
      seo_campaign: seoCampaign,
      market_analysis: marketAnalysis,
      content_strategy: contentStrategy,
      monitoring_setup: monitoringSetup,
      expected_timeline: {
        initial_rankings: '2-4 weeks',
        first_page_positions: '8-12 weeks',
        stockholm_domination: '6-12 months'
      }
    });

  } catch (error) {
    console.error('❌ Failed to create Stockholm SEO campaign:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create Stockholm SEO campaign',
      details: error.message
    }, { status: 500 });
  }
}

// =============================================================================
// STOCKHOLM SEO DATA MANAGEMENT
// =============================================================================

async function getStockholmSEOData(keyword?: string, stockholmArea?: string, timeRange?: string) {
  // Mock Stockholm SEO data - replace with actual SEO tracking
  const allSEOData = [
    {
      keyword: 'flyttfirma stockholm',
      current_position: 3,
      previous_position: 5,
      position_change: 2,
      stockholm_relevance_score: 0.98,
      local_search_volume: 1200,
      competition_level: 'high',
      
      // Content performance
      content_url: '/flytt-stockholm',
      content_type: 'service_page',
      content_word_count: 1500,
      nordflytt_mentions: 8,
      stockholm_mentions: 12,
      
      // Traffic and engagement
      organic_traffic_generated: 450,
      click_through_rate: 0.08,
      bounce_rate: 0.32,
      average_session_duration: 185,
      
      // Business metrics
      leads_from_seo: 12,
      revenue_attributed: 48000,
      conversion_rate: 0.027,
      
      // Stockholm-specific metrics
      stockholm_areas_mentioned: ['Östermalm', 'Södermalm', 'Vasastan'],
      local_business_signals: 0.89,
      geographic_targeting_score: 0.95,
      
      // Competitor comparison
      competitor_positions: {
        'Stockholm Flyttar AB': 8,
        'Huvudstadsflyttarna': 12,
        'Flytt & Co Stockholm': 15
      },
      
      measured_at: '2025-01-15T10:00:00Z'
    },
    {
      keyword: 'flytt stockholm',
      current_position: 7,
      previous_position: 8,
      position_change: 1,
      stockholm_relevance_score: 0.95,
      local_search_volume: 800,
      competition_level: 'medium',
      
      // Content performance
      content_url: '/flytt-stockholm',
      content_type: 'service_page',
      content_word_count: 1200,
      nordflytt_mentions: 6,
      stockholm_mentions: 15,
      
      // Traffic and engagement
      organic_traffic_generated: 280,
      click_through_rate: 0.06,
      bounce_rate: 0.28,
      average_session_duration: 220,
      
      // Business metrics
      leads_from_seo: 8,
      revenue_attributed: 32000,
      conversion_rate: 0.029,
      
      // Stockholm-specific metrics
      stockholm_areas_mentioned: ['Stockholm city', 'Norrmalm', 'Gamla Stan'],
      local_business_signals: 0.87,
      geographic_targeting_score: 0.93,
      
      // Competitor comparison
      competitor_positions: {
        'Stockholm Flyttar AB': 5,
        'Huvudstadsflyttarna': 9,
        'Flytt & Co Stockholm': 11
      },
      
      measured_at: '2025-01-15T10:00:00Z'
    },
    {
      keyword: 'bästa flyttfirma stockholm',
      current_position: 2,
      previous_position: 3,
      position_change: 1,
      stockholm_relevance_score: 0.92,
      local_search_volume: 400,
      competition_level: 'high',
      
      // Content performance
      content_url: '/om-oss',
      content_type: 'about_page',
      content_word_count: 800,
      nordflytt_mentions: 12,
      stockholm_mentions: 8,
      
      // Traffic and engagement
      organic_traffic_generated: 180,
      click_through_rate: 0.12,
      bounce_rate: 0.25,
      average_session_duration: 195,
      
      // Business metrics
      leads_from_seo: 6,
      revenue_attributed: 24000,
      conversion_rate: 0.033,
      
      // Stockholm-specific metrics
      stockholm_areas_mentioned: ['Östermalm', 'Södermalm'],
      local_business_signals: 0.91,
      geographic_targeting_score: 0.88,
      
      // Competitor comparison
      competitor_positions: {
        'Stockholm Flyttar AB': 6,
        'Huvudstadsflyttarna': 14,
        'Flytt & Co Stockholm': 18
      },
      
      measured_at: '2025-01-15T10:00:00Z'
    },
    {
      keyword: 'akutflytt stockholm',
      current_position: 1,
      previous_position: 2,
      position_change: 1,
      stockholm_relevance_score: 0.89,
      local_search_volume: 320,
      competition_level: 'low',
      
      // Content performance
      content_url: '/akutflytt-stockholm',
      content_type: 'service_page',
      content_word_count: 900,
      nordflytt_mentions: 5,
      stockholm_mentions: 9,
      
      // Traffic and engagement
      organic_traffic_generated: 85,
      click_through_rate: 0.15,
      bounce_rate: 0.22,
      average_session_duration: 240,
      
      // Business metrics
      leads_from_seo: 8,
      revenue_attributed: 34000,
      conversion_rate: 0.094,
      
      // Stockholm-specific metrics
      stockholm_areas_mentioned: ['Stockholm city', 'Alla områden'],
      local_business_signals: 0.85,
      geographic_targeting_score: 0.92,
      
      // Competitor comparison
      competitor_positions: {
        'Stockholm Flyttar AB': 15,
        'Huvudstadsflyttarna': 8,
        'Flytt & Co Stockholm': 22
      },
      
      measured_at: '2025-01-15T10:00:00Z'
    },
    {
      keyword: 'kontorsflytt stockholm',
      current_position: 4,
      previous_position: 6,
      position_change: 2,
      stockholm_relevance_score: 0.94,
      local_search_volume: 200,
      competition_level: 'medium',
      
      // Content performance
      content_url: '/kontorsflytt',
      content_type: 'service_page',
      content_word_count: 1100,
      nordflytt_mentions: 7,
      stockholm_mentions: 6,
      
      // Traffic and engagement
      organic_traffic_generated: 65,
      click_through_rate: 0.07,
      bounce_rate: 0.35,
      average_session_duration: 165,
      
      // Business metrics
      leads_from_seo: 4,
      revenue_attributed: 18000,
      conversion_rate: 0.062,
      
      // Stockholm-specific metrics
      stockholm_areas_mentioned: ['Östermalm', 'Norrmalm', 'Södermalm'],
      local_business_signals: 0.88,
      geographic_targeting_score: 0.90,
      
      // Competitor comparison
      competitor_positions: {
        'Stockholm Flyttar AB': 7,
        'Huvudstadsflyttarna': 11,
        'Flytt & Co Stockholm': 9
      },
      
      measured_at: '2025-01-15T10:00:00Z'
    }
  ];

  let filteredData = allSEOData;

  if (keyword) {
    filteredData = filteredData.filter(d => 
      d.keyword.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  if (stockholmArea) {
    filteredData = filteredData.filter(d => 
      d.stockholm_areas_mentioned.some(area => 
        area.toLowerCase().includes(stockholmArea.toLowerCase())
      )
    );
  }

  return filteredData;
}

async function getStockholmCompetitorAnalysis() {
  // Mock competitor analysis
  return {
    competitors: [
      {
        name: 'Stockholm Flyttar AB',
        market_share: 0.18,
        avg_position: 8.2,
        strengths: ['Price competitive', 'Local presence'],
        weaknesses: ['No weekend service', 'Limited packing options'],
        content_gaps: ['Emergency services', 'Premium offerings'],
        opportunity_score: 0.73
      },
      {
        name: 'Huvudstadsflyttarna',
        market_share: 0.15,
        avg_position: 10.8,
        strengths: ['Long history', 'Good reviews'],
        weaknesses: ['Outdated website', 'Poor mobile experience'],
        content_gaps: ['Modern technology', 'Digital booking'],
        opportunity_score: 0.81
      },
      {
        name: 'Flytt & Co Stockholm',
        market_share: 0.12,
        avg_position: 13.6,
        strengths: ['Modern branding', 'Social media presence'],
        weaknesses: ['Limited services', 'Higher prices'],
        content_gaps: ['Comprehensive services', 'Value proposition'],
        opportunity_score: 0.67
      }
    ],
    
    market_analysis: {
      total_market_size: 'SEK 125M annually',
      nordflytt_market_share: 0.023,
      growth_potential: 0.34,
      competitive_intensity: 'medium',
      entry_barriers: 'moderate'
    },
    
    content_opportunities: [
      {
        gap: 'Emergency moving services',
        search_volume: 320,
        competition: 'low',
        opportunity_score: 0.89
      },
      {
        gap: 'Premium moving packages',
        search_volume: 180,
        competition: 'medium',
        opportunity_score: 0.72
      },
      {
        gap: 'International moving from Stockholm',
        search_volume: 150,
        competition: 'low',
        opportunity_score: 0.85
      }
    ]
  };
}

async function getStockholmSEOOpportunities() {
  // Mock SEO opportunities
  return [
    {
      keyword: 'akutflytt stockholm',
      opportunity_type: 'low_competition',
      search_volume: 320,
      competition_level: 'low',
      estimated_traffic: 85,
      revenue_potential: 34000,
      effort_required: 'low',
      time_to_rank: '4-6 weeks',
      priority: 'high'
    },
    {
      keyword: 'flyttfirma östermalm',
      opportunity_type: 'local_optimization',
      search_volume: 180,
      competition_level: 'medium',
      estimated_traffic: 45,
      revenue_potential: 18000,
      effort_required: 'medium',
      time_to_rank: '8-12 weeks',
      priority: 'medium'
    },
    {
      keyword: 'stockholm moving company',
      opportunity_type: 'international_seo',
      search_volume: 90,
      competition_level: 'low',
      estimated_traffic: 25,
      revenue_potential: 12000,
      effort_required: 'high',
      time_to_rank: '12-16 weeks',
      priority: 'medium'
    },
    {
      keyword: 'kontorsflytt södermalm',
      opportunity_type: 'business_targeting',
      search_volume: 120,
      competition_level: 'medium',
      estimated_traffic: 32,
      revenue_potential: 28000,
      effort_required: 'medium',
      time_to_rank: '6-10 weeks',
      priority: 'high'
    }
  ];
}

// =============================================================================
// STOCKHOLM SEO CAMPAIGN CREATION
// =============================================================================

async function analyzeStockholmMarket(keywords: string[], stockholmAreas: string[]) {
  console.log('📊 Analyzing Stockholm market for keywords:', keywords);
  
  // Mock market analysis
  const marketAnalysis = {
    total_search_volume: keywords.length * 400, // Rough estimate
    competition_analysis: {
      low_competition: Math.floor(keywords.length * 0.3),
      medium_competition: Math.floor(keywords.length * 0.5),
      high_competition: Math.floor(keywords.length * 0.2)
    },
    
    stockholm_market_potential: {
      total_addressable_market: 125000000, // SEK annually
      serviceable_market: 25000000, // SEK annually for moving services
      nordflytt_current_share: 0.023,
      growth_potential: 0.34
    },
    
    keyword_opportunities: keywords.map(keyword => ({
      keyword: keyword,
      search_volume: Math.floor(Math.random() * 800) + 200,
      competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      stockholm_relevance: 0.8 + Math.random() * 0.2,
      revenue_potential: Math.floor(Math.random() * 30000) + 10000,
      ranking_difficulty: Math.floor(Math.random() * 10) + 1
    })),
    
    stockholm_areas_analysis: stockholmAreas.map(area => ({
      area: area,
      search_volume: Math.floor(Math.random() * 300) + 100,
      local_competition: Math.floor(Math.random() * 5) + 2,
      average_property_value: Math.floor(Math.random() * 5000000) + 5000000,
      moving_frequency: 0.12 + Math.random() * 0.08,
      opportunity_score: 0.6 + Math.random() * 0.4
    })),
    
    seasonal_trends: {
      peak_months: ['January', 'February', 'September', 'October'],
      low_months: ['July', 'December'],
      seasonal_multiplier: 1.3
    },
    
    expected_roi: 22.5 + Math.random() * 10,
    time_to_first_results: '6-8 weeks',
    time_to_full_potential: '6-12 months'
  };

  return marketAnalysis;
}

async function createStockholmSEOCampaign(campaignData: any) {
  console.log('🚀 Creating Stockholm SEO campaign');
  
  // Mock campaign creation
  const campaign = {
    id: Math.floor(Math.random() * 1000) + 100,
    campaign_name: campaignData.campaign_name,
    target_keywords: campaignData.target_keywords,
    stockholm_areas: campaignData.stockholm_areas,
    content_strategy: campaignData.content_strategy,
    automation_level: campaignData.automation_level,
    
    // Campaign settings
    created_at: new Date().toISOString(),
    status: 'active',
    budget_allocated: 50000, // SEK
    expected_duration: '12 months',
    
    // Stockholm-specific settings
    stockholm_optimization: {
      local_business_optimization: true,
      stockholm_schema_markup: true,
      google_my_business_integration: true,
      local_citations: true,
      stockholm_content_localization: true
    },
    
    // Content strategy
    content_plan: {
      service_pages: campaignData.target_keywords.length,
      blog_posts: Math.floor(campaignData.target_keywords.length * 1.5),
      landing_pages: Math.floor(campaignData.target_keywords.length * 0.5),
      stockholm_area_pages: campaignData.stockholm_areas.length
    },
    
    // Technical SEO
    technical_seo_plan: {
      site_speed_optimization: true,
      mobile_optimization: true,
      schema_markup: true,
      xml_sitemap: true,
      robots_txt_optimization: true
    },
    
    // Monitoring setup
    monitoring_keywords: campaignData.target_keywords.concat([
      'nordflytt',
      'flytt stockholm',
      'flyttfirma stockholm'
    ]),
    
    // Success metrics
    success_metrics: {
      target_keywords_top_10: campaignData.target_keywords.length * 0.7,
      organic_traffic_increase: 150, // Percentage
      leads_per_month: 25,
      revenue_per_month: 100000 // SEK
    }
  };

  return campaign;
}

async function generateStockholmContentStrategy(campaign: any, marketAnalysis: any) {
  console.log('📝 Generating Stockholm content strategy');
  
  // Mock content strategy generation
  const contentStrategy = {
    campaign_id: campaign.id,
    
    // Content pillars
    content_pillars: [
      {
        pillar: 'Stockholm Local Expertise',
        keywords: campaign.target_keywords.filter(k => k.includes('stockholm')),
        content_types: ['service_pages', 'area_guides', 'local_tips'],
        stockholm_areas: campaign.stockholm_areas,
        monthly_content_quota: 4
      },
      {
        pillar: 'Moving Services Excellence',
        keywords: campaign.target_keywords.filter(k => k.includes('flytt')),
        content_types: ['service_pages', 'how_to_guides', 'case_studies'],
        stockholm_areas: [],
        monthly_content_quota: 6
      },
      {
        pillar: 'Customer Success Stories',
        keywords: ['bästa flyttfirma', 'recensioner', 'erfarenheter'],
        content_types: ['testimonials', 'case_studies', 'success_stories'],
        stockholm_areas: campaign.stockholm_areas,
        monthly_content_quota: 3
      }
    ],
    
    // Content calendar
    content_calendar: generateContentCalendar(campaign.target_keywords, campaign.stockholm_areas),
    
    // Stockholm-specific content requirements
    stockholm_requirements: {
      local_references_per_page: 3,
      stockholm_area_mentions: 'natural_integration',
      local_landmarks_references: true,
      stockholm_history_integration: false,
      local_events_mentions: 'seasonal'
    },
    
    // SEO content guidelines
    seo_guidelines: {
      min_word_count: 800,
      max_word_count: 2000,
      keyword_density: 0.02,
      header_structure: 'hierarchical',
      internal_linking: 'strategic',
      external_linking: 'authoritative_sources'
    },
    
    // Performance targets
    performance_targets: {
      organic_traffic_per_page: 100,
      leads_per_page_monthly: 2,
      bounce_rate_target: 0.35,
      time_on_page_target: 180
    }
  };

  return contentStrategy;
}

async function setupStockholmSEOMonitoring(campaign: any) {
  console.log('📊 Setting up Stockholm SEO monitoring');
  
  // Mock monitoring setup
  const monitoring = {
    campaign_id: campaign.id,
    
    // Keyword monitoring
    keyword_tracking: {
      primary_keywords: campaign.target_keywords,
      secondary_keywords: generateSecondaryKeywords(campaign.target_keywords),
      competitor_keywords: ['stockholm flyttar', 'huvudstadsflyttarna', 'flytt & co'],
      monitoring_frequency: 'daily'
    },
    
    // Stockholm-specific monitoring
    stockholm_monitoring: {
      local_pack_tracking: true,
      google_my_business_tracking: true,
      local_citations_monitoring: true,
      stockholm_serp_features: true
    },
    
    // Performance monitoring
    performance_metrics: {
      organic_traffic: true,
      keyword_rankings: true,
      click_through_rates: true,
      conversion_rates: true,
      revenue_attribution: true
    },
    
    // Competitor monitoring
    competitor_tracking: {
      ranking_changes: true,
      new_content_detection: true,
      backlink_monitoring: true,
      social_signals: true
    },
    
    // Alerts and notifications
    alerts: {
      ranking_drops: { threshold: 3, notification: 'email' },
      traffic_drops: { threshold: 0.2, notification: 'email' },
      new_opportunities: { notification: 'weekly_report' },
      competitor_changes: { notification: 'monthly_report' }
    },
    
    // Reporting schedule
    reporting: {
      daily_dashboard: true,
      weekly_summary: true,
      monthly_detailed_report: true,
      quarterly_strategy_review: true
    }
  };

  return monitoring;
}

// =============================================================================
// STOCKHOLM SEO UTILITIES
// =============================================================================

function calculateStockholmDominationScore(seoData: any[]) {
  // Calculate overall Stockholm market domination score
  const totalKeywords = seoData.length;
  const topPositions = seoData.filter(k => k.current_position <= 3).length;
  const firstPagePositions = seoData.filter(k => k.current_position <= 10).length;
  const averageStockholmRelevance = seoData.reduce((sum, k) => sum + k.stockholm_relevance_score, 0) / totalKeywords;
  
  // Weighted score calculation
  const positionScore = (topPositions * 0.5 + firstPagePositions * 0.3) / totalKeywords;
  const relevanceScore = averageStockholmRelevance;
  const trafficScore = seoData.reduce((sum, k) => sum + k.organic_traffic_generated, 0) / (totalKeywords * 200);
  
  return Math.min(1.0, (positionScore * 0.4 + relevanceScore * 0.3 + trafficScore * 0.3));
}

function generateSecondaryKeywords(primaryKeywords: string[]): string[] {
  // Generate secondary keywords based on primary keywords
  const secondaryKeywords = [];
  
  primaryKeywords.forEach(keyword => {
    if (keyword.includes('stockholm')) {
      secondaryKeywords.push(keyword.replace('stockholm', 'huvudstaden'));
      secondaryKeywords.push(keyword + ' pris');
      secondaryKeywords.push(keyword + ' kostnad');
    }
    if (keyword.includes('flytt')) {
      secondaryKeywords.push(keyword.replace('flytt', 'flyttjänst'));
      secondaryKeywords.push(keyword + ' offert');
      secondaryKeywords.push(keyword + ' tips');
    }
  });
  
  return [...new Set(secondaryKeywords)]; // Remove duplicates
}

function generateContentCalendar(keywords: string[], stockholmAreas: string[]) {
  // Generate monthly content calendar
  const calendar = [];
  const months = ['January', 'February', 'March', 'April', 'May', 'June'];
  
  months.forEach((month, index) => {
    const monthlyContent = [];
    
    // Service pages
    if (keywords.length > index) {
      monthlyContent.push({
        type: 'service_page',
        title: `${keywords[index]} - Professionell service`,
        keyword: keywords[index],
        stockholm_area: stockholmAreas[index % stockholmAreas.length],
        estimated_traffic: Math.floor(Math.random() * 200) + 100,
        priority: 'high'
      });
    }
    
    // Area guides
    if (stockholmAreas.length > index) {
      monthlyContent.push({
        type: 'area_guide',
        title: `Flytta till ${stockholmAreas[index]} - Komplett guide`,
        keyword: `flytta ${stockholmAreas[index].toLowerCase()}`,
        stockholm_area: stockholmAreas[index],
        estimated_traffic: Math.floor(Math.random() * 150) + 50,
        priority: 'medium'
      });
    }
    
    // Blog posts
    monthlyContent.push({
      type: 'blog_post',
      title: `${month} flytttips för Stockholm`,
      keyword: `flytttips stockholm ${month.toLowerCase()}`,
      stockholm_area: 'Stockholm generell',
      estimated_traffic: Math.floor(Math.random() * 100) + 50,
      priority: 'low'
    });
    
    calendar.push({
      month: month,
      content: monthlyContent
    });
  });
  
  return calendar;
}