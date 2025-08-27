// =============================================================================
// NORDFLYTT FINANCIAL AI MODULE - INVOICES API
// RESTful API for invoice management with AI processing
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedBillingEngine } from '@/lib/financial/BillingEngine';

const billingEngine = new EnhancedBillingEngine();

/**
 * GET /api/financial/invoices
 * List invoices with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📄 Invoices list requested');
    
    const url = new URL(request.url);
    const params = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '10'),
      status: url.searchParams.get('status'),
      customer_id: url.searchParams.get('customer_id'),
      job_id: url.searchParams.get('job_id'),
      date_from: url.searchParams.get('date_from'),
      date_to: url.searchParams.get('date_to'),
      ai_approved: url.searchParams.get('ai_approved'),
      search: url.searchParams.get('search')
    };

    // Mock invoice data - in real implementation, query database
    const mockInvoices = generateMockInvoices(params);
    
    console.log('✅ Invoices retrieved successfully', {
      count: mockInvoices.data.length,
      filters: Object.entries(params).filter(([k, v]) => v).length
    });

    return NextResponse.json({
      success: true,
      data: mockInvoices.data,
      pagination: mockInvoices.pagination,
      filters: params,
      summary: {
        total_amount: mockInvoices.data.reduce((sum, inv) => sum + inv.total_amount, 0),
        pending_count: mockInvoices.data.filter(inv => inv.status === 'pending_review').length,
        ai_approved_count: mockInvoices.data.filter(inv => inv.ai_approved).length
      }
    });

  } catch (error) {
    console.error('❌ Invoices list failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve invoices',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/financial/invoices
 * Create new invoice from job data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('💰 Invoice creation requested');
    
    const body = await request.json();
    const { job_data, options = {} } = body;

    if (!job_data || !job_data.id) {
      return NextResponse.json({
        success: false,
        error: 'job_data with id is required'
      }, { status: 400 });
    }

    // Generate smart invoice using AI billing engine
    const result = await billingEngine.generateSmartInvoice(job_data, options);

    if (result.success) {
      console.log('✅ Invoice created successfully', {
        invoiceId: result.invoice.id,
        invoiceNumber: result.invoice.invoice_number,
        amount: result.invoice.total_amount
      });

      return NextResponse.json({
        success: true,
        invoice: result.invoice,
        ai_analysis: result.aiAnalysis,
        rut_assessment: result.rutAssessment,
        optimizations: result.optimizations,
        processing_time: result.processingTime
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        fallback_action: result.fallbackAction
      }, { status: 422 });
    }

  } catch (error) {
    console.error('❌ Invoice creation failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create invoice',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Generate mock invoice data for testing
 */
function generateMockInvoices(params: any) {
  const invoices = [];
  const limit = Math.min(params.limit, 50);
  
  for (let i = 0; i < limit; i++) {
    const amount = 8000 + Math.random() * 12000;
    const vatAmount = amount * 0.25;
    const rutDeduction = Math.random() > 0.3 ? amount * 0.5 : 0;
    const total = amount + vatAmount - rutDeduction;
    
    const invoice = {
      id: 1000 + i,
      job_id: 500 + i,
      customer_id: 100 + Math.floor(i / 3),
      invoice_number: `NF-2025-${String(Date.now()).slice(-6)}${String(i).padStart(3, '0')}`,
      amount_excluding_vat: Math.round(amount * 100) / 100,
      vat_amount: Math.round(vatAmount * 100) / 100,
      rut_deduction: Math.round(rutDeduction * 100) / 100,
      total_amount: Math.round(total * 100) / 100,
      invoice_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      due_date: new Date(Date.now() + (30 + Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: ['draft', 'pending_review', 'approved', 'sent', 'paid'][Math.floor(Math.random() * 5)],
      ai_review_score: 0.75 + Math.random() * 0.25,
      ai_approved: Math.random() > 0.3,
      human_review_required: Math.random() > 0.7,
      created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      customer_name: `Customer ${100 + Math.floor(i / 3)}`,
      job_description: `Moving job #${500 + i}`
    };
    
    // Apply filters
    if (params.status && invoice.status !== params.status) continue;
    if (params.customer_id && invoice.customer_id !== parseInt(params.customer_id)) continue;
    if (params.ai_approved === 'true' && !invoice.ai_approved) continue;
    if (params.ai_approved === 'false' && invoice.ai_approved) continue;
    
    invoices.push(invoice);
  }

  return {
    data: invoices,
    pagination: {
      page: params.page,
      limit: params.limit,
      total: invoices.length,
      pages: Math.ceil(invoices.length / params.limit)
    }
  };
}