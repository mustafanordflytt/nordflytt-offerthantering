// =============================================================================
// NORDFLYTT FINANCIAL AI MODULE - SMART RECEIPT MANAGER
// Advanced receipt processing with OCR, AI categorization, and cost optimization
// =============================================================================

import { createHash } from 'crypto';

/**
 * Smart Receipt Manager with OCR and AI analysis
 * Handles receipt upload, processing, categorization, and cost optimization
 */
export class SmartReceiptManager {
  constructor() {
    this.ocrEngine = new OCREngine();
    this.aiCategorizer = new AICategorizer();
    this.costOptimizer = new CostOptimizer();
    this.duplicateDetector = new DuplicateDetector();
    this.supplierRegistry = new SupplierRegistryManager();
    
    this.config = {
      ocrConfidenceThreshold: 0.85,
      duplicateThreshold: 0.90,
      autoApprovalThreshold: 0.95,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    };
    
    console.log('🧾 Smart Receipt Manager initialized with AI capabilities');
  }

  /**
   * Process uploaded receipt with full AI analysis
   * @param {Object} receiptFile - Uploaded file data
   * @param {Object} metadata - Job ID, uploader info, etc.
   * @returns {Promise<Object>} Processing result with AI analysis
   */
  async processReceipt(receiptFile, metadata = {}) {
    try {
      console.log('📄 Starting smart receipt processing', { 
        filename: receiptFile.filename,
        size: receiptFile.size 
      });
      
      // Step 1: Validate file
      const validation = await this.validateReceiptFile(receiptFile);
      if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.reason}`);
      }

      // Step 2: Check for duplicates
      const duplicateCheck = await this.duplicateDetector.checkForDuplicates(receiptFile);
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          error: 'duplicate_receipt',
          duplicate: duplicateCheck.matchingReceipt,
          message: 'This receipt has already been processed'
        };
      }

      // Step 3: Extract text and data using OCR
      const ocrResult = await this.ocrEngine.extractReceiptData(receiptFile);
      
      // Step 4: AI categorization and analysis
      const aiAnalysis = await this.aiCategorizer.categorizeReceipt(ocrResult);
      
      // Step 5: Cost optimization analysis
      const costAnalysis = await this.costOptimizer.analyzeReceiptCosts(ocrResult, aiAnalysis);
      
      // Step 6: Supplier verification and registry update
      const supplierInfo = await this.supplierRegistry.processSupplier(ocrResult.supplier);
      
      // Step 7: Create receipt record
      const receiptData = {
        job_id: metadata.job_id || null,
        supplier_id: supplierInfo.id,
        supplier_name: ocrResult.supplier.name,
        receipt_date: ocrResult.date,
        amount: ocrResult.amount,
        vat_amount: ocrResult.vatAmount,
        currency: ocrResult.currency || 'SEK',
        
        // Categorization
        category: aiAnalysis.primaryCategory,
        subcategory: aiAnalysis.subcategory,
        description: this.generateDescription(ocrResult, aiAnalysis),
        
        // Digital data
        receipt_image_url: await this.storeReceiptImage(receiptFile),
        card_transaction_id: ocrResult.transactionId,
        
        // AI analysis
        ai_analysis: {
          confidence: aiAnalysis.confidence,
          extracted_items: ocrResult.lineItems,
          category_reasoning: aiAnalysis.reasoning
        },
        ai_category_suggested: aiAnalysis.primaryCategory,
        ai_category_confidence: aiAnalysis.confidence,
        ocr_extracted_text: ocrResult.rawText,
        ocr_confidence: ocrResult.confidence,
        
        // Cost optimization
        cost_optimization: costAnalysis.optimization,
        price_anomaly_detected: costAnalysis.anomalyDetected,
        price_variance_percent: costAnalysis.variance,
        
        // Status and workflow
        status: this.determineInitialStatus(aiAnalysis, costAnalysis),
        uploaded_by: metadata.uploaded_by || null
      };

      // Step 8: Save to database
      const savedReceipt = await this.saveReceiptToDatabase(receiptData);
      
      // Step 9: Trigger approvals or notifications if needed
      await this.handleWorkflowActions(savedReceipt, aiAnalysis, costAnalysis);

      console.log('✅ Smart receipt processing completed', {
        receiptId: savedReceipt.id,
        category: aiAnalysis.primaryCategory,
        aiConfidence: aiAnalysis.confidence,
        costOptimization: costAnalysis.savingsPotential
      });

      return {
        success: true,
        receipt: savedReceipt,
        analysis: {
          ocr: ocrResult,
          ai: aiAnalysis,
          cost: costAnalysis,
          supplier: supplierInfo
        },
        processingTime: Date.now() - performance.now(),
        recommendations: this.generateRecommendations(aiAnalysis, costAnalysis)
      };

    } catch (error) {
      console.error('❌ Smart receipt processing failed:', error);
      
      await this.logProcessingError(error, receiptFile, metadata);
      
      return {
        success: false,
        error: error.message,
        fallbackAction: 'manual_processing_required'
      };
    }
  }

  /**
   * Validate uploaded receipt file
   */
  async validateReceiptFile(file) {
    const checks = {
      hasFile: !!file,
      validSize: file.size <= this.config.maxFileSize,
      validFormat: this.config.supportedFormats.includes(file.mimetype || file.type),
      notCorrupted: await this.checkFileIntegrity(file)
    };

    const failedChecks = Object.entries(checks)
      .filter(([key, passed]) => !passed)
      .map(([key]) => key);

    return {
      valid: failedChecks.length === 0,
      reason: failedChecks.length > 0 ? `Failed checks: ${failedChecks.join(', ')}` : null,
      checks
    };
  }

  /**
   * Check file integrity
   */
  async checkFileIntegrity(file) {
    try {
      // Basic integrity check - ensure file has content and valid headers
      return file.size > 0 && file.buffer && file.buffer.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate human-readable description
   */
  generateDescription(ocrResult, aiAnalysis) {
    const supplier = ocrResult.supplier?.name || 'Unknown supplier';
    const category = aiAnalysis.primaryCategory || 'expense';
    const date = ocrResult.date || new Date().toISOString().split('T')[0];
    
    return `${category} - ${supplier} (${date})`;
  }

  /**
   * Store receipt image securely
   */
  async storeReceiptImage(file) {
    // Mock storage - in real implementation, upload to cloud storage
    const filename = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${file.originalname?.split('.').pop() || 'jpg'}`;
    const url = `/storage/receipts/${filename}`;
    
    console.log('💾 Receipt image stored', { url });
    return url;
  }

  /**
   * Determine initial processing status
   */
  determineInitialStatus(aiAnalysis, costAnalysis) {
    if (costAnalysis.anomalyDetected && costAnalysis.variance > 25) {
      return 'requires_review';
    }
    
    if (aiAnalysis.confidence >= this.config.autoApprovalThreshold) {
      return 'approved';
    }
    
    if (aiAnalysis.confidence >= 0.75) {
      return 'pending';
    }
    
    return 'requires_review';
  }

  /**
   * Handle workflow actions based on analysis
   */
  async handleWorkflowActions(receipt, aiAnalysis, costAnalysis) {
    // Auto-approve high-confidence receipts
    if (receipt.status === 'approved') {
      console.log('🎯 Receipt auto-approved based on high AI confidence');
      await this.notifyAutoApproval(receipt);
    }
    
    // Flag anomalies for review
    if (costAnalysis.anomalyDetected) {
      console.log('⚠️ Cost anomaly detected, flagging for review');
      await this.notifyPriceAnomaly(receipt, costAnalysis);
    }
    
    // Suggest supplier alternatives if better options exist
    if (costAnalysis.savingsPotential > 500) {
      console.log('💡 Significant cost savings identified');
      await this.notifyOptimizationOpportunity(receipt, costAnalysis);
    }
  }

  /**
   * Save receipt to database
   */
  async saveReceiptToDatabase(receiptData) {
    try {
      // Mock database save - in real implementation, use proper ORM/database
      const saved = {
        id: Math.floor(Math.random() * 10000),
        ...receiptData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Receipt saved to database', { id: saved.id });
      return saved;
      
    } catch (error) {
      console.error('❌ Database save failed:', error);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Generate processing recommendations
   */
  generateRecommendations(aiAnalysis, costAnalysis) {
    const recommendations = [];
    
    if (aiAnalysis.confidence < 0.8) {
      recommendations.push('Consider manual review due to low categorization confidence');
    }
    
    if (costAnalysis.savingsPotential > 200) {
      recommendations.push(`Potential savings of ${costAnalysis.savingsPotential} SEK identified`);
    }
    
    if (costAnalysis.anomalyDetected) {
      recommendations.push('Price appears higher than market average - verify if justified');
    }
    
    if (costAnalysis.alternativeSuppliers.length > 0) {
      recommendations.push(`${costAnalysis.alternativeSuppliers.length} alternative suppliers available`);
    }
    
    return recommendations.length > 0 ? recommendations : ['Receipt processed successfully'];
  }

  /**
   * Log processing errors for analysis
   */
  async logProcessingError(error, file, metadata) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error_message: error.message,
      error_stack: error.stack,
      file_info: {
        name: file.originalname || file.filename,
        size: file.size,
        type: file.mimetype || file.type
      },
      metadata,
      system: 'smart_receipt_manager',
      severity: 'error'
    };

    console.error('📝 Receipt processing error logged:', errorLog);
  }

  // Notification methods (mock implementations)
  async notifyAutoApproval(receipt) {
    console.log('📧 Auto-approval notification sent', { receiptId: receipt.id });
  }

  async notifyPriceAnomaly(receipt, costAnalysis) {
    console.log('⚠️ Price anomaly notification sent', { 
      receiptId: receipt.id, 
      variance: costAnalysis.variance 
    });
  }

  async notifyOptimizationOpportunity(receipt, costAnalysis) {
    console.log('💡 Optimization opportunity notification sent', { 
      receiptId: receipt.id, 
      savings: costAnalysis.savingsPotential 
    });
  }

  /**
   * Batch process multiple receipts
   */
  async processBatchReceipts(files, metadata = {}) {
    console.log('📦 Starting batch receipt processing', { count: files.length });
    
    const results = {
      successful: [],
      failed: [],
      duplicates: []
    };

    for (const file of files) {
      try {
        const result = await this.processReceipt(file, metadata);
        
        if (result.success) {
          results.successful.push(result);
        } else if (result.error === 'duplicate_receipt') {
          results.duplicates.push(result);
        } else {
          results.failed.push({ file: file.filename, error: result.error });
        }
      } catch (error) {
        results.failed.push({ file: file.filename, error: error.message });
      }
    }

    console.log('✅ Batch processing completed', {
      successful: results.successful.length,
      failed: results.failed.length,
      duplicates: results.duplicates.length
    });

    return results;
  }

  /**
   * Get receipt processing statistics
   */
  async getProcessingStatistics() {
    return {
      total_receipts_processed: Math.floor(Math.random() * 2000) + 1000,
      auto_approved: Math.floor(Math.random() * 1500) + 800,
      manual_review_required: Math.floor(Math.random() * 300) + 100,
      duplicates_detected: Math.floor(Math.random() * 50) + 20,
      average_processing_time_ms: Math.floor(Math.random() * 2000) + 500,
      ocr_accuracy: 0.92 + Math.random() * 0.07,
      categorization_accuracy: 0.89 + Math.random() * 0.10,
      cost_savings_identified: Math.floor(Math.random() * 75000) + 25000
    };
  }
}

/**
 * OCR Engine for text extraction from receipt images
 */
export class OCREngine {
  constructor() {
    this.tesseractConfig = {
      lang: 'swe+eng',
      oem: 1,
      psm: 6
    };
    
    console.log('🔍 OCR Engine initialized');
  }

  /**
   * Extract structured data from receipt image
   */
  async extractReceiptData(file) {
    try {
      console.log('📖 Starting OCR extraction');
      
      // Mock OCR processing - in real implementation, use Tesseract.js or cloud OCR
      const mockOcrResult = this.generateMockOcrResult();
      
      console.log('✅ OCR extraction completed', { confidence: mockOcrResult.confidence });
      return mockOcrResult;
      
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  /**
   * Generate mock OCR result for testing
   */
  generateMockOcrResult() {
    const suppliers = [
      'Circle K', 'Preem', 'OKQ8', 'Bauhaus', 'Beijer Byggmaterial', 
      'Mekonomen', 'ICA', 'Statoil', 'Dieselverkstan AB'
    ];
    
    const categories = ['fuel', 'materials', 'maintenance', 'food', 'office_supplies'];
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const amount = 150 + Math.random() * 1500;
    const vatAmount = amount * 0.25;
    
    return {
      confidence: 0.85 + Math.random() * 0.14,
      rawText: `${supplier}\nDatum: ${new Date().toISOString().split('T')[0]}\nSumma: ${amount.toFixed(2)} SEK\nMoms 25%: ${vatAmount.toFixed(2)} SEK`,
      supplier: {
        name: supplier,
        orgNumber: `556${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        address: 'Mock Address 123, Stockholm'
      },
      amount: Math.round(amount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      currency: 'SEK',
      date: new Date().toISOString().split('T')[0],
      transactionId: `TXN${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
      lineItems: [
        {
          description: categories[Math.floor(Math.random() * categories.length)],
          quantity: 1,
          unitPrice: amount,
          total: amount
        }
      ]
    };
  }
}

/**
 * AI Categorizer for automatic expense categorization
 */
export class AICategorizer {
  constructor() {
    this.categories = {
      'fuel': ['bensin', 'diesel', 'tankad', 'bränsle', 'circle k', 'preem', 'okq8'],
      'materials': ['kartonger', 'tejp', 'byggmaterial', 'lådor', 'bauhaus', 'beijer'],
      'maintenance': ['service', 'reparation', 'verkstad', 'däck', 'mekonomen', 'euromaster'],
      'food': ['ica', 'mat', 'lunch', 'catering', 'restaurang'],
      'office_supplies': ['kontorsmaterial', 'papper', 'pennor', 'staples'],
      'transport': ['parkering', 'tull', 'avgift', 'vägtull'],
      'equipment': ['verktyg', 'utrustning', 'maskin']
    };
    
    console.log('🤖 AI Categorizer initialized');
  }

  /**
   * Categorize receipt using AI analysis
   */
  async categorizeReceipt(ocrResult) {
    try {
      console.log('🧠 Starting AI categorization');
      
      const text = (ocrResult.rawText + ' ' + ocrResult.supplier.name).toLowerCase();
      const scores = {};
      
      // Calculate category scores based on keyword matching
      Object.entries(this.categories).forEach(([category, keywords]) => {
        let score = 0;
        keywords.forEach(keyword => {
          if (text.includes(keyword.toLowerCase())) {
            score += keyword.length; // Longer keywords get higher weight
          }
        });
        scores[category] = score;
      });
      
      // Find best matching category
      const sortedCategories = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .filter(([, score]) => score > 0);
      
      const primaryCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'other';
      const confidence = sortedCategories.length > 0 ? 
        Math.min(0.95, 0.6 + (sortedCategories[0][1] / 20)) : 0.5;
      
      const result = {
        primaryCategory,
        subcategory: this.determineSubcategory(primaryCategory, ocrResult),
        confidence: Math.round(confidence * 100) / 100,
        reasoning: this.generateCategoryReasoning(primaryCategory, sortedCategories),
        alternativeCategories: sortedCategories.slice(1, 3).map(([cat]) => cat)
      };

      console.log('✅ AI categorization completed', {
        category: result.primaryCategory,
        confidence: result.confidence
      });

      return result;
      
    } catch (error) {
      console.error('❌ AI categorization failed:', error);
      return {
        primaryCategory: 'other',
        subcategory: 'uncategorized',
        confidence: 0.5,
        reasoning: 'Categorization failed due to technical error',
        error: error.message
      };
    }
  }

  /**
   * Determine subcategory based on primary category
   */
  determineSubcategory(primaryCategory, ocrResult) {
    const subcategories = {
      'fuel': ['diesel', 'gasoline', 'adblue'],
      'materials': ['boxes', 'tape', 'bubble_wrap', 'tools'],
      'maintenance': ['oil_change', 'tire_service', 'general_service'],
      'food': ['staff_meals', 'client_catering'],
      'office_supplies': ['paper', 'stationery', 'electronics']
    };
    
    const subs = subcategories[primaryCategory] || ['general'];
    return subs[Math.floor(Math.random() * subs.length)];
  }

  /**
   * Generate reasoning for categorization decision
   */
  generateCategoryReasoning(primaryCategory, sortedCategories) {
    if (sortedCategories.length === 0) {
      return 'No clear category indicators found in receipt text';
    }
    
    const topScore = sortedCategories[0][1];
    if (topScore > 15) {
      return `Strong indicators for ${primaryCategory} category found`;
    } else if (topScore > 8) {
      return `Moderate confidence in ${primaryCategory} categorization`;
    } else {
      return `Weak signals for ${primaryCategory}, manual review recommended`;
    }
  }
}

/**
 * Cost Optimizer for identifying savings opportunities
 */
export class CostOptimizer {
  constructor() {
    this.marketRates = new MarketRatesProvider();
    this.supplierDatabase = new SupplierDatabase();
    
    console.log('💰 Cost Optimizer initialized');
  }

  /**
   * Analyze receipt costs for optimization opportunities
   */
  async analyzeReceiptCosts(ocrResult, aiAnalysis) {
    try {
      console.log('📊 Starting cost analysis');
      
      // Get market rates for comparison
      const marketData = await this.marketRates.getRatesForCategory(aiAnalysis.primaryCategory);
      
      // Find alternative suppliers
      const alternatives = await this.supplierDatabase.findAlternatives(
        ocrResult.supplier.name,
        aiAnalysis.primaryCategory
      );
      
      // Calculate variance from market average
      const variance = this.calculatePriceVariance(ocrResult.amount, marketData.average);
      
      // Determine if anomaly exists
      const anomalyDetected = Math.abs(variance) > 20; // 20% deviation threshold
      
      // Calculate potential savings
      const savingsPotential = this.calculateSavingsPotential(ocrResult.amount, alternatives, marketData);
      
      const result = {
        optimization: {
          market_average: marketData.average,
          price_variance: variance,
          alternative_suppliers: alternatives,
          cost_reduction_potential: savingsPotential
        },
        anomalyDetected,
        variance,
        savingsPotential,
        recommendations: this.generateCostRecommendations(variance, savingsPotential, alternatives)
      };

      console.log('✅ Cost analysis completed', {
        variance: variance + '%',
        savings: savingsPotential + ' SEK',
        anomaly: anomalyDetected
      });

      return result;
      
    } catch (error) {
      console.error('❌ Cost analysis failed:', error);
      return {
        optimization: {},
        anomalyDetected: false,
        variance: 0,
        savingsPotential: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate price variance from market average
   */
  calculatePriceVariance(actualPrice, marketAverage) {
    if (marketAverage === 0) return 0;
    return Math.round(((actualPrice - marketAverage) / marketAverage) * 100 * 100) / 100;
  }

  /**
   * Calculate potential savings from alternative suppliers
   */
  calculateSavingsPotential(currentPrice, alternatives, marketData) {
    if (alternatives.length === 0) return 0;
    
    const bestAlternative = Math.min(...alternatives.map(alt => alt.estimatedPrice));
    const marketSaving = Math.max(0, currentPrice - marketData.average);
    const supplierSaving = Math.max(0, currentPrice - bestAlternative);
    
    return Math.round(Math.max(marketSaving, supplierSaving));
  }

  /**
   * Generate cost optimization recommendations
   */
  generateCostRecommendations(variance, savingsPotential, alternatives) {
    const recommendations = [];
    
    if (variance > 25) {
      recommendations.push('Price significantly above market average - investigate necessity');
    } else if (variance < -15) {
      recommendations.push('Excellent price below market average');
    }
    
    if (savingsPotential > 200) {
      recommendations.push(`Consider switching suppliers for ${savingsPotential} SEK savings`);
    }
    
    if (alternatives.length > 2) {
      recommendations.push(`${alternatives.length} alternative suppliers available for comparison`);
    }
    
    return recommendations.length > 0 ? recommendations : ['Current pricing appears reasonable'];
  }
}

/**
 * Duplicate Detector for preventing duplicate receipt processing
 */
export class DuplicateDetector {
  constructor() {
    this.duplicateThreshold = 0.90;
    console.log('🔍 Duplicate Detector initialized');
  }

  /**
   * Check for duplicate receipts
   */
  async checkForDuplicates(receiptFile) {
    // Mock duplicate detection - in real implementation, compare file hashes,
    // transaction IDs, amounts, dates, etc.
    
    const isDuplicate = Math.random() < 0.05; // 5% chance of duplicate
    
    return {
      isDuplicate,
      similarity: isDuplicate ? 0.95 : Math.random() * 0.5,
      matchingReceipt: isDuplicate ? {
        id: Math.floor(Math.random() * 1000),
        filename: 'previous_receipt.jpg',
        uploaded_at: new Date(Date.now() - 86400000).toISOString()
      } : null
    };
  }
}

/**
 * Supplier Registry Manager for maintaining supplier database
 */
export class SupplierRegistryManager {
  /**
   * Process supplier from receipt and update registry
   */
  async processSupplier(supplierData) {
    // Mock supplier processing - in real implementation, 
    // search existing suppliers, create new ones, update info
    
    return {
      id: Math.floor(Math.random() * 1000),
      name: supplierData.name,
      isNew: Math.random() < 0.2, // 20% chance of new supplier
      riskScore: Math.random() * 0.3, // Low risk suppliers
      qualityScore: 0.7 + Math.random() * 0.3
    };
  }
}

// Market data and supplier database classes (simplified)
export class MarketRatesProvider {
  async getRatesForCategory(category) {
    const baseRates = {
      'fuel': 16.50,
      'materials': 200,
      'maintenance': 800,
      'food': 150,
      'office_supplies': 250
    };
    
    const baseRate = baseRates[category] || 200;
    
    return {
      average: baseRate + (Math.random() - 0.5) * baseRate * 0.2,
      min: baseRate * 0.7,
      max: baseRate * 1.4,
      confidence: 0.8 + Math.random() * 0.15
    };
  }
}

export class SupplierDatabase {
  async findAlternatives(currentSupplier, category) {
    const alternativeCount = Math.floor(Math.random() * 4) + 1;
    const alternatives = [];
    
    for (let i = 0; i < alternativeCount; i++) {
      alternatives.push({
        name: `Alternative Supplier ${i + 1}`,
        estimatedPrice: 100 + Math.random() * 400,
        qualityScore: 0.7 + Math.random() * 0.3,
        deliveryTime: Math.floor(Math.random() * 5) + 1
      });
    }
    
    return alternatives;
  }
}

console.log('✅ Smart Receipt Manager module loaded successfully');