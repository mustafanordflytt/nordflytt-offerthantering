import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

// Enhanced Secure Booking Modifier with Grok's improvements
export async function POST(request: NextRequest) {
  try {
    const { customerId, action, verificationCode, verificationId } = await request.json();
    
    if (!customerId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle different verification actions
    switch (action) {
      case 'initiate':
        return await initiateVerification(customerId);
      
      case 'verify':
        return await verifyCode(customerId, verificationCode, verificationId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error: any) {
    console.error('In-chat verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

async function initiateVerification(customerId: string) {
  // Generate OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  if (!supabase) {
    // Mock response for demo
    return NextResponse.json({
      success: true,
      verificationId,
      message: `🔐 För att säkert ändra din bokning, ange denna kod: **${otpCode}** (giltig 5 min)`,
      code: otpCode, // Only for demo - remove in production
      requiresVerification: true,
      nextStep: 'await_verification'
    });
  }
  
  // Store OTP in database
  const { error } = await supabase
    .from('verification_codes')
    .insert({
      id: verificationId,
      customer_id: customerId,
      code: otpCode,
      expires_at: expiresAt.toISOString(),
      used: false
    });
  
  if (error) throw error;
  
  return NextResponse.json({
    success: true,
    verificationId,
    message: `🔐 För att säkert ändra din bokning, ange denna kod: **${otpCode}** (giltig 5 min)`,
    requiresVerification: true,
    nextStep: 'await_verification'
  });
}

async function verifyCode(customerId: string, code: string, verificationId: string) {
  if (!code || !verificationId) {
    return NextResponse.json({
      success: false,
      message: '❌ Ogiltig kod. Försök igen eller kontakta support.',
      error: 'Missing verification data'
    });
  }
  
  if (!supabase) {
    // Mock verification for demo
    const isValid = code === '123456'; // Demo code
    
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: '✅ Verifiering lyckades! Du kan nu göra ändringar.',
        verified: true,
        customerId
      });
    }
    
    return NextResponse.json({
      success: false,
      message: '❌ Ogiltig kod. Försök igen eller kontakta support.'
    });
  }
  
  // Verify code in database
  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('id', verificationId)
    .eq('customer_id', customerId)
    .eq('code', code)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) {
    return NextResponse.json({
      success: false,
      message: '❌ Ogiltig kod. Försök igen eller kontakta support.'
    });
  }
  
  // Mark code as used
  await supabase
    .from('verification_codes')
    .update({ used: true })
    .eq('id', verificationId);
  
  return NextResponse.json({
    success: true,
    message: '✅ Verifiering lyckades! Du kan nu göra ändringar.',
    verified: true,
    customerId
  });
}