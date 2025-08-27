import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/seo/opportunities - Get keyword opportunities
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const aiOnly = searchParams.get('ai_only') === 'true';
    const minOpportunityScore = parseInt(searchParams.get('min_score') || '0');

    let query = supabase
      .from('seo_opportunities')
      .select('*')
      .order('opportunity_score', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (aiOnly) {
      query = query.eq('ai_advantage_potential', true);
    }

    if (minOpportunityScore > 0) {
      query = query.gte('opportunity_score', minOpportunityScore);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate opportunity summary
    const summary = {
      total: data?.length || 0,
      aiOpportunities: data?.filter(o => o.ai_advantage_potential).length || 0,
      highValue: data?.filter(o => o.opportunity_score >= 80).length || 0,
      totalSearchVolume: data?.reduce((sum, o) => sum + (o.search_volume || 0), 0) || 0,
      totalRevenuePotential: data?.reduce((sum, o) => sum + (o.estimated_revenue_potential || 0), 0) || 0,
      byStatus: {
        identified: data?.filter(o => o.status === 'identified').length || 0,
        inProgress: data?.filter(o => o.status === 'in_progress').length || 0,
        implemented: data?.filter(o => o.status === 'implemented').length || 0,
        monitoring: data?.filter(o => o.status === 'monitoring').length || 0
      }
    };

    return NextResponse.json({ 
      success: true, 
      data,
      summary
    });

  } catch (error) {
    console.error('Opportunities API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

// POST /api/seo/opportunities - Create new opportunity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      keyword, 
      keyword_type = 'ai_focused',
      search_volume,
      competition_score,
      cpc_estimate,
      ai_advantage_potential = false,
      implementation_effort = 'medium'
    } = body;

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword required' },
        { status: 400 }
      );
    }

    // Calculate opportunity score
    const opportunityScore = calculateOpportunityScore({
      search_volume,
      competition_score,
      cpc_estimate,
      ai_advantage_potential
    });

    // Insert new opportunity
    const { data, error } = await supabase
      .from('seo_opportunities')
      .insert({
        keyword,
        keyword_type,
        search_volume,
        competition_score,
        cpc_estimate,
        opportunity_score: opportunityScore,
        ai_advantage_potential,
        implementation_effort,
        estimated_traffic_potential: Math.floor(search_volume * 0.15 * (1 - competition_score)),
        estimated_revenue_potential: Math.floor(search_volume * 0.15 * (1 - competition_score) * 250),
        status: 'identified'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data
    });

  } catch (error) {
    console.error('Opportunities POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}

// PATCH /api/seo/opportunities - Update opportunity status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, assigned_to } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'ID and status required' },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (assigned_to) updateData.assigned_to = assigned_to;

    const { data, error } = await supabase
      .from('seo_opportunities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data
    });

  } catch (error) {
    console.error('Opportunities PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update opportunity' },
      { status: 500 }
    );
  }
}

// Calculate opportunity score based on multiple factors
function calculateOpportunityScore(params: {
  search_volume?: number;
  competition_score?: number;
  cpc_estimate?: number;
  ai_advantage_potential?: boolean;
}): number {
  const {
    search_volume = 0,
    competition_score = 0.5,
    cpc_estimate = 0,
    ai_advantage_potential = false
  } = params;

  let score = 0;

  // Search volume component (0-30 points)
  if (search_volume >= 1000) score += 30;
  else if (search_volume >= 500) score += 25;
  else if (search_volume >= 100) score += 20;
  else if (search_volume >= 50) score += 15;
  else if (search_volume >= 10) score += 10;
  else score += 5;

  // Competition component (0-30 points)
  score += Math.floor((1 - competition_score) * 30);

  // CPC value component (0-20 points)
  if (cpc_estimate >= 30) score += 20;
  else if (cpc_estimate >= 20) score += 15;
  else if (cpc_estimate >= 10) score += 10;
  else if (cpc_estimate >= 5) score += 5;

  // AI advantage bonus (0-20 points)
  if (ai_advantage_potential) {
    score += 20;
  }

  return Math.min(100, Math.max(0, score));
}