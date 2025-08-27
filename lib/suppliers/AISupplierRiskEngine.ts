import { supabase } from '@/lib/supabase';

interface RiskAssessment {
  supplier_id: number;
  assessment_date: Date;
  risk_factors: RiskFactor[];
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  immediate_action_required: boolean;
  predicted_risks: PredictedRisk[];
  recommendations: RiskRecommendation[];
  next_assessment_date: Date;
}

interface RiskFactor {
  category: string;
  score: number;
  indicators: any;
  risk_level: string;
  trend?: string;
  immediate_concerns?: string[];
}

interface PredictedRisk {
  type: string;
  probability: number;
  timeline: string;
  impact: string;
}

interface RiskRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  description: string;
  timeline: string;
}

export class AISupplierRiskEngine {
  private riskThresholds = {
    critical: 75,
    high: 50,
    medium: 25,
    low: 0
  };

  async monitorSupplierRisks(): Promise<void> {
    try {
      // Get all active suppliers
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('supplier_status', 'active');

      if (error) throw error;

      // Assess risk for each supplier
      for (const supplier of suppliers || []) {
        const riskAssessment = await this.comprehensiveRiskAssessment(supplier);
        
        if (riskAssessment.risk_level === 'high' || riskAssessment.risk_level === 'critical') {
          await this.triggerRiskAlert(supplier, riskAssessment);
        }
        
        await this.updateSupplierRiskProfile(supplier.id, riskAssessment);
      }
    } catch (error) {
      console.error('Error monitoring supplier risks:', error);
    }
  }

  async comprehensiveRiskAssessment(supplier: any): Promise<RiskAssessment> {
    const riskFactors = await Promise.all([
      this.assessFinancialHealth(supplier),
      this.checkComplianceStatus(supplier),
      this.analyzePaymentBehavior(supplier),
      this.evaluateMarketPosition(supplier),
      this.detectFraudIndicators(supplier),
      this.assessOperationalRisks(supplier)
    ]);

    const overallRisk = this.calculateOverallRisk(riskFactors);
    const predictions = await this.predictFutureRisks(supplier, riskFactors);
    
    return {
      supplier_id: supplier.id,
      assessment_date: new Date(),
      risk_factors: riskFactors,
      overall_risk_score: overallRisk.score,
      risk_level: overallRisk.level,
      immediate_action_required: overallRisk.score > 75,
      predicted_risks: predictions,
      recommendations: await this.generateRiskRecommendations(overallRisk, predictions),
      next_assessment_date: this.calculateNextAssessmentDate(overallRisk.level)
    };
  }

  private async assessFinancialHealth(supplier: any): Promise<RiskFactor> {
    const healthIndicators = {
      f_skatt_status: await this.checkFSkattStatus(supplier.f_skatt_number),
      credit_score: await this.getCreditScore(supplier.org_number),
      payment_history: await this.analyzePaymentHistory(supplier),
      bankruptcy_risk: await this.assessBankruptcyRisk(supplier.org_number),
      legal_issues: await this.checkLegalIssues(supplier.org_number),
      market_stability: await this.assessMarketPosition(supplier),
      competitive_position: await this.analyzeCompetitivePosition(supplier)
    };

    const financialScore = this.calculateFinancialScore(healthIndicators);
    
    return {
      category: 'financial_health',
      score: financialScore,
      indicators: healthIndicators,
      risk_level: this.categorizeRisk(financialScore),
      trend: await this.analyzeFinancialTrend(supplier),
      immediate_concerns: this.identifyImmediateFinancialConcerns(healthIndicators)
    };
  }

  private async checkFSkattStatus(fSkattNumber: string): Promise<any> {
    // Simulate F-skatt check (in real implementation, integrate with Skatteverket API)
    const mockStatus = Math.random() > 0.1; // 90% chance of active status
    
    return {
      status: mockStatus ? 'active' : 'inactive',
      valid_until: mockStatus ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      risk_level: mockStatus ? 'low' : 'critical',
      last_checked: new Date(),
      automatic_monitoring: true
    };
  }

  private async getCreditScore(orgNumber: string): Promise<number> {
    // Simulate credit score check (in real implementation, integrate with UC/Creditsafe)
    return Math.floor(Math.random() * 100) + 200; // 200-300 range
  }

  private async analyzePaymentHistory(supplier: any): Promise<any> {
    // Analyze payment behavior from purchase orders
    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const totalOrders = orders?.length || 0;
    const onTimePayments = orders?.filter(o => o.payment_on_time).length || 0;
    
    return {
      total_transactions: totalOrders,
      on_time_rate: totalOrders > 0 ? (onTimePayments / totalOrders) : 1,
      average_days_to_payment: this.calculateAveragePaymentDays(orders),
      payment_disputes: orders?.filter(o => o.payment_dispute).length || 0
    };
  }

  private async detectFraudIndicators(supplier: any): Promise<RiskFactor> {
    const indicators = {
      contact_verification: await this.verifyContactInformation(supplier),
      identity_consistency: await this.checkIdentityConsistency(supplier),
      business_registration: await this.verifyBusinessRegistration(supplier),
      operational_evidence: await this.assessOperationalEvidence(supplier),
      communication_patterns: await this.analyzeCommuncationPatterns(supplier),
      pricing_anomalies: await this.detectPricingAnomalies(supplier),
      supplier_network: await this.analyzeSupplierNetwork(supplier),
      suspicious_connections: await this.detectSuspiciousConnections(supplier)
    };

    const fraudScore = this.calculateFraudScore(indicators);
    
    return {
      category: 'fraud_detection',
      score: fraudScore,
      indicators: indicators,
      risk_level: this.categorizeRisk(fraudScore),
      immediate_concerns: fraudScore > 50 ? ['Potential fraud indicators detected'] : []
    };
  }

  private async checkComplianceStatus(supplier: any): Promise<RiskFactor> {
    const complianceChecks = {
      gdpr_compliance: await this.checkGDPRCompliance(supplier),
      contract_compliance: await this.checkContractCompliance(supplier),
      audit_compliance: await this.checkAuditCompliance(supplier),
      certification_status: await this.checkCertifications(supplier),
      regulatory_compliance: await this.checkRegulatoryCompliance(supplier)
    };

    const complianceScore = this.calculateComplianceScore(complianceChecks);
    
    return {
      category: 'compliance',
      score: complianceScore,
      indicators: complianceChecks,
      risk_level: this.categorizeRisk(complianceScore),
      immediate_concerns: this.identifyComplianceConcerns(complianceChecks)
    };
  }

  private async analyzePaymentBehavior(supplier: any): Promise<RiskFactor> {
    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplier.id)
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

    const paymentMetrics = {
      invoice_accuracy: this.calculateInvoiceAccuracy(orders),
      price_consistency: this.analyzePriceConsistency(orders),
      discount_usage: this.analyzeDiscountUsage(orders),
      payment_terms_adherence: this.analyzePaymentTermsAdherence(orders)
    };

    const behaviorScore = this.calculatePaymentBehaviorScore(paymentMetrics);
    
    return {
      category: 'payment_behavior',
      score: behaviorScore,
      indicators: paymentMetrics,
      risk_level: this.categorizeRisk(behaviorScore),
      trend: this.analyzePaymentTrend(orders)
    };
  }

  private async evaluateMarketPosition(supplier: any): Promise<RiskFactor> {
    const marketIndicators = {
      market_share: await this.estimateMarketShare(supplier),
      competitive_strength: await this.assessCompetitiveStrength(supplier),
      industry_trends: await this.analyzeIndustryTrends(supplier.category_id),
      customer_diversification: await this.assessCustomerDiversification(supplier),
      innovation_capability: await this.assessInnovationCapability(supplier)
    };

    const marketScore = this.calculateMarketScore(marketIndicators);
    
    return {
      category: 'market_position',
      score: marketScore,
      indicators: marketIndicators,
      risk_level: this.categorizeRisk(marketScore),
      trend: marketIndicators.industry_trends.trend
    };
  }

  private async assessOperationalRisks(supplier: any): Promise<RiskFactor> {
    const operationalIndicators = {
      delivery_reliability: await this.assessDeliveryReliability(supplier),
      capacity_adequacy: await this.assessCapacityAdequacy(supplier),
      quality_consistency: await this.assessQualityConsistency(supplier),
      service_responsiveness: await this.assessServiceResponsiveness(supplier),
      business_continuity: await this.assessBusinessContinuity(supplier)
    };

    const operationalScore = this.calculateOperationalScore(operationalIndicators);
    
    return {
      category: 'operational_risks',
      score: operationalScore,
      indicators: operationalIndicators,
      risk_level: this.categorizeRisk(operationalScore),
      immediate_concerns: this.identifyOperationalConcerns(operationalIndicators)
    };
  }

  private calculateOverallRisk(riskFactors: RiskFactor[]): { score: number; level: 'low' | 'medium' | 'high' | 'critical' } {
    // Weight different risk categories
    const weights = {
      financial_health: 0.3,
      fraud_detection: 0.2,
      compliance: 0.2,
      payment_behavior: 0.1,
      market_position: 0.1,
      operational_risks: 0.1
    };

    let weightedScore = 0;
    let totalWeight = 0;

    riskFactors.forEach(factor => {
      const weight = weights[factor.category as keyof typeof weights] || 0.1;
      weightedScore += factor.score * weight;
      totalWeight += weight;
    });

    const score = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    return {
      score,
      level: this.categorizeRisk(score)
    };
  }

  private categorizeRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= this.riskThresholds.critical) return 'critical';
    if (score >= this.riskThresholds.high) return 'high';
    if (score >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  private async predictFutureRisks(supplier: any, currentRiskFactors: RiskFactor[]): Promise<PredictedRisk[]> {
    const predictions: PredictedRisk[] = [];

    // Financial risk predictions
    const financialRisk = currentRiskFactors.find(f => f.category === 'financial_health');
    if (financialRisk && financialRisk.score > 50) {
      predictions.push({
        type: 'bankruptcy_risk',
        probability: financialRisk.score / 100,
        timeline: '6-12 months',
        impact: 'Critical - complete supplier failure possible'
      });
    }

    // Contract expiry risk
    if (supplier.contract_end_date) {
      const daysUntilExpiry = Math.floor((new Date(supplier.contract_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 90) {
        predictions.push({
          type: 'contract_expiry',
          probability: 1.0,
          timeline: `${daysUntilExpiry} days`,
          impact: 'High - service disruption if not renewed'
        });
      }
    }

    // Market risk predictions
    const marketRisk = currentRiskFactors.find(f => f.category === 'market_position');
    if (marketRisk && marketRisk.trend === 'declining') {
      predictions.push({
        type: 'market_exit_risk',
        probability: marketRisk.score / 100,
        timeline: '12-18 months',
        impact: 'Medium - may need alternative supplier'
      });
    }

    return predictions;
  }

  private async generateRiskRecommendations(overallRisk: any, predictions: PredictedRisk[]): Promise<RiskRecommendation[]> {
    const recommendations: RiskRecommendation[] = [];
    
    if (overallRisk.score > 75) {
      recommendations.push({
        priority: 'critical',
        action: 'immediate_supplier_review',
        description: 'Conduct immediate supplier review and consider contract suspension',
        timeline: '24 hours'
      });
    }
    
    const bankruptcyRisk = predictions.find(p => p.type === 'bankruptcy_risk');
    if (bankruptcyRisk && bankruptcyRisk.probability > 0.7) {
      recommendations.push({
        priority: 'high',
        action: 'diversify_supplier_base',
        description: 'Identify and onboard alternative suppliers immediately',
        timeline: '1 week'
      });
    }
    
    if (overallRisk.score > 50) {
      recommendations.push({
        priority: 'medium',
        action: 'enhance_monitoring',
        description: 'Increase monitoring frequency and implement stricter contract terms',
        timeline: '2 weeks'
      });
    }

    const contractExpiry = predictions.find(p => p.type === 'contract_expiry');
    if (contractExpiry) {
      recommendations.push({
        priority: 'high',
        action: 'contract_renewal',
        description: 'Initiate contract renewal negotiations or find alternative supplier',
        timeline: '30 days'
      });
    }
    
    return recommendations;
  }

  private calculateNextAssessmentDate(riskLevel: string): Date {
    const daysUntilNext = {
      critical: 7,
      high: 14,
      medium: 30,
      low: 90
    };

    const days = daysUntilNext[riskLevel as keyof typeof daysUntilNext] || 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async triggerRiskAlert(supplier: any, assessment: RiskAssessment): Promise<void> {
    // Store risk alert
    await supabase.from('supplier_monitoring').insert({
      supplier_id: supplier.id,
      monitoring_date: new Date(),
      bankruptcy_risk_score: assessment.overall_risk_score,
      alerts_triggered: {
        type: 'high_risk_detected',
        risk_level: assessment.risk_level,
        immediate_action: assessment.immediate_action_required,
        triggered_at: new Date()
      },
      action_required: true
    });

    // Send notifications (implement notification service)
    // await this.notificationService.sendRiskAlert(supplier, assessment);
  }

  private async updateSupplierRiskProfile(supplierId: number, assessment: RiskAssessment): Promise<void> {
    await supabase
      .from('suppliers')
      .update({
        risk_score: assessment.overall_risk_score,
        compliance_status: assessment.risk_factors.find(f => f.category === 'compliance')?.indicators.overall_status || 'unknown',
        updated_at: new Date()
      })
      .eq('id', supplierId);

    // Store monitoring record
    await supabase.from('supplier_monitoring').insert({
      supplier_id: supplierId,
      monitoring_date: new Date(),
      bankruptcy_risk_score: assessment.overall_risk_score,
      financial_health_indicators: assessment.risk_factors.find(f => f.category === 'financial_health')?.indicators,
      action_required: assessment.immediate_action_required
    });
  }

  // Helper methods for calculations
  private calculateFinancialScore(indicators: any): number {
    let score = 0;
    
    if (indicators.f_skatt_status.status !== 'active') score += 50;
    if (indicators.credit_score < 250) score += 30;
    if (indicators.bankruptcy_risk > 0.5) score += 40;
    if (indicators.legal_issues.length > 0) score += 20;
    
    return Math.min(score, 100);
  }

  private calculateFraudScore(indicators: any): number {
    let score = 0;
    
    if (!indicators.contact_verification.verified) score += 30;
    if (!indicators.business_registration.valid) score += 40;
    if (indicators.pricing_anomalies.detected) score += 20;
    if (indicators.suspicious_connections.found) score += 30;
    
    return Math.min(score, 100);
  }

  private calculateComplianceScore(checks: any): number {
    let score = 0;
    let totalChecks = 0;
    
    Object.values(checks).forEach((check: any) => {
      totalChecks++;
      if (!check.compliant) score += 20;
    });
    
    return Math.min(score, 100);
  }

  private calculatePaymentBehaviorScore(metrics: any): number {
    let score = 0;
    
    if (metrics.invoice_accuracy < 0.95) score += 20;
    if (!metrics.price_consistency) score += 30;
    if (metrics.payment_terms_adherence < 0.90) score += 25;
    
    return Math.min(score, 100);
  }

  private calculateMarketScore(indicators: any): number {
    let score = 0;
    
    if (indicators.market_share < 0.05) score += 20;
    if (indicators.competitive_strength < 3) score += 30;
    if (indicators.customer_diversification < 0.3) score += 25;
    
    return Math.min(score, 100);
  }

  private calculateOperationalScore(indicators: any): number {
    let score = 0;
    
    if (indicators.delivery_reliability < 0.95) score += 25;
    if (!indicators.capacity_adequacy) score += 30;
    if (indicators.quality_consistency < 0.98) score += 20;
    if (!indicators.business_continuity.plan_exists) score += 25;
    
    return Math.min(score, 100);
  }

  // Stub methods for specific checks (to be implemented with real integrations)
  private async assessBankruptcyRisk(orgNumber: string): Promise<number> {
    return Math.random() * 0.3; // Mock: 0-30% bankruptcy risk
  }

  private async checkLegalIssues(orgNumber: string): Promise<any[]> {
    return []; // Mock: no legal issues
  }

  private async assessMarketPosition(supplier: any): Promise<any> {
    return { stable: true, trend: 'stable' };
  }

  private async analyzeCompetitivePosition(supplier: any): Promise<any> {
    return { position: 'strong', score: 7.5 };
  }

  private async analyzeFinancialTrend(supplier: any): Promise<string> {
    return 'stable';
  }

  private identifyImmediateFinancialConcerns(indicators: any): string[] {
    const concerns: string[] = [];
    
    if (indicators.f_skatt_status.status !== 'active') {
      concerns.push('F-skatt status inactive - immediate action required');
    }
    if (indicators.credit_score < 200) {
      concerns.push('Very low credit score - high financial risk');
    }
    if (indicators.bankruptcy_risk > 0.7) {
      concerns.push('High bankruptcy risk detected');
    }
    
    return concerns;
  }

  private calculateAveragePaymentDays(orders: any[]): number {
    if (!orders || orders.length === 0) return 30;
    
    const paymentDays = orders
      .filter(o => o.payment_date && o.invoice_date)
      .map(o => {
        const invoice = new Date(o.invoice_date);
        const payment = new Date(o.payment_date);
        return Math.floor((payment.getTime() - invoice.getTime()) / (1000 * 60 * 60 * 24));
      });
    
    return paymentDays.length > 0 
      ? paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length 
      : 30;
  }

  // Additional helper methods for various checks
  private async verifyContactInformation(supplier: any): Promise<any> {
    return { verified: true, confidence: 0.95 };
  }

  private async checkIdentityConsistency(supplier: any): Promise<any> {
    return { consistent: true, discrepancies: [] };
  }

  private async verifyBusinessRegistration(supplier: any): Promise<any> {
    return { valid: true, registration_date: supplier.created_at };
  }

  private async assessOperationalEvidence(supplier: any): Promise<any> {
    return { evidence_found: true, activity_level: 'high' };
  }

  private async analyzeCommuncationPatterns(supplier: any): Promise<any> {
    return { normal: true, anomalies: [] };
  }

  private async detectPricingAnomalies(supplier: any): Promise<any> {
    return { detected: false, anomalies: [] };
  }

  private async analyzeSupplierNetwork(supplier: any): Promise<any> {
    return { network_size: 'medium', connections: 15 };
  }

  private async detectSuspiciousConnections(supplier: any): Promise<any> {
    return { found: false, connections: [] };
  }

  private async checkGDPRCompliance(supplier: any): Promise<any> {
    return { compliant: true, last_audit: new Date() };
  }

  private async checkContractCompliance(supplier: any): Promise<any> {
    return { compliant: true, violations: [] };
  }

  private async checkAuditCompliance(supplier: any): Promise<any> {
    return { compliant: true, last_audit: supplier.last_audit_date };
  }

  private async checkCertifications(supplier: any): Promise<any> {
    return { valid: true, expiring_soon: [] };
  }

  private async checkRegulatoryCompliance(supplier: any): Promise<any> {
    return { compliant: true, issues: [] };
  }

  private identifyComplianceConcerns(checks: any): string[] {
    const concerns: string[] = [];
    
    if (!checks.gdpr_compliance.compliant) {
      concerns.push('GDPR non-compliance detected');
    }
    if (!checks.contract_compliance.compliant) {
      concerns.push('Contract violations found');
    }
    if (checks.certification_status.expiring_soon.length > 0) {
      concerns.push('Certifications expiring soon');
    }
    
    return concerns;
  }

  private calculateInvoiceAccuracy(orders: any[]): number {
    if (!orders || orders.length === 0) return 1;
    
    const accurateInvoices = orders.filter(o => !o.invoice_disputed).length;
    return accurateInvoices / orders.length;
  }

  private analyzePriceConsistency(orders: any[]): boolean {
    // Analyze if prices are consistent across orders
    return true;
  }

  private analyzeDiscountUsage(orders: any[]): any {
    return { appropriate: true, average_discount: 0.02 };
  }

  private analyzePaymentTermsAdherence(orders: any[]): number {
    return 0.95; // 95% adherence to payment terms
  }

  private calculatePaymentBehaviorScore(metrics: any): number {
    let score = 100;
    
    if (metrics.invoice_accuracy < 0.95) score -= 20;
    if (!metrics.price_consistency) score -= 30;
    if (metrics.payment_terms_adherence < 0.90) score -= 25;
    
    return Math.max(0, score);
  }

  private analyzePaymentTrend(orders: any[]): string {
    return 'stable';
  }

  private async estimateMarketShare(supplier: any): Promise<number> {
    return 0.15; // 15% market share
  }

  private async assessCompetitiveStrength(supplier: any): Promise<number> {
    return 7; // Scale of 1-10
  }

  private async analyzeIndustryTrends(categoryId: number): Promise<any> {
    return { trend: 'growing', growth_rate: 0.05 };
  }

  private async assessCustomerDiversification(supplier: any): Promise<number> {
    return 0.6; // 60% diversification
  }

  private async assessInnovationCapability(supplier: any): Promise<number> {
    return 6; // Scale of 1-10
  }

  private async assessDeliveryReliability(supplier: any): Promise<number> {
    return 0.97; // 97% on-time delivery
  }

  private async assessCapacityAdequacy(supplier: any): Promise<boolean> {
    return true;
  }

  private async assessQualityConsistency(supplier: any): Promise<number> {
    return 0.99; // 99% quality consistency
  }

  private async assessServiceResponsiveness(supplier: any): Promise<number> {
    return 8; // Scale of 1-10
  }

  private async assessBusinessContinuity(supplier: any): Promise<any> {
    return { plan_exists: true, last_tested: new Date() };
  }

  private identifyOperationalConcerns(indicators: any): string[] {
    const concerns: string[] = [];
    
    if (indicators.delivery_reliability < 0.95) {
      concerns.push('Below target delivery reliability');
    }
    if (!indicators.capacity_adequacy) {
      concerns.push('Insufficient capacity for demand');
    }
    if (!indicators.business_continuity.plan_exists) {
      concerns.push('No business continuity plan');
    }
    
    return concerns;
  }
}