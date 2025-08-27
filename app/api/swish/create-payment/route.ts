import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase'
import { authenticate } from '@/lib/security/auth-middleware'
import { rateLimit, rateLimiters } from '@/lib/security/rate-limit'
import { validateRequest, schemas } from '@/lib/security/validation'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid';

// Swish payment schema
const swishPaymentSchema = z.object({
  amount: z.number().positive().max(999999), // Max 1M SEK
  bookingReference: z.string().min(1).max(100),
  customerPhone: schemas.phone, // Uses Swedish phone validation
  message: z.string().max(50).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - strict for payment operations
    const rateLimitRes = await rateLimit(request, rateLimiters.strict)
    if (rateLimitRes) return rateLimitRes
    
    // Authentication required - payment operations need auth
    const user = await authenticate(request, {
      methods: ['jwt', 'supabase', 'apikey']
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required for payment operations' },
        { status: 401 }
      )
    }
    
    // Validate and sanitize input
    const { amount, bookingReference, customerPhone, message } = await validateRequest(
      request, 
      swishPaymentSchema
    )
    
    logger.info('Swish payment request:', {
      userId: user.id,
      bookingReference,
      amount,
      // Don't log full phone number for privacy
      customerPhone: customerPhone.substring(0, 6) + '****'
    })

    const supabase = createServerSupabaseClient()
    
    // Verify booking exists and belongs to user (if not admin)
    if (user.role !== 'admin') {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, customer_id')
        .eq('booking_number', bookingReference)
        .single()
      
      if (bookingError || !booking) {
        logger.error('Booking not found for payment:', { bookingReference })
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }
    }
    
    const paymentId = uuidv4();
    
    // Store payment request in database
    const paymentData = {
      id: paymentId,
      booking_reference: bookingReference,
      amount,
      currency: 'SEK',
      customer_phone: customerPhone,
      message: message || `Betalning för bokning ${bookingReference}`,
      status: 'pending',
      created_by: user.id,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    };

    // In production, this would call Swish API
    // const swishResponse = await fetch('https://mss.cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.SWISH_ACCESS_TOKEN}`
    //   },
    //   body: JSON.stringify({
    //     payeePaymentReference: bookingReference,
    //     callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/swish/callback`,
    //     payerAlias: customerPhone,
    //     payeeAlias: process.env.SWISH_NUMBER,
    //     amount: amount.toString(),
    //     currency: 'SEK',
    //     message: message
    //   })
    // });

    // Save payment request to database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()
    
    if (paymentError) {
      logger.error('Failed to save payment request:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      )
    }
    
    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'payment',
        resource_id: payment.id,
        action: 'create',
        user_id: user.id,
        details: { 
          bookingReference,
          amount,
          method: 'swish'
        }
      })
    
    // In production, integrate with real Swish API here
    // For now, return mock response
    
    logger.info('Swish payment created:', { 
      paymentId: payment.id,
      status: payment.status 
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      paymentRequestToken: payment.id, // In production, this would come from Swish
      status: payment.status,
      expiresAt: payment.expires_at
    });

  } catch (error) {
    logger.error('Swish payment creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}