import { NextRequest, NextResponse } from 'next/server';
import { creditsafeClient } from '@/lib/creditsafe/client';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Get client IP address
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');
  return ip || '127.0.0.1';
}

// Start BankID authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personalNumber, action = 'auth' } = body;

    if (action === 'auth') {
      // Personal number is optional for "samma enhet" (same device) authentication

      // Get client IP
      const ipAddress = getClientIp(request);

      // Create session
      const sessionId = uuidv4();

      // Check if we're in development mode without proper credentials
      const isDevelopment = process.env.NODE_ENV === 'development';
      const hasCredentials = process.env.CREDITSAFE_USERNAME && process.env.CREDITSAFE_PASSWORD;
      
      let authResult;
      
      if (isDevelopment && !hasCredentials) {
        // Mock response for development
        console.log('Using mock BankID response for development');
        authResult = {
          orderRef: `mock-${Date.now()}`,
          autoStartToken: `mock-auto-${Date.now()}`,
          qrStartToken: `mock-qr-${Date.now()}`,
          qrStartSecret: `mock-secret-${Date.now()}`,
        };
      } else {
        // Initiate real BankID authentication
        // Om inget personnummer anges, använd "samma enhet" autentisering
        authResult = await creditsafeClient.initiateBankIDAuth({
          personalNumber: personalNumber || undefined, // undefined triggar "samma enhet"
          ipAddress,
        });
      }

      // Store authentication session
      const { error: dbError } = await supabase
        .from('bankid_authentications')
        .insert({
          session_id: sessionId,
          order_ref: authResult.orderRef,
          personal_number: personalNumber || null, // Kan vara null för "samma enhet"
          status: 'pending',
          ip_address: ipAddress,
          user_agent: request.headers.get('user-agent'),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Generate BankID launch URL
      const bankIdUrl = `bankid:///?autostarttoken=${authResult.autoStartToken}&redirect=null`;

      return NextResponse.json({
        success: true,
        sessionId,
        orderRef: authResult.orderRef,
        autoStartToken: authResult.autoStartToken,
        qrStartToken: authResult.qrStartToken,
        qrStartSecret: authResult.qrStartSecret,
        bankIdUrl,
      });
    }

    // Handle status check
    if (action === 'status') {
      const { orderRef } = body;

      if (!orderRef) {
        return NextResponse.json(
          { error: 'Order reference is required' },
          { status: 400 }
        );
      }

      // Check if this is a mock order ref
      let statusResult;
      
      if (orderRef.startsWith('mock-')) {
        // Mock status for development
        console.log('Using mock BankID status for development');
        
        // Simulate authentication flow
        const mockStartTime = parseInt(orderRef.split('-')[1]);
        const elapsedTime = Date.now() - mockStartTime;
        
        if (elapsedTime < 2000) {
          statusResult = {
            status: 'pending',
            hintCode: 'outstandingTransaction',
          };
        } else if (elapsedTime < 5000) {
          statusResult = {
            status: 'pending',
            hintCode: 'userSign',
          };
        } else {
          // Complete after 5 seconds with mock data
          statusResult = {
            status: 'complete',
            completionData: {
              user: {
                personalNumber: '199001011234',
                name: 'Test Testsson',
                givenName: 'Test',
                surname: 'Testsson'
              },
              device: {
                ipAddress: '127.0.0.1'
              },
              signature: 'mock-signature',
              ocspResponse: 'mock-ocsp'
            }
          };
        }
      } else {
        // Check real BankID status
        statusResult = await creditsafeClient.checkBankIDStatus(orderRef);
      }

      // Update authentication record
      if (statusResult.status !== 'pending') {
        const updateData: any = {
          status: statusResult.status,
          hint_code: statusResult.hintCode,
        };

        if (statusResult.status === 'complete' && statusResult.completionData) {
          updateData.completion_data = statusResult.completionData;
          updateData.completed_at = new Date().toISOString();
        }

        await supabase
          .from('bankid_authentications')
          .update(updateData)
          .eq('order_ref', orderRef);
      }

      return NextResponse.json({
        success: true,
        status: statusResult.status,
        hintCode: statusResult.hintCode,
        completionData: statusResult.completionData,
      });
    }

    // Handle cancellation
    if (action === 'cancel') {
      const { orderRef } = body;

      if (!orderRef) {
        return NextResponse.json(
          { error: 'Order reference is required' },
          { status: 400 }
        );
      }

      // Cancel BankID authentication
      await creditsafeClient.cancelBankIDAuth(orderRef);

      // Update database
      await supabase
        .from('bankid_authentications')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('order_ref', orderRef);

      return NextResponse.json({
        success: true,
        message: 'Authentication cancelled',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('BankID error:', error);
    
    // Ge mer detaljerad felinformation
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'response' in error ? (error as any).response : null;
    
    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'BankID authentication failed',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

// Generate QR code for BankID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const qrStartToken = searchParams.get('token');
    const qrStartSecret = searchParams.get('secret');

    if (!qrStartToken || !qrStartSecret) {
      return NextResponse.json(
        { error: 'Missing QR parameters' },
        { status: 400 }
      );
    }

    // Generate QR data
    // In production, this would generate an actual QR code image
    const qrData = `bankid:///?autostarttoken=${qrStartToken}&qrstarttoken=${qrStartToken}&qrstartsecret=${qrStartSecret}`;

    return NextResponse.json({
      success: true,
      qrData,
      // In production, return QR code image URL
      qrImageUrl: `/api/bankid/qr?data=${encodeURIComponent(qrData)}`,
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}