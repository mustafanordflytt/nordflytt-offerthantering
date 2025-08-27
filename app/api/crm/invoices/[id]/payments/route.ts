import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCRMAuth } from '@/lib/auth/validate-crm-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
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

    // Validate required fields
    const { amount, paymentDate, paymentMethodId } = body
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get invoice details
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('total_amount, paid_amount, status')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice can receive payments
    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot add payments to cancelled invoices' },
        { status: 400 }
      )
    }

    // Check if payment would exceed invoice total
    const paymentAmountMinor = Math.round(amount * 100)
    const remainingAmount = invoice.total_amount - invoice.paid_amount
    
    if (paymentAmountMinor > remainingAmount) {
      return NextResponse.json(
        { 
          error: 'Payment amount exceeds remaining balance',
          remainingBalance: remainingAmount / 100
        },
        { status: 400 }
      )
    }

    // Create payment record
    const { data: newPayment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        payment_method_id: paymentMethodId || null,
        amount: paymentAmountMinor,
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        reference: body.reference || null,
        bank_transaction_id: body.bankTransactionId || null,
        bank_account: body.bankAccount || null,
        status: body.status || 'completed',
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      throw paymentError
    }

    // The trigger will automatically update the invoice paid_amount and status

    // Get updated invoice
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('status, paid_amount, total_amount')
      .eq('id', invoiceId)
      .single()

    return NextResponse.json({
      success: true,
      payment: {
        id: newPayment.id,
        amount: newPayment.amount / 100,
        paymentDate: newPayment.payment_date,
        reference: newPayment.reference,
        status: newPayment.status
      },
      invoice: {
        id: invoiceId,
        status: updatedInvoice?.status,
        paidAmount: updatedInvoice?.paid_amount ? updatedInvoice.paid_amount / 100 : 0,
        totalAmount: updatedInvoice?.total_amount ? updatedInvoice.total_amount / 100 : 0,
        remainingAmount: updatedInvoice 
          ? (updatedInvoice.total_amount - updatedInvoice.paid_amount) / 100
          : 0
      },
      message: 'Payment recorded successfully'
    })

  } catch (error) {
    console.error('Unexpected error in payment creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}