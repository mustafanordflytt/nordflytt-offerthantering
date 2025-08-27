import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('financial:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(
          id,
          customer_name,
          customer_email,
          customer_phone,
          customer_type
        ),
        job:jobs(
          id,
          job_id,
          from_address,
          to_address,
          scheduled_date
        ),
        payments:invoice_payments(
          id,
          amount,
          payment_date,
          status,
          payment_method:payment_methods(name)
        ),
        line_items:invoice_line_items(
          id,
          description,
          quantity,
          unit_price,
          total_amount,
          rut_eligible
        )
      `, { count: 'exact' })
      .order('invoice_date', { ascending: false })
      .order('invoice_number', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    if (startDate) {
      query = query.gte('invoice_date', startDate)
    }

    if (endDate) {
      query = query.lte('invoice_date', endDate)
    }

    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,reference.ilike.%${search}%`)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: invoices, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch invoices')
    }

    // Transform invoices for frontend (convert amounts from minor units)
    const transformedInvoices = (invoices || []).map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerId: invoice.customer_id,
      customer: invoice.customer,
      jobId: invoice.job_id,
      job: invoice.job,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      status: invoice.status,
      // Convert amounts from minor units to major units
      subtotalAmount: invoice.subtotal_amount / 100,
      vatAmount: invoice.vat_amount / 100,
      rutDeductionAmount: invoice.rut_deduction_amount / 100,
      discountAmount: invoice.discount_amount / 100,
      totalAmount: invoice.total_amount / 100,
      paidAmount: invoice.paid_amount / 100,
      // RUT fields
      rutEligible: invoice.rut_eligible,
      rutHours: invoice.rut_hours,
      // External integrations
      fortnoxId: invoice.fortnox_id,
      fortnoxStatus: invoice.fortnox_status,
      fortnoxSyncedAt: invoice.fortnox_synced_at,
      // AI fields
      autoCreated: invoice.auto_created,
      aiReviewScore: invoice.ai_review_score,
      aiApproved: invoice.ai_approved,
      // Other fields
      paymentTerms: invoice.payment_terms,
      reference: invoice.reference,
      notes: invoice.notes,
      sentAt: invoice.sent_at,
      paidAt: invoice.paid_at,
      // Related data
      payments: (invoice.payments || []).map((p: any) => ({
        id: p.id,
        amount: p.amount / 100,
        paymentDate: p.payment_date,
        status: p.status,
        method: p.payment_method?.name
      })),
      lineItems: (invoice.line_items || []).map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price / 100,
        totalAmount: item.total_amount / 100,
        rutEligible: item.rut_eligible
      })),
      // Timestamps
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at
    }))

    // Calculate statistics
    const stats = {
      totalInvoices: count || 0,
      totalAmount: transformedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paidAmount: transformedInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      unpaidAmount: transformedInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0),
      overdueCount: transformedInvoices.filter(inv => 
        inv.status === 'overdue' || 
        (inv.status !== 'paid' && new Date(inv.dueDate) < new Date())
      ).length,
      averageInvoiceValue: transformedInvoices.length > 0 
        ? transformedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / transformedInvoices.length
        : 0
    }

    return NextResponse.json({
      success: true,
      invoices: transformedInvoices,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    })

  } catch (error: any) {
    console.error('Invoices API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch invoices',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!authResult.permissions.includes('financial:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    const { customerId, dueDate, lineItems } = body
    
    if (!customerId || !dueDate || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Customer ID, due date, and at least one line item are required' },
        { status: 400 }
      )
    }

    // Generate invoice number
    const { data: invoiceNumberData } = await supabase
      .rpc('generate_invoice_number')

    const invoiceNumber = invoiceNumberData || `INV${Date.now()}`

    // Calculate totals from line items
    let subtotal = 0
    let vatAmount = 0
    let rutDeduction = 0

    const processedLineItems = lineItems.map((item: any, index: number) => {
      const quantity = parseFloat(item.quantity || 1)
      const unitPrice = Math.round((item.unitPrice || 0) * 100) // Convert to minor units
      const itemSubtotal = Math.round(quantity * unitPrice)
      const vatRate = parseFloat(item.vatRate || 25)
      const itemVat = Math.round(itemSubtotal * vatRate / 100)
      
      subtotal += itemSubtotal
      vatAmount += itemVat

      // Calculate RUT deduction if eligible
      if (item.rutEligible && item.rutHours) {
        const rutAmount = Math.round(item.rutHours * unitPrice * 0.5) // 50% RUT deduction
        rutDeduction += rutAmount
      }

      return {
        line_number: index + 1,
        type: item.type || 'service',
        description: item.description,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal_amount: itemSubtotal,
        vat_rate: vatRate,
        vat_amount: itemVat,
        total_amount: itemSubtotal + itemVat,
        rut_eligible: item.rutEligible || false,
        rut_hours: item.rutHours || null,
        service_code: item.serviceCode || null
      }
    })

    // Create invoice
    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: customerId,
        job_id: body.jobId || null,
        offer_id: body.offerId || null,
        invoice_date: body.invoiceDate || new Date().toISOString().split('T')[0],
        due_date: dueDate,
        currency: body.currency || 'SEK',
        status: body.status || 'draft',
        // Amounts in minor units
        subtotal_amount: subtotal,
        vat_amount: vatAmount,
        rut_deduction_amount: rutDeduction,
        discount_amount: Math.round((body.discountAmount || 0) * 100),
        total_amount: subtotal + vatAmount - rutDeduction - Math.round((body.discountAmount || 0) * 100),
        paid_amount: 0,
        // RUT fields
        rut_eligible: body.rutEligible || rutDeduction > 0,
        rut_hours: body.rutHours || null,
        rut_personal_number: body.rutPersonalNumber || null,
        // Other fields
        payment_terms: body.paymentTerms || '30 dagar netto',
        notes: body.notes || null,
        internal_notes: body.internalNotes || null,
        reference: body.reference || null,
        auto_created: body.autoCreated || false,
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Invoice creation error:', error)
      throw error
    }

    // Create line items
    const lineItemsData = processedLineItems.map((item: any) => ({
      ...item,
      invoice_id: newInvoice.id
    }))

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsData)

    if (lineItemsError) {
      console.error('Line items creation error:', lineItemsError)
      // Rollback by deleting the invoice
      await supabase.from('invoices').delete().eq('id', newInvoice.id)
      throw lineItemsError
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoice_number,
        totalAmount: newInvoice.total_amount / 100,
        status: newInvoice.status
      },
      message: 'Invoice created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Invoice creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create invoice',
      details: error.message
    }, { status: 500 })
  }
}