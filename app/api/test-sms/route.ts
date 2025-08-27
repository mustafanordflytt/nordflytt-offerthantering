import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function GET() {
  try {
    console.log('[TEST-SMS] Initierar SMS-test...');
    
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log('[TEST-SMS] Twilio-klient skapad');
    console.log('[TEST-SMS] Använder Messaging Service:', process.env.TWILIO_MESSAGING_SERVICE_SID);

    const message = await client.messages.create({
      body: 'Detta är ett test-SMS från Nordflytt bokningssystem.',
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: '+46723683967'
    });

    console.log('[TEST-SMS] SMS skickat framgångsrikt. Message SID:', message.sid);
    
    return NextResponse.json({ 
      success: true, 
      messageId: message.sid 
    });
  } catch (error: any) {
    console.error('[TEST-SMS] Fel vid SMS-test:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 