import { NextRequest, NextResponse } from 'next/server';
import { rankingTracker } from '@/lib/seo/ranking-tracker';
import { supabase } from '@/lib/supabase';

// POST /api/seo/tracking/add-keyword - Add new keyword for tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      keyword,
      trackImmediately = true,
      aiAdvantage = false,
      targetPosition = 3,
      trackCompetitors = true
    } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid keyword required' },
        { status: 400 }
      );
    }

    // Check if keyword already exists
    const { data: existing } = await supabase
      .from('seo_opportunities')
      .select('id')
      .eq('keyword', keyword)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Keyword already being tracked' },
        { status: 400 }
      );
    }

    // Determine if this is an AI keyword
    const isAIKeyword = aiAdvantage || 
      keyword.toLowerCase().includes('ai') ||
      keyword.toLowerCase().includes('ml') ||
      keyword.toLowerCase().includes('smart') ||
      keyword.toLowerCase().includes('automat') ||
      keyword.toLowerCase().includes('instant') ||
      keyword.toLowerCase().includes('87%');

    // Add to opportunities table
    const { data: opportunity, error: oppError } = await supabase
      .from('seo_opportunities')
      .insert({
        keyword,
        keyword_type: isAIKeyword ? 'ai_focused' : 'service',
        search_volume: 0, // Will be updated when we get data
        competition_score: 0.5, // Default, will be updated
        opportunity_score: isAIKeyword ? 90 : 70,
        ai_advantage_potential: isAIKeyword,
        target_position: targetPosition,
        status: 'monitoring',
        implementation_effort: 'low',
        recommended_action: 'Track keyword performance and optimize content'
      })
      .select()
      .single();

    if (oppError) throw oppError;

    let trackingResult = null;

    // Track immediately if requested
    if (trackImmediately) {
      trackingResult = await rankingTracker.addKeyword(keyword, {
        aiAdvantage: isAIKeyword,
        competitorDomains: trackCompetitors ? [
          'stockholmflyttbyra.se',
          'flyttochtransport.se',
          'flyttfirmaistockholm.nu',
          'stadhem.se',
          'flyttgubben.se'
        ] : []
      });
    }

    return NextResponse.json({ 
      success: true,
      data: {
        opportunity,
        trackingResult,
        message: `Started tracking "${keyword}"${isAIKeyword ? ' (AI keyword)' : ''}`
      }
    });

  } catch (error) {
    console.error('Add keyword error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add keyword' },
      { status: 500 }
    );
  }
}

// GET /api/seo/tracking/add-keyword - Get tracking status
export async function GET(request: NextRequest) {
  try {
    // Get all tracked keywords
    const { data: trackedKeywords, error } = await supabase
      .from('seo_opportunities')
      .select('keyword, ai_advantage_potential, status, created_at')
      .in('status', ['monitoring', 'in_progress', 'implemented'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get AI keyword summary
    const aiKeywordSummary = await rankingTracker.getAIKeywordSummary();

    return NextResponse.json({
      success: true,
      data: {
        totalTracked: trackedKeywords?.length || 0,
        aiKeywords: trackedKeywords?.filter(k => k.ai_advantage_potential).length || 0,
        traditionalKeywords: trackedKeywords?.filter(k => !k.ai_advantage_potential).length || 0,
        recentlyAdded: trackedKeywords?.slice(0, 10) || [],
        aiPerformance: aiKeywordSummary
      }
    });

  } catch (error) {
    console.error('Get tracking status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get tracking status' },
      { status: 500 }
    );
  }
}