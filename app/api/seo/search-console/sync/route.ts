import { NextRequest, NextResponse } from 'next/server';
import { googleSearchConsole } from '@/lib/seo/google-search-console';

// POST /api/seo/search-console/sync - Sync data from Google Search Console
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      days = 30,
      syncType = 'all' // 'all', 'keywords', 'pages', 'ai_keywords'
    } = body;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dateFormat = (date: Date) => date.toISOString().split('T')[0];

    let results: any = {
      success: true,
      synced: {}
    };

    // Sync based on type
    if (syncType === 'all' || syncType === 'keywords') {
      const keywordData = await googleSearchConsole.getKeywordPerformance(
        dateFormat(startDate),
        dateFormat(endDate)
      );
      results.synced.keywords = keywordData.length;
    }

    if (syncType === 'all' || syncType === 'pages') {
      const pageData = await googleSearchConsole.getPagePerformance(
        dateFormat(startDate),
        dateFormat(endDate)
      );
      results.synced.pages = pageData.length;
    }

    if (syncType === 'all' || syncType === 'ai_keywords') {
      const aiKeywordData = await googleSearchConsole.getAIKeywordPerformance(
        dateFormat(startDate),
        dateFormat(endDate)
      );
      results.synced.aiKeywords = aiKeywordData.length;
    }

    // Get performance comparison
    const comparison = await googleSearchConsole.getPerformanceComparison(days);
    results.comparison = comparison;

    return NextResponse.json(results);

  } catch (error) {
    console.error('Search Console sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync Search Console data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/seo/search-console/sync - Get sync status
export async function GET(request: NextRequest) {
  try {
    // Check if Google Search Console is configured
    const isConfigured = !!(
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID &&
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
    );

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Google Search Console not configured. Add API credentials to environment variables.',
        authUrl: googleSearchConsole.getAuthUrl()
      });
    }

    // Try to get recent data to verify connection
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      await googleSearchConsole.getSearchAnalytics({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        rowLimit: 1
      });

      return NextResponse.json({
        success: true,
        configured: true,
        connected: true,
        message: 'Google Search Console is connected and working'
      });

    } catch (apiError) {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: false,
        message: 'Google Search Console configured but not authenticated',
        authUrl: googleSearchConsole.getAuthUrl()
      });
    }

  } catch (error) {
    console.error('Search Console status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check Search Console status' },
      { status: 500 }
    );
  }
}