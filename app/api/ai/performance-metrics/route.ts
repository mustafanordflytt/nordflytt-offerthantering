import { NextRequest, NextResponse } from 'next/server';
import { crmIntegration } from '@/lib/ai/crm-integration';

export async function GET(request: NextRequest) {
  try {
    // Initialize AI integration
    await crmIntegration.initialize();
    
    // Get AI performance metrics
    const metrics = await crmIntegration.getPerformanceMetrics();
    
    return NextResponse.json(metrics);
    
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    );
  }
}