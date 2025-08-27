/**
 * NORDFLYTT DYNAMIC KICKBACK ENGINE
 * Intelligent payment calculation system for partner ecosystem
 * Handles complex tier-based bonuses, volume optimization, and automated payments
 */

export interface KickbackCalculation {
  partnerId: number;
  agentId?: number;
  calculationPeriod: string;
  periodStart: Date;
  periodEnd: Date;
  baseRate: number;
  referralsIncluded: ReferralForCalculation[];
  baseAmount: number;
  bonuses: BonusBreakdown;
  deductions: DeductionBreakdown;
  finalAmount: number;
  paymentInstructions: PaymentInstructions;
  taxConsiderations: TaxInfo;
  nextTierRequirements?: NextTierInfo;
}

export interface ReferralForCalculation {
  referralId: number;
  customerId: number;
  referralDate: Date;
  conversionDate: Date;
  moveValue: number;
  baseKickback: number;
  qualityScore: number;
  customerSatisfaction: number;
  serviceType: string;
  isFirstTimeCustomer: boolean;
  urgencyLevel: string;
}

export interface BonusBreakdown {
  volume: VolumeBonus;
  quality: QualityBonus;
  tier: TierBonus;
  performance: PerformanceBonus;
  specialPromotions: SpecialPromotionBonus[];
  seasonalBonus: SeasonalBonus;
  total: number;
}

export interface VolumeBonus {
  threshold: number;
  achieved: number;
  bonusRate: number;
  amount: number;
  description: string;
}

export interface QualityBonus {
  avgCustomerSatisfaction: number;
  qualityThreshold: number;
  bonusRate: number;
  amount: number;
  description: string;
}

export interface TierBonus {
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  multiplier: number;
  amount: number;
  description: string;
}

export interface PerformanceBonus {
  conversionRate: number;
  targetRate: number;
  bonusRate: number;
  amount: number;
  description: string;
}

export interface SpecialPromotionBonus {
  promotionId: string;
  promotionName: string;
  criteria: string;
  bonusAmount: number;
  expiryDate: Date;
}

export interface SeasonalBonus {
  season: string;
  multiplier: number;
  amount: number;
  description: string;
}

export interface DeductionBreakdown {
  adminFee: number;
  taxWithholding: number;
  chargebacks: number;
  penalties: number;
  total: number;
}

export interface PaymentInstructions {
  paymentMethod: 'bank_transfer' | 'swish' | 'invoice';
  bankAccount?: BankDetails;
  swishNumber?: string;
  invoiceRequired: boolean;
  paymentSchedule: 'monthly' | 'quarterly';
  nextPaymentDate: Date;
  paymentReference: string;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  swiftCode?: string;
  accountHolder: string;
}

export interface TaxInfo {
  taxableAmount: number;
  taxWithheld: number;
  taxRate: number;
  taxDocumentation: string;
  vatApplicable: boolean;
}

export interface NextTierInfo {
  nextTier: string;
  requirementsToAchieve: TierRequirement[];
  potentialBonusIncrease: number;
  estimatedTimeToAchieve: string;
}

export interface TierRequirement {
  metric: string;
  current: number;
  required: number;
  progress: number;
  description: string;
}

export interface TierThresholds {
  bronze: { referrals: number; revenue: number; satisfaction: number; multiplier: number };
  silver: { referrals: number; revenue: number; satisfaction: number; multiplier: number };
  gold: { referrals: number; revenue: number; satisfaction: number; multiplier: number };
  platinum: { referrals: number; revenue: number; satisfaction: number; multiplier: number };
}

export class DynamicKickbackEngine {
  private tierThresholds: TierThresholds;
  private bonusRates: Record<string, number>;
  private specialPromotions: SpecialPromotionBonus[];
  private taxRate: number;
  private adminFeeRate: number;

  constructor() {
    this.tierThresholds = {
      bronze: { referrals: 0, revenue: 0, satisfaction: 0, multiplier: 1.0 },
      silver: { referrals: 10, revenue: 50000, satisfaction: 4.0, multiplier: 1.1 },
      gold: { referrals: 25, revenue: 150000, satisfaction: 4.3, multiplier: 1.2 },
      platinum: { referrals: 50, revenue: 350000, satisfaction: 4.5, multiplier: 1.3 }
    };

    this.bonusRates = {
      volumeBonus: 0.05,     // 5% extra for volume achievement
      qualityBonus: 0.03,    // 3% extra for quality achievement
      conversionBonus: 0.02, // 2% extra for high conversion rate
      seasonalBonus: 0.15,   // 15% extra during peak season
      urgencyBonus: 0.10     // 10% extra for urgent moves
    };

    this.specialPromotions = [
      {
        promotionId: 'SPRING2025',
        promotionName: 'Vårkampanj 2025',
        criteria: 'Extra 500 SEK per referral i mars-april',
        bonusAmount: 500,
        expiryDate: new Date('2025-04-30')
      },
      {
        promotionId: 'NEWPARTNER',
        promotionName: 'Ny Partner Bonus',
        criteria: 'Dubbel kickback första månaden',
        bonusAmount: 0, // Calculated as 100% of base
        expiryDate: new Date('2025-12-31')
      }
    ];

    this.taxRate = 0.30; // 30% tax rate
    this.adminFeeRate = 0.02; // 2% admin fee
  }

  async calculateMonthlyKickback(partnerId: number, agentId?: number, period?: string): Promise<KickbackCalculation> {
    console.log(`💰 Calculating monthly kickback for partner ${partnerId}${agentId ? `, agent ${agentId}` : ''}`);

    const calculationPeriod = period || this.getCurrentPeriod();
    const { periodStart, periodEnd } = this.parsePeriod(calculationPeriod);
    
    // Fetch referrals for the period
    const referrals = await this.getReferralsForPeriod(partnerId, agentId, periodStart, periodEnd);
    const partnerInfo = await this.getPartnerInfo(partnerId);
    const performanceData = await this.getPerformanceData(partnerId, agentId, periodStart, periodEnd);

    console.log(`📊 Found ${referrals.length} referrals for calculation period`);

    // Calculate base kickback amount
    const baseAmount = this.calculateBaseAmount(referrals);
    console.log(`🔢 Base kickback amount: ${baseAmount.toLocaleString()} SEK`);

    // Calculate all bonuses
    const bonuses = await this.calculateBonuses(referrals, performanceData, partnerInfo);
    console.log(`🎁 Total bonuses: ${bonuses.total.toLocaleString()} SEK`);

    // Calculate deductions
    const deductions = this.calculateDeductions(baseAmount + bonuses.total, partnerInfo);
    console.log(`📉 Total deductions: ${deductions.total.toLocaleString()} SEK`);

    // Final amount calculation
    const finalAmount = baseAmount + bonuses.total - deductions.total;
    console.log(`💳 Final payment amount: ${finalAmount.toLocaleString()} SEK`);

    // Generate payment instructions
    const paymentInstructions = await this.generatePaymentInstructions(partnerId, agentId, finalAmount);
    
    // Calculate tax information
    const taxInfo = this.calculateTaxInfo(baseAmount + bonuses.total, deductions);
    
    // Determine next tier requirements
    const nextTierInfo = await this.calculateNextTierRequirements(partnerId, agentId, performanceData);

    const calculation: KickbackCalculation = {
      partnerId,
      agentId,
      calculationPeriod,
      periodStart,
      periodEnd,
      baseRate: partnerInfo.kickback_rate,
      referralsIncluded: referrals,
      baseAmount,
      bonuses,
      deductions,
      finalAmount,
      paymentInstructions,
      taxConsiderations: taxInfo,
      nextTierRequirements: nextTierInfo
    };

    // Store calculation in database
    await this.storeKickbackCalculation(calculation);
    
    console.log(`✅ Kickback calculation completed for partner ${partnerId}`);
    return calculation;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString('sv-SE', { month: 'long' });
    return `${month} ${year}`;
  }

  private parsePeriod(period: string): { periodStart: Date; periodEnd: Date } {
    // Parse period like "januari 2025"
    const [month, year] = period.split(' ');
    const monthNumber = new Date(`${month} 1, ${year}`).getMonth();
    
    const periodStart = new Date(parseInt(year), monthNumber, 1);
    const periodEnd = new Date(parseInt(year), monthNumber + 1, 0);
    
    return { periodStart, periodEnd };
  }

  private async getReferralsForPeriod(partnerId: number, agentId: number | undefined, periodStart: Date, periodEnd: Date): Promise<ReferralForCalculation[]> {
    // Mock data - in real implementation, fetch from database
    const mockReferrals: ReferralForCalculation[] = [
      {
        referralId: 1,
        customerId: 101,
        referralDate: new Date('2025-01-05'),
        conversionDate: new Date('2025-01-08'),
        moveValue: 12500,
        baseKickback: 1250,
        qualityScore: 8,
        customerSatisfaction: 4.5,
        serviceType: 'residential',
        isFirstTimeCustomer: true,
        urgencyLevel: 'medium'
      },
      {
        referralId: 2,
        customerId: 102,
        referralDate: new Date('2025-01-12'),
        conversionDate: new Date('2025-01-15'),
        moveValue: 8500,
        baseKickback: 850,
        qualityScore: 9,
        customerSatisfaction: 4.8,
        serviceType: 'residential',
        isFirstTimeCustomer: false,
        urgencyLevel: 'high'
      },
      {
        referralId: 3,
        customerId: 103,
        referralDate: new Date('2025-01-20'),
        conversionDate: new Date('2025-01-22'),
        moveValue: 18000,
        baseKickback: 1800,
        qualityScore: 7,
        customerSatisfaction: 4.2,
        serviceType: 'office',
        isFirstTimeCustomer: true,
        urgencyLevel: 'urgent'
      }
    ];

    return mockReferrals;
  }

  private async getPartnerInfo(partnerId: number): Promise<any> {
    // Mock partner info - in real implementation, fetch from database
    return {
      id: partnerId,
      organization_name: 'Svensk Fastighetsförmedling Stockholm',
      kickback_rate: 0.10,
      payment_method: 'bank_transfer',
      payment_details: {
        account_number: '1234567890',
        bank_name: 'Handelsbanken',
        account_holder: 'Svensk Fastighetsförmedling Stockholm AB'
      },
      current_tier: 'silver',
      partnership_start_date: new Date('2024-06-01')
    };
  }

  private async getPerformanceData(partnerId: number, agentId: number | undefined, periodStart: Date, periodEnd: Date): Promise<any> {
    // Mock performance data - in real implementation, fetch from database
    return {
      totalReferrals: 15,
      totalRevenue: 87500,
      conversionRate: 0.82,
      avgCustomerSatisfaction: 4.5,
      currentTier: 'silver',
      monthlyReferrals: 3,
      quarterlyReferrals: 8,
      yearlyReferrals: 15
    };
  }

  private calculateBaseAmount(referrals: ReferralForCalculation[]): number {
    return referrals.reduce((sum, referral) => sum + referral.baseKickback, 0);
  }

  private async calculateBonuses(referrals: ReferralForCalculation[], performanceData: any, partnerInfo: any): Promise<BonusBreakdown> {
    const baseAmount = this.calculateBaseAmount(referrals);
    
    // Volume bonus
    const volumeBonus = this.calculateVolumeBonus(referrals.length, performanceData.totalReferrals, baseAmount);
    
    // Quality bonus
    const qualityBonus = this.calculateQualityBonus(performanceData.avgCustomerSatisfaction, baseAmount);
    
    // Tier bonus
    const tierBonus = this.calculateTierBonus(partnerInfo.current_tier, baseAmount);
    
    // Performance bonus
    const performanceBonus = this.calculatePerformanceBonus(performanceData.conversionRate, baseAmount);
    
    // Special promotions
    const specialPromotions = this.calculateSpecialPromotions(referrals, partnerInfo);
    
    // Seasonal bonus
    const seasonalBonus = this.calculateSeasonalBonus(baseAmount);
    
    const total = volumeBonus.amount + qualityBonus.amount + tierBonus.amount + 
                  performanceBonus.amount + specialPromotions.reduce((sum, promo) => sum + promo.bonusAmount, 0) + 
                  seasonalBonus.amount;

    return {
      volume: volumeBonus,
      quality: qualityBonus,
      tier: tierBonus,
      performance: performanceBonus,
      specialPromotions,
      seasonalBonus,
      total
    };
  }

  private calculateVolumeBonus(currentReferrals: number, totalReferrals: number, baseAmount: number): VolumeBonus {
    const threshold = 20; // Monthly threshold for volume bonus
    const achieved = currentReferrals;
    const bonusRate = achieved >= threshold ? this.bonusRates.volumeBonus : 0;
    const amount = baseAmount * bonusRate;
    
    return {
      threshold,
      achieved,
      bonusRate,
      amount,
      description: achieved >= threshold ? 
        `Volymbonus för ${achieved} referrals (tröskelvärde: ${threshold})` : 
        `Volymbonus ej uppnådd (${achieved}/${threshold} referrals)`
    };
  }

  private calculateQualityBonus(avgSatisfaction: number, baseAmount: number): QualityBonus {
    const qualityThreshold = 4.2;
    const bonusRate = avgSatisfaction >= qualityThreshold ? this.bonusRates.qualityBonus : 0;
    const amount = baseAmount * bonusRate;
    
    return {
      avgCustomerSatisfaction: avgSatisfaction,
      qualityThreshold,
      bonusRate,
      amount,
      description: avgSatisfaction >= qualityThreshold ? 
        `Kvalitetsbonus för ${avgSatisfaction}/5.0 kundnöjdhet` : 
        `Kvalitetsbonus ej uppnådd (${avgSatisfaction}/${qualityThreshold})`
    };
  }

  private calculateTierBonus(currentTier: string, baseAmount: number): TierBonus {
    const tierKey = currentTier as keyof TierThresholds;
    const multiplier = this.tierThresholds[tierKey].multiplier;
    const amount = baseAmount * (multiplier - 1.0); // Only the bonus part
    
    return {
      currentTier: tierKey,
      multiplier,
      amount,
      description: `${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} tier bonus (${multiplier}x multiplier)`
    };
  }

  private calculatePerformanceBonus(conversionRate: number, baseAmount: number): PerformanceBonus {
    const targetRate = 0.75;
    const bonusRate = conversionRate >= targetRate ? this.bonusRates.conversionBonus : 0;
    const amount = baseAmount * bonusRate;
    
    return {
      conversionRate,
      targetRate,
      bonusRate,
      amount,
      description: conversionRate >= targetRate ? 
        `Konverteringsbonus för ${(conversionRate * 100).toFixed(0)}% konvertering` : 
        `Konverteringsbonus ej uppnådd (${(conversionRate * 100).toFixed(0)}%/${(targetRate * 100).toFixed(0)}%)`
    };
  }

  private calculateSpecialPromotions(referrals: ReferralForCalculation[], partnerInfo: any): SpecialPromotionBonus[] {
    const applicablePromotions: SpecialPromotionBonus[] = [];
    
    // Check spring campaign
    const springPromo = this.specialPromotions.find(p => p.promotionId === 'SPRING2025');
    if (springPromo && new Date() <= springPromo.expiryDate) {
      applicablePromotions.push({
        ...springPromo,
        bonusAmount: referrals.length * 500 // 500 SEK per referral
      });
    }
    
    // Check new partner bonus
    const newPartnerPromo = this.specialPromotions.find(p => p.promotionId === 'NEWPARTNER');
    if (newPartnerPromo && this.isNewPartner(partnerInfo)) {
      const baseAmount = this.calculateBaseAmount(referrals);
      applicablePromotions.push({
        ...newPartnerPromo,
        bonusAmount: baseAmount // Double the kickback
      });
    }
    
    return applicablePromotions;
  }

  private isNewPartner(partnerInfo: any): boolean {
    const partnershipStart = new Date(partnerInfo.partnership_start_date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return partnershipStart > threeMonthsAgo;
  }

  private calculateSeasonalBonus(baseAmount: number): SeasonalBonus {
    const currentMonth = new Date().getMonth();
    const isMovingSeason = currentMonth >= 3 && currentMonth <= 8; // April to September
    
    const multiplier = isMovingSeason ? 1.05 : 1.0; // 5% bonus during moving season
    const amount = baseAmount * (multiplier - 1.0);
    
    return {
      season: isMovingSeason ? 'Högsäsong' : 'Lågsäsong',
      multiplier,
      amount,
      description: isMovingSeason ? 
        'Säsongsbonus för högsäsong (april-september)' : 
        'Ingen säsongsbonus (lågsäsong)'
    };
  }

  private calculateDeductions(grossAmount: number, partnerInfo: any): DeductionBreakdown {
    const adminFee = grossAmount * this.adminFeeRate;
    const taxWithholding = grossAmount * this.taxRate;
    const chargebacks = 0; // No chargebacks this period
    const penalties = 0; // No penalties this period
    
    return {
      adminFee,
      taxWithholding,
      chargebacks,
      penalties,
      total: adminFee + taxWithholding + chargebacks + penalties
    };
  }

  private async generatePaymentInstructions(partnerId: number, agentId: number | undefined, amount: number): Promise<PaymentInstructions> {
    const partnerInfo = await this.getPartnerInfo(partnerId);
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    nextPaymentDate.setDate(15); // Payment on 15th of next month
    
    return {
      paymentMethod: partnerInfo.payment_method,
      bankAccount: partnerInfo.payment_method === 'bank_transfer' ? partnerInfo.payment_details : undefined,
      swishNumber: partnerInfo.payment_method === 'swish' ? partnerInfo.payment_details.swish_number : undefined,
      invoiceRequired: partnerInfo.payment_method === 'invoice',
      paymentSchedule: 'monthly',
      nextPaymentDate,
      paymentReference: `KICKBACK-${partnerId}-${agentId || 'ORG'}-${Date.now()}`
    };
  }

  private calculateTaxInfo(grossAmount: number, deductions: DeductionBreakdown): TaxInfo {
    return {
      taxableAmount: grossAmount,
      taxWithheld: deductions.taxWithholding,
      taxRate: this.taxRate,
      taxDocumentation: 'Skatteavdrag enligt gällande regler för provision/kickback',
      vatApplicable: false
    };
  }

  private async calculateNextTierRequirements(partnerId: number, agentId: number | undefined, performanceData: any): Promise<NextTierInfo | undefined> {
    const currentTier = performanceData.currentTier;
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);
    
    if (currentIndex === tiers.length - 1) {
      return undefined; // Already at highest tier
    }
    
    const nextTier = tiers[currentIndex + 1];
    const nextTierRequirements = this.tierThresholds[nextTier as keyof TierThresholds];
    
    const requirements: TierRequirement[] = [
      {
        metric: 'Månatliga referrals',
        current: performanceData.monthlyReferrals,
        required: nextTierRequirements.referrals,
        progress: performanceData.monthlyReferrals / nextTierRequirements.referrals,
        description: `${performanceData.monthlyReferrals}/${nextTierRequirements.referrals} referrals per månad`
      },
      {
        metric: 'Total omsättning',
        current: performanceData.totalRevenue,
        required: nextTierRequirements.revenue,
        progress: performanceData.totalRevenue / nextTierRequirements.revenue,
        description: `${performanceData.totalRevenue.toLocaleString()}/${nextTierRequirements.revenue.toLocaleString()} SEK`
      },
      {
        metric: 'Kundnöjdhet',
        current: performanceData.avgCustomerSatisfaction,
        required: nextTierRequirements.satisfaction,
        progress: performanceData.avgCustomerSatisfaction / nextTierRequirements.satisfaction,
        description: `${performanceData.avgCustomerSatisfaction}/${nextTierRequirements.satisfaction} i snitt`
      }
    ];
    
    const potentialBonusIncrease = (nextTierRequirements.multiplier - this.tierThresholds[currentTier as keyof TierThresholds].multiplier) * 100;
    
    return {
      nextTier,
      requirementsToAchieve: requirements,
      potentialBonusIncrease,
      estimatedTimeToAchieve: this.estimateTimeToNextTier(requirements)
    };
  }

  private estimateTimeToNextTier(requirements: TierRequirement[]): string {
    const avgProgress = requirements.reduce((sum, req) => sum + req.progress, 0) / requirements.length;
    
    if (avgProgress >= 0.8) return '1-2 månader';
    if (avgProgress >= 0.6) return '2-3 månader';
    if (avgProgress >= 0.4) return '3-6 månader';
    return '6+ månader';
  }

  private async storeKickbackCalculation(calculation: KickbackCalculation): Promise<void> {
    // In real implementation, store in database
    console.log(`💾 Storing kickback calculation for partner ${calculation.partnerId}`);
  }

  async processPayment(calculationId: string): Promise<void> {
    console.log(`💳 Processing payment for calculation ${calculationId}`);
    // In real implementation, integrate with payment systems
  }

  async generatePaymentReport(partnerId: number, period: string): Promise<any> {
    const calculation = await this.calculateMonthlyKickback(partnerId, undefined, period);
    
    return {
      partnerId,
      period,
      summary: {
        totalReferrals: calculation.referralsIncluded.length,
        baseAmount: calculation.baseAmount,
        totalBonuses: calculation.bonuses.total,
        totalDeductions: calculation.deductions.total,
        finalAmount: calculation.finalAmount
      },
      breakdown: calculation,
      paymentStatus: 'calculated',
      nextPaymentDate: calculation.paymentInstructions.nextPaymentDate
    };
  }

  async optimizeKickbackRates(partnerId: number, performanceData: any): Promise<number> {
    // AI-powered optimization of kickback rates based on performance
    const baseRate = 0.08;
    const performanceMultiplier = performanceData.conversionRate * 1.2;
    const qualityMultiplier = performanceData.avgCustomerSatisfaction / 5.0;
    
    const optimizedRate = baseRate * performanceMultiplier * qualityMultiplier;
    
    console.log(`🔧 Optimized kickback rate for partner ${partnerId}: ${(optimizedRate * 100).toFixed(1)}%`);
    return Math.min(optimizedRate, 0.15); // Cap at 15%
  }
}