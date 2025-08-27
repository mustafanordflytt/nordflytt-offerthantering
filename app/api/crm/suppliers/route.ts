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
    if (!authResult.permissions.includes('suppliers:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query
    let query = supabase
      .from('suppliers')
      .select(`
        *,
        category:supplier_categories(
          id,
          category_name
        ),
        contacts:supplier_contacts!supplier_contacts_supplier_id_fkey(
          id,
          contact_name,
          contact_role,
          contact_email,
          contact_phone,
          is_primary
        ),
        active_contracts:supplier_contracts!supplier_contracts_supplier_id_fkey(
          id,
          contract_number,
          contract_type,
          contract_status,
          start_date,
          end_date,
          contract_value
        ),
        latest_performance:supplier_performance_metrics!supplier_performance_metrics_supplier_id_fkey(
          overall_performance_score,
          performance_tier,
          metric_date
        ),
        latest_risk:supplier_risk_assessments!supplier_risk_assessments_supplier_id_fkey(
          overall_risk_score,
          risk_level,
          assessment_date
        )
      `, { count: 'exact' })
      .order('supplier_name', { ascending: true })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('supplier_status', status)
    }

    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }

    if (search) {
      query = query.or(`supplier_name.ilike.%${search}%,supplier_code.ilike.%${search}%,organization_number.ilike.%${search}%`)
    }

    // Only get active contracts
    query = query.eq('supplier_contracts.contract_status', 'active')

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: suppliers, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to fetch suppliers')
    }

    // Process suppliers to get latest metrics
    const processedSuppliers = (suppliers || []).map(supplier => {
      // Get latest performance metric
      const latestPerformance = supplier.latest_performance
        ?.sort((a: any, b: any) => new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime())[0]

      // Get latest risk assessment
      const latestRisk = supplier.latest_risk
        ?.sort((a: any, b: any) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime())[0]

      // Get primary contact
      const primaryContact = supplier.contacts?.find((c: any) => c.is_primary) || supplier.contacts?.[0]

      return {
        id: supplier.id,
        supplierName: supplier.supplier_name,
        supplierCode: supplier.supplier_code,
        category: supplier.category,
        supplierType: supplier.supplier_type,
        organizationNumber: supplier.organization_number,
        vatNumber: supplier.vat_number,
        status: supplier.supplier_status,
        // Contact info
        primaryContact: primaryContact ? {
          id: primaryContact.id,
          name: primaryContact.contact_name,
          role: primaryContact.contact_role,
          email: primaryContact.contact_email,
          phone: primaryContact.contact_phone
        } : null,
        contactsCount: supplier.contacts?.length || 0,
        // Address
        address: supplier.supplier_address,
        postalCode: supplier.supplier_postal_code,
        city: supplier.supplier_city,
        // Business terms
        paymentTerms: supplier.payment_terms,
        deliveryTerms: supplier.delivery_terms,
        minimumOrderValue: supplier.minimum_order_value,
        leadTimeDays: supplier.lead_time_days,
        // Performance
        rating: supplier.supplier_rating,
        performanceScore: latestPerformance?.overall_performance_score,
        performanceTier: latestPerformance?.performance_tier,
        // Risk
        riskScore: latestRisk?.overall_risk_score,
        riskLevel: latestRisk?.risk_level,
        // Contracts
        activeContracts: supplier.active_contracts?.length || 0,
        contractValue: supplier.active_contracts?.reduce((sum: number, c: any) => sum + (c.contract_value || 0), 0) || 0,
        // Other
        isCritical: supplier.is_critical_supplier,
        tags: supplier.tags || [],
        notes: supplier.notes,
        // Dates
        createdAt: supplier.created_at,
        updatedAt: supplier.updated_at
      }
    })

    // Calculate statistics
    const stats = {
      totalSuppliers: count || 0,
      activeSuppliers: processedSuppliers.filter(s => s.status === 'active').length,
      criticalSuppliers: processedSuppliers.filter(s => s.isCritical).length,
      highRiskSuppliers: processedSuppliers.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length,
      premiumSuppliers: processedSuppliers.filter(s => s.performanceTier === 'premium').length,
      totalContractValue: processedSuppliers.reduce((sum, s) => sum + (s.contractValue || 0), 0),
      avgPerformanceScore: processedSuppliers.filter(s => s.performanceScore).length > 0
        ? processedSuppliers.reduce((sum, s) => sum + (s.performanceScore || 0), 0) / processedSuppliers.filter(s => s.performanceScore).length
        : 0
    }

    return NextResponse.json({
      success: true,
      suppliers: processedSuppliers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    })

  } catch (error: any) {
    console.error('Suppliers API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch suppliers',
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
    if (!authResult.permissions.includes('suppliers:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    const { supplierName, supplierType, categoryId } = body
    
    if (!supplierName || !supplierType) {
      return NextResponse.json(
        { error: 'Supplier name and type are required' },
        { status: 400 }
      )
    }

    // Create supplier (supplier_code will be auto-generated by trigger)
    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert({
        supplier_name: supplierName,
        supplier_type: supplierType,
        category_id: categoryId || null,
        supplier_email: body.supplierEmail || null,
        supplier_phone: body.supplierPhone || null,
        supplier_address: body.supplierAddress || null,
        supplier_postal_code: body.supplierPostalCode || null,
        supplier_city: body.supplierCity || null,
        organization_number: body.organizationNumber || null,
        vat_number: body.vatNumber || null,
        supplier_status: body.status || 'active',
        payment_terms: body.paymentTerms || null,
        delivery_terms: body.deliveryTerms || null,
        minimum_order_value: body.minimumOrderValue || 0,
        lead_time_days: body.leadTimeDays || null,
        preferred_contact_method: body.preferredContactMethod || null,
        is_critical_supplier: body.isCritical || false,
        notes: body.notes || null,
        tags: body.tags || [],
        metadata: body.metadata || {},
        created_by: authResult.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Supplier creation error:', error)
      throw error
    }

    // Create primary contact if provided
    if (body.primaryContact) {
      const contact = body.primaryContact
      await supabase
        .from('supplier_contacts')
        .insert({
          supplier_id: newSupplier.id,
          contact_name: contact.name,
          contact_role: contact.role || null,
          contact_email: contact.email || null,
          contact_phone: contact.phone || null,
          contact_mobile: contact.mobile || null,
          is_primary: true,
          notes: contact.notes || null
        })
    }

    return NextResponse.json({
      success: true,
      supplier: {
        id: newSupplier.id,
        supplierName: newSupplier.supplier_name,
        supplierCode: newSupplier.supplier_code,
        status: newSupplier.supplier_status
      },
      message: 'Supplier created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Supplier creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create supplier',
      details: error.message
    }, { status: 500 })
  }
}