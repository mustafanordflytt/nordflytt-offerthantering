import { NextRequest, NextResponse } from 'next/server';

/**
 * Extracts API key from various header formats
 * Supports both X-API-Key and Authorization Bearer formats
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check X-API-Key header (primary method)
  const xApiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  if (xApiKey) {
    return xApiKey;
  }

  // Check Authorization header with Bearer token
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
  }

  return null;
}

/**
 * Enhanced API key validation supporting multiple header formats
 */
export function validateApiKeyEnhanced(request: NextRequest): boolean {
  const apiKey = extractApiKey(request);
  const validApiKey = process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123';
  
  return apiKey === validApiKey;
}

/**
 * CORS configuration for OpenAI GPT and other external services
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, use specific origins
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Production CORS configuration (more restrictive)
 */
export const productionCorsHeaders = {
  'Access-Control-Allow-Origin': 'https://chat.openai.com',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsRequest(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const headers = process.env.NODE_ENV === 'production' 
      ? productionCorsHeaders 
      : corsHeaders;
      
    return new NextResponse(null, { 
      status: 200, 
      headers 
    });
  }
  return null;
}

/**
 * Add CORS headers to response
 */
export function withCors(response: NextResponse): NextResponse {
  const headers = process.env.NODE_ENV === 'production' 
    ? productionCorsHeaders 
    : corsHeaders;
    
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Enhanced middleware wrapper with CORS and multiple auth support
 */
export function withApiAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    // Handle CORS preflight
    const corsResponse = handleCorsRequest(request);
    if (corsResponse) {
      return corsResponse;
    }

    // Validate API key
    if (!validateApiKeyEnhanced(request)) {
      const response = NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Invalid or missing API key. Use X-API-Key header or Authorization Bearer token.',
          timestamp: new Date().toISOString()
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="Lowisa API"'
          }
        }
      );
      return withCors(response);
    }
    
    try {
      const result = await handler(request, ...args);
      return withCors(result);
    } catch (error) {
      console.error('[API Error]:', error);
      const response = NextResponse.json(
        { 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
      return withCors(response);
    }
  };
}