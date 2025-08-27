// =============================================================================
// NORDFLYTT FINANCIAL AI MODULE - RECEIPTS API
// RESTful API for receipt management with OCR and AI processing
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { SmartReceiptManager } from '@/lib/financial/SmartReceiptManager';

const receiptManager = new SmartReceiptManager();

/**
 * GET /api/financial/receipts
 * List receipts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧾 Receipts list requested');
    
    const url = new URL(request.url);
    const params = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      status: url.searchParams.get('status'),
      category: url.searchParams.get('category'),
      supplier: url.searchParams.get('supplier'),
      job_id: url.searchParams.get('job_id'),
      date_from: url.searchParams.get('date_from'),
      date_to: url.searchParams.get('date_to'),
      min_amount: parseFloat(url.searchParams.get('min_amount') || '0'),
      max_amount: parseFloat(url.searchParams.get('max_amount') || '999999'),
      anomaly_detected: url.searchParams.get('anomaly_detected'),
      search: url.searchParams.get('search')
    };

    // Mock receipt data - in real implementation, query database
    const mockReceipts = generateMockReceipts(params);
    
    console.log('✅ Receipts retrieved successfully', {
      count: mockReceipts.data.length,
      filters: Object.entries(params).filter(([k, v]) => v && v !== '0' && v !== '999999').length
    });

    return NextResponse.json({
      success: true,
      data: mockReceipts.data,
      pagination: mockReceipts.pagination,
      filters: params,
      summary: {
        total_amount: mockReceipts.data.reduce((sum, receipt) => sum + receipt.amount, 0),
        pending_count: mockReceipts.data.filter(r => r.status === 'pending').length,
        approved_count: mockReceipts.data.filter(r => r.status === 'approved').length,
        anomaly_count: mockReceipts.data.filter(r => r.price_anomaly_detected).length,
        categories: [...new Set(mockReceipts.data.map(r => r.category))].length
      }
    });

  } catch (error) {
    console.error('❌ Receipts list failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve receipts',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/financial/receipts
 * Upload and process new receipt with AI analysis
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📷 Receipt upload requested');
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('receipt') as File;
    const jobId = formData.get('job_id') as string;
    const uploadedBy = formData.get('uploaded_by') as string;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Receipt file is required'
      }, { status: 400 });
    }

    // Convert File to buffer for processing
    const buffer = Buffer.from(await file.arrayBuffer());
    const receiptFile = {
      filename: file.name,
      originalname: file.name,
      size: file.size,
      mimetype: file.type,
      buffer
    };

    const metadata = {
      job_id: jobId ? parseInt(jobId) : null,
      uploaded_by: uploadedBy ? parseInt(uploadedBy) : null
    };

    // Process receipt with AI
    const result = await receiptManager.processReceipt(receiptFile, metadata);

    if (result.success) {
      console.log('✅ Receipt processed successfully', {
        receiptId: result.receipt.id,
        category: result.receipt.category,
        amount: result.receipt.amount
      });

      return NextResponse.json({
        success: true,
        receipt: result.receipt,
        analysis: result.analysis,
        recommendations: result.recommendations,
        processing_time: result.processingTime
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        fallback_action: result.fallbackAction
      }, { status: result.error === 'duplicate_receipt' ? 409 : 422 });
    }

  } catch (error) {
    console.error('❌ Receipt upload failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process receipt',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/financial/receipts/batch
 * Upload and process multiple receipts
 */
export async function POST_BATCH(request: NextRequest) {
  try {
    console.log('📦 Batch receipt upload requested');
    
    const formData = await request.formData();
    const files: File[] = [];
    
    // Collect all uploaded files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('receipt_') && value instanceof File) {
        files.push(value);
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No receipt files provided'
      }, { status: 400 });
    }

    // Convert files to processing format
    const receiptFiles = await Promise.all(files.map(async (file) => ({
      filename: file.name,
      originalname: file.name,
      size: file.size,
      mimetype: file.type,
      buffer: Buffer.from(await file.arrayBuffer())
    })));

    const metadata = {
      job_id: formData.get('job_id') ? parseInt(formData.get('job_id') as string) : null,
      uploaded_by: formData.get('uploaded_by') ? parseInt(formData.get('uploaded_by') as string) : null
    };

    // Process batch
    const results = await receiptManager.processBatchReceipts(receiptFiles, metadata);

    console.log('✅ Batch processing completed', {
      total: files.length,
      successful: results.successful.length,
      failed: results.failed.length,
      duplicates: results.duplicates.length
    });

    return NextResponse.json({
      success: true,
      batch_results: results,
      summary: {
        total_uploaded: files.length,
        successful_count: results.successful.length,
        failed_count: results.failed.length,
        duplicate_count: results.duplicates.length,
        total_amount: results.successful.reduce((sum, r) => sum + (r.receipt?.amount || 0), 0)
      }
    });

  } catch (error) {
    console.error('❌ Batch receipt upload failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process batch receipts',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Generate mock receipt data for testing
 */
function generateMockReceipts(params: any) {
  const receipts = [];
  const limit = Math.min(params.limit, 100);
  
  const suppliers = ['Circle K', 'Preem', 'OKQ8', 'Bauhaus', 'Beijer Byggmaterial', 'Mekonomen', 'ICA'];
  const categories = ['fuel', 'materials', 'maintenance', 'food', 'office_supplies', 'transport'];
  const statuses = ['pending', 'approved', 'rejected', 'requires_review'];
  
  for (let i = 0; i < limit; i++) {
    const amount = 50 + Math.random() * 2000;
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const anomalyDetected = Math.random() < 0.15; // 15% have anomalies
    
    const receipt = {
      id: 2000 + i,
      job_id: Math.random() > 0.3 ? 500 + Math.floor(Math.random() * 100) : null,
      supplier_name: supplier,
      supplier_id: Math.floor(Math.random() * 50) + 1,
      receipt_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: Math.round(amount * 100) / 100,
      vat_amount: Math.round(amount * 0.25 * 100) / 100,
      currency: 'SEK',
      category,
      subcategory: category === 'fuel' ? 'diesel' : 'general',
      description: `${category} - ${supplier}`,
      receipt_image_url: `/storage/receipts/receipt_${2000 + i}.jpg`,
      ai_category_confidence: 0.7 + Math.random() * 0.3,
      ocr_confidence: 0.8 + Math.random() * 0.2,
      price_anomaly_detected: anomalyDetected,
      price_variance_percent: anomalyDetected ? (Math.random() - 0.5) * 60 : (Math.random() - 0.5) * 20,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      uploaded_by: Math.floor(Math.random() * 10) + 1,
      
      // AI analysis summary
      ai_analysis: {
        confidence: 0.75 + Math.random() * 0.25,
        extracted_items: [category],
        category_reasoning: `Strong indicators for ${category} category`
      },
      
      // Cost optimization data
      cost_optimization: {
        market_average: amount * (0.9 + Math.random() * 0.2),
        savings_potential: Math.max(0, Math.random() * 200),
        alternative_suppliers: Math.floor(Math.random() * 4)
      }
    };
    
    // Apply filters
    if (params.status && receipt.status !== params.status) continue;
    if (params.category && receipt.category !== params.category) continue;
    if (params.supplier && !receipt.supplier_name.toLowerCase().includes(params.supplier.toLowerCase())) continue;
    if (params.job_id && receipt.job_id !== parseInt(params.job_id)) continue;
    if (receipt.amount < params.min_amount || receipt.amount > params.max_amount) continue;
    if (params.anomaly_detected === 'true' && !receipt.price_anomaly_detected) continue;
    if (params.anomaly_detected === 'false' && receipt.price_anomaly_detected) continue;
    
    receipts.push(receipt);
  }

  return {
    data: receipts,
    pagination: {
      page: params.page,
      limit: params.limit,
      total: receipts.length,
      pages: Math.ceil(receipts.length / params.limit)
    }
  };
}