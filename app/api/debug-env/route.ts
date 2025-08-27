// app/api/debug-env/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    // SendGrid
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '✅ Loaded' : '❌ Missing',
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || '❌ Missing',
    
    // Twilio
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '✅ Loaded' : '❌ Missing',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '✅ Loaded' : '❌ Missing',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '❌ Missing',
    
    // Base URL
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '❌ Missing',
    
    // Node environment
    NODE_ENV: process.env.NODE_ENV,
    
    // All environment keys (första 3 tecken av varje)
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('SENDGRID') || key.includes('TWILIO') || key.includes('NEXT_PUBLIC')
    ).map(key => `${key}: ${process.env[key]?.substring(0, 3)}...`)
  };

  return NextResponse.json(envVars);
}
