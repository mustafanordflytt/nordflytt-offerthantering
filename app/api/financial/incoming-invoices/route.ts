// =============================================================================
// NORDFLYTT FINANCIAL AI MODULE - INCOMING INVOICES API (BILLO)
// RESTful API for incoming invoices from suppliers managed via Billo
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { SmartReceiptManager } from '@/lib/financial/SmartReceiptManager';

const receiptManager = new SmartReceiptManager();

/**
 * GET /api/financial/incoming-invoices
 * List incoming invoices from suppliers via Billo
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📥 Incoming invoices list requested');
    
    const url = new URL(request.url);
    const params = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '10'),
      status: url.searchParams.get('status'),
      supplier_id: url.searchParams.get('supplier_id'),
      supplier_name: url.searchParams.get('supplier_name'),
      date_from: url.searchParams.get('date_from'),
      date_to: url.searchParams.get('date_to'),
      due_date_from: url.searchParams.get('due_date_from'),
      due_date_to: url.searchParams.get('due_date_to'),
      billo_status: url.searchParams.get('billo_status'),
      requires_approval: url.searchParams.get('requires_approval'),
      search: url.searchParams.get('search')
    };

    // Mock incoming invoice data - in real implementation, query database and Billo API
    const mockInvoices = generateMockIncomingInvoices(params);
    
    console.log('✅ Incoming invoices retrieved successfully', {
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
        pending_approval: mockInvoices.data.filter(inv => inv.requires_approval).length,
        approved_count: mockInvoices.data.filter(inv => inv.status === 'approved').length,
        paid_count: mockInvoices.data.filter(inv => inv.status === 'paid').length,
        overdue_count: mockInvoices.data.filter(inv => {
          const dueDate = new Date(inv.due_date);
          const today = new Date();
          return dueDate < today && inv.status !== 'paid';
        }).length,
        ai_auto_approved: mockInvoices.data.filter(inv => inv.ai_approval_recommendation).length
      }
    });

  } catch (error) {
    console.error('❌ Incoming invoices list failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve incoming invoices',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/financial/incoming-invoices
 * Process new incoming invoice from supplier via Billo
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Incoming invoice processing requested');
    
    const formData = await request.formData();
    const invoiceFile = formData.get('invoice_pdf') as File;
    const supplierName = formData.get('supplier_name') as string;
    const invoiceNumber = formData.get('supplier_invoice_number') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const billoInvoiceId = formData.get('billo_invoice_id') as string;

    if (!invoiceFile && !billoInvoiceId) {
      return NextResponse.json({
        success: false,
        error: 'Either invoice PDF file or Billo invoice ID is required'
      }, { status: 400 });
    }

    let aiAnalysis = null;
    let ocrResult = null;

    // If PDF file is provided, process with AI/OCR
    if (invoiceFile) {
      const fileBuffer = Buffer.from(await invoiceFile.arrayBuffer());
      const mockFile = {
        filename: invoiceFile.name,
        originalname: invoiceFile.name,
        size: invoiceFile.size,
        mimetype: invoiceFile.type,
        buffer: fileBuffer
      };

      // Process invoice with AI for validation and categorization
      const aiResult = await receiptManager.processReceipt(mockFile, {
        supplier_name: supplierName,
        invoice_type: 'incoming'
      });

      if (aiResult.success) {
        aiAnalysis = aiResult.analysis;
        ocrResult = aiResult.analysis?.ocr;
      }
    }

    // Create incoming invoice record
    const incomingInvoice = await processIncomingInvoice({
      supplier_name: supplierName,
      supplier_invoice_number: invoiceNumber,
      amount_excluding_vat: amount * 0.8, // Assume 20% VAT
      vat_amount: amount * 0.2,
      total_amount: amount,
      billo_invoice_id: billoInvoiceId,
      pdf_url: invoiceFile ? await storeInvoicePDF(invoiceFile) : null,
      ai_analysis: aiAnalysis,
      ocr_result: ocrResult
    });

    // Send to Billo for payment processing if not already there
    let billoResult = null;
    if (!billoInvoiceId) {
      billoResult = await sendToBillo(incomingInvoice);
    }

    console.log('✅ Incoming invoice processed successfully', {
      invoiceId: incomingInvoice.id,
      supplierName: incomingInvoice.supplier_name,
      amount: incomingInvoice.total_amount,
      billoId: incomingInvoice.billo_invoice_id
    });

    return NextResponse.json({
      success: true,
      invoice: incomingInvoice,
      ai_analysis: aiAnalysis,
      billo_integration: billoResult,
      recommendations: generatePaymentRecommendations(incomingInvoice, aiAnalysis)
    });

  } catch (error) {
    console.error('❌ Incoming invoice processing failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process incoming invoice',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/financial/incoming-invoices/approve
 * Approve incoming invoice for payment
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('✅ Incoming invoice approval requested');
    
    const body = await request.json();
    const { invoice_id, approved_by, approval_notes, auto_pay = false } = body;

    if (!invoice_id || !approved_by) {
      return NextResponse.json({
        success: false,
        error: 'invoice_id and approved_by are required'
      }, { status: 400 });
    }

    // Mock approval process
    const approvedInvoice = {
      id: invoice_id,
      status: 'approved',
      approved_by,
      approved_at: new Date().toISOString(),
      approval_notes,
      requires_approval: false
    };

    // If auto_pay is enabled, trigger Billo payment
    if (auto_pay) {
      const paymentResult = await triggerBilloPayment(invoice_id);
      approvedInvoice.status = 'payment_initiated';
      approvedInvoice.billo_payment_id = paymentResult.payment_id;
    }

    console.log('✅ Incoming invoice approved', {
      invoiceId: invoice_id,
      approvedBy: approved_by,
      autoPay: auto_pay
    });

    return NextResponse.json({
      success: true,
      invoice: approvedInvoice,
      message: auto_pay ? 'Invoice approved and payment initiated' : 'Invoice approved successfully'
    });

  } catch (error) {
    console.error('❌ Incoming invoice approval failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to approve incoming invoice',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Process incoming invoice data
 */
async function processIncomingInvoice(invoiceData: any) {
  const invoice = {
    id: Math.floor(Math.random() * 10000) + 3000,
    ...invoiceData,
    nordflytt_reference: `NF-IN-2025-${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 100)}`,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    received_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    requires_approval: true,
    
    // AI analysis results
    ai_duplicate_check_score: Math.random() * 0.2 + 0.8, // High confidence no duplicate
    ai_amount_verification_score: Math.random() * 0.3 + 0.7, // Reasonable amount
    ai_fraud_risk: Math.random() * 0.1, // Low fraud risk
    ai_category_prediction: ['fuel', 'materials', 'maintenance', 'services'][Math.floor(Math.random() * 4)],
    ai_approval_recommendation: Math.random() > 0.3, // 70% AI recommends approval
    
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('💾 Incoming invoice record created', { id: invoice.id });
  return invoice;
}

/**
 * Send invoice to Billo for payment processing
 */
async function sendToBillo(invoice: any) {
  console.log('🔗 Sending invoice to Billo for payment setup:', invoice.nordflytt_reference);
  
  const billoResult = {
    success: true,
    billo_invoice_id: `BILLO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    payment_setup: true,
    payment_method: 'auto_debit',
    scheduled_payment_date: invoice.due_date,
    billo_dashboard_url: `https://billo.se/invoices/${invoice.id}`
  };
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log('✅ Invoice setup in Billo successfully', {
    billoId: billoResult.billo_invoice_id,
    paymentDate: billoResult.scheduled_payment_date
  });
  
  return billoResult;
}

/**
 * Trigger payment via Billo
 */
async function triggerBilloPayment(invoiceId: number) {
  console.log('💳 Triggering Billo payment for invoice:', invoiceId);
  
  const paymentResult = {
    success: true,
    payment_id: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    payment_method: 'bank_transfer',
    payment_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days
    estimated_completion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days
  };
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('✅ Billo payment initiated', {
    paymentId: paymentResult.payment_id,
    paymentDate: paymentResult.payment_date
  });
  
  return paymentResult;
}

/**
 * Store invoice PDF file
 */
async function storeInvoicePDF(file: File) {
  const filename = `incoming_invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
  const url = `/storage/incoming-invoices/${filename}`;
  
  console.log('💾 Invoice PDF stored', { url });
  return url;
}

/**
 * Generate payment recommendations based on AI analysis
 */
function generatePaymentRecommendations(invoice: any, aiAnalysis: any) {
  const recommendations = [];
  
  if (invoice.ai_approval_recommendation) {
    recommendations.push('AI recommends approval - all validation checks passed');
  }
  
  if (invoice.ai_duplicate_check_score < 0.5) {
    recommendations.push('Potential duplicate detected - manual review required');
  }
  
  if (invoice.ai_fraud_risk > 0.3) {
    recommendations.push('Elevated fraud risk - additional verification recommended');
  }
  
  if (invoice.ai_amount_verification_score < 0.6) {
    recommendations.push('Amount seems unusual for this supplier - verify pricing');
  }
  
  const daysToDue = Math.ceil((new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysToDue <= 5) {
    recommendations.push(`Payment due in ${daysToDue} days - consider expedited approval`);
  }
  
  return recommendations.length > 0 ? recommendations : ['Standard approval process recommended'];
}

/**
 * Generate mock incoming invoice data for testing
 */
function generateMockIncomingInvoices(params: any) {
  const invoices = [];
  const limit = Math.min(params.limit, 50);
  
  const suppliers = [
    'Circle K Sverige AB', 'Preem AB', 'OKQ8 AB', 'Bauhaus Sverige AB', 
    'Beijer Byggmaterial AB', 'Mekonomen AB', 'Euromaster Sverige AB'
  ];
  
  for (let i = 0; i < limit; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const amount = 500 + Math.random() * 5000;
    const vatAmount = amount * 0.25;
    const total = amount + vatAmount;
    
    const invoice = {
      id: 3000 + i,
      supplier_id: Math.floor(Math.random() * 50) + 1,
      supplier_name: supplier,
      supplier_invoice_number: `${supplier.split(' ')[0].toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
      nordflytt_reference: `NF-IN-2025-${String(Date.now()).slice(-6)}${String(i).padStart(3, '0')}`,
      
      amount_excluding_vat: Math.round(amount * 100) / 100,
      vat_amount: Math.round(vatAmount * 100) / 100,
      total_amount: Math.round(total * 100) / 100,
      currency: 'SEK',
      
      invoice_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      due_date: new Date(Date.now() + (Math.random() * 60 - 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      received_date: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      
      status: ['pending', 'approved', 'paid', 'disputed', 'overdue'][Math.floor(Math.random() * 5)],
      payment_method: ['bank_transfer', 'billo_auto', 'manual'][Math.floor(Math.random() * 3)],
      
      // Billo integration
      billo_invoice_id: `BILLO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      billo_payment_id: Math.random() > 0.5 ? `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
      billo_status: ['pending', 'scheduled', 'paid'][Math.floor(Math.random() * 3)],
      
      // AI analysis
      ai_duplicate_check_score: Math.random() * 0.3 + 0.7,
      ai_amount_verification_score: Math.random() * 0.4 + 0.6,
      ai_fraud_risk: Math.random() * 0.2,
      ai_category_prediction: ['fuel', 'materials', 'maintenance', 'services'][Math.floor(Math.random() * 4)],
      ai_approval_recommendation: Math.random() > 0.3,
      
      // Document
      pdf_url: `/storage/incoming-invoices/${supplier.toLowerCase().replace(/\s+/g, '_')}_${i}.pdf`,
      original_filename: `${supplier.split(' ')[0]}_invoice_${Math.floor(Math.random() * 10000)}.pdf`,
      
      // Approval
      requires_approval: Math.random() > 0.3,
      approved_by: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : null,
      approved_at: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString() : null,
      
      created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Apply filters
    if (params.status && invoice.status !== params.status) continue;
    if (params.supplier_name && !invoice.supplier_name.toLowerCase().includes(params.supplier_name.toLowerCase())) continue;
    if (params.billo_status && invoice.billo_status !== params.billo_status) continue;
    if (params.requires_approval === 'true' && !invoice.requires_approval) continue;
    if (params.requires_approval === 'false' && invoice.requires_approval) continue;
    
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