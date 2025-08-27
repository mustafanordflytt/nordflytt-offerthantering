import { NextResponse } from 'next/server';
import { AuthLevel } from '@/lib/api-auth';

export const authLevel = AuthLevel.PUBLIC;

export async function GET() {
  const envStatus = {
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    googleMaps: {
      apiKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    sendgrid: {
      apiKey: !!process.env.SENDGRID_API_KEY,
      fromEmail: !!process.env.SENDGRID_FROM_EMAIL,
    },
    twilio: {
      accountSid: !!process.env.TWILIO_ACCOUNT_SID,
      authToken: !!process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    },
    security: {
      internalApiKey: !!process.env.INTERNAL_API_KEY,
      encryptionKey: !!process.env.ENCRYPTION_KEY,
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      nodeEnv: process.env.NODE_ENV,
      authBypass: process.env.AUTH_BYPASS,
    }
  };

  return NextResponse.json({
    status: 'Environment check complete',
    configured: envStatus,
    summary: {
      supabase: Object.values(envStatus.supabase).every(v => v),
      googleMaps: envStatus.googleMaps.apiKey,
      email: envStatus.sendgrid.apiKey && envStatus.sendgrid.fromEmail,
      sms: envStatus.twilio.accountSid && envStatus.twilio.authToken && envStatus.twilio.phoneNumber,
      security: envStatus.security.internalApiKey && envStatus.security.encryptionKey,
    }
  });
}