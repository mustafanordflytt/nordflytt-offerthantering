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

    // Get invoice with customer details
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(
          id,
          customer_name,
          customer_email,
          customer_phone
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice can be sent
    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot send cancelled invoices' },
        { status: 400 }
      )
    }

    if (!invoice.customer?.customer_email && !body.email) {
      return NextResponse.json(
        { error: 'Customer email is required to send invoice' },
        { status: 400 }
      )
    }

    const recipientEmail = body.email || invoice.customer.customer_email

    // Update invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
        sent_at: new Date().toISOString(),
        updated_by: authResult.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (updateError) {
      console.error('Invoice update error:', updateError)
      throw updateError
    }

    // TODO: Integrate with email service (SendGrid, etc.)
    // For now, we'll simulate sending
    console.log(`Sending invoice ${invoice.invoice_number} to ${recipientEmail}`)

    // Create audit log entry (optional - if you have an audit table)
    // await supabase.from('audit_logs').insert({
    //   entity_type: 'invoice',
    //   entity_id: invoiceId,
    //   action: 'sent',
    //   user_id: authResult.user.id,
    //   metadata: { recipient_email: recipientEmail }
    // })

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoice_number} sent to ${recipientEmail}`,
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoice_number,
        status: updatedInvoice.status,
        sentAt: updatedInvoice.sent_at
      }
    })

  } catch (error) {
    console.error('Unexpected error in invoice send:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}