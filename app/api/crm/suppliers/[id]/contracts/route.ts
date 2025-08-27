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
    if (!authResult.permissions.includes('suppliers:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const supplierId = resolvedParams.id

    // Fetch all contracts for the supplier
    const { data: contracts, error } = await supabase
      .from('supplier_contracts')
      .select(`
        *,
        created_by_user:crm_users!supplier_contracts_created_by_fkey(
          id,
          name,
          email
        )
      `)
      .eq('supplier_id', supplierId)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch contracts')
    }

    // Transform contracts
    const transformedContracts = (contracts || []).map(contract => ({
      id: contract.id,
      contractNumber: contract.contract_number,
      type: contract.contract_type,
      status: contract.contract_status,
      // Dates
      startDate: contract.start_date,
      endDate: contract.end_date,
      signedDate: contract.signed_date,
      // Terms
      autoRenew: contract.auto_renew,
      renewalNoticeDays: contract.renewal_notice_days,
      // Financial (convert from minor units)
      contractValue: contract.contract_value ? contract.contract_value / 100 : null,
      currency: contract.currency,
      discountPercentage: contract.discount_percentage,
      // SLA
      slaResponseTime: contract.sla_response_time,
      slaResolutionTime: contract.sla_resolution_time,
      penaltyClauses: contract.penalty_clauses,
      // Compliance
      insuranceAmount: contract.insurance_amount ? contract.insurance_amount / 100 : null,
      insuranceExpiry: contract.insurance_expiry,
      fSkattVerified: contract.f_skatt_verified,
      fSkattExpiry: contract.f_skatt_expiry,
      // Documents
      contractUrl: contract.contract_url,
      attachments: contract.attachments || [],
      // Metadata
      signedBy: contract.signed_by,
      createdBy: contract.created_by_user,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      // Calculated fields
      daysUntilExpiry: contract.end_date 
        ? Math.floor((new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null,
      isExpiringSoon: contract.end_date 
        ? Math.floor((new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 90
        : false
    }))

    return NextResponse.json({
      contracts: transformedContracts,
      count: transformedContracts.length
    })

  } catch (error) {
    console.error('Unexpected error in contracts fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    if (!authResult.permissions.includes('suppliers:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const supplierId = resolvedParams.id
    const body = await request.json()

    // Validate required fields
    const { contractType, startDate } = body
    
    if (!contractType || !startDate) {
      return NextResponse.json(
        { error: 'Contract type and start date are required' },
        { status: 400 }
      )
    }

    // Generate contract number
    const { data: lastContract } = await supabase
      .from('supplier_contracts')
      .select('contract_number')
      .order('contract_number', { ascending: false })
      .limit(1)
      .single()

    const year = new Date().getFullYear()
    const lastNumber = lastContract && lastContract.contract_number.startsWith(`C${year}`)
      ? parseInt(lastContract.contract_number.substring(5))
      : 0
    const contractNumber = `C${year}-${String(lastNumber + 1).padStart(4, '0')}`

    // Create contract
    const { data: newContract, error } = await supabase
      .from('supplier_contracts')
      .insert({
        contract_number: contractNumber,
        supplier_id: supplierId,
        contract_type: contractType,
        contract_status: body.status || 'draft',
        start_date: startDate,
        end_date: body.endDate || null,
        auto_renew: body.autoRenew || false,
        renewal_notice_days: body.renewalNoticeDays || 30,
        // Financial (convert to minor units)
        contract_value: body.contractValue ? Math.round(body.contractValue * 100) : null,
        currency: body.currency || 'SEK',
        discount_percentage: body.discountPercentage || null,
        // SLA
        sla_response_time: body.slaResponseTime || null,
        sla_resolution_time: body.slaResolutionTime || null,
        penalty_clauses: body.penaltyClauses || null,
        // Compliance
        insurance_amount: body.insuranceAmount ? Math.round(body.insuranceAmount * 100) : null,
        insurance_expiry: body.insuranceExpiry || null,
        f_skatt_verified: body.fSkattVerified || false,
        f_skatt_expiry: body.fSkattExpiry || null,
        // Documents
        contract_url: body.contractUrl || null,
        attachments: body.attachments || [],
        // Signing
        signed_date: body.signedDate || null,
        signed_by: body.signedBy || null,
        // Audit
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Contract creation error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      contract: {
        id: newContract.id,
        contractNumber: newContract.contract_number,
        type: newContract.contract_type,
        status: newContract.contract_status
      },
      message: 'Contract created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Contract creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create contract',
      details: error.message
    }, { status: 500 })
  }
}