import { NextRequest, NextResponse } from 'next/server';
import { crmIntegration } from '@/lib/ai/crm-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, serviceType = 'moving', requirements } = body;
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize AI integration
    await crmIntegration.initialize();
    
    // Create AI-optimized job
    const result = await crmIntegration.createOptimizedJob({
      customerId,
      serviceType,
      requirements: requirements || {}
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error creating AI job:', error);
    return NextResponse.json(
      { error: 'Failed to create AI-optimized job' },
      { status: 500 }
    );
  }
}