// =============================================================================
// NORDFLYTT FINANCIAL AI MODULE - OUTGOING INVOICES API (FORTNOX)
// RESTful API for outgoing invoices sent to customers via Fortnox
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedBillingEngine } from '@/lib/financial/BillingEngine';

const billingEngine = new EnhancedBillingEngine();

/**
 * GET /api/financial/outgoing-invoices
 * List outgoing invoices sent to customers via Fortnox
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📤 Outgoing invoices list requested');
    
    const url = new URL(request.url);
    const params = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '10'),
      status: url.searchParams.get('status'),
      customer_id: url.searchParams.get('customer_id'),
      job_id: url.searchParams.get('job_id'),
      date_from: url.searchParams.get('date_from'),
      date_to: url.searchParams.get('date_to'),
      fortnox_status: url.searchParams.get('fortnox_status'),
      search: url.searchParams.get('search')
    };

    // Mock outgoing invoice data - in real implementation, query database
    const mockInvoices = generateMockOutgoingInvoices(params);
    
    console.log('✅ Outgoing invoices retrieved successfully', {
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
        pending_count: mockInvoices.data.filter(inv => inv.status === 'pending').length,
        sent_count: mockInvoices.data.filter(inv => inv.status === 'sent').length,
        paid_count: mockInvoices.data.filter(inv => inv.status === 'paid').length,
        overdue_count: mockInvoices.data.filter(inv => inv.status === 'overdue').length,
        rut_total: mockInvoices.data.reduce((sum, inv) => sum + (inv.rut_deduction || 0), 0)
      }
    });

  } catch (error) {
    console.error('❌ Outgoing invoices list failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve outgoing invoices',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/financial/outgoing-invoices
 * Create new outgoing invoice and send via Fortnox
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Outgoing invoice creation requested');
    
    const body = await request.json();
    const { job_data, options = {} } = body;

    if (!job_data || !job_data.id) {
      return NextResponse.json({
        success: false,
        error: 'job_data with id is required'
      }, { status: 400 });
    }

    // Generate smart invoice using AI billing engine
    const result = await billingEngine.generateSmartInvoice(job_data, {
      ...options,
      invoice_type: 'outgoing',
      send_via_fortnox: true
    });

    if (result.success) {
      // Simulate Fortnox integration
      const fortnoxResult = await sendToFortnox(result.invoice);
      
      console.log('✅ Outgoing invoice created and sent via Fortnox', {
        invoiceId: result.invoice.id,
        invoiceNumber: result.invoice.invoice_number,
        fortnoxId: fortnoxResult.fortnox_id,
        amount: result.invoice.total_amount
      });

      return NextResponse.json({
        success: true,
        invoice: {
          ...result.invoice,
          fortnox_id: fortnoxResult.fortnox_id,
          fortnox_status: fortnoxResult.status,
          sent_to_customer: fortnoxResult.sent_to_customer
        },
        ai_analysis: result.aiAnalysis,
        rut_assessment: result.rutAssessment,
        fortnox_integration: fortnoxResult,
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
    console.error('❌ Outgoing invoice creation failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create outgoing invoice',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Simulate Fortnox integration for sending invoice
 */
async function sendToFortnox(invoice: any) {
  console.log('🔗 Sending invoice to Fortnox:', invoice.invoice_number);
  
  // Mock Fortnox API call
  const fortnoxResult = {
    success: true,
    fortnox_id: `FTX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    status: 'sent',
    sent_to_customer: true,
    customer_email: 'customer@example.com',
    pdf_url: `https://fortnox.se/invoices/${invoice.invoice_number}.pdf`,
    sent_at: new Date().toISOString()
  };
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('✅ Invoice sent via Fortnox successfully', {
    fortnoxId: fortnoxResult.fortnox_id,
    customerEmail: fortnoxResult.customer_email
  });
  
  return fortnoxResult;
}

/**
 * Generate mock outgoing invoice data for testing
 */
function generateMockOutgoingInvoices(params: any) {
  const invoices = [];
  const limit = Math.min(params.limit, 50);
  
  for (let i = 0; i < limit; i++) {
    const amount = 8000 + Math.random() * 12000;
    const vatAmount = amount * 0.25;
    const rutDeduction = Math.random() > 0.3 ? amount * 0.5 : 0;
    const total = amount + vatAmount - rutDeduction;
    
    const invoice = {
      id: 2000 + i,
      job_id: 500 + i,
      customer_id: 100 + Math.floor(i / 3),
      invoice_number: `NF-OUT-2025-${String(Date.now()).slice(-6)}${String(i).padStart(3, '0')}`,
      amount_excluding_vat: Math.round(amount * 100) / 100,
      vat_amount: Math.round(vatAmount * 100) / 100,
      rut_deduction: Math.round(rutDeduction * 100) / 100,
      total_amount: Math.round(total * 100) / 100,
      invoice_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      due_date: new Date(Date.now() + (30 + Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: ['draft', 'pending', 'sent', 'paid', 'overdue'][Math.floor(Math.random() * 5)],
      
      // Fortnox specific fields
      fortnox_id: `FTX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      fortnox_status: ['sent', 'delivered', 'paid'][Math.floor(Math.random() * 3)],
      sent_to_customer: Math.random() > 0.2,
      customer_email: `customer${100 + Math.floor(i / 3)}@example.com`,
      
      // AI fields
      ai_review_score: 0.75 + Math.random() * 0.25,
      ai_approved: Math.random() > 0.2,
      human_review_required: Math.random() > 0.8,
      
      created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      customer_name: `Customer ${100 + Math.floor(i / 3)}`,
      job_description: `Moving job #${500 + i}`,
      
      // Payment tracking
      payment_received: Math.random() > 0.4,
      payment_date: Math.random() > 0.4 ? new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString() : null
    };
    
    // Apply filters
    if (params.status && invoice.status !== params.status) continue;
    if (params.customer_id && invoice.customer_id !== parseInt(params.customer_id)) continue;
    if (params.fortnox_status && invoice.fortnox_status !== params.fortnox_status) continue;
    
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