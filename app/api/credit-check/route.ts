import { NextRequest, NextResponse } from 'next/server';
import { creditsafeClient, CreditsafeClient } from '@/lib/creditsafe/client';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { 
  authenticateAPI, 
  AuthLevel, 
  apiError, 
  apiResponse, 
  validateInput,
  logAPIAccess 
} from '@/lib/api-auth';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Hash function for personal numbers
function hashPersonalNumber(personalNumber: string): string {
  return crypto
    .createHash('sha256')
    .update(personalNumber + process.env.PERSONAL_NUMBER_SALT || 'nordflytt-salt-2025')
    .digest('hex');
}

// Get client IP address
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');
  return ip || '127.0.0.1';
}

// Input validation schema
const creditCheckSchema = {
  personalNumber: {
    type: 'string' as const,
    required: true,
    pattern: /^(\d{10}|\d{12}|\d{6}-\d{4}|\d{8}-\d{4})$/
  },
  customerId: {
    type: 'string' as const,
    required: false,
    pattern: /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i
  },
  sessionId: {
    type: 'string' as const,
    required: false
  },
  checkType: {
    type: 'string' as const,
    required: false,
    enum: ['standard', 'enhanced', 'business']
  }
}

export async function POST(request: NextRequest) {
  // Authenticate - public endpoint but with rate limiting
  const auth = await authenticateAPI(request, AuthLevel.PUBLIC)
  if (!auth.authorized) {
    return auth.response!
  }
  
  let response: NextResponse
  
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateInput(body, creditCheckSchema)
    if (!validation.valid) {
      return apiError(`Invalid input: ${validation.errors.join(', ')}`, 400, 'VALIDATION_ERROR')
    }
    const { 
      personalNumber, 
      customerId,
      sessionId,
      checkType = 'standard'
    } = body;

    // Validate input
    if (!personalNumber) {
      return NextResponse.json(
        { error: 'Personal number is required' },
        { status: 400 }
      );
    }

    // Format and validate personal number
    const formattedPN = CreditsafeClient.formatPersonalNumber(personalNumber);
    if (!CreditsafeClient.validatePersonalNumber(formattedPN)) {
      return NextResponse.json(
        { error: 'Invalid personal number format' },
        { status: 400 }
      );
    }

    // Hash personal number for storage
    const pnHash = hashPersonalNumber(formattedPN);

    // Check if we have a recent valid credit check
    const { data: existingCheck } = await supabase
      .from('credit_checks')
      .select('*')
      .eq('personal_number_hash', pnHash)
      .eq('status', 'approved')
      .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (existingCheck) {
      return NextResponse.json({
        success: true,
        checkId: existingCheck.id,
        status: 'approved',
        cached: true,
        creditLimit: existingCheck.credit_limit,
        riskScore: existingCheck.risk_score,
      });
    }

    // Get client IP for security
    const ipAddress = getClientIp(request);

    // Create credit check record
    const { data: checkRecord, error: dbError } = await supabase
      .from('credit_checks')
      .insert({
        customer_id: customerId || null,
        personal_number: formattedPN,
        personal_number_hash: pnHash,
        check_type: checkType,
        status: 'pending',
        ip_address: ipAddress,
        user_agent: request.headers.get('user-agent'),
        created_by: sessionId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create credit check record' },
        { status: 500 }
      );
    }

    // Perform credit check with Creditsafe
    const creditCheckResult = await creditsafeClient.performCreditCheck({
      personalNumber: formattedPN,
      ipAddress,
    });

    // Update credit check record with results
    const { error: updateError } = await supabase
      .from('credit_checks')
      .update({
        status: creditCheckResult.status,
        risk_score: creditCheckResult.riskScore,
        credit_limit: creditCheckResult.creditLimit,
        reject_code: creditCheckResult.rejectCode,
        reject_reason: creditCheckResult.rejectReason,
        requires_deposit: creditCheckResult.requiresDeposit,
        deposit_amount: creditCheckResult.depositAmount,
        raw_response: creditCheckResult.rawResponse,
        completed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .eq('id', checkRecord.id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Prepare response data
    const responseData = {
      success: true,
      checkId: checkRecord.id,
      status: creditCheckResult.status,
      riskScore: creditCheckResult.riskScore,
      creditLimit: creditCheckResult.creditLimit,
    };

    // Add rejection details if rejected
    if (creditCheckResult.status === 'rejected') {
      Object.assign(responseData, {
        rejectCode: creditCheckResult.rejectCode,
        rejectReason: creditCheckResult.rejectReason,
        requiresDeposit: creditCheckResult.requiresDeposit,
        depositAmount: creditCheckResult.depositAmount,
        alternativePaymentOptions: getAlternativePaymentOptions(creditCheckResult.rejectCode),
      });
    }

    response = apiResponse(responseData);
    
    // Log API access
    logAPIAccess(request, response)
    return response
  } catch (error) {
    console.error('Credit check error:', error);
    response = apiError(
      'Internal server error',
      500,
      'CREDIT_CHECK_ERROR'
    )
    
    // Log API access even on error
    logAPIAccess(request, response)
    return response
  }
}

// Get alternative payment options based on reject code
function getAlternativePaymentOptions(rejectCode?: string) {
  // For all rejected customers, only offer Swish prepayment
  return [{
    type: 'swish',
    description: 'Betala hela beloppet i förväg med Swish',
  }];
  
  // Legacy code kept for reference
  /*
  if (!rejectCode) return [];

  const options = [];

  switch (rejectCode) {
    case 'REJECT_1': // Payment remarks
    case 'REJECT_2': // High debt
    case 'REJECT_3': // Previous payment problems
      options.push({
        type: 'deposit',
        amount: 5000,
        description: 'Deposition krävs för bokning',
      });
      options.push({
        type: 'direct_payment',
        description: 'Direktbetalning med kort eller Swish',
      });
      break;
    
    case 'REJECT_4': // Insufficient credit history
      options.push({
        type: 'guarantor',
        description: 'Borgensman krävs',
      });
      options.push({
        type: 'deposit',
        amount: 3000,
        description: 'Deposition krävs för bokning',
      });
      break;
    
    case 'REJECT_5': // Security risk
      options.push({
        type: 'prepayment',
        description: 'Förskottsbetalning krävs',
      });
      break;
    
    default:
      options.push({
        type: 'contact',
        description: 'Kontakta kundtjänst för alternativa betalningsmetoder',
      });
  }

  return options;
  */
}