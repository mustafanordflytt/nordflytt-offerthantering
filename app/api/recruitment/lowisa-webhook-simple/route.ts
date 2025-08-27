import { NextResponse } from 'next/server';
import { extractApiKey, handleCorsRequest, withCors } from '@/lib/api-auth-enhanced';

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsRequest(request as any);
  if (corsResponse) return corsResponse;

  try {
    // Check API key (supports both X-API-Key and Bearer token)
    const apiKey = extractApiKey(request as any);
    const validApiKey = process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123';
    
    if (!apiKey || apiKey !== validApiKey) {
      return withCors(NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      ));
    }

    const body = await request.json();
    const { applicationId, message, sender, timestamp } = body;

    // Simple mock response
    const mockResponse = "Tack för ditt meddelande! Jag är Lowisa, rekryteringsassistent på Nordflytt. Kan du berätta lite om din bakgrund?";
    
    // Simple completeness check
    const completeness = {
      isComplete: false,
      completedAreas: 1,
      totalAreas: 4,
      completionRate: 25,
      missing: ["arbetserfarenhet", "tillgänglighet", "svenska"],
      details: {
        körkort: true,
        arbetserfarenhet: false,
        tillgänglighet: false,
        svenska: false
      }
    };

    return withCors(NextResponse.json({
      success: true,
      response: mockResponse,
      completeness,
      applicationId,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('[Lowisa Webhook Simple] Error:', error);
    return withCors(NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}

// Support OPTIONS for CORS preflight
export async function OPTIONS(request: Request) {
  const corsResponse = handleCorsRequest(request as any);
  return corsResponse || new NextResponse(null, { status: 200 });
}