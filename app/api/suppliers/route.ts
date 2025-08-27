import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AISupplierRiskEngine } from '@/lib/suppliers/AISupplierRiskEngine';

const riskEngine = new AISupplierRiskEngine();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('suppliers')
      .select(`
        *,
        supplier_categories (
          category_name,
          category_code
        ),
        supplier_performance (
          overall_performance_score,
          delivery_reliability,
          quality_score,
          performance_trend
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    if (status && status !== 'all') {
      query = query.eq('supplier_status', status);
    }

    if (search) {
      query = query.or(`company_name.ilike.%${search}%,supplier_code.ilike.%${search}%`);
    }

    const { data: suppliers, error } = await query;

    if (error) {
      throw error;
    }

    // Enhance with additional calculated fields
    const enhancedSuppliers = suppliers?.map(supplier => ({
      ...supplier,
      category_name: supplier.supplier_categories?.category_name || 'Unknown',
      performance_score: supplier.supplier_performance?.[0]?.overall_performance_score || 0,
      delivery_reliability: supplier.supplier_performance?.[0]?.delivery_reliability || 0,
      quality_score: supplier.supplier_performance?.[0]?.quality_score || 0,
      performance_trend: supplier.supplier_performance?.[0]?.performance_trend || 'stable'
    }));

    return NextResponse.json({
      success: true,
      data: enhancedSuppliers,
      total: enhancedSuppliers?.length || 0
    });

  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supplierData = await request.json();

    // Validate required fields
    if (!supplierData.company_name || !supplierData.category_id) {
      return NextResponse.json(
        { success: false, error: 'Company name and category are required' },
        { status: 400 }
      );
    }

    // Generate unique supplier code
    const supplierCode = await generateSupplierCode(supplierData.category_id);

    // Insert new supplier
    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert({
        ...supplierData,
        supplier_code: supplierCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Initialize performance tracking
    await supabase
      .from('supplier_performance')
      .insert({
        supplier_id: newSupplier.id,
        evaluation_period: 'initial',
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        overall_performance_score: 0,
        performance_trend: 'new',
        created_at: new Date().toISOString()
      });

    // Log GDPR compliance
    await supabase
      .from('gdpr_compliance_log')
      .insert({
        supplier_id: newSupplier.id,
        data_subject_type: 'supplier_contact',
        data_subject_name: supplierData.contact_person,
        action_type: 'consent_given',
        legal_basis: 'contract',
        data_categories: ['contact_information', 'business_data'],
        retention_period: 84, // 7 years
        consent_given: true,
        consent_date: new Date().toISOString(),
        compliance_status: 'compliant',
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      data: newSupplier,
      message: 'Supplier created successfully'
    });

  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}

async function generateSupplierCode(categoryId: number): Promise<string> {
  // Get category code
  const { data: category } = await supabase
    .from('supplier_categories')
    .select('category_code')
    .eq('id', categoryId)
    .single();

  const categoryCode = category?.category_code || 'SUP';

  // Get count of suppliers in this category
  const { count } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  const sequence = String((count || 0) + 1).padStart(3, '0');
  return `${categoryCode}-${sequence}`;
}