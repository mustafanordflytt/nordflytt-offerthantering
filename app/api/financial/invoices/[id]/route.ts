// =============================================================================
// NORDFLYTT FINANCIAL AI MODULE - SINGLE INVOICE API
// RESTful API for individual invoice operations
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedBillingEngine } from '@/lib/financial/BillingEngine';

const billingEngine = new EnhancedBillingEngine();

/**
 * GET /api/financial/invoices/[id]
 * Get single invoice with details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📄 Single invoice requested', { id: params.id });
    
    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid invoice ID'
      }, { status: 400 });
    }

    // Mock invoice data - in real implementation, query database
    const invoice = generateMockInvoiceDetail(invoiceId);
    
    if (!invoice) {
      return NextResponse.json({
        success: false,
        error: 'Invoice not found'
      }, { status: 404 });
    }

    console.log('✅ Invoice retrieved successfully', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number
    });

    return NextResponse.json({
      success: true,
      invoice,
      line_items: invoice.line_items,
      ai_analysis: invoice.ai_analysis,
      rut_application: invoice.rut_application
    });

  } catch (error) {
    console.error('❌ Single invoice retrieval failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve invoice',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/financial/invoices/[id]
 * Update invoice (status, approval, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('✏️ Invoice update requested', { id: params.id });
    
    const invoiceId = parseInt(params.id);
    const body = await request.json();
    
    if (isNaN(invoiceId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid invoice ID'
      }, { status: 400 });
    }

    // Validate update data
    const allowedUpdates = ['status', 'payment_method', 'payment_reference', 'approved_by', 'review_notes'];
    const updates = Object.keys(body).filter(key => allowedUpdates.includes(key));
    
    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid updates provided'
      }, { status: 400 });
    }

    // Mock update - in real implementation, update database
    const updatedInvoice = {
      ...generateMockInvoiceDetail(invoiceId),
      ...Object.fromEntries(updates.map(key => [key, body[key]])),
      updated_at: new Date().toISOString(),
      approved_at: body.status === 'approved' ? new Date().toISOString() : null
    };

    console.log('✅ Invoice updated successfully', {
      invoiceId,
      updates: updates.join(', ')
    });

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      updated_fields: updates
    });

  } catch (error) {
    console.error('❌ Invoice update failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update invoice',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/financial/invoices/[id]
 * Cancel/delete invoice (if allowed)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Invoice deletion requested', { id: params.id });
    
    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid invoice ID'
      }, { status: 400 });
    }

    // Check if invoice can be deleted (business rules)
    const invoice = generateMockInvoiceDetail(invoiceId);
    if (!invoice) {
      return NextResponse.json({
        success: false,
        error: 'Invoice not found'
      }, { status: 404 });
    }

    if (['sent', 'paid'].includes(invoice.status)) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete sent or paid invoices'
      }, { status: 403 });
    }

    // Mock deletion - in real implementation, soft delete or cancel
    console.log('✅ Invoice cancelled successfully', { invoiceId });

    return NextResponse.json({
      success: true,
      message: 'Invoice cancelled successfully',
      invoice_id: invoiceId
    });

  } catch (error) {
    console.error('❌ Invoice deletion failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel invoice',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Generate detailed mock invoice data
 */
function generateMockInvoiceDetail(id: number) {
  if (id < 1000 || id > 9999) return null;
  
  const amount = 8000 + Math.random() * 12000;
  const vatAmount = amount * 0.25;
  const rutDeduction = Math.random() > 0.3 ? amount * 0.5 : 0;
  const total = amount + vatAmount - rutDeduction;
  
  return {
    id,
    job_id: id - 500,
    customer_id: 100 + Math.floor(id / 10),
    invoice_number: `NF-2025-${String(Date.now()).slice(-6)}${String(id).slice(-3)}`,
    amount_excluding_vat: Math.round(amount * 100) / 100,
    vat_amount: Math.round(vatAmount * 100) / 100,
    rut_deduction: Math.round(rutDeduction * 100) / 100,
    total_amount: Math.round(total * 100) / 100,
    invoice_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: ['draft', 'pending_review', 'approved', 'sent', 'paid'][Math.floor(Math.random() * 5)],
    payment_method: null,
    payment_reference: null,
    ai_review_score: 0.75 + Math.random() * 0.25,
    ai_review_notes: 'High confidence - recommended for auto-approval',
    ai_fraud_risk: Math.random() * 0.2,
    ai_approved: Math.random() > 0.3,
    human_review_required: Math.random() > 0.7,
    created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
    approved_by: null,
    approved_at: null,
    
    // Line items
    line_items: [
      {
        id: id * 10 + 1,
        invoice_id: id,
        description: `Flyttjänst - Storgatan 1 till Biblioteksgatan 5`,
        quantity: 1,
        unit_price: Math.round(amount * 0.7 * 100) / 100,
        line_total: Math.round(amount * 0.7 * 100) / 100,
        category: 'moving',
        ai_suggested_price: Math.round(amount * 0.72 * 100) / 100,
        price_optimization_applied: true
      },
      {
        id: id * 10 + 2,
        invoice_id: id,
        description: 'Packningsservice',
        quantity: Math.floor(Math.random() * 10) + 5,
        unit_price: 150,
        line_total: Math.round(amount * 0.3 * 100) / 100,
        category: 'packing',
        ai_suggested_price: 145,
        price_optimization_applied: false
      }
    ],
    
    // AI analysis details
    ai_analysis: {
      confidence: 0.85 + Math.random() * 0.15,
      fraud_risk: Math.random() * 0.2,
      quality_score: 0.9 + Math.random() * 0.1,
      processing_time: 150 + Math.random() * 100,
      recommendations: ['Auto-approval recommended', 'RUT application eligible']
    },
    
    // RUT application if applicable
    rut_application: rutDeduction > 0 ? {
      id: id + 5000,
      application_id: `RUT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      deduction_amount: Math.round(rutDeduction * 100) / 100,
      status: ['submitted', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
      application_date: new Date().toISOString().split('T')[0],
      ai_validation_score: 0.9 + Math.random() * 0.1
    } : null,
    
    // Customer details
    customer: {
      id: 100 + Math.floor(id / 10),
      name: `Customer ${100 + Math.floor(id / 10)}`,
      email: `customer${100 + Math.floor(id / 10)}@example.com`,
      phone: `+46 70 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`
    },
    
    // Job details
    job: {
      id: id - 500,
      pickup_address: 'Storgatan 1, 111 22 Stockholm',
      delivery_address: 'Biblioteksgatan 5, 114 35 Stockholm',
      scheduled_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completed_date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      volume: Math.floor(Math.random() * 20) + 5,
      distance_km: Math.floor(Math.random() * 50) + 10
    }
  };
}