import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsData, CampaignPerformance, SEOMetrics } from '@/lib/analytics/types';

// Mock analytics data for demonstration
// In production, this would connect to various analytics APIs
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '24h';

    // Generate mock data based on time range
    const multiplier = timeRange === '1h' ? 0.1 : 
                      timeRange === '24h' ? 1 : 
                      timeRange === '7d' ? 7 : 
                      timeRange === '30d' ? 30 : 90;

    const analyticsData: AnalyticsData = {
      sessions: Math.floor(1000 * multiplier),
      pageViews: Math.floor(3500 * multiplier),
      uniqueVisitors: Math.floor(800 * multiplier),
      bounceRate: 0.42,
      avgSessionDuration: 185, // seconds
      conversionRate: 0.032,
      revenue: Math.floor(250000 * multiplier),
      leads: Math.floor(32 * multiplier),
      topPages: [
        {
          path: '/',
          views: Math.floor(1200 * multiplier),
          avgTimeOnPage: 45,
        },
        {
          path: '/form',
          views: Math.floor(800 * multiplier),
          avgTimeOnPage: 240,
        },
        {
          path: '/tjanster/flytt',
          views: Math.floor(600 * multiplier),
          avgTimeOnPage: 120,
        },
        {
          path: '/om-oss',
          views: Math.floor(400 * multiplier),
          avgTimeOnPage: 90,
        },
        {
          path: '/kontakt',
          views: Math.floor(300 * multiplier),
          avgTimeOnPage: 60,
        },
      ],
      topSources: [
        {
          source: 'google',
          medium: 'organic',
          visitors: Math.floor(350 * multiplier),
          conversions: Math.floor(12 * multiplier),
        },
        {
          source: 'direct',
          medium: 'none',
          visitors: Math.floor(250 * multiplier),
          conversions: Math.floor(8 * multiplier),
        },
        {
          source: 'facebook',
          medium: 'cpc',
          visitors: Math.floor(150 * multiplier),
          conversions: Math.floor(6 * multiplier),
        },
        {
          source: 'hemnet',
          medium: 'referral',
          visitors: Math.floor(100 * multiplier),
          conversions: Math.floor(5 * multiplier),
        },
      ],
      deviceBreakdown: {
        desktop: 0.52,
        mobile: 0.41,
        tablet: 0.07,
      },
      locationBreakdown: [
        {
          city: 'Stockholm',
          visitors: Math.floor(500 * multiplier),
          conversions: Math.floor(20 * multiplier),
        },
        {
          city: 'Solna',
          visitors: Math.floor(120 * multiplier),
          conversions: Math.floor(5 * multiplier),
        },
        {
          city: 'Nacka',
          visitors: Math.floor(80 * multiplier),
          conversions: Math.floor(3 * multiplier),
        },
        {
          city: 'Huddinge',
          visitors: Math.floor(60 * multiplier),
          conversions: Math.floor(2 * multiplier),
        },
        {
          city: 'Täby',
          visitors: Math.floor(40 * multiplier),
          conversions: Math.floor(2 * multiplier),
        },
      ],
    };

    const campaigns: CampaignPerformance[] = [
      {
        campaignId: 'stockholm-winter-2025',
        name: 'Stockholm Vinterflyttning 2025',
        source: 'google',
        medium: 'cpc',
        impressions: Math.floor(50000 * multiplier),
        clicks: Math.floor(1500 * multiplier),
        ctr: 0.03,
        conversions: Math.floor(15 * multiplier),
        conversionRate: 0.01,
        cost: Math.floor(15000 * multiplier),
        revenue: Math.floor(75000 * multiplier),
        roi: 400,
        cpa: 1000,
      },
      {
        campaignId: 'facebook-retargeting',
        name: 'Facebook Retargeting',
        source: 'facebook',
        medium: 'cpc',
        impressions: Math.floor(80000 * multiplier),
        clicks: Math.floor(2400 * multiplier),
        ctr: 0.03,
        conversions: Math.floor(12 * multiplier),
        conversionRate: 0.005,
        cost: Math.floor(8000 * multiplier),
        revenue: Math.floor(48000 * multiplier),
        roi: 500,
        cpa: 667,
      },
      {
        campaignId: 'hemnet-postcards',
        name: 'Hemnet iDraw Vykort',
        source: 'direct-mail',
        medium: 'postcard',
        impressions: Math.floor(2000 * multiplier),
        clicks: Math.floor(150 * multiplier),
        ctr: 0.075,
        conversions: Math.floor(8 * multiplier),
        conversionRate: 0.053,
        cost: Math.floor(6000 * multiplier),
        revenue: Math.floor(40000 * multiplier),
        roi: 567,
        cpa: 750,
      },
    ];

    const seoMetrics: SEOMetrics = {
      organicTraffic: Math.floor(350 * multiplier),
      organicConversions: Math.floor(12 * multiplier),
      topKeywords: [
        {
          keyword: 'flyttfirma stockholm',
          impressions: Math.floor(5000 * multiplier),
          clicks: Math.floor(150 * multiplier),
          position: 3.2,
          ctr: 0.03,
        },
        {
          keyword: 'billig flyttfirma stockholm',
          impressions: Math.floor(3000 * multiplier),
          clicks: Math.floor(120 * multiplier),
          position: 4.5,
          ctr: 0.04,
        },
        {
          keyword: 'flytt stockholm pris',
          impressions: Math.floor(2000 * multiplier),
          clicks: Math.floor(80 * multiplier),
          position: 2.8,
          ctr: 0.04,
        },
        {
          keyword: 'flytthjälp stockholm',
          impressions: Math.floor(1500 * multiplier),
          clicks: Math.floor(60 * multiplier),
          position: 5.1,
          ctr: 0.04,
        },
      ],
      topLandingPages: [
        {
          path: '/',
          impressions: Math.floor(8000 * multiplier),
          clicks: Math.floor(200 * multiplier),
          position: 3.5,
        },
        {
          path: '/tjanster/flytt',
          impressions: Math.floor(5000 * multiplier),
          clicks: Math.floor(150 * multiplier),
          position: 4.2,
        },
        {
          path: '/priser',
          impressions: Math.floor(3000 * multiplier),
          clicks: Math.floor(100 * multiplier),
          position: 3.8,
        },
      ],
      coreWebVitals: {
        lcp: 2.1, // Largest Contentful Paint (seconds)
        fid: 85, // First Input Delay (milliseconds)
        cls: 0.08, // Cumulative Layout Shift
      },
    };

    return NextResponse.json({
      analytics: analyticsData,
      campaigns,
      seo: seoMetrics,
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}