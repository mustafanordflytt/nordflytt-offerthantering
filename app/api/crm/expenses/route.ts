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
    const supplierId = searchParams.get('supplierId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('expenses')
      .select(`
        *,
        supplier:suppliers(
          id,
          supplier_name,
          supplier_email,
          supplier_phone,
          supplier_type
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
        )
      `, { count: 'exact' })
      .order('invoice_date', { ascending: false })
      .order('expense_number', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId)
    }

    if (category) {
      query = query.eq('expense_category', category)
    }

    if (startDate) {
      query = query.gte('invoice_date', startDate)
    }

    if (endDate) {
      query = query.lte('invoice_date', endDate)
    }

    if (search) {
      query = query.or(`expense_number.ilike.%${search}%,supplier_invoice_number.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: expenses, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch expenses')
    }

    // Transform expenses for frontend (convert amounts from minor units)
    const transformedExpenses = (expenses || []).map(expense => ({
      id: expense.id,
      expenseNumber: expense.expense_number,
      supplierId: expense.supplier_id,
      supplier: expense.supplier,
      supplierInvoiceNumber: expense.supplier_invoice_number,
      invoiceDate: expense.invoice_date,
      dueDate: expense.due_date,
      status: expense.status,
      // Convert amounts from minor units
      subtotalAmount: expense.subtotal_amount / 100,
      vatAmount: expense.vat_amount / 100,
      totalAmount: expense.total_amount / 100,
      paidAmount: expense.paid_amount / 100,
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
      // Other fields
      description: expense.description,
      internalNotes: expense.internal_notes,
      receiptUrl: expense.receipt_url,
      attachments: expense.attachments || [],
      // Approval info
      approvedAt: expense.approved_at,
      approvedBy: expense.approved_by_user,
      paidAt: expense.paid_at,
      // Metadata
      createdBy: expense.created_by_user,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at
    }))

    // Calculate statistics
    const stats = {
      totalExpenses: count || 0,
      totalAmount: transformedExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0),
      paidAmount: transformedExpenses.reduce((sum, exp) => sum + exp.paidAmount, 0),
      unpaidAmount: transformedExpenses.reduce((sum, exp) => sum + (exp.totalAmount - exp.paidAmount), 0),
      pendingApproval: transformedExpenses.filter(exp => exp.status === 'pending').length,
      overdueCount: transformedExpenses.filter(exp => 
        exp.status !== 'paid' && exp.dueDate && new Date(exp.dueDate) < new Date()
      ).length,
      categoryCounts: transformedExpenses.reduce((acc, exp) => {
        const cat = exp.expenseCategory || 'Uncategorized'
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      success: true,
      expenses: transformedExpenses,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    })

  } catch (error: any) {
    console.error('Expenses API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch expenses',
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
    const { supplierId, invoiceDate, totalAmount } = body
    
    if (!supplierId || !invoiceDate || !totalAmount) {
      return NextResponse.json(
        { error: 'Supplier ID, invoice date, and total amount are required' },
        { status: 400 }
      )
    }

    // Generate expense number
    const { data: lastExpense } = await supabase
      .from('expenses')
      .select('expense_number')
      .order('expense_number', { ascending: false })
      .limit(1)
      .single()

    const lastNumber = lastExpense ? parseInt(lastExpense.expense_number.replace('EXP', '')) : 0
    const expenseNumber = `EXP${String(lastNumber + 1).padStart(6, '0')}`

    // Calculate amounts
    const totalAmountMinor = Math.round(totalAmount * 100)
    const vatRate = body.vatRate || 25
    const subtotalAmountMinor = Math.round(totalAmountMinor / (1 + vatRate / 100))
    const vatAmountMinor = totalAmountMinor - subtotalAmountMinor

    // Create expense
    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert({
        expense_number: expenseNumber,
        supplier_id: supplierId,
        supplier_invoice_number: body.supplierInvoiceNumber || null,
        invoice_date: invoiceDate,
        due_date: body.dueDate || null,
        currency: body.currency || 'SEK',
        status: body.status || 'pending',
        // Amounts in minor units
        subtotal_amount: subtotalAmountMinor,
        vat_amount: vatAmountMinor,
        total_amount: totalAmountMinor,
        paid_amount: 0,
        // Categorization
        expense_category: body.expenseCategory || null,
        cost_center: body.costCenter || null,
        project_code: body.projectCode || null,
        // Other fields
        description: body.description || null,
        internal_notes: body.internalNotes || null,
        receipt_url: body.receiptUrl || null,
        attachments: body.attachments || [],
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Expense creation error:', error)
      throw error
    }

    // Create line items if provided
    if (body.lineItems && body.lineItems.length > 0) {
      const lineItemsData = body.lineItems.map((item: any, index: number) => ({
        expense_id: newExpense.id,
        line_number: index + 1,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: Math.round((item.unitPrice || 0) * 100),
        subtotal_amount: Math.round((item.quantity || 1) * (item.unitPrice || 0) * 100),
        vat_rate: item.vatRate || vatRate,
        vat_amount: Math.round((item.quantity || 1) * (item.unitPrice || 0) * (item.vatRate || vatRate) / 100 * 100),
        total_amount: Math.round((item.quantity || 1) * (item.unitPrice || 0) * (1 + (item.vatRate || vatRate) / 100) * 100),
        cost_center: item.costCenter || body.costCenter || null
      }))

      await supabase
        .from('expense_line_items')
        .insert(lineItemsData)
    }

    return NextResponse.json({
      success: true,
      expense: {
        id: newExpense.id,
        expenseNumber: newExpense.expense_number,
        totalAmount: newExpense.total_amount / 100,
        status: newExpense.status
      },
      message: 'Expense created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Expense creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create expense',
      details: error.message
    }, { status: 500 })
  }
}