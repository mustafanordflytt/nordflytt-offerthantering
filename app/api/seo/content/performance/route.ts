import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/seo/content/performance - Get content metrics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageType = searchParams.get('page_type');
    const aiOptimized = searchParams.get('ai_optimized') === 'true';
    const minRevenue = parseInt(searchParams.get('min_revenue') || '0');

    let query = supabase
      .from('seo_content')
      .select('*')
      .order('revenue_attribution', { ascending: false });

    if (pageType) {
      query = query.eq('page_type', pageType);
    }

    if (aiOptimized) {
      query = query.eq('ai_optimized', true);
    }

    if (minRevenue > 0) {
      query = query.gte('revenue_attribution', minRevenue);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate performance metrics
    const metrics = calculateContentMetrics(data || []);

    return NextResponse.json({ 
      success: true, 
      data,
      metrics
    });

  } catch (error) {
    console.error('Content performance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content performance' },
      { status: 500 }
    );
  }
}

// Calculate content performance metrics
function calculateContentMetrics(data: any[]) {
  const metrics = {
    totalPages: data.length,
    aiOptimizedPages: data.filter(p => p.ai_optimized).length,
    totalRevenue: data.reduce((sum, p) => sum + (p.revenue_attribution || 0), 0),
    totalClicks: data.reduce((sum, p) => sum + (p.organic_clicks || 0), 0),
    totalImpressions: data.reduce((sum, p) => sum + (p.organic_impressions || 0), 0),
    averageCTR: 0,
    averagePosition: 0,
    topPerformers: [],
    needsOptimization: [],
    byPageType: {} as Record<string, any>
  };

  // Calculate averages
  const pagesWithData = data.filter(p => p.organic_impressions > 0);
  if (pagesWithData.length > 0) {
    metrics.averageCTR = pagesWithData.reduce((sum, p) => sum + (p.ctr_percentage || 0), 0) / pagesWithData.length;
    metrics.averagePosition = pagesWithData.reduce((sum, p) => sum + (p.average_position || 0), 0) / pagesWithData.length;
  }

  // Identify top performers
  metrics.topPerformers = data
    .filter(p => p.revenue_attribution > 0)
    .sort((a, b) => b.revenue_attribution - a.revenue_attribution)
    .slice(0, 10)
    .map(p => ({
      url: p.page_url,
      revenue: p.revenue_attribution,
      clicks: p.organic_clicks,
      conversionRate: p.conversion_rate,
      aiOptimized: p.ai_optimized
    }));

  // Identify pages needing optimization
  metrics.needsOptimization = data
    .filter(p => {
      // Low CTR (< 2%)
      if (p.ctr_percentage < 2 && p.organic_impressions > 100) return true;
      // High position but low clicks
      if (p.average_position <= 10 && p.organic_clicks < 10 && p.organic_impressions > 100) return true;
      // Low optimization score
      if (p.optimization_score < 50) return true;
      return false;
    })
    .slice(0, 10)
    .map(p => ({
      url: p.page_url,
      issue: p.ctr_percentage < 2 ? 'low_ctr' : p.optimization_score < 50 ? 'low_optimization' : 'low_clicks',
      currentCTR: p.ctr_percentage,
      position: p.average_position,
      optimizationScore: p.optimization_score
    }));

  // Group by page type
  const pageTypes = ['landing', 'blog', 'service', 'area', 'tool'];
  pageTypes.forEach(type => {
    const typePages = data.filter(p => p.page_type === type);
    metrics.byPageType[type] = {
      count: typePages.length,
      revenue: typePages.reduce((sum, p) => sum + (p.revenue_attribution || 0), 0),
      clicks: typePages.reduce((sum, p) => sum + (p.organic_clicks || 0), 0),
      avgCTR: typePages.length > 0 
        ? typePages.reduce((sum, p) => sum + (p.ctr_percentage || 0), 0) / typePages.length 
        : 0
    };
  });

  return metrics;
}

// POST /api/seo/content/performance - Update content performance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page_url, metrics } = body;

    if (!page_url || !metrics) {
      return NextResponse.json(
        { success: false, error: 'Page URL and metrics required' },
        { status: 400 }
      );
    }

    // Update content performance metrics
    const { data, error } = await supabase
      .from('seo_content')
      .upsert({
        page_url,
        ...metrics,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'page_url'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data
    });

  } catch (error) {
    console.error('Content performance POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update content performance' },
      { status: 500 }
    );
  }
}