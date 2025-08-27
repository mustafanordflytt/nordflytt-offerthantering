import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/seo/competitors - Get competitor analysis data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const keyword = searchParams.get('keyword');
    const aiMentioned = searchParams.get('ai_mentioned') === 'true';

    let query = supabase
      .from('seo_competitors')
      .select('*')
      .order('date_tracked', { ascending: false });

    if (domain) {
      query = query.eq('competitor_domain', domain);
    }

    if (keyword) {
      query = query.eq('keyword', keyword);
    }

    if (aiMentioned) {
      query = query.or('ai_mentioned.eq.true,ml_mentioned.eq.true');
    }

    const { data, error } = await query.limit(1000);

    if (error) throw error;

    // Analyze competitor landscape
    const competitorAnalysis = analyzeCompetitors(data || []);

    return NextResponse.json({ 
      success: true, 
      data,
      analysis: competitorAnalysis
    });

  } catch (error) {
    console.error('Competitors API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch competitor data' },
      { status: 500 }
    );
  }
}

// Analyze competitor data
function analyzeCompetitors(data: any[]) {
  const analysis = {
    totalCompetitors: new Set(data.map(d => d.competitor_domain)).size,
    competitorsUsingAI: new Set(data.filter(d => d.ai_mentioned || d.ml_mentioned).map(d => d.competitor_domain)).size,
    topCompetitors: [] as any[],
    aiAdoption: {
      mentioningAI: 0,
      mentioningML: 0,
      neither: 0
    },
    keywordDominance: new Map<string, any>()
  };

  // Count AI/ML mentions
  const uniqueDomains = new Set(data.map(d => d.competitor_domain));
  uniqueDomains.forEach(domain => {
    const domainData = data.filter(d => d.competitor_domain === domain);
    const hasAI = domainData.some(d => d.ai_mentioned);
    const hasML = domainData.some(d => d.ml_mentioned);
    
    if (hasAI) analysis.aiAdoption.mentioningAI++;
    if (hasML) analysis.aiAdoption.mentioningML++;
    if (!hasAI && !hasML) analysis.aiAdoption.neither++;
  });

  // Calculate keyword dominance
  const keywordGroups = data.reduce((acc, item) => {
    if (!acc[item.keyword]) acc[item.keyword] = [];
    acc[item.keyword].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(keywordGroups).forEach(([keyword, rankings]) => {
    const sorted = rankings.sort((a, b) => a.position - b.position);
    analysis.keywordDominance.set(keyword, {
      leader: sorted[0]?.competitor_domain,
      leaderPosition: sorted[0]?.position,
      competitorCount: sorted.length
    });
  });

  // Identify top competitors by visibility
  const competitorVisibility = new Map<string, number>();
  data.forEach(item => {
    const current = competitorVisibility.get(item.competitor_domain) || 0;
    // Simple visibility score: higher position = lower score (better)
    const score = item.position <= 3 ? 10 : item.position <= 10 ? 5 : item.position <= 20 ? 2 : 1;
    competitorVisibility.set(item.competitor_domain, current + score);
  });

  analysis.topCompetitors = Array.from(competitorVisibility.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, score]) => ({ domain, visibilityScore: score }));

  return analysis;
}

// POST /api/seo/competitors - Add competitor tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domains } = body;

    if (!domains || !Array.isArray(domains)) {
      return NextResponse.json(
        { success: false, error: 'Domains array required' },
        { status: 400 }
      );
    }

    // In production, this would trigger competitor tracking
    // For now, return success
    return NextResponse.json({ 
      success: true, 
      message: `Added ${domains.length} competitors for tracking`,
      domains 
    });

  } catch (error) {
    console.error('Competitors POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add competitors' },
      { status: 500 }
    );
  }
}