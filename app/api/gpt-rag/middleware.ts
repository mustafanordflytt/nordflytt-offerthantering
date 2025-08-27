import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = parseInt(process.env.GPT_RATE_LIMIT_MAX || '100');

export async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 'anonymous';
  
  const now = Date.now();
  const userLimit = rateLimitMap.get(token);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize
    rateLimitMap.set(token, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return null;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests from Custom GPT. Try again in 15 minutes.',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString()
        }
      }
    );
  }
  
  // Increment count
  userLimit.count++;
  
  return null;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}