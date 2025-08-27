// =============================================================================
// STAFF APP JOB COMPLETION WEBHOOK
// Handles job completion from Staff App and triggers auto-invoice creation
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getFortnoxIntegration, JobCompletionData, CRMJobData } from '@/lib/fortnox-integration';

// Mock function to get job data from CRM - replace with actual database call
async function getJobDataFromCRM(jobId: string): Promise<CRMJobData | null> {
  // This should be replaced with actual database query
  // For now, returning mock data for testing
  if (jobId === 'job_12345') {
    return {
      id: jobId,
      customer: {
        name: 'Anna Svensson',
        email: 'anna.svensson@gmail.com',
        phone: '073-123-4567',
        address: 'Vasagatan 10',
        city: 'Stockholm',
        zipCode: '111 20',
        personalNumber: '780321-6006'
      },
      movingDate: '2025-07-21',
      fromAddress: 'Vasagatan 10, Stockholm',
      toAddress: 'Östermalm 25, Stockholm',
      fromType: 'lägenhet',
      toType: 'lägenhet',
      volume: 25,
      isLongDistance: false,
      services: [
        {
          type: 'flytthjälp',
          articleNumber: '2',
          description: 'Flyttservice',
          customerPrice: 8500,
          rutEligible: true
        },
        {
          type: 'packning',
          articleNumber: '3',
          description: 'Packning av hela bohag',
          customerPrice: 2000,
          rutEligible: true
        }
      ],
      quoteTotal: 10500,
      status: 'in_progress'
    };
  }
  return null;
}

// Update job status in database
async function updateJobStatus(
  jobId: string, 
  status: string, 
  invoiceNumber?: string,
  rutApplicationId?: string
): Promise<void> {
  // This should update the actual database
  // For now, just logging
  console.log('Updating job status:', {
    jobId,
    status,
    invoiceNumber,
    rutApplicationId
  });
}

// Log auto-invoice error for monitoring
async function logAutoInvoiceError(
  jobId: string,
  errorType: string,
  errorMessage: string
): Promise<void> {
  // This should insert into auto_invoice_errors table
  console.error('Auto-invoice error:', {
    jobId,
    errorType,
    errorMessage,
    timestamp: new Date().toISOString()
  });
}

// Notify admin of auto-invoice creation
async function notifyAdminOfInvoice(
  jobId: string,
  invoiceNumber: string,
  customerName: string,
  totalAmount: number
): Promise<void> {
  // Send notification via email/SMS/push
  console.log('Notifying admin of new auto-invoice:', {
    jobId,
    invoiceNumber,
    customerName,
    totalAmount
  });
}

export async function POST(request: NextRequest) {
  try {
    // Parse completion data from Staff App
    const completionData: JobCompletionData = await request.json();
    
    // Validate required fields
    if (!completionData.jobId || !completionData.completedAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get job data from CRM
    const jobData = await getJobDataFromCRM(completionData.jobId);
    if (!jobData) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Update job status to completed
    await updateJobStatus(completionData.jobId, 'completed');

    // Check if auto-invoice is enabled
    if (process.env.ENABLE_AUTO_INVOICE !== 'true') {
      return NextResponse.json({
        success: true,
        message: 'Job completed successfully (auto-invoice disabled)'
      });
    }

    // Create auto-invoice using Fortnox integration
    const fortnox = getFortnoxIntegration();
    const invoiceResult = await fortnox.createCompleteInvoice(jobData, completionData);

    if (!invoiceResult.success) {
      // Log error but don't fail the completion
      await logAutoInvoiceError(
        completionData.jobId,
        'invoice_creation_failed',
        invoiceResult.error || 'Unknown error'
      );
      
      return NextResponse.json({
        success: true,
        message: 'Job completed but auto-invoice failed',
        autoInvoice: {
          success: false,
          error: invoiceResult.error
        }
      });
    }

    // Update job with invoice information
    await updateJobStatus(
      completionData.jobId,
      'completed_and_invoiced',
      invoiceResult.invoiceNumber
    );

    // Calculate total amount for notification
    const totalAmount = jobData.services.reduce((sum, service) => sum + service.customerPrice, 0) +
                       completionData.additions.reduce((sum, add) => sum + add.price, 0) +
                       completionData.materials.reduce((sum, mat) => sum + (mat.quantity * mat.unitPrice), 0);

    // Notify admin of successful auto-invoice
    await notifyAdminOfInvoice(
      completionData.jobId,
      invoiceResult.invoiceNumber!,
      jobData.customer.name,
      totalAmount
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Job completed and invoice created',
      autoInvoice: {
        success: true,
        invoiceNumber: invoiceResult.invoiceNumber,
        customerName: jobData.customer.name,
        totalAmount
      }
    });

  } catch (error) {
    console.error('Staff app completion webhook error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'staff-app-job-completion',
    autoInvoiceEnabled: process.env.ENABLE_AUTO_INVOICE === 'true',
    timestamp: new Date().toISOString()
  });
}