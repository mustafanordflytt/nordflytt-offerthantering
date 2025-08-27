import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { IntelligentProcurementEngine } from '@/lib/suppliers/IntelligentProcurementEngine';

const procurementEngine = new IntelligentProcurementEngine();

export async function POST(request: NextRequest) {
  try {
    const procurementRequest = await request.json();

    // Validate procurement request
    if (!procurementRequest.items || procurementRequest.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Procurement request must include items' },
        { status: 400 }
      );
    }

    // Perform intelligent procurement optimization
    const optimization = await procurementEngine.optimizeProcurementDecision(procurementRequest);

    // Store the optimization analysis
    const { data: analysisRecord, error: analysisError } = await supabase
      .from('procurement_analysis')
      .insert({
        request_id: procurementRequest.id,
        analysis_data: optimization.analysis,
        recommendation: optimization.recommendation,
        estimated_savings: optimization.estimated_savings,
        implementation_plan: optimization.implementation_plan,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error storing procurement analysis:', analysisError);
    }

    return NextResponse.json({
      success: true,
      data: optimization,
      message: 'Procurement optimization completed successfully'
    });

  } catch (error) {
    console.error('Error optimizing procurement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to optimize procurement' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers (
          company_name,
          supplier_code,
          category_id
        ),
        supplier_categories (
          category_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (category) {
      query = query.eq('category_id', category);
    }

    if (status) {
      query = query.eq('order_status', status);
    }

    const { data: purchaseOrders, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate procurement metrics
    const metrics = calculateProcurementMetrics(purchaseOrders);

    return NextResponse.json({
      success: true,
      data: {
        purchase_orders: purchaseOrders,
        metrics: metrics
      }
    });

  } catch (error) {
    console.error('Error fetching procurement data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch procurement data' },
      { status: 500 }
    );
  }
}

// Create automatic purchase order
export async function PUT(request: NextRequest) {
  try {
    const { optimization_id, approved_by } = await request.json();

    if (!optimization_id || !approved_by) {
      return NextResponse.json(
        { success: false, error: 'Optimization ID and approver are required' },
        { status: 400 }
      );
    }

    // Get optimization data
    const { data: optimization, error: optimizationError } = await supabase
      .from('procurement_analysis')
      .select('*')
      .eq('id', optimization_id)
      .single();

    if (optimizationError || !optimization) {
      return NextResponse.json(
        { success: false, error: 'Optimization not found' },
        { status: 404 }
      );
    }

    // Generate automatic purchase order
    const po = await procurementEngine.generateAutomaticPO(
      optimization.recommendation,
      { id: optimization.request_id, ...optimization.analysis.original_request }
    );

    // Update approval status
    await supabase
      .from('purchase_orders')
      .update({
        approval_status: 'approved',
        approved_by: approved_by,
        approval_date: new Date().toISOString(),
        order_status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', po.id);

    return NextResponse.json({
      success: true,
      data: po,
      message: 'Purchase order created and approved successfully'
    });

  } catch (error) {
    console.error('Error creating automatic purchase order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}

function calculateProcurementMetrics(purchaseOrders: any[]) {
  const totalOrders = purchaseOrders?.length || 0;
  const totalValue = purchaseOrders?.reduce((sum, po) => sum + (po.total_amount || 0), 0) || 0;
  const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
  
  const statusCounts = purchaseOrders?.reduce((counts, po) => {
    counts[po.order_status] = (counts[po.order_status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>) || {};

  const completedOrders = purchaseOrders?.filter(po => po.order_status === 'completed') || [];
  const onTimeDeliveries = completedOrders.filter(po => {
    if (!po.requested_delivery_date || !po.actual_delivery_date) return false;
    return new Date(po.actual_delivery_date) <= new Date(po.requested_delivery_date);
  }).length;

  const onTimeRate = completedOrders.length > 0 ? (onTimeDeliveries / completedOrders.length) * 100 : 0;

  // Calculate AI savings
  const aiOptimizedOrders = purchaseOrders?.filter(po => po.auto_generated) || [];
  const totalSavings = aiOptimizedOrders.reduce((sum, po) => sum + (po.estimated_savings || 0), 0);
  const savingsPercentage = totalValue > 0 ? (totalSavings / totalValue) * 100 : 0;

  return {
    total_orders: totalOrders,
    total_value: totalValue,
    average_order_value: averageOrderValue,
    status_breakdown: statusCounts,
    on_time_delivery_rate: onTimeRate,
    ai_optimized_orders: aiOptimizedOrders.length,
    total_ai_savings: totalSavings,
    savings_percentage: savingsPercentage,
    monthly_spend: calculateMonthlySpend(purchaseOrders),
    top_categories: calculateTopCategories(purchaseOrders),
    supplier_performance: calculateSupplierPerformance(purchaseOrders)
  };
}

function calculateMonthlySpend(purchaseOrders: any[]) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyOrders = purchaseOrders?.filter(po => {
    const orderDate = new Date(po.created_at);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  }) || [];

  return monthlyOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);
}

function calculateTopCategories(purchaseOrders: any[]) {
  const categorySpend = purchaseOrders?.reduce((categories, po) => {
    const categoryName = po.supplier_categories?.category_name || 'Unknown';
    categories[categoryName] = (categories[categoryName] || 0) + (po.total_amount || 0);
    return categories;
  }, {} as Record<string, number>) || {};

  return Object.entries(categorySpend)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, spend]) => ({ category, spend }));
}

function calculateSupplierPerformance(purchaseOrders: any[]) {
  const supplierMetrics = purchaseOrders?.reduce((metrics, po) => {
    const supplierName = po.suppliers?.company_name || 'Unknown';
    
    if (!metrics[supplierName]) {
      metrics[supplierName] = {
        total_orders: 0,
        total_value: 0,
        on_time_deliveries: 0,
        completed_orders: 0
      };
    }
    
    metrics[supplierName].total_orders += 1;
    metrics[supplierName].total_value += po.total_amount || 0;
    
    if (po.order_status === 'completed') {
      metrics[supplierName].completed_orders += 1;
      
      if (po.requested_delivery_date && po.actual_delivery_date) {
        const onTime = new Date(po.actual_delivery_date) <= new Date(po.requested_delivery_date);
        if (onTime) {
          metrics[supplierName].on_time_deliveries += 1;
        }
      }
    }
    
    return metrics;
  }, {} as Record<string, any>) || {};

  return Object.entries(supplierMetrics)
    .map(([supplier, metrics]) => ({
      supplier,
      ...metrics,
      on_time_rate: metrics.completed_orders > 0 ? 
        (metrics.on_time_deliveries / metrics.completed_orders) * 100 : 0,
      average_order_value: metrics.total_orders > 0 ? 
        metrics.total_value / metrics.total_orders : 0
    }))
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 10);
}