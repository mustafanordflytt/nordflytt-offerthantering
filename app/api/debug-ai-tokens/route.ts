// Debug endpoint för att se AI-relaterade tokens på servern
// VARNING: Ta bort denna fil innan produktion!

import { NextResponse } from 'next/server';

export async function GET() {
  // Kontrollera alla AI-relaterade miljövariabler
  const aiTokens = {
    // Nordflytt GPT tokens
    NORDFLYTT_GPT_API_KEY: process.env.NORDFLYTT_GPT_API_KEY 
      ? `${process.env.NORDFLYTT_GPT_API_KEY.substring(0, 10)}...${process.env.NORDFLYTT_GPT_API_KEY.slice(-4)}`
      : '❌ Missing',
    
    // AI Service tokens
    AI_SERVICE_API_KEY: process.env.AI_SERVICE_API_KEY
      ? `${process.env.AI_SERVICE_API_KEY.substring(0, 10)}...${process.env.AI_SERVICE_API_KEY.slice(-4)}`
      : '❌ Missing',
    
    AI_SERVICE_TOKEN: process.env.AI_SERVICE_TOKEN
      ? `${process.env.AI_SERVICE_TOKEN.substring(0, 10)}...${process.env.AI_SERVICE_TOKEN.slice(-4)}`
      : '❌ Missing',
    
    // AI Service URLs
    AI_SERVICE_API_URL: process.env.AI_SERVICE_API_URL || '❌ Missing',
    NEXT_PUBLIC_AI_SERVICE_API_URL: process.env.NEXT_PUBLIC_AI_SERVICE_API_URL || '❌ Missing',
    NEXT_PUBLIC_GPT_RAG_API_URL: process.env.NEXT_PUBLIC_GPT_RAG_API_URL || '❌ Missing',
    
    // OpenAI (om den används)
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
      ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}`
      : '❌ Missing',
    
    // Kontrollera om det finns andra okända AI tokens
    otherAITokens: Object.keys(process.env)
      .filter(key => 
        (key.includes('AI') || key.includes('GPT') || key.includes('BEARER') || key.includes('TOKEN')) &&
        !['NORDFLYTT_GPT_API_KEY', 'AI_SERVICE_API_KEY', 'AI_SERVICE_TOKEN', 'OPENAI_API_KEY'].includes(key)
      )
      .map(key => ({
        key,
        value: process.env[key]?.substring(0, 20) + '...'
      })),
    
    // Server info
    serverInfo: {
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      hasProductionAPI: process.env.USE_PRODUCTION_API === 'true',
      timestamp: new Date().toISOString()
    }
  };

  return NextResponse.json(aiTokens, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}