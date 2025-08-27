import { NextRequest, NextResponse } from 'next/server';

// Mock PPC Dashboard Data
interface DashboardData {
  profit: {
    today: number;
    trend: string;
    forecast: number;
    status: 'SAFE' | 'WARNING' | 'CRITICAL';
  };
  roas: {
    overall: number;
    google: number;
    meta: number;
    bing: number;
    linkedin: number;
  };
  fraudProtection: {
    moneySaved: number;
    threatsBlocked: number;
    competitorsBlocked: string[];
  };
  aiSuggestions: Array<{
    id: number;
    text: string;
    impact: string;
    confidence: string;
    action: string;
    platform?: string;
    evidence?: string;
  }>;
  adCreationData: {
    newAdsToday: number;
    activeTests: number;
    winnersIdentified: number;
    competitorAdsAnalyzed: number;
    newInsightsApplied: number;
  };
  expertLearningData: {
    platformUpdatesProcessed: number;
    communityInsightsGathered: number;
    newStrategiesImplemented: number;
    competitorIntelUpdated: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Simulate real-time data variations
    const baseProfit = 69150;
    const variation = Math.random() * 0.1 - 0.05; // ±5% variation
    const todayProfit = Math.round(baseProfit * (1 + variation));
    
    // Calculate trend based on time of day
    const hour = new Date().getHours();
    const trendValue = hour > 12 ? '+23' : '+18';
    
    // Determine status based on various factors
    const status = todayProfit > 70000 ? 'SAFE' : 
                   todayProfit > 50000 ? 'WARNING' : 'CRITICAL';

    const dashboardData: DashboardData = {
      profit: {
        today: todayProfit,
        trend: `${trendValue}%`,
        forecast: 156000,
        status: status
      },
      roas: {
        overall: 3.78,
        google: 4.2 + (Math.random() * 0.4 - 0.2),
        meta: 2.8 + (Math.random() * 0.3 - 0.15),
        bing: 5.1,
        linkedin: 3.4
      },
      fraudProtection: {
        moneySaved: Math.round(1245 + Math.random() * 500),
        threatsBlocked: Math.floor(3 + Math.random() * 5),
        competitorsBlocked: ['MovingStockholm', 'StockholmMove']
      },
      aiSuggestions: [
        {
          id: 1,
          text: 'Öka Google budget +15k för +28k profit',
          impact: '+28k profit',
          confidence: '94%',
          action: 'budget_increase',
          platform: 'google'
        },
        {
          id: 2,
          text: 'Blockera MovingStockholm IP (sparar 2k/dag)',
          impact: '2k/dag sparat',
          confidence: '99%',
          action: 'fraud_protection',
          evidence: '15_suspicious_clicks_detected'
        }
      ],
      adCreationData: {
        newAdsToday: 5,
        activeTests: 12,
        winnersIdentified: 3,
        competitorAdsAnalyzed: 47,
        newInsightsApplied: 4
      },
      expertLearningData: {
        platformUpdatesProcessed: 3,
        communityInsightsGathered: 12,
        newStrategiesImplemented: 8,
        competitorIntelUpdated: 6
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching PPC dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// Execute AI suggestion
export async function POST(request: NextRequest) {
  try {
    const { suggestionId, action } = await request.json();

    // Simulate executing the AI suggestion
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully executed ${action}`,
      impact: {
        immediateEffect: 'Campaign optimization in progress',
        expectedResult: 'Results visible within 24-48 hours'
      }
    });
  } catch (error) {
    console.error('Error executing AI suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to execute suggestion' },
      { status: 500 }
    );
  }
}