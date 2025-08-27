import { NextRequest, NextResponse } from 'next/server';

// Enhanced metrics API endpoint
export async function GET(request: NextRequest) {
  try {
    // In production, these would come from your database
    // For now, returning realistic demo data
    
    const enhancedMetrics = {
      aiPerformance: {
        conversations: {
          today: 47,
          growth: 23,
          total: 1247
        },
        emailAutomation: 94,
        ticketsCreated: 12,
        aiConversion: 73,
        avgResponseTime: "24 seconds",
        customerSatisfaction: 4.7
      },
      
      financialDetails: {
        paidThisMonth: "2,722,000",
        outstanding: "125,000",
        overdue: "23,000",
        rutSavings: "340,000",
        avgJobValue: 18500,
        paymentTermCompliance: 89,
        invoiceCount: {
          total: 147,
          paid: 139,
          pending: 8,
          overdue: 2
        }
      },
      
      operations: {
        team: {
          available: 5,
          busy: 3,
          efficiency: 87,
          todayJobs: 12,
          completedJobs: 8
        },
        jobMetrics: {
          avgDuration: "3.2h",
          aiEstimated: "3.1h",
          accuracy: 97,
          onTimeRate: 94
        }
      },
      
      systemStatus: {
        overall: 'operational', // operational, warning, critical
        services: {
          api: 'operational',
          database: 'operational',
          ai: 'operational',
          payments: 'warning'
        },
        lastUpdated: new Date().toISOString()
      },
      
      realtimeStats: {
        activeChats: 3,
        queuedChats: 1,
        avgWaitTime: "45 seconds",
        staffOnline: 8,
        vehiclesActive: 4
      }
    };
    
    return NextResponse.json({
      success: true,
      data: enhancedMetrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Enhanced metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enhanced metrics' },
      { status: 500 }
    );
  }
}