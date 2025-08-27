import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const invoiceId = resolvedParams.id

    // Fetch invoice with all related data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(
          id,
          customer_name,
          customer_email,
          customer_phone,
          customer_type,
          customer_address,
          customer_postal_code,
          customer_city,
          organization_number,
          contact_person
        ),
        job:jobs(
          id,
          job_id,
          from_address,
          to_address,
          scheduled_date,
          scheduled_time,
          status,
          estimated_duration,
          actual_duration
        ),
        offer:offers(
          id,
          offer_id,
          total_price,
          status
        ),
        created_by_user:crm_users!invoices_created_by_fkey(
          id,
          name,
          email
        ),
        payments:invoice_payments(
          id,
          amount,
          payment_date,
          reference,
          status,
          payment_method:payment_methods(
            id,
            name,
            type
          )
        ),
        line_items:invoice_line_items(
          id,
          line_number,
          type,
          description,
          quantity,
          unit_price,
          subtotal_amount,
          vat_rate,
          vat_amount,
          total_amount,
          rut_eligible,
          rut_hours,
          service_code
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Transform invoice data (convert amounts from minor units)
    const transformedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      // Customer information
      customerId: invoice.customer_id,
      customer: invoice.customer,
      // Job/Offer information
      jobId: invoice.job_id,
      job: invoice.job,
      offerId: invoice.offer_id,
      offer: invoice.offer,
      // Dates
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      // Status
      status: invoice.status,
      sentAt: invoice.sent_at,
      viewedAt: invoice.viewed_at,
      paidAt: invoice.paid_at,
      cancelledAt: invoice.cancelled_at,
      // Amounts (convert from minor units)
      subtotalAmount: invoice.subtotal_amount / 100,
      vatAmount: invoice.vat_amount / 100,
      rutDeductionAmount: invoice.rut_deduction_amount / 100,
      discountAmount: invoice.discount_amount / 100,
      totalAmount: invoice.total_amount / 100,
      paidAmount: invoice.paid_amount / 100,
      remainingAmount: (invoice.total_amount - invoice.paid_amount) / 100,
      // RUT details
      rutEligible: invoice.rut_eligible,
      rutHours: invoice.rut_hours,
      rutPersonalNumber: invoice.rut_personal_number,
      // External integrations
      fortnoxId: invoice.fortnox_id,
      fortnoxStatus: invoice.fortnox_status,
      fortnoxSyncedAt: invoice.fortnox_synced_at,
      // AI and automation
      autoCreated: invoice.auto_created,
      aiReviewScore: invoice.ai_review_score,
      aiApproved: invoice.ai_approved,
      aiNotes: invoice.ai_notes,
      // Additional data
      currency: invoice.currency,
      paymentTerms: invoice.payment_terms,
      notes: invoice.notes,
      internalNotes: invoice.internal_notes,
      reference: invoice.reference,
      // Line items (convert amounts)
      lineItems: (invoice.line_items || [])
        .sort((a: any, b: any) => a.line_number - b.line_number)
        .map((item: any) => ({
          id: item.id,
          lineNumber: item.line_number,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price / 100,
          subtotalAmount: item.subtotal_amount / 100,
          vatRate: item.vat_rate,
          vatAmount: item.vat_amount / 100,
          totalAmount: item.total_amount / 100,
          rutEligible: item.rut_eligible,
          rutHours: item.rut_hours,
          serviceCode: item.service_code
        })),
      // Payments (convert amounts)
      payments: (invoice.payments || [])
        .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
        .map((payment: any) => ({
          id: payment.id,
          amount: payment.amount / 100,
          paymentDate: payment.payment_date,
          reference: payment.reference,
          status: payment.status,
          method: payment.payment_method
        })),
      // Metadata
      createdBy: invoice.created_by_user,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at
    }

    // Calculate summary
    const summary = {
      isOverdue: invoice.status !== 'paid' && new Date(invoice.due_date) < new Date(),
      daysOverdue: invoice.status !== 'paid' 
        ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
      paymentProgress: invoice.total_amount > 0 
        ? Math.round((invoice.paid_amount / invoice.total_amount) * 100)
        : 0,
      rutSavings: invoice.rut_eligible 
        ? invoice.rut_deduction_amount / 100
        : 0
    }

    return NextResponse.json({
      invoice: transformedInvoice,
      summary
    })

  } catch (error) {
    console.error('Unexpected error in invoice details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const invoiceId = resolvedParams.id
    const body = await request.json()

    // Get current invoice
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !currentInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Don't allow editing of paid or cancelled invoices
    if (currentInvoice.status === 'paid' || currentInvoice.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot edit ${currentInvoice.status} invoices` },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_by: authResult.user.id,
      updated_at: new Date().toISOString()
    }

    // Update fields if provided
    if (body.dueDate !== undefined) updateData.due_date = body.dueDate
    if (body.paymentTerms !== undefined) updateData.payment_terms = body.paymentTerms
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.internalNotes !== undefined) updateData.internal_notes = body.internalNotes
    if (body.reference !== undefined) updateData.reference = body.reference
    if (body.rutPersonalNumber !== undefined) updateData.rut_personal_number = body.rutPersonalNumber

    // Handle status updates
    if (body.status !== undefined && body.status !== currentInvoice.status) {
      updateData.status = body.status
      
      // Set timestamps based on status change
      if (body.status === 'sent' && !currentInvoice.sent_at) {
        updateData.sent_at = new Date().toISOString()
      } else if (body.status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
      }
    }

    // Update discount if provided
    if (body.discountAmount !== undefined) {
      updateData.discount_amount = Math.round(body.discountAmount * 100)
      // Recalculate total
      updateData.total_amount = currentInvoice.subtotal_amount + currentInvoice.vat_amount 
        - currentInvoice.rut_deduction_amount - updateData.discount_amount
    }

    // Update invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single()

    if (updateError) {
      console.error('Invoice update error:', updateError)
      throw updateError
    }

    // Update line items if provided
    if (body.lineItems !== undefined) {
      // Delete existing line items
      await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', invoiceId)

      // Create new line items
      let subtotal = 0
      let vatAmount = 0
      let rutDeduction = 0

      const processedLineItems = body.lineItems.map((item: any, index: number) => {
        const quantity = parseFloat(item.quantity || 1)
        const unitPrice = Math.round((item.unitPrice || 0) * 100)
        const itemSubtotal = Math.round(quantity * unitPrice)
        const vatRate = parseFloat(item.vatRate || 25)
        const itemVat = Math.round(itemSubtotal * vatRate / 100)
        
        subtotal += itemSubtotal
        vatAmount += itemVat

        if (item.rutEligible && item.rutHours) {
          const rutAmount = Math.round(item.rutHours * unitPrice * 0.5)
          rutDeduction += rutAmount
        }

        return {
          invoice_id: invoiceId,
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

      await supabase
        .from('invoice_line_items')
        .insert(processedLineItems)

      // Update invoice totals
      const totalAmount = subtotal + vatAmount - rutDeduction - (updatedInvoice.discount_amount || 0)
      
      await supabase
        .from('invoices')
        .update({
          subtotal_amount: subtotal,
          vat_amount: vatAmount,
          rut_deduction_amount: rutDeduction,
          total_amount: totalAmount,
          rut_eligible: rutDeduction > 0
        })
        .eq('id', invoiceId)
    }

    return NextResponse.json({
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoice_number,
        status: updatedInvoice.status,
        totalAmount: updatedInvoice.total_amount / 100,
        updatedAt: updatedInvoice.updated_at
      },
      message: 'Invoice updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in invoice update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CRM authentication
    const authResult = await validateCRMAuth(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only admins can delete invoices
    if (!authResult.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const invoiceId = resolvedParams.id

    // Get invoice to check if it can be deleted
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status, invoice_number')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion of sent or paid invoices
    if (['sent', 'viewed', 'paid', 'partially_paid'].includes(invoice.status)) {
      return NextResponse.json(
        { error: 'Cannot delete invoices that have been sent or paid. Cancel instead.' },
        { status: 400 }
      )
    }

    // Delete invoice (cascades to line items and payments)
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)

    if (deleteError) {
      console.error('Invoice deletion error:', deleteError)
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoice_number} deleted successfully`
    })

  } catch (error) {
    console.error('Unexpected error in invoice deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}