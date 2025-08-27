import { NextRequest, NextResponse } from 'next/server';
import { crmIntegration } from '@/lib/ai/crm-integration';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Initialize AI integration
    await crmIntegration.initialize();
    
    // Get enhanced customer data
    const result = await crmIntegration.enhanceCustomerData(params.id);
    
    // Return AI insights
    return NextResponse.json({
      leadScore: result.aiInsights.leadScore.score,
      leadConfidence: result.aiInsights.leadScore.confidence,
      lifetimeValue: result.aiInsights.clvPrediction.predictedCLV,
      churnRisk: Math.round(result.aiInsights.churnRisk.churnProbability * 100),
      nextLikelyService: result.aiInsights.personalization.recommendations.nextService,
      recommendations: result.aiInsights.leadScore.recommendations,
      segment: result.aiInsights.leadScore.segment,
      priority: result.aiInsights.leadScore.priority
    });
    
  } catch (error) {
    console.error('Error getting customer intelligence:', error);
    return NextResponse.json(
      { error: 'Failed to get customer intelligence' },
      { status: 500 }
    );
  }
}