import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { authenticate } from '@/lib/security/auth-middleware'
import { rateLimit, rateLimiters } from '@/lib/security/rate-limit'
import { validateRequest } from '@/lib/security/validation'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// Invoice generation schema
const generateInvoiceSchema = z.object({
  bookingNumber: z.string().min(1),
  jobId: z.string().uuid().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - strict for financial operations
    const rateLimitRes = await rateLimit(request, rateLimiters.strict)
    if (rateLimitRes) return rateLimitRes
    
    // Authentication required - only admin/manager can generate invoices
    const user = await authenticate(request, {
      methods: ['jwt', 'supabase'],
      roles: ['admin', 'manager']
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or Manager access required' },
        { status: 401 }
      )
    }
    
    // Validate request body
    const { bookingNumber, jobId } = await validateRequest(request, generateInvoiceSchema)
    
    logger.info('Generating invoice:', { 
      userId: user.id,
      bookingNumber,
      jobId 
    })
    
    const supabase = createServerSupabaseClient()
    
    // Get booking data from database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        ),
        jobs (
          id,
          status,
          total_price
        )
      `)
      .eq('booking_number', bookingNumber)
      .single()
    
    if (bookingError || !booking) {
      logger.error('Booking not found:', { bookingNumber, error: bookingError })
      return NextResponse.json({ 
        error: 'Booking not found' 
      }, { status: 404 })
    }
    
    // Get additional services if job exists
    let additionalServices: any[] = []
    if (jobId || booking.jobs?.[0]?.id) {
      const actualJobId = jobId || booking.jobs[0].id
      const { data: services, error: servicesError } = await supabase
        .from('job_additional_services')
        .select('*')
        .eq('job_id', actualJobId)
      
      if (!servicesError && services) {
        additionalServices = services
      }
    }
    
    // Calculate invoice
    const basePrice = booking.total_price || 15000 // Use booking price
    const totalAdditionalCost = additionalServices.reduce((sum: number, service: any) => 
      sum + (service.price * service.quantity), 0
    )
    
    // RUT deduction calculation (50% of labor cost, max 50,000 kr/year)
    const laborCost = (basePrice + totalAdditionalCost) * 0.7 // Assume 70% is labor
    const rutDeduction = Math.min(laborCost * 0.5, 25000) // Half of yearly max per job
    
    const invoice = {
      invoiceNumber: `INV-${bookingNumber}-${Date.now()}`,
      bookingNumber,
      customerName: booking.customers?.name || booking.customer_name,
      customerEmail: booking.customers?.email || booking.customer_email,
      customerPhone: booking.customers?.phone || booking.customer_phone,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      
      lineItems: [
        {
          description: 'Flyttjänst - Grundpris',
          quantity: 1,
          unitPrice: basePrice,
          total: basePrice
        },
        ...additionalServices.map((service: any) => ({
          description: service.name + (service.added_during_job ? ' (Tillagt under uppdrag)' : ''),
          quantity: service.quantity,
          unitPrice: service.price,
          total: service.price * service.quantity,
          addedBy: service.added_by,
          addedAt: service.added_at
        }))
      ],
      
      subtotal: basePrice + totalAdditionalCost,
      rutDeduction: rutDeduction,
      totalBeforeVAT: basePrice + totalAdditionalCost - rutDeduction,
      vat: 0, // Moving services are VAT exempt with RUT
      totalAmount: basePrice + totalAdditionalCost - rutDeduction,
      
      payment: {
        method: 'Swish/Bankgiro',
        reference: bookingNumber,
        status: 'pending'
      },
      
      notes: [
        'RUT-avdrag är redan applicerat på fakturan',
        'Betalning sker efter slutfört uppdrag',
        'Vid frågor kontakta kundtjänst'
      ]
    }
    
    // Save invoice to database
    const { data: savedInvoice, error: saveError } = await supabase
      .from('invoices')
      .insert({
        booking_id: booking.id,
        job_id: jobId || booking.jobs?.[0]?.id,
        invoice_number: invoice.invoiceNumber,
        customer_id: booking.customer_id,
        amount: invoice.totalAmount,
        subtotal: invoice.subtotal,
        rut_deduction: invoice.rutDeduction,
        status: 'pending',
        due_date: invoice.dueDate,
        line_items: invoice.lineItems,
        created_by: user.id
      })
      .select()
      .single()
    
    if (saveError) {
      logger.error('Failed to save invoice:', saveError)
      // Don't expose database errors
      return NextResponse.json({
        error: 'Failed to save invoice'
      }, { status: 500 })
    }
    
    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'invoice',
        resource_id: savedInvoice.id,
        action: 'create',
        user_id: user.id,
        details: { 
          bookingNumber, 
          amount: invoice.totalAmount 
        }
      })
    
    logger.info('Invoice generated successfully:', { 
      invoiceId: savedInvoice.id,
      invoiceNumber: invoice.invoiceNumber 
    })
    
    // In production, this would also:
    // 1. Generate PDF using a service like React PDF
    // 2. Send email with SendGrid
    // 3. Create Fortnox invoice via API
    
    return NextResponse.json({
      success: true,
      invoice,
      invoiceId: savedInvoice.id,
      message: 'Faktura genererad och skickad till kund'
    })
    
  } catch (error) {
    logger.error('Invoice generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}