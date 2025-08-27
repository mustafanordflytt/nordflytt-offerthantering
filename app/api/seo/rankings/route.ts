import { NextRequest, NextResponse } from 'next/server';
import { rankingTracker } from '@/lib/seo/ranking-tracker';
import { supabase } from '@/lib/supabase';

// GET /api/seo/rankings - Get current keyword positions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');
    const days = parseInt(searchParams.get('days') || '30');
    const aiOnly = searchParams.get('ai_only') === 'true';

    if (keyword) {
      // Get ranking history for specific keyword
      const history = await rankingTracker.getRankingHistory(keyword, days);
      return NextResponse.json({ success: true, data: history });
    }

    // Get all current rankings
    let query = supabase
      .from('seo_rankings')
      .select('*')
      .eq('domain', 'nordflytt.se')
      .order('date_tracked', { ascending: false });

    if (aiOnly) {
      query = query.eq('ai_advantage', true);
    }

    // Get latest ranking for each keyword
    const { data: allRankings, error } = await query;

    if (error) throw error;

    // Group by keyword and get latest
    const latestRankings = new Map();
    allRankings?.forEach(ranking => {
      if (!latestRankings.has(ranking.keyword) || 
          new Date(ranking.date_tracked) > new Date(latestRankings.get(ranking.keyword).date_tracked)) {
        latestRankings.set(ranking.keyword, ranking);
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: Array.from(latestRankings.values()),
      summary: {
        total: latestRankings.size,
        top3: Array.from(latestRankings.values()).filter(r => r.position && r.position <= 3).length,
        top10: Array.from(latestRankings.values()).filter(r => r.position && r.position <= 10).length,
        notRanking: Array.from(latestRankings.values()).filter(r => !r.position || r.position > 100).length
      }
    });

  } catch (error) {
    console.error('Rankings API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}

// POST /api/seo/rankings - Trigger manual ranking check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords } = body;

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { success: false, error: 'Keywords array required' },
        { status: 400 }
      );
    }

    // Add keywords and check rankings
    const results = await Promise.all(
      keywords.map(keyword => rankingTracker.addKeyword(keyword))
    );

    return NextResponse.json({ 
      success: true, 
      message: `Started tracking ${keywords.length} keywords`,
      results 
    });

  } catch (error) {
    console.error('Rankings POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add keywords' },
      { status: 500 }
    );
  }
}