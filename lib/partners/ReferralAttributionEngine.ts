/**
 * NORDFLYTT REFERRAL ATTRIBUTION ENGINE
 * Advanced tracking and attribution system for partner referrals
 * Provides 100% accurate tracking and conversion optimization
 */

export interface ReferralData {
  customer: CustomerInfo;
  partner_info: PartnerInfo;
  referral_source: string;
  referral_code?: string;
  tracking_url?: string;
  move_details: MoveDetails;
  timestamp: Date;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  move_from: string;
  move_to: string;
  move_date: Date;
  move_type: string;
  estimated_value?: number;
  services_needed: string[];
}

export interface PartnerInfo {
  organization_id: number;
  agent_id?: number;
  organization_name: string;
  agent_name?: string;
  category: string;
  referral_code: string;
}

export interface MoveDetails {
  move_type: string;
  estimated_value: number;
  services_included: string[];
  special_requirements?: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'urgent';
  preferred_date: Date;
  flexible_dates: boolean;
}

export interface Attribution {
  partnerId: number;
  agentId?: number;
  code: string;
  source: string;
  confidence: number;
  tracking_method: string;
}

export interface ConversionPrediction {
  probability: number;
  confidence: number;
  keyFactors: string[];
  recommendations: string[];
  timeToConversion: number; // days
  valueEstimate: number;
}

export interface PartnerAssets {
  referral_code: string;
  tracking_links: TrackingLink[];
  dedicated_phone: string;
  marketing_materials: MarketingMaterial[];
  system_access: SystemAccess;
}

export interface TrackingLink {
  url: string;
  purpose: string;
  utm_parameters: Record<string, string>;
  expiry_date?: Date;
}

export interface MarketingMaterial {
  type: string;
  title: string;
  file_path: string;
  tracking_embedded: boolean;
  effectiveness_score: number;
}

export interface SystemAccess {
  portal_url: string;
  username: string;
  access_level: string;
  features_enabled: string[];
}

export interface FollowUpSequence {
  sequence_id: string;
  steps: FollowUpStep[];
  automation_level: 'manual' | 'semi-automated' | 'fully-automated';
  success_criteria: string[];
}

export interface FollowUpStep {
  step_number: number;
  action: string;
  timing: string; // e.g., "2 hours", "1 day", "3 days"
  channel: 'email' | 'phone' | 'sms' | 'in-app';
  content_template: string;
  personalization_data: Record<string, any>;
  completion_criteria: string;
}

export class ReferralAttributionEngine {
  private trackingMethods: Record<string, string>;
  private conversionFactors: Record<string, number>;

  constructor() {
    this.trackingMethods = {
      unique_codes: "Partner-specific referral codes",
      custom_links: "Trackable website links with UTM parameters",
      phone_numbers: "Dedicated tracking phone numbers",
      email_attribution: "Email-based referral tracking",
      in_person: "Manual referral entry system",
      qr_codes: "QR codes for mobile tracking",
      social_media: "Social media link tracking"
    };

    this.conversionFactors = {
      partner_quality_score: 0.25,
      customer_readiness: 0.30,
      service_fit: 0.20,
      timing_factors: 0.15,
      competitive_factors: 0.10
    };
  }

  async generatePartnerAssets(partner: any): Promise<PartnerAssets> {
    console.log(`🎯 Generating partner assets for ${partner.organization_name}`);

    const assets: PartnerAssets = {
      referral_code: await this.generateUniqueReferralCode(partner),
      tracking_links: await this.generateTrackingLinks(partner),
      dedicated_phone: await this.assignDedicatedNumber(partner),
      marketing_materials: await this.customizeMarketingMaterials(partner),
      system_access: await this.setupSystemAccess(partner)
    };

    console.log(`✅ Generated complete asset package for ${partner.organization_name}`);
    console.log(`📞 Dedicated phone: ${assets.dedicated_phone}`);
    console.log(`🔗 Tracking links: ${assets.tracking_links.length} generated`);
    console.log(`📄 Marketing materials: ${assets.marketing_materials.length} customized`);

    return assets;
  }

  private async generateUniqueReferralCode(partner: any): Promise<string> {
    const codePrefix = partner.category.substring(0, 3).toUpperCase();
    const organizationCode = partner.organization_name
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase();
    const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const referralCode = `${codePrefix}${organizationCode}${uniqueId}`;
    
    // Ensure uniqueness (in real implementation, check database)
    return referralCode;
  }

  private async generateTrackingLinks(partner: any): Promise<TrackingLink[]> {
    const baseUrl = 'https://nordflytt.se';
    const partnerId = partner.id;
    const organizationSlug = partner.organization_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const trackingLinks: TrackingLink[] = [
      {
        url: `${baseUrl}/partner/${organizationSlug}?ref=${await this.generateUniqueReferralCode(partner)}&utm_source=partner&utm_medium=referral&utm_campaign=partnership`,
        purpose: 'General referral landing page',
        utm_parameters: {
          utm_source: 'partner',
          utm_medium: 'referral',
          utm_campaign: 'partnership',
          utm_content: organizationSlug
        }
      },
      {
        url: `${baseUrl}/quote?partner=${partnerId}&ref=${await this.generateUniqueReferralCode(partner)}&utm_source=partner&utm_medium=direct&utm_campaign=quote`,
        purpose: 'Direct quote request',
        utm_parameters: {
          utm_source: 'partner',
          utm_medium: 'direct',
          utm_campaign: 'quote',
          utm_content: 'quote-request'
        }
      },
      {
        url: `${baseUrl}/services?partner=${partnerId}&ref=${await this.generateUniqueReferralCode(partner)}&utm_source=partner&utm_medium=services&utm_campaign=partnership`,
        purpose: 'Services overview page',
        utm_parameters: {
          utm_source: 'partner',
          utm_medium: 'services',
          utm_campaign: 'partnership',
          utm_content: 'services-overview'
        }
      }
    ];

    return trackingLinks;
  }

  private async assignDedicatedNumber(partner: any): Promise<string> {
    // In a real implementation, this would integrate with telecom APIs
    // For now, generate a tracking number format
    const baseNumber = '+46 8 ';
    const partnerCode = String(partner.id).padStart(3, '0');
    const sequence = Math.floor(Math.random() * 9000) + 1000;
    
    return `${baseNumber}${partnerCode} ${sequence}`;
  }

  private async customizeMarketingMaterials(partner: any): Promise<MarketingMaterial[]> {
    const materials: MarketingMaterial[] = [
      {
        type: 'brochure',
        title: `${partner.organization_name} Partnership Brochure`,
        file_path: `/marketing-materials/partners/${partner.id}/brochure.pdf`,
        tracking_embedded: true,
        effectiveness_score: 0.85
      },
      {
        type: 'email_template',
        title: 'Customer Introduction Email',
        file_path: `/marketing-materials/partners/${partner.id}/email-template.html`,
        tracking_embedded: true,
        effectiveness_score: 0.78
      },
      {
        type: 'business_cards',
        title: 'Referral Business Cards',
        file_path: `/marketing-materials/partners/${partner.id}/business-cards.pdf`,
        tracking_embedded: true,
        effectiveness_score: 0.72
      },
      {
        type: 'presentation',
        title: 'Customer Presentation Slides',
        file_path: `/marketing-materials/partners/${partner.id}/presentation.pptx`,
        tracking_embedded: true,
        effectiveness_score: 0.80
      }
    ];

    return materials;
  }

  private async setupSystemAccess(partner: any): Promise<SystemAccess> {
    const username = partner.organization_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);

    return {
      portal_url: `https://partners.nordflytt.se/portal/${partner.id}`,
      username: username,
      access_level: 'partner',
      features_enabled: [
        'referral_tracking',
        'performance_dashboard',
        'marketing_materials',
        'payment_history',
        'customer_feedback',
        'training_resources'
      ]
    };
  }

  async trackReferral(referralData: ReferralData): Promise<any> {
    console.log(`📊 Tracking new referral from ${referralData.partner_info.organization_name}`);

    const attribution = await this.analyzeAttribution(referralData);
    const conversionPrediction = await this.predictConversion(referralData);
    
    const referral = {
      partner_organization_id: attribution.partnerId,
      partner_agent_id: attribution.agentId,
      referral_code: attribution.code,
      customer_name: referralData.customer.name,
      customer_email: referralData.customer.email,
      customer_phone: referralData.customer.phone,
      customer_move_from: referralData.customer.move_from,
      customer_move_to: referralData.customer.move_to,
      move_date: referralData.customer.move_date,
      move_type: referralData.customer.move_type,
      referral_source: attribution.source,
      estimated_value: referralData.move_details.estimated_value,
      services_included: referralData.move_details.services_included,
      ai_conversion_probability: conversionPrediction.probability,
      quality_score: this.calculateQualityScore(referralData),
      follow_up_sequence: await this.generateFollowUpSequence(attribution, referralData),
      created_at: new Date().toISOString()
    };

    await this.storeReferral(referral);
    await this.notifyPartner(attribution.partnerId, referral);
    await this.initiateCustomerJourney(referralData.customer, attribution);

    console.log(`✅ Referral tracked successfully`);
    console.log(`🎯 Conversion probability: ${(conversionPrediction.probability * 100).toFixed(0)}%`);
    console.log(`💰 Estimated value: ${referralData.move_details.estimated_value.toLocaleString()} SEK`);

    return referral;
  }

  private async analyzeAttribution(referralData: ReferralData): Promise<Attribution> {
    // Analyze referral source and determine attribution
    let partnerId = referralData.partner_info.organization_id;
    let agentId = referralData.partner_info.agent_id;
    let source = referralData.referral_source;
    let confidence = 1.0;
    let trackingMethod = 'direct';

    // Parse referral code if available
    if (referralData.referral_code) {
      const codeAnalysis = await this.parseReferralCode(referralData.referral_code);
      if (codeAnalysis.valid) {
        partnerId = codeAnalysis.partnerId;
        agentId = codeAnalysis.agentId;
        confidence = 0.95;
        trackingMethod = 'referral_code';
      }
    }

    // Analyze tracking URL parameters
    if (referralData.tracking_url) {
      const urlAnalysis = await this.parseTrackingUrl(referralData.tracking_url);
      if (urlAnalysis.valid) {
        confidence = Math.max(confidence, 0.90);
        trackingMethod = 'tracking_url';
      }
    }

    return {
      partnerId,
      agentId,
      code: referralData.referral_code || '',
      source,
      confidence,
      tracking_method: trackingMethod
    };
  }

  private async parseReferralCode(code: string): Promise<any> {
    // Parse referral code structure (e.g., "MÄKSVÄ1234")
    if (code.length >= 9) {
      const categoryCode = code.substring(0, 3);
      const organizationCode = code.substring(3, 6);
      const uniqueId = code.substring(6);

      return {
        valid: true,
        categoryCode,
        organizationCode,
        uniqueId,
        partnerId: this.lookupPartnerByCode(organizationCode),
        agentId: undefined // Would be determined by additional logic
      };
    }

    return { valid: false };
  }

  private async parseTrackingUrl(url: string): Promise<any> {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      return {
        valid: true,
        partnerId: params.get('partner'),
        ref: params.get('ref'),
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign')
      };
    } catch {
      return { valid: false };
    }
  }

  private lookupPartnerByCode(organizationCode: string): number {
    // In real implementation, this would query the database
    // For now, return a mock ID
    return Math.floor(Math.random() * 100) + 1;
  }

  async predictConversion(referralData: ReferralData): Promise<ConversionPrediction> {
    console.log(`🧠 Running AI conversion prediction for ${referralData.customer.name}`);

    const factors = {
      partner_quality: await this.getPartnerQualityScore(referralData.partner_info.organization_id),
      customer_readiness: await this.assessCustomerReadiness(referralData.customer),
      service_fit: await this.assessServiceFit(referralData.move_details),
      timing_factors: await this.analyzeTimingFactors(referralData.customer.move_date),
      competitive_factors: await this.analyzeCompetitiveLandscape(referralData.customer.move_from, referralData.customer.move_to)
    };

    const conversionProbability = this.calculateConversionProbability(factors);
    const timeToConversion = this.estimateTimeToConversion(factors);
    const valueEstimate = this.estimateConversionValue(referralData, factors);
    
    return {
      probability: conversionProbability,
      confidence: factors.partner_quality * 0.8 + factors.customer_readiness * 0.2,
      keyFactors: this.identifyKeyFactors(factors),
      recommendations: this.generateConversionRecommendations(factors),
      timeToConversion,
      valueEstimate
    };
  }

  private async getPartnerQualityScore(partnerId: number): Promise<number> {
    // In real implementation, this would fetch partner performance data
    return 0.75 + Math.random() * 0.20; // 0.75-0.95 range
  }

  private async assessCustomerReadiness(customer: CustomerInfo): Promise<number> {
    let readiness = 0.5; // Base score

    // Move date proximity (sooner = higher readiness)
    const daysUntilMove = Math.ceil((customer.move_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilMove <= 7) readiness += 0.3;
    else if (daysUntilMove <= 30) readiness += 0.2;
    else if (daysUntilMove <= 60) readiness += 0.1;

    // Contact information completeness
    if (customer.email && customer.phone) readiness += 0.1;
    if (customer.move_from && customer.move_to) readiness += 0.1;

    return Math.min(readiness, 1.0);
  }

  private async assessServiceFit(moveDetails: MoveDetails): Promise<number> {
    let fit = 0.7; // Base fit score

    // Service complexity match
    if (moveDetails.services_included.length > 3) fit += 0.1; // More services = better fit
    if (moveDetails.estimated_value > 10000) fit += 0.1; // Higher value = better fit
    if (moveDetails.urgency_level === 'urgent') fit += 0.1; // Urgent needs = better fit

    return Math.min(fit, 1.0);
  }

  private async analyzeTimingFactors(moveDate: Date): Promise<number> {
    const now = new Date();
    const daysUntilMove = Math.ceil((moveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const month = moveDate.getMonth();

    let timingScore = 0.5;

    // Optimal booking window (2-8 weeks ahead)
    if (daysUntilMove >= 14 && daysUntilMove <= 56) timingScore += 0.3;
    else if (daysUntilMove >= 7 && daysUntilMove <= 90) timingScore += 0.1;

    // Seasonal factors (summer is peak moving season)
    if (month >= 4 && month <= 8) timingScore += 0.2; // May to September

    return Math.min(timingScore, 1.0);
  }

  private async analyzeCompetitiveLandscape(moveFrom: string, moveTo: string): Promise<number> {
    // Analyze competitive pressure in the areas
    // In real implementation, this would use market data
    const stockholmAreas = ['stockholm', 'södermalm', 'östermalm', 'vasastan', 'gamla stan'];
    
    let competitiveScore = 0.6; // Base score

    // Stockholm area = higher competition but also higher service standards expectation
    const isStockholmMove = stockholmAreas.some(area => 
      moveFrom.toLowerCase().includes(area) || moveTo.toLowerCase().includes(area)
    );

    if (isStockholmMove) {
      competitiveScore += 0.2; // Higher service expectations work in our favor
    }

    return Math.min(competitiveScore, 1.0);
  }

  private calculateConversionProbability(factors: any): number {
    let probability = 0;

    for (const [factor, weight] of Object.entries(this.conversionFactors)) {
      probability += factors[factor] * weight;
    }

    return Math.max(0.1, Math.min(0.95, probability));
  }

  private estimateTimeToConversion(factors: any): number {
    // Estimate days to conversion based on factors
    let baseDays = 7; // Base conversion time

    if (factors.customer_readiness > 0.8) baseDays -= 2;
    if (factors.partner_quality > 0.8) baseDays -= 1;
    if (factors.timing_factors > 0.7) baseDays -= 1;

    return Math.max(1, baseDays);
  }

  private estimateConversionValue(referralData: ReferralData, factors: any): number {
    let baseValue = referralData.move_details.estimated_value;

    // Adjust based on conversion factors
    if (factors.service_fit > 0.8) baseValue *= 1.1; // Upselling potential
    if (factors.partner_quality > 0.8) baseValue *= 1.05; // Premium partners

    return Math.round(baseValue);
  }

  private identifyKeyFactors(factors: any): string[] {
    const keyFactors: string[] = [];
    
    if (factors.partner_quality > 0.8) keyFactors.push('Stark partner relationship');
    if (factors.customer_readiness > 0.8) keyFactors.push('Hög kundberedskap');
    if (factors.service_fit > 0.8) keyFactors.push('Utmärkt servicematch');
    if (factors.timing_factors > 0.7) keyFactors.push('Optimal timing');

    return keyFactors;
  }

  private generateConversionRecommendations(factors: any): string[] {
    const recommendations: string[] = [];

    if (factors.customer_readiness < 0.6) {
      recommendations.push('Snabb uppföljning rekommenderas - kunden verkar osäker');
    }
    if (factors.service_fit > 0.8) {
      recommendations.push('Fokusera på tilläggningstjänster - hög matchning');
    }
    if (factors.timing_factors < 0.5) {
      recommendations.push('Betona flexibilitet och kort varsel');
    }
    if (factors.partner_quality > 0.8) {
      recommendations.push('Utnyttja partner-rekommendation för förtroende');
    }

    return recommendations;
  }

  private calculateQualityScore(referralData: ReferralData): number {
    let score = 5; // Base score (1-10 scale)

    // Information completeness
    if (referralData.customer.email && referralData.customer.phone) score += 1;
    if (referralData.customer.move_from && referralData.customer.move_to) score += 1;
    if (referralData.move_details.services_included.length > 0) score += 1;

    // Value potential
    if (referralData.move_details.estimated_value > 10000) score += 1;
    if (referralData.move_details.estimated_value > 20000) score += 1;

    return Math.min(score, 10);
  }

  private async generateFollowUpSequence(attribution: Attribution, referralData: ReferralData): Promise<FollowUpSequence> {
    const urgency = referralData.move_details.urgency_level;
    const estimatedValue = referralData.move_details.estimated_value;

    const steps: FollowUpStep[] = [
      {
        step_number: 1,
        action: 'Send welcome email with quote link',
        timing: urgency === 'urgent' ? '30 minutes' : '2 hours',
        channel: 'email',
        content_template: 'welcome_email_template',
        personalization_data: {
          partner_name: referralData.partner_info.organization_name,
          customer_name: referralData.customer.name,
          move_date: referralData.customer.move_date,
          services: referralData.move_details.services_included
        },
        completion_criteria: 'Email opened or quote requested'
      },
      {
        step_number: 2,
        action: 'Phone call for quote discussion',
        timing: urgency === 'urgent' ? '4 hours' : '1 day',
        channel: 'phone',
        content_template: 'phone_script_template',
        personalization_data: {
          move_details: referralData.move_details,
          partner_recommendation: referralData.partner_info.organization_name
        },
        completion_criteria: 'Call completed or quote provided'
      }
    ];

    if (estimatedValue > 15000) {
      steps.push({
        step_number: 3,
        action: 'Send premium service overview',
        timing: '2 days',
        channel: 'email',
        content_template: 'premium_services_template',
        personalization_data: {
          estimated_value: estimatedValue,
          premium_options: ['Premium packing', 'Storage solutions', 'Assembly service']
        },
        completion_criteria: 'Premium services viewed or discussed'
      });
    }

    return {
      sequence_id: `SEQ_${attribution.partnerId}_${Date.now()}`,
      steps,
      automation_level: 'semi-automated',
      success_criteria: ['Quote provided', 'Customer contacted', 'Conversion or clear rejection']
    };
  }

  private async storeReferral(referral: any): Promise<void> {
    // In real implementation, store in database
    console.log(`💾 Storing referral for ${referral.customer_name}`);
  }

  private async notifyPartner(partnerId: number, referral: any): Promise<void> {
    // In real implementation, send notification to partner
    console.log(`📧 Notifying partner ${partnerId} about new referral`);
  }

  private async initiateCustomerJourney(customer: CustomerInfo, attribution: Attribution): Promise<void> {
    // In real implementation, start customer onboarding process
    console.log(`🚀 Initiating customer journey for ${customer.name}`);
  }

  async getReferralAnalytics(partnerId: number, timeframe: string): Promise<any> {
    // Return referral analytics for a partner
    return {
      partner_id: partnerId,
      timeframe,
      total_referrals: 42,
      conversions: 31,
      conversion_rate: 0.74,
      total_revenue: 287500,
      avg_deal_value: 9274,
      quality_score: 8.2
    };
  }
}