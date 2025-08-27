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

    // Fetch supplier with all related data
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        category:supplier_categories(
          id,
          category_name,
          description
        ),
        created_by_user:crm_users!suppliers_created_by_fkey(
          id,
          name,
          email
        ),
        updated_by_user:crm_users!suppliers_updated_by_fkey(
          id,
          name,
          email
        ),
        contacts:supplier_contacts(
          id,
          contact_name,
          contact_role,
          contact_email,
          contact_phone,
          contact_mobile,
          is_primary,
          is_active,
          notes
        ),
        contracts:supplier_contracts(
          id,
          contract_number,
          contract_type,
          contract_status,
          start_date,
          end_date,
          auto_renew,
          renewal_notice_days,
          contract_value,
          currency,
          discount_percentage,
          sla_response_time,
          sla_resolution_time,
          insurance_amount,
          insurance_expiry,
          f_skatt_verified,
          f_skatt_expiry,
          signed_date,
          signed_by
        ),
        performance_history:supplier_performance_metrics(
          id,
          metric_date,
          on_time_delivery_rate,
          quality_score,
          defect_rate,
          invoice_accuracy_rate,
          price_competitiveness,
          total_spend,
          response_time_avg,
          issue_resolution_rate,
          customer_satisfaction,
          compliance_score,
          safety_incidents,
          environmental_score,
          overall_performance_score,
          performance_tier
        ),
        risk_assessments:supplier_risk_assessments(
          id,
          assessment_date,
          financial_risk_score,
          operational_risk_score,
          compliance_risk_score,
          reputational_risk_score,
          supply_chain_risk_score,
          overall_risk_score,
          risk_level,
          identified_risks,
          mitigation_actions,
          reviewed_by,
          review_notes,
          next_review_date
        )
      `)
      .eq('id', supplierId)
      .single()

    if (error || !supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Transform supplier data
    const transformedSupplier = {
      id: supplier.id,
      supplierName: supplier.supplier_name,
      supplierCode: supplier.supplier_code,
      category: supplier.category,
      supplierType: supplier.supplier_type,
      // Contact information
      email: supplier.supplier_email,
      phone: supplier.supplier_phone,
      address: supplier.supplier_address,
      postalCode: supplier.supplier_postal_code,
      city: supplier.supplier_city,
      // Business information
      organizationNumber: supplier.organization_number,
      vatNumber: supplier.vat_number,
      status: supplier.supplier_status,
      // Terms
      paymentTerms: supplier.payment_terms,
      deliveryTerms: supplier.delivery_terms,
      minimumOrderValue: supplier.minimum_order_value,
      leadTimeDays: supplier.lead_time_days,
      preferredContactMethod: supplier.preferred_contact_method,
      // Ratings and flags
      rating: supplier.supplier_rating,
      isCritical: supplier.is_critical_supplier,
      // Additional data
      notes: supplier.notes,
      tags: supplier.tags || [],
      metadata: supplier.metadata || {},
      // Contacts
      contacts: (supplier.contacts || []).map((contact: any) => ({
        id: contact.id,
        name: contact.contact_name,
        role: contact.contact_role,
        email: contact.contact_email,
        phone: contact.contact_phone,
        mobile: contact.contact_mobile,
        isPrimary: contact.is_primary,
        isActive: contact.is_active,
        notes: contact.notes
      })),
      // Contracts
      contracts: (supplier.contracts || [])
        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        .map((contract: any) => ({
          id: contract.id,
          contractNumber: contract.contract_number,
          type: contract.contract_type,
          status: contract.contract_status,
          startDate: contract.start_date,
          endDate: contract.end_date,
          autoRenew: contract.auto_renew,
          renewalNoticeDays: contract.renewal_notice_days,
          value: contract.contract_value ? contract.contract_value / 100 : null,
          currency: contract.currency,
          discountPercentage: contract.discount_percentage,
          sla: {
            responseTime: contract.sla_response_time,
            resolutionTime: contract.sla_resolution_time
          },
          insurance: {
            amount: contract.insurance_amount ? contract.insurance_amount / 100 : null,
            expiry: contract.insurance_expiry
          },
          fSkatt: {
            verified: contract.f_skatt_verified,
            expiry: contract.f_skatt_expiry
          },
          signedDate: contract.signed_date,
          signedBy: contract.signed_by
        })),
      // Performance history
      performanceHistory: (supplier.performance_history || [])
        .sort((a: any, b: any) => new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime())
        .map((metric: any) => ({
          id: metric.id,
          date: metric.metric_date,
          delivery: {
            onTimeRate: metric.on_time_delivery_rate,
            qualityScore: metric.quality_score,
            defectRate: metric.defect_rate
          },
          financial: {
            invoiceAccuracy: metric.invoice_accuracy_rate,
            priceCompetitiveness: metric.price_competitiveness,
            totalSpend: metric.total_spend ? metric.total_spend / 100 : 0
          },
          service: {
            responseTimeAvg: metric.response_time_avg,
            issueResolutionRate: metric.issue_resolution_rate,
            satisfaction: metric.customer_satisfaction
          },
          compliance: {
            score: metric.compliance_score,
            safetyIncidents: metric.safety_incidents,
            environmentalScore: metric.environmental_score
          },
          overall: {
            score: metric.overall_performance_score,
            tier: metric.performance_tier
          }
        })),
      // Risk assessments
      riskAssessments: (supplier.risk_assessments || [])
        .sort((a: any, b: any) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime())
        .map((risk: any) => ({
          id: risk.id,
          date: risk.assessment_date,
          scores: {
            financial: risk.financial_risk_score,
            operational: risk.operational_risk_score,
            compliance: risk.compliance_risk_score,
            reputational: risk.reputational_risk_score,
            supplyChain: risk.supply_chain_risk_score,
            overall: risk.overall_risk_score
          },
          level: risk.risk_level,
          identifiedRisks: risk.identified_risks || [],
          mitigationActions: risk.mitigation_actions || [],
          review: {
            reviewedBy: risk.reviewed_by,
            notes: risk.review_notes,
            nextReviewDate: risk.next_review_date
          }
        })),
      // Metadata
      createdBy: supplier.created_by_user,
      updatedBy: supplier.updated_by_user,
      createdAt: supplier.created_at,
      updatedAt: supplier.updated_at
    }

    // Calculate summary metrics
    const latestPerformance = supplier.performance_history?.[0]
    const latestRisk = supplier.risk_assessments?.[0]
    const activeContracts = supplier.contracts?.filter((c: any) => c.contract_status === 'active')

    const summary = {
      currentPerformanceScore: latestPerformance?.overall_performance_score || null,
      currentPerformanceTier: latestPerformance?.performance_tier || null,
      currentRiskScore: latestRisk?.overall_risk_score || null,
      currentRiskLevel: latestRisk?.risk_level || null,
      activeContractsCount: activeContracts?.length || 0,
      totalContractValue: activeContracts?.reduce((sum: number, c: any) => sum + (c.contract_value || 0), 0) / 100 || 0,
      upcomingExpirations: activeContracts?.filter((c: any) => {
        if (!c.end_date) return false
        const daysUntilExpiry = Math.floor((new Date(c.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 90 && daysUntilExpiry >= 0
      }).length || 0
    }

    return NextResponse.json({
      supplier: transformedSupplier,
      summary
    })

  } catch (error) {
    console.error('Unexpected error in supplier details:', error)
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
    if (!authResult.permissions.includes('suppliers:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const supplierId = resolvedParams.id
    const body = await request.json()

    // Get current supplier
    const { data: currentSupplier, error: fetchError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (fetchError || !currentSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_by: authResult.user.id,
      updated_at: new Date().toISOString()
    }

    // Update fields if provided
    if (body.supplierName !== undefined) updateData.supplier_name = body.supplierName
    if (body.supplierType !== undefined) updateData.supplier_type = body.supplierType
    if (body.categoryId !== undefined) updateData.category_id = body.categoryId
    if (body.supplierEmail !== undefined) updateData.supplier_email = body.supplierEmail
    if (body.supplierPhone !== undefined) updateData.supplier_phone = body.supplierPhone
    if (body.supplierAddress !== undefined) updateData.supplier_address = body.supplierAddress
    if (body.supplierPostalCode !== undefined) updateData.supplier_postal_code = body.supplierPostalCode
    if (body.supplierCity !== undefined) updateData.supplier_city = body.supplierCity
    if (body.organizationNumber !== undefined) updateData.organization_number = body.organizationNumber
    if (body.vatNumber !== undefined) updateData.vat_number = body.vatNumber
    if (body.status !== undefined) updateData.supplier_status = body.status
    if (body.paymentTerms !== undefined) updateData.payment_terms = body.paymentTerms
    if (body.deliveryTerms !== undefined) updateData.delivery_terms = body.deliveryTerms
    if (body.minimumOrderValue !== undefined) updateData.minimum_order_value = body.minimumOrderValue
    if (body.leadTimeDays !== undefined) updateData.lead_time_days = body.leadTimeDays
    if (body.preferredContactMethod !== undefined) updateData.preferred_contact_method = body.preferredContactMethod
    if (body.rating !== undefined) updateData.supplier_rating = body.rating
    if (body.isCritical !== undefined) updateData.is_critical_supplier = body.isCritical
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    // Update supplier
    const { data: updatedSupplier, error: updateError } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', supplierId)
      .select()
      .single()

    if (updateError) {
      console.error('Supplier update error:', updateError)
      throw updateError
    }

    return NextResponse.json({
      supplier: {
        id: updatedSupplier.id,
        supplierName: updatedSupplier.supplier_name,
        supplierCode: updatedSupplier.supplier_code,
        status: updatedSupplier.supplier_status,
        updatedAt: updatedSupplier.updated_at
      },
      message: 'Supplier updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in supplier update:', error)
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

    // Check permissions - only admins can delete suppliers
    if (!authResult.permissions.includes('admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const supplierId = resolvedParams.id

    // Check if supplier has active contracts
    const { data: activeContracts } = await supabase
      .from('supplier_contracts')
      .select('id')
      .eq('supplier_id', supplierId)
      .eq('contract_status', 'active')

    if (activeContracts && activeContracts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with active contracts' },
        { status: 400 }
      )
    }

    // Check if supplier has pending expenses
    const { data: pendingExpenses } = await supabase
      .from('expenses')
      .select('id')
      .eq('supplier_id', supplierId)
      .in('status', ['pending', 'approved'])

    if (pendingExpenses && pendingExpenses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with pending expenses' },
        { status: 400 }
      )
    }

    // Soft delete by setting status to deleted
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({
        supplier_status: 'deleted',
        updated_by: authResult.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', supplierId)

    if (updateError) {
      console.error('Supplier deletion error:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in supplier deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}