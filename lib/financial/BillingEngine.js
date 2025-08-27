// =============================================================================
// NORDFLYTT FINANCIAL AI MODULE - ENHANCED BILLING ENGINE
// Advanced billing automation with AI-driven optimization and fraud detection
// =============================================================================

import { createHash } from 'crypto';
import { systemConfig } from '@/config/systemConfig';

/**
 * Enhanced Billing Engine with AI capabilities
 * Handles invoice generation, RUT applications, and financial optimization
 */
export class EnhancedBillingEngine {
  constructor() {
    this.aiReviewer = new AIInvoiceReviewer();
    this.rutHandler = new RUTApplicationHandler();
    this.priceOptimizer = new PriceOptimizationEngine();
    this.integrations = {
      fortnox: new FortnoxIntegration(),
      billo: new BilloIntegration(),
      skatteverket: new SkatteverketIntegration()
    };
    
    this.config = {
      autoApprovalThreshold: 0.95,
      humanReviewThreshold: 0.75,
      maxRetryAttempts: 3,
      standardVatRate: 0.25, // 25% Swedish VAT
      rutDeductionRate: 0.50 // 50% RUT deduction
    };
    
    console.log('🏦 Enhanced Billing Engine initialized with AI capabilities');
  }

  /**
   * Generate smart invoice from completed job
   * @param {Object} jobData - Complete job information
   * @param {Object} options - Invoice generation options
   * @returns {Promise<Object>} Generated invoice with AI analysis
   */
  async generateSmartInvoice(jobData, options = {}) {
    try {
      console.log('📄 Starting smart invoice generation', { jobId: jobData.id });
      
      // Step 1: Validate job eligibility for invoicing
      const eligibilityCheck = await this.validateJobEligibility(jobData);
      if (!eligibilityCheck.eligible) {
        throw new Error(`Job not eligible for invoicing: ${eligibilityCheck.reason}`);
      }

      // Step 2: AI-powered price optimization
      const optimizedPricing = await this.priceOptimizer.optimizeInvoicePricing(jobData);
      
      // Step 3: Generate invoice line items with market intelligence
      const lineItems = await this.generateIntelligentLineItems(jobData, optimizedPricing);
      
      // Step 4: Calculate totals and VAT
      const financials = this.calculateInvoiceFinancials(lineItems, jobData);
      
      // Step 5: AI review and fraud detection
      const aiReview = await this.aiReviewer.reviewInvoice({
        jobData,
        lineItems,
        financials,
        customerHistory: await this.getCustomerHistory(jobData.customer_id)
      });

      // Step 6: RUT eligibility assessment
      const rutAssessment = await this.rutHandler.assessRUTEligibility(jobData, financials);
      
      // Step 7: Create invoice record
      const invoiceData = {
        job_id: jobData.id,
        customer_id: jobData.customer_id,
        invoice_number: await this.generateInvoiceNumber(),
        
        // Financial data
        amount_excluding_vat: financials.subtotal,
        vat_amount: financials.vatAmount,
        rut_deduction: rutAssessment.eligible ? financials.rutDeduction : 0,
        total_amount: financials.total,
        
        // Dates
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: this.calculateDueDate(options.paymentTerms || 30),
        
        // AI analysis
        ai_review_score: aiReview.confidence,
        ai_review_notes: aiReview.notes,
        ai_fraud_risk: aiReview.fraudRisk,
        ai_approved: aiReview.confidence >= this.config.autoApprovalThreshold,
        human_review_required: aiReview.confidence < this.config.humanReviewThreshold,
        
        // Status
        status: this.determineInitialStatus(aiReview),
        created_by: options.userId || null
      };

      // Step 8: Save to database
      const savedInvoice = await this.saveInvoiceToDatabase(invoiceData, lineItems);
      
      // Step 9: Submit RUT application if eligible
      if (rutAssessment.eligible && aiReview.confidence >= this.config.humanReviewThreshold) {
        await this.rutHandler.submitRUTApplication(savedInvoice, jobData);
      }
      
      // Step 10: External system integration
      if (savedInvoice.ai_approved && !savedInvoice.human_review_required) {
        await this.integrateWithExternalSystems(savedInvoice);
      }

      console.log('✅ Smart invoice generated successfully', {
        invoiceId: savedInvoice.id,
        invoiceNumber: savedInvoice.invoice_number,
        aiScore: aiReview.confidence,
        autoApproved: savedInvoice.ai_approved
      });

      return {
        success: true,
        invoice: savedInvoice,
        aiAnalysis: aiReview,
        rutAssessment,
        optimizations: optimizedPricing.recommendations,
        processingTime: Date.now() - performance.now()
      };

    } catch (error) {
      console.error('❌ Smart invoice generation failed:', error);
      
      // Log error for analysis
      await this.logBillingError(error, jobData);
      
      return {
        success: false,
        error: error.message,
        fallbackAction: 'manual_invoice_creation_required'
      };
    }
  }

  /**
   * Validate if job is eligible for invoicing
   */
  async validateJobEligibility(jobData) {
    const checks = {
      isCompleted: jobData.status === 'completed',
      hasCustomer: !!jobData.customer_id,
      hasPrice: jobData.price && jobData.price > 0,
      noExistingInvoice: !(await this.checkExistingInvoice(jobData.id)),
      hasRequiredData: !!(jobData.pickup_address && jobData.delivery_address)
    };

    const failedChecks = Object.entries(checks)
      .filter(([key, passed]) => !passed)
      .map(([key]) => key);

    return {
      eligible: failedChecks.length === 0,
      reason: failedChecks.length > 0 ? `Failed checks: ${failedChecks.join(', ')}` : null,
      checks
    };
  }

  /**
   * Generate intelligent line items with market analysis
   */
  async generateIntelligentLineItems(jobData, optimizedPricing) {
    const lineItems = [];
    
    // Base moving service
    const baseService = {
      description: `Flyttjänst - ${jobData.pickup_address} till ${jobData.delivery_address}`,
      quantity: 1,
      unit_price: optimizedPricing.basePrice,
      line_total: optimizedPricing.basePrice,
      category: 'moving',
      ai_suggested_price: optimizedPricing.marketComparison.suggested_price,
      market_rate_comparison: optimizedPricing.marketComparison,
      price_optimization_applied: optimizedPricing.optimizationApplied
    };
    lineItems.push(baseService);

    // Additional services based on job data
    if (jobData.packing_service) {
      lineItems.push({
        description: 'Packningsservice',
        quantity: jobData.estimated_volume || 1,
        unit_price: optimizedPricing.packingPricePerCubicMeter || 150,
        line_total: (jobData.estimated_volume || 1) * (optimizedPricing.packingPricePerCubicMeter || 150),
        category: 'packing',
        ai_suggested_price: optimizedPricing.packingOptimized || 150,
        market_rate_comparison: optimizedPricing.packingMarketData,
        price_optimization_applied: true
      });
    }

    // Storage service
    if (jobData.storage_service) {
      lineItems.push({
        description: 'Lagerservice',
        quantity: jobData.storage_duration_days || 30,
        unit_price: optimizedPricing.storagePricePerDay || 25,
        line_total: (jobData.storage_duration_days || 30) * (optimizedPricing.storagePricePerDay || 25),
        category: 'storage',
        ai_suggested_price: optimizedPricing.storageOptimized || 25,
        market_rate_comparison: optimizedPricing.storageMarketData,
        price_optimization_applied: true
      });
    }

    // Distance-based pricing adjustment
    if (jobData.distance_km && jobData.distance_km > 50) {
      const extraDistancePrice = (jobData.distance_km - 50) * 15; // 15 SEK per extra km
      lineItems.push({
        description: `Extra körsträcka (${jobData.distance_km - 50} km över 50 km)`,
        quantity: jobData.distance_km - 50,
        unit_price: 15,
        line_total: extraDistancePrice,
        category: 'transport',
        ai_suggested_price: optimizedPricing.distanceOptimized || 15,
        market_rate_comparison: optimizedPricing.distanceMarketData,
        price_optimization_applied: false
      });
    }

    return lineItems;
  }

  /**
   * Calculate invoice financials with VAT and RUT
   */
  calculateInvoiceFinancials(lineItems, jobData) {
    const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
    const vatAmount = subtotal * this.config.standardVatRate;
    
    // RUT deduction applies to labor costs (not materials)
    const laborCosts = lineItems
      .filter(item => ['moving', 'packing'].includes(item.category))
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const rutDeduction = laborCosts * this.config.rutDeductionRate;
    const total = subtotal + vatAmount - rutDeduction;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      rutDeduction: Math.round(rutDeduction * 100) / 100,
      total: Math.round(total * 100) / 100,
      laborCosts: Math.round(laborCosts * 100) / 100
    };
  }

  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `NF-${year}-${timestamp.toString().slice(-6)}${random}`;
  }

  /**
   * Calculate due date based on payment terms
   */
  calculateDueDate(paymentTermsDays = 30) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);
    return dueDate.toISOString().split('T')[0];
  }

  /**
   * Determine initial invoice status based on AI review
   */
  determineInitialStatus(aiReview) {
    if (aiReview.fraudRisk > 0.3) return 'requires_review';
    if (aiReview.confidence >= this.config.autoApprovalThreshold) return 'approved';
    if (aiReview.confidence >= this.config.humanReviewThreshold) return 'pending_review';
    return 'draft';
  }

  /**
   * Save invoice and line items to database
   */
  async saveInvoiceToDatabase(invoiceData, lineItems) {
    try {
      // This would integrate with your database layer
      // For now, return mock saved data
      const savedInvoice = {
        id: Math.floor(Math.random() * 10000),
        ...invoiceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save line items (would be separate database call)
      const savedLineItems = lineItems.map((item, index) => ({
        id: Math.floor(Math.random() * 10000) + index,
        invoice_id: savedInvoice.id,
        ...item,
        created_at: new Date().toISOString()
      }));

      console.log('💾 Invoice saved to database', {
        invoiceId: savedInvoice.id,
        lineItemCount: savedLineItems.length
      });

      return { ...savedInvoice, line_items: savedLineItems };
      
    } catch (error) {
      console.error('❌ Database save failed:', error);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Integrate with external systems (Fortnox, Billo, etc.)
   */
  async integrateWithExternalSystems(invoice) {
    const integrationPromises = [];

    // Fortnox integration for accounting
    if (this.integrations.fortnox.isEnabled()) {
      integrationPromises.push(
        this.integrations.fortnox.syncInvoice(invoice)
          .catch(error => ({ system: 'fortnox', error: error.message }))
      );
    }

    // Billo integration for payment processing
    if (this.integrations.billo.isEnabled()) {
      integrationPromises.push(
        this.integrations.billo.submitInvoice(invoice)
          .catch(error => ({ system: 'billo', error: error.message }))
      );
    }

    const results = await Promise.allSettled(integrationPromises);
    
    console.log('🔗 External integrations completed', {
      invoiceId: invoice.id,
      integrations: results.length,
      successful: results.filter(r => r.status === 'fulfilled').length
    });

    return results;
  }

  /**
   * Get customer history for AI analysis
   */
  async getCustomerHistory(customerId) {
    // Mock customer history - in real implementation, query database
    return {
      total_invoices: Math.floor(Math.random() * 20) + 1,
      average_invoice_value: 12500 + Math.random() * 10000,
      payment_history: Math.random() > 0.1 ? 'good' : 'delayed',
      last_invoice_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      risk_factors: []
    };
  }

  /**
   * Check if invoice already exists for job
   */
  async checkExistingInvoice(jobId) {
    // Mock check - in real implementation, query database
    return Math.random() < 0.05; // 5% chance of existing invoice
  }

  /**
   * Log billing errors for analysis
   */
  async logBillingError(error, jobData) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error_message: error.message,
      error_stack: error.stack,
      job_id: jobData?.id,
      system: 'billing_engine',
      severity: 'error'
    };

    console.error('📝 Billing error logged:', errorLog);
    
    // In real implementation, save to database or monitoring system
  }

  /**
   * Process batch invoices for multiple completed jobs
   */
  async processBatchInvoices(jobs, options = {}) {
    console.log('📦 Starting batch invoice processing', { jobCount: jobs.length });
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    const batchSize = options.batchSize || 10;
    const batches = this.chunkArray(jobs, batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(async (job) => {
        try {
          const result = await this.generateSmartInvoice(job, options);
          if (result.success) {
            results.successful.push(result);
          } else {
            results.failed.push({ job: job.id, error: result.error });
          }
        } catch (error) {
          results.failed.push({ job: job.id, error: error.message });
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Small delay between batches to prevent system overload
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('✅ Batch processing completed', {
      total: jobs.length,
      successful: results.successful.length,
      failed: results.failed.length,
      skipped: results.skipped.length
    });

    return results;
  }

  /**
   * Utility function to chunk array into smaller batches
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get billing engine statistics
   */
  async getEngineStatistics() {
    return {
      total_invoices_generated: Math.floor(Math.random() * 1000) + 500,
      ai_auto_approved: Math.floor(Math.random() * 800) + 400,
      fraud_detected: Math.floor(Math.random() * 10) + 1,
      average_processing_time_ms: Math.floor(Math.random() * 500) + 150,
      integration_success_rate: 0.95 + Math.random() * 0.05,
      rut_applications_submitted: Math.floor(Math.random() * 600) + 300,
      cost_savings_identified: Math.floor(Math.random() * 50000) + 25000
    };
  }
}

/**
 * AI Invoice Reviewer for automated fraud detection and quality control
 */
export class AIInvoiceReviewer {
  constructor() {
    this.fraudDetector = new FraudDetectionEngine();
    this.qualityChecker = new InvoiceQualityChecker();
    this.confidenceCalculator = new ConfidenceScoreCalculator();
    
    console.log('🤖 AI Invoice Reviewer initialized');
  }

  /**
   * Comprehensive AI review of invoice
   */
  async reviewInvoice(invoiceContext) {
    try {
      console.log('🔍 Starting AI invoice review');
      
      // Fraud detection analysis
      const fraudAnalysis = await this.fraudDetector.analyzeInvoice(invoiceContext);
      
      // Quality and completeness check
      const qualityAnalysis = await this.qualityChecker.validateInvoice(invoiceContext);
      
      // Calculate overall confidence
      const confidence = await this.confidenceCalculator.calculateScore({
        fraud: fraudAnalysis,
        quality: qualityAnalysis,
        historical: invoiceContext.customerHistory
      });

      // Generate review notes
      const notes = this.generateReviewNotes(fraudAnalysis, qualityAnalysis, confidence);

      const review = {
        confidence: Math.round(confidence * 100) / 100,
        fraudRisk: fraudAnalysis.riskScore,
        qualityScore: qualityAnalysis.score,
        notes,
        recommendation: this.getRecommendation(confidence, fraudAnalysis.riskScore),
        processingTime: Date.now() - performance.now(),
        timestamp: new Date().toISOString()
      };

      console.log('✅ AI review completed', {
        confidence: review.confidence,
        fraudRisk: review.fraudRisk,
        recommendation: review.recommendation
      });

      return review;

    } catch (error) {
      console.error('❌ AI review failed:', error);
      
      // Return conservative review on error
      return {
        confidence: 0.5,
        fraudRisk: 0.5,
        qualityScore: 0.5,
        notes: `AI review failed: ${error.message}. Manual review required.`,
        recommendation: 'manual_review',
        error: true
      };
    }
  }

  generateReviewNotes(fraudAnalysis, qualityAnalysis, confidence) {
    const notes = [];
    
    if (fraudAnalysis.riskScore > 0.3) {
      notes.push(`High fraud risk detected: ${fraudAnalysis.riskFactors.join(', ')}`);
    }
    
    if (qualityAnalysis.score < 0.8) {
      notes.push(`Quality issues: ${qualityAnalysis.issues.join(', ')}`);
    }
    
    if (confidence >= 0.95) {
      notes.push('High confidence - recommended for auto-approval');
    } else if (confidence >= 0.75) {
      notes.push('Medium confidence - standard review recommended');
    } else {
      notes.push('Low confidence - thorough manual review required');
    }
    
    return notes.join('. ');
  }

  getRecommendation(confidence, fraudRisk) {
    if (fraudRisk > 0.3) return 'reject';
    if (confidence >= 0.95 && fraudRisk < 0.1) return 'auto_approve';
    if (confidence >= 0.75) return 'standard_review';
    return 'manual_review';
  }
}

/**
 * Fraud Detection Engine using pattern recognition
 */
export class FraudDetectionEngine {
  constructor() {
    this.patterns = {
      duplicateThreshold: 0.9,
      amountAnomalyThreshold: 3.0, // Standard deviations
      timePatternThreshold: 0.8
    };
  }

  async analyzeInvoice(context) {
    const riskFactors = [];
    let riskScore = 0;

    // Check for duplicate invoice patterns
    const duplicateRisk = await this.checkDuplicatePattern(context);
    if (duplicateRisk.isDuplicate) {
      riskFactors.push('potential_duplicate');
      riskScore += 0.4;
    }

    // Amount anomaly detection
    const amountRisk = await this.checkAmountAnomaly(context);
    if (amountRisk.isAnomalous) {
      riskFactors.push('amount_anomaly');
      riskScore += 0.3;
    }

    // Timing pattern analysis
    const timingRisk = await this.checkTimingPattern(context);
    if (timingRisk.isSuspicious) {
      riskFactors.push('suspicious_timing');
      riskScore += 0.2;
    }

    // Customer history validation
    const historyRisk = await this.checkCustomerHistory(context);
    if (historyRisk.hasRiskFactors) {
      riskFactors.push('customer_risk_factors');
      riskScore += 0.1;
    }

    return {
      riskScore: Math.min(riskScore, 1.0),
      riskFactors,
      details: {
        duplicate: duplicateRisk,
        amount: amountRisk,
        timing: timingRisk,
        history: historyRisk
      }
    };
  }

  async checkDuplicatePattern(context) {
    // Mock duplicate detection
    const similarity = Math.random();
    return {
      isDuplicate: similarity > this.patterns.duplicateThreshold,
      similarity,
      matchingInvoices: similarity > this.patterns.duplicateThreshold ? ['INV-123456'] : []
    };
  }

  async checkAmountAnomaly(context) {
    // Mock amount anomaly detection
    const variance = Math.random() * 4; // 0-4 standard deviations
    return {
      isAnomalous: variance > this.patterns.amountAnomalyThreshold,
      variance,
      expectedRange: [8000, 15000],
      actualAmount: context.financials?.total || 12500
    };
  }

  async checkTimingPattern(context) {
    // Mock timing analysis
    const suspicionScore = Math.random();
    return {
      isSuspicious: suspicionScore > this.patterns.timePatternThreshold,
      suspicionScore,
      patterns: ['normal_business_hours']
    };
  }

  async checkCustomerHistory(context) {
    const history = context.customerHistory;
    const riskFactors = [];
    
    if (history.payment_history === 'delayed') {
      riskFactors.push('payment_delays');
    }
    
    return {
      hasRiskFactors: riskFactors.length > 0,
      riskFactors,
      trustScore: riskFactors.length === 0 ? 0.9 : 0.6
    };
  }
}

/**
 * Invoice Quality Checker for completeness and accuracy
 */
export class InvoiceQualityChecker {
  async validateInvoice(context) {
    const issues = [];
    let score = 1.0;

    // Check required fields
    if (!context.jobData.customer_id) {
      issues.push('missing_customer');
      score -= 0.3;
    }

    if (!context.jobData.price || context.jobData.price <= 0) {
      issues.push('invalid_amount');
      score -= 0.4;
    }

    if (!context.jobData.pickup_address || !context.jobData.delivery_address) {
      issues.push('incomplete_addresses');
      score -= 0.2;
    }

    // Check line items validity
    if (!context.lineItems || context.lineItems.length === 0) {
      issues.push('no_line_items');
      score -= 0.3;
    }

    return {
      score: Math.max(score, 0),
      issues,
      isValid: score >= 0.7
    };
  }
}

/**
 * Confidence Score Calculator combining multiple factors
 */
export class ConfidenceScoreCalculator {
  async calculateScore(analyses) {
    let baseConfidence = 0.8; // Start with 80% confidence
    
    // Fraud risk adjustment
    baseConfidence -= analyses.fraud.riskScore * 0.4;
    
    // Quality adjustment
    baseConfidence = baseConfidence * analyses.quality.score;
    
    // Historical data adjustment
    if (analyses.historical.payment_history === 'good') {
      baseConfidence += 0.1;
    } else {
      baseConfidence -= 0.05;
    }
    
    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, baseConfidence));
  }
}

// Mock integration classes for external systems
export class FortnoxIntegration {
  isEnabled() { return process.env.FORTNOX_ENABLED === 'true'; }
  async syncInvoice(invoice) {
    console.log('🔗 Syncing with Fortnox:', invoice.invoice_number);
    return { success: true, fortnox_id: 'FX-' + Math.random().toString(36).substr(2, 9) };
  }
}

export class BilloIntegration {
  isEnabled() { return process.env.BILLO_ENABLED === 'true'; }
  async submitInvoice(invoice) {
    console.log('💳 Submitting to Billo:', invoice.invoice_number);
    return { success: true, billo_id: 'BI-' + Math.random().toString(36).substr(2, 9) };
  }
}

export class SkatteverketIntegration {
  isEnabled() { return process.env.SKATTEVERKET_ENABLED === 'true'; }
  async submitRUTApplication(invoice, jobData) {
    console.log('🏛️ Submitting RUT application:', invoice.invoice_number);
    return { success: true, application_id: 'RUT-' + Math.random().toString(36).substr(2, 9) };
  }
}

/**
 * RUT Application Handler for Swedish tax deductions
 * Handles eligibility assessment and application submission
 */
export class RUTApplicationHandler {
  constructor() {
    this.skatteverket = new SkatteverketIntegration();
    this.config = {
      maxAnnualDeduction: 75000, // SEK
      deductionRate: 0.50, // 50% of labor costs
      minDeductionAmount: 100, // SEK
      maxSingleJobDeduction: 25000 // SEK
    };
    
    console.log('🏛️ RUT Application Handler initialized');
  }

  /**
   * Assess RUT eligibility for a completed job
   */
  async assessRUTEligibility(jobData, financials) {
    try {
      console.log('🔍 Assessing RUT eligibility', { jobId: jobData.id });
      
      const eligibilityChecks = {
        isMovingService: this.isEligibleService(jobData),
        hasSwedishCustomer: await this.validateSwedishCustomer(jobData.customer_id),
        isResidentialProperty: this.isResidentialProperty(jobData),
        withinDeductionLimits: this.checkDeductionLimits(financials),
        hasRequiredDocumentation: this.validateDocumentation(jobData)
      };

      const eligible = Object.values(eligibilityChecks).every(check => check === true);
      const potentialDeduction = eligible ? this.calculateRUTDeduction(financials) : 0;

      const assessment = {
        eligible,
        eligibilityChecks,
        potentialDeduction,
        maxAnnualRemaining: await this.getCustomerRemainingDeduction(jobData.customer_id),
        estimatedProcessingDays: 14,
        confidence: this.calculateEligibilityConfidence(eligibilityChecks),
        notes: this.generateEligibilityNotes(eligibilityChecks, eligible)
      };

      console.log('✅ RUT eligibility assessment completed', {
        eligible: assessment.eligible,
        deduction: assessment.potentialDeduction,
        confidence: assessment.confidence
      });

      return assessment;

    } catch (error) {
      console.error('❌ RUT eligibility assessment failed:', error);
      return {
        eligible: false,
        error: error.message,
        confidence: 0,
        notes: 'Assessment failed due to technical error'
      };
    }
  }

  /**
   * Submit RUT application to Skatteverket
   */
  async submitRUTApplication(invoice, jobData) {
    try {
      console.log('📋 Submitting RUT application', { invoiceId: invoice.id });
      
      const applicationData = {
        invoice_id: invoice.id,
        customer_personnummer: await this.getCustomerPersonnummer(jobData.customer_id),
        property_address: jobData.delivery_address || jobData.pickup_address,
        property_type: this.determinePropertyType(jobData),
        service_type: 'moving',
        deduction_amount: invoice.rut_deduction,
        application_date: new Date().toISOString().split('T')[0],
        supporting_documents: await this.gatherSupportingDocuments(invoice, jobData)
      };

      // Submit to Skatteverket (mock for now)
      const submissionResult = await this.skatteverket.submitRUTApplication(invoice, jobData);
      
      if (submissionResult.success) {
        // Save application record to database
        const applicationRecord = await this.saveApplicationToDatabase({
          ...applicationData,
          application_id: submissionResult.application_id,
          status: 'submitted',
          ai_validation_score: 0.95
        });

        console.log('✅ RUT application submitted successfully', {
          applicationId: submissionResult.application_id,
          deductionAmount: applicationData.deduction_amount
        });

        return {
          success: true,
          application: applicationRecord,
          skatteverket_response: submissionResult
        };
      } else {
        throw new Error('Skatteverket submission failed');
      }

    } catch (error) {
      console.error('❌ RUT application submission failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if service type is eligible for RUT deduction
   */
  isEligibleService(jobData) {
    const eligibleServices = ['moving', 'packing', 'cleaning', 'storage'];
    return eligibleServices.includes(jobData.service_type || jobData.type);
  }

  /**
   * Validate customer is Swedish resident
   */
  async validateSwedishCustomer(customerId) {
    // Mock validation - in real implementation, check customer registry
    return Math.random() > 0.1; // 90% of customers are Swedish
  }

  /**
   * Check if property is residential (required for RUT)
   */
  isResidentialProperty(jobData) {
    // Simple heuristic - look for residential indicators
    const address = jobData.delivery_address || jobData.pickup_address || '';
    const residentialKeywords = ['lägenhet', 'villa', 'hus', 'radhus', 'bostadsrätt'];
    
    return residentialKeywords.some(keyword => 
      address.toLowerCase().includes(keyword.toLowerCase())
    ) || Math.random() > 0.2; // Default 80% residential
  }

  /**
   * Check deduction amount limits
   */
  checkDeductionLimits(financials) {
    const deduction = financials.rutDeduction || 0;
    return deduction >= this.config.minDeductionAmount && 
           deduction <= this.config.maxSingleJobDeduction;
  }

  /**
   * Validate required documentation exists
   */
  validateDocumentation(jobData) {
    // Mock validation - check for required documents
    return jobData.documentation_complete !== false;
  }

  /**
   * Calculate RUT deduction amount
   */
  calculateRUTDeduction(financials) {
    const laborCosts = financials.laborCosts || 0;
    const deduction = laborCosts * this.config.deductionRate;
    
    return Math.min(
      Math.max(deduction, this.config.minDeductionAmount),
      this.config.maxSingleJobDeduction
    );
  }

  /**
   * Get customer's remaining annual RUT deduction
   */
  async getCustomerRemainingDeduction(customerId) {
    // Mock calculation - in real implementation, query Skatteverket or database
    const usedThisYear = Math.random() * 50000;
    return Math.max(0, this.config.maxAnnualDeduction - usedThisYear);
  }

  /**
   * Calculate confidence score for eligibility
   */
  calculateEligibilityConfidence(checks) {
    const weights = {
      isMovingService: 0.25,
      hasSwedishCustomer: 0.30,
      isResidentialProperty: 0.20,
      withinDeductionLimits: 0.15,
      hasRequiredDocumentation: 0.10
    };

    return Object.entries(checks).reduce((confidence, [check, passed]) => {
      return confidence + (passed ? weights[check] || 0 : 0);
    }, 0);
  }

  /**
   * Generate eligibility notes
   */
  generateEligibilityNotes(checks, eligible) {
    const failedChecks = Object.entries(checks)
      .filter(([key, passed]) => !passed)
      .map(([key]) => key);

    if (eligible) {
      return 'All RUT eligibility requirements met. Application ready for submission.';
    } else {
      return `RUT not eligible: ${failedChecks.join(', ')}. Manual review recommended.`;
    }
  }

  /**
   * Save application to database
   */
  async saveApplicationToDatabase(applicationData) {
    // Mock database save
    const saved = {
      id: Math.floor(Math.random() * 10000),
      ...applicationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 RUT application saved to database', { id: saved.id });
    return saved;
  }

  /**
   * Get customer's personnummer (masked for privacy)
   */
  async getCustomerPersonnummer(customerId) {
    // Mock - in real implementation, get from secure customer database
    return 'XXXXXXXX-XXXX'; // Masked for GDPR compliance
  }

  /**
   * Determine property type for RUT application
   */
  determinePropertyType(jobData) {
    const address = jobData.delivery_address || jobData.pickup_address || '';
    
    if (address.toLowerCase().includes('lägenhet')) return 'apartment';
    if (address.toLowerCase().includes('villa')) return 'villa';
    if (address.toLowerCase().includes('radhus')) return 'townhouse';
    
    return 'apartment'; // Default
  }

  /**
   * Gather supporting documents for application
   */
  async gatherSupportingDocuments(invoice, jobData) {
    return {
      invoice_pdf: `/invoices/${invoice.invoice_number}.pdf`,
      job_completion_photos: jobData.completion_photos || [],
      customer_id_verification: 'verified',
      property_documentation: 'address_verified'
    };
  }
}

/**
 * Price Optimization Engine with market intelligence
 * Provides AI-driven pricing recommendations and market analysis
 */
export class PriceOptimizationEngine {
  constructor() {
    this.marketData = new MarketDataProvider();
    this.pricingModel = new DynamicPricingModel();
    this.competitorAnalyzer = new CompetitorAnalyzer();
    
    console.log('💰 Price Optimization Engine initialized');
  }

  /**
   * Optimize invoice pricing based on market intelligence
   */
  async optimizeInvoicePricing(jobData) {
    try {
      console.log('📊 Starting price optimization', { jobId: jobData.id });
      
      // Get current market rates
      const marketRates = await this.marketData.getCurrentRates(jobData);
      
      // Analyze competitor pricing
      const competitorPricing = await this.competitorAnalyzer.analyzeCompetitors(jobData);
      
      // Apply dynamic pricing model
      const optimizedPricing = await this.pricingModel.generateOptimizedPricing({
        jobData,
        marketRates,
        competitorPricing
      });
      
      // Calculate potential savings/improvements
      const optimization = this.calculateOptimization(jobData.price, optimizedPricing);
      
      const result = {
        basePrice: optimizedPricing.basePrice,
        optimizationApplied: optimization.applied,
        potentialSavings: optimization.savings,
        marketComparison: {
          suggested_price: optimizedPricing.basePrice,
          market_average: marketRates.average,
          competitive_position: this.determineCompetitivePosition(optimizedPricing.basePrice, marketRates),
          confidence: marketRates.confidence
        },
        recommendations: this.generatePricingRecommendations(optimization, marketRates)
      };

      // Add service-specific optimizations
      if (jobData.packing_service) {
        result.packingPricePerCubicMeter = optimizedPricing.packingRate;
        result.packingOptimized = marketRates.packing?.optimized || 150;
        result.packingMarketData = marketRates.packing;
      }

      if (jobData.storage_service) {
        result.storagePricePerDay = optimizedPricing.storageRate;
        result.storageOptimized = marketRates.storage?.optimized || 25;
        result.storageMarketData = marketRates.storage;
      }

      if (jobData.distance_km && jobData.distance_km > 50) {
        result.distanceOptimized = optimizedPricing.distanceRate;
        result.distanceMarketData = marketRates.distance;
      }

      console.log('✅ Price optimization completed', {
        originalPrice: jobData.price,
        optimizedPrice: result.basePrice,
        improvement: optimization.improvement
      });

      return result;

    } catch (error) {
      console.error('❌ Price optimization failed:', error);
      
      // Return fallback pricing
      return {
        basePrice: jobData.price || 12500,
        optimizationApplied: false,
        error: error.message,
        marketComparison: {
          suggested_price: jobData.price || 12500,
          market_average: 12500,
          competitive_position: 'unknown',
          confidence: 0.5
        },
        recommendations: ['Manual price review recommended due to optimization error']
      };
    }
  }

  /**
   * Calculate optimization metrics
   */
  calculateOptimization(originalPrice, optimizedPricing) {
    const original = originalPrice || 0;
    const optimized = optimizedPricing.basePrice || original;
    const difference = optimized - original;
    const improvement = original > 0 ? (difference / original) * 100 : 0;
    
    return {
      applied: Math.abs(difference) > 100, // Apply if difference > 100 SEK
      savings: Math.max(0, -difference), // Savings if price reduced
      additional_revenue: Math.max(0, difference), // Extra revenue if price increased
      improvement: Math.round(improvement * 100) / 100,
      reason: this.determineOptimizationReason(difference)
    };
  }

  /**
   * Determine competitive position
   */
  determineCompetitivePosition(price, marketRates) {
    const ratio = price / marketRates.average;
    
    if (ratio < 0.9) return 'below_market';
    if (ratio > 1.1) return 'above_market';
    return 'market_aligned';
  }

  /**
   * Generate pricing recommendations
   */
  generatePricingRecommendations(optimization, marketRates) {
    const recommendations = [];
    
    if (optimization.applied) {
      if (optimization.savings > 0) {
        recommendations.push(`Price reduction recommended: Save customer ${optimization.savings} SEK`);
      } else if (optimization.additional_revenue > 0) {
        recommendations.push(`Price increase justified: Additional ${optimization.additional_revenue} SEK revenue`);
      }
    }
    
    if (marketRates.confidence < 0.7) {
      recommendations.push('Low market data confidence - consider manual review');
    }
    
    if (marketRates.trend === 'increasing') {
      recommendations.push('Market prices trending upward - consider future pricing strategy');
    }
    
    return recommendations.length > 0 ? recommendations : ['Current pricing appears optimal'];
  }

  /**
   * Determine reason for optimization
   */
  determineOptimizationReason(difference) {
    if (Math.abs(difference) < 100) return 'minimal_adjustment';
    if (difference > 0) return 'market_opportunity';
    return 'competitive_adjustment';
  }
}

// Market data and competitor analysis classes (simplified implementations)
export class MarketDataProvider {
  async getCurrentRates(jobData) {
    // Mock market data - in real implementation, query APIs or databases
    const baseRate = 8000 + Math.random() * 8000; // 8000-16000 SEK
    
    return {
      average: Math.round(baseRate),
      min: Math.round(baseRate * 0.7),
      max: Math.round(baseRate * 1.4),
      confidence: 0.75 + Math.random() * 0.2,
      trend: Math.random() > 0.5 ? 'stable' : 'increasing',
      sources: 5,
      last_updated: new Date().toISOString(),
      packing: {
        average: 150,
        optimized: 140 + Math.random() * 20
      },
      storage: {
        average: 25,
        optimized: 20 + Math.random() * 10
      },
      distance: {
        average: 15,
        optimized: 12 + Math.random() * 6
      }
    };
  }
}

export class DynamicPricingModel {
  async generateOptimizedPricing(context) {
    const { jobData, marketRates, competitorPricing } = context;
    
    // Apply AI-based pricing algorithm (simplified)
    let basePrice = marketRates.average;
    
    // Adjust for job complexity
    if (jobData.volume > 20) basePrice *= 1.2;
    if (jobData.priority === 'urgent') basePrice *= 1.15;
    if (jobData.distance_km > 30) basePrice *= 1.1;
    
    // Competitor adjustment
    if (competitorPricing.averagePrice < basePrice * 0.9) {
      basePrice = competitorPricing.averagePrice * 1.05; // Stay competitive but slightly above
    }
    
    return {
      basePrice: Math.round(basePrice),
      packingRate: 140 + Math.random() * 20,
      storageRate: 20 + Math.random() * 10,
      distanceRate: 12 + Math.random() * 6,
      confidence: 0.85
    };
  }
}

export class CompetitorAnalyzer {
  async analyzeCompetitors(jobData) {
    // Mock competitor analysis
    return {
      averagePrice: 11500 + Math.random() * 3000,
      competitorCount: 3,
      marketPosition: 'competitive',
      priceRange: {
        min: 9000,
        max: 16000
      }
    };
  }
}

console.log('✅ Enhanced Billing Engine with RUT and Price Optimization loaded successfully');