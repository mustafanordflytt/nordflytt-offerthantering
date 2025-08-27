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
    const expenseId = resolvedParams.id

    // Fetch expense with all related data
    const { data: expense, error } = await supabase
      .from('expenses')
      .select(`
        *,
        supplier:suppliers(
          id,
          supplier_name,
          supplier_email,
          supplier_phone,
          supplier_type,
          supplier_address,
          organization_number,
          contact_person
        ),
        approved_by_user:crm_users!expenses_approved_by_fkey(
          id,
          name,
          email
        ),
        created_by_user:crm_users!expenses_created_by_fkey(
          id,
          name,
          email
        ),
        line_items:expense_line_items(
          id,
          line_number,
          description,
          quantity,
          unit_price,
          subtotal_amount,
          vat_rate,
          vat_amount,
          total_amount,
          cost_center
        )
      `)
      .eq('id', expenseId)
      .single()

    if (error || !expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Transform expense data (convert amounts from minor units)
    const transformedExpense = {
      id: expense.id,
      expenseNumber: expense.expense_number,
      // Supplier information
      supplierId: expense.supplier_id,
      supplier: expense.supplier,
      supplierInvoiceNumber: expense.supplier_invoice_number,
      // Dates
      invoiceDate: expense.invoice_date,
      dueDate: expense.due_date,
      // Status
      status: expense.status,
      approvedAt: expense.approved_at,
      approvedBy: expense.approved_by_user,
      paidAt: expense.paid_at,
      // Amounts (convert from minor units)
      subtotalAmount: expense.subtotal_amount / 100,
      vatAmount: expense.vat_amount / 100,
      totalAmount: expense.total_amount / 100,
      paidAmount: expense.paid_amount / 100,
      remainingAmount: (expense.total_amount - expense.paid_amount) / 100,
      // Categorization
      expenseCategory: expense.expense_category,
      costCenter: expense.cost_center,
      projectCode: expense.project_code,
      // External integrations
      billoInvoiceId: expense.billo_invoice_id,
      billoStatus: expense.billo_status,
      billoSyncedAt: expense.billo_synced_at,
      // AI analysis
      aiCategorySuggestion: expense.ai_category_suggestion,
      aiFraudRiskScore: expense.ai_fraud_risk_score,
      aiApprovalRecommendation: expense.ai_approval_recommendation,
      aiNotes: expense.ai_notes,
      // Additional data
      currency: expense.currency,
      description: expense.description,
      internalNotes: expense.internal_notes,
      receiptUrl: expense.receipt_url,
      attachments: expense.attachments || [],
      // Line items (convert amounts)
      lineItems: (expense.line_items || [])
        .sort((a: any, b: any) => a.line_number - b.line_number)
        .map((item: any) => ({
          id: item.id,
          lineNumber: item.line_number,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price / 100,
          subtotalAmount: item.subtotal_amount / 100,
          vatRate: item.vat_rate,
          vatAmount: item.vat_amount / 100,
          totalAmount: item.total_amount / 100,
          costCenter: item.cost_center
        })),
      // Metadata
      createdBy: expense.created_by_user,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at
    }

    // Calculate summary
    const summary = {
      isOverdue: expense.status !== 'paid' && expense.due_date && new Date(expense.due_date) < new Date(),
      daysOverdue: expense.status !== 'paid' && expense.due_date
        ? Math.max(0, Math.floor((new Date().getTime() - new Date(expense.due_date).getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
      requiresApproval: expense.status === 'pending',
      fraudRisk: expense.ai_fraud_risk_score ? 
        expense.ai_fraud_risk_score > 0.7 ? 'high' :
        expense.ai_fraud_risk_score > 0.3 ? 'medium' : 'low'
        : 'unknown'
    }

    return NextResponse.json({
      expense: transformedExpense,
      summary
    })

  } catch (error) {
    console.error('Unexpected error in expense details:', error)
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
    const expenseId = resolvedParams.id
    const body = await request.json()

    // Get current expense
    const { data: currentExpense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .single()

    if (fetchError || !currentExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Don't allow editing of paid expenses
    if (currentExpense.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot edit paid expenses' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_by: authResult.user.id,
      updated_at: new Date().toISOString()
    }

    // Update fields if provided
    if (body.supplierInvoiceNumber !== undefined) updateData.supplier_invoice_number = body.supplierInvoiceNumber
    if (body.dueDate !== undefined) updateData.due_date = body.dueDate
    if (body.expenseCategory !== undefined) updateData.expense_category = body.expenseCategory
    if (body.costCenter !== undefined) updateData.cost_center = body.costCenter
    if (body.projectCode !== undefined) updateData.project_code = body.projectCode
    if (body.description !== undefined) updateData.description = body.description
    if (body.internalNotes !== undefined) updateData.internal_notes = body.internalNotes

    // Handle status updates
    if (body.status !== undefined && body.status !== currentExpense.status) {
      updateData.status = body.status
      
      // Set approval fields if approving
      if (body.status === 'approved' && !currentExpense.approved_at) {
        updateData.approved_at = new Date().toISOString()
        updateData.approved_by = authResult.user.id
      } else if (body.status === 'paid') {
        updateData.paid_at = new Date().toISOString()
        updateData.paid_amount = currentExpense.total_amount
      }
    }

    // Update expense
    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .select()
      .single()

    if (updateError) {
      console.error('Expense update error:', updateError)
      throw updateError
    }

    return NextResponse.json({
      expense: {
        id: updatedExpense.id,
        expenseNumber: updatedExpense.expense_number,
        status: updatedExpense.status,
        totalAmount: updatedExpense.total_amount / 100,
        updatedAt: updatedExpense.updated_at
      },
      message: 'Expense updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in expense update:', error)
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

    // Check permissions - only admins can delete expenses
    if (!authResult.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const expenseId = resolvedParams.id

    // Get expense to check if it can be deleted
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('status, expense_number')
      .eq('id', expenseId)
      .single()

    if (fetchError || !expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion of approved or paid expenses
    if (['approved', 'paid'].includes(expense.status)) {
      return NextResponse.json(
        { error: 'Cannot delete approved or paid expenses' },
        { status: 400 }
      )
    }

    // Delete expense (cascades to line items)
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (deleteError) {
      console.error('Expense deletion error:', deleteError)
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: `Expense ${expense.expense_number} deleted successfully`
    })

  } catch (error) {
    console.error('Unexpected error in expense deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}