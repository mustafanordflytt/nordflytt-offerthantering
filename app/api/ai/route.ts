import { NextRequest, NextResponse } from 'next/server';
import { aiSystem } from '@/lib/ai';

// Initialize AI system on first request
let aiInitialized = false;

async function ensureAIInitialized() {
  if (!aiInitialized) {
    try {
      await aiSystem.initialize();
      aiInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI system:', error);
      throw error;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureAIInitialized();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json(aiSystem.getStatus());
      
      case 'business-intelligence':
        const intelligence = await aiSystem.getBusinessIntelligence();
        return NextResponse.json(intelligence);
      
      default:
        return NextResponse.json({ 
          message: 'AI System Operational',
          status: aiSystem.getStatus() 
        });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'AI system error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAIInitialized();
    
    const body = await request.json();
    const { type, action, data } = body;

    switch (type) {
      case 'recommendation':
        const recommendations = await aiSystem.getRecommendations({
          type: action,
          data
        });
        return NextResponse.json(recommendations);
      
      case 'workflow':
        const result = await aiSystem.triggerWorkflow(action, data);
        return NextResponse.json(result);
      
      case 'notification':
        await aiSystem.sendNotification(data.to, data.message, data.channel);
        return NextResponse.json({ success: true });
      
      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'AI processing error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}