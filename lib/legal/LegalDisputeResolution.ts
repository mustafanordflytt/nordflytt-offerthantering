import { supabase } from '@/lib/supabase';

interface DisputeData {
  customer_id: number;
  uppdrag_id: number;
  title: string;
  description: string;
  estimated_value?: number;
  incident_date?: string;
}

interface Classification {
  type: string;
  keywords: string[];
  severity: string;
  typical_resolution: string;
  legal_framework: string;
  automation_eligible: boolean;
  average_resolution_days: number;
  confidence: number;
}

interface LegalAnalysis {
  strength: number;
  position_strength: 'strong' | 'moderate' | 'weak';
  key_factors: any;
  risks: string[];
  opportunities: string[];
  recommended_approach: string;
  complexity?: number;
}

interface ResponseStrategy {
  action: string;
  tone: string;
  offer_compromise: boolean;
  settlement_willingness: number;
  insurance_involvement: boolean;
  escalation_threshold: number;
  auto_response_eligible: boolean;
  estimated_cost: number;
  estimated_days: number;
  success_probability: number;
  escalate?: boolean;
  insuranceClaim?: boolean;
}

export class LegalDisputeResolution {
  private disputeTypes = {
    damage_claim: {
      keywords: ["skada", "trasig", "sönder", "krossad", "förstörd", "repig", "bucklig", "skadad", "defekt"],
      severity: "high",
      typical_resolution: "insurance_claim_or_compensation",
      legal_framework: "Konsumenttjänstlagen § 24-25",
      automation_eligible: true,
      average_resolution_days: 7
    },
    
    service_complaint: {
      keywords: ["sent", "dålig service", "oprofessionellt", "missnöjd", "otrevlig", "klagomål", "besviken"],
      severity: "medium", 
      typical_resolution: "service_recovery_or_discount",
      legal_framework: "Konsumenttjänstlagen § 11-12",
      automation_eligible: true,
      average_resolution_days: 3
    },
    
    pricing_dispute: {
      keywords: ["för dyrt", "felaktig faktura", "överdebitering", "fel pris", "för mycket", "kostnad"],
      severity: "medium",
      typical_resolution: "price_adjustment_or_explanation",
      legal_framework: "Konsumenttjänstlagen § 15",
      automation_eligible: true,
      average_resolution_days: 2
    },
    
    contract_breach: {
      keywords: ["avtalsbrott", "ej levererat", "inte som överenskommet", "brutit avtal", "kontraktsbrott"],
      severity: "high",
      typical_resolution: "contract_remediation_or_damages",
      legal_framework: "Avtalslagen + Konsumenttjänstlagen",
      automation_eligible: false,
      average_resolution_days: 14
    },
    
    delay_complaint: {
      keywords: ["försening", "inte i tid", "för sent", "kom aldrig", "försenad", "väntat"],
      severity: "low",
      typical_resolution: "explanation_and_goodwill",
      legal_framework: "Konsumenttjänstlagen § 9",
      automation_eligible: true,
      average_resolution_days: 1
    },

    payment_dispute: {
      keywords: ["betalt", "faktura", "pengar", "återbetalning", "kostnad", "betalning"],
      severity: "medium",
      typical_resolution: "payment_plan_or_adjustment",
      legal_framework: "Konsumenttjänstlagen § 15-16",
      automation_eligible: true,
      average_resolution_days: 5
    }
  };

  async handleIncomingDispute(disputeData: DisputeData) {
    try {
      // Step 1: Classify the dispute
      const classification = await this.classifyDispute(disputeData);
      
      // Step 2: Analyze legal position
      const legalAnalysis = await this.analyzeLegalPosition(disputeData, classification);
      
      // Step 3: Generate response strategy
      const responseStrategy = await this.generateResponseStrategy(legalAnalysis);
      
      // Step 4: Store analysis and create case
      const caseRecord = await this.createLegalCase(disputeData, classification, legalAnalysis);
      
      // Step 5: Store AI analysis
      await this.storeAIAnalysis(caseRecord.id, classification, legalAnalysis, responseStrategy);
      
      // Step 6: Generate automatic response if applicable
      if (responseStrategy.auto_response_eligible) {
        await this.generateAutomaticResponse(caseRecord, responseStrategy);
      }

      return {
        case_number: caseRecord.case_number,
        case_id: caseRecord.id,
        classification: classification,
        legal_strength: legalAnalysis.strength,
        recommended_action: responseStrategy.action,
        auto_response_sent: responseStrategy.auto_response_eligible,
        escalation_needed: responseStrategy.escalate,
        insurance_claim_recommended: responseStrategy.insuranceClaim,
        estimated_resolution_time: responseStrategy.estimated_days,
        estimated_cost: responseStrategy.estimated_cost
      };
    } catch (error) {
      console.error('Error handling dispute:', error);
      throw error;
    }
  }

  private async classifyDispute(disputeData: DisputeData): Promise<Classification> {
    const description = disputeData.description.toLowerCase();
    
    let bestMatch = null;
    let highestScore = 0;

    for (const [type, config] of Object.entries(this.disputeTypes)) {
      const score = this.calculateMatchScore(description, config.keywords);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = { 
          type, 
          ...config, 
          confidence: score 
        };
      }
    }

    // Default to service complaint if no clear match
    if (!bestMatch || highestScore < 0.2) {
      bestMatch = {
        type: 'service_complaint',
        ...this.disputeTypes.service_complaint,
        confidence: 0.5
      };
    }

    return bestMatch;
  }

  private calculateMatchScore(text: string, keywords: string[]): number {
    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
      }
    }
    return matches / keywords.length;
  }

  private async analyzeLegalPosition(
    disputeData: DisputeData, 
    classification: Classification
  ): Promise<LegalAnalysis> {
    // Simulate legal analysis (in production, this would involve more complex logic)
    const factors = {
      contract_terms: await this.analyzeContractTerms(disputeData.uppdrag_id),
      documentation: await this.assessDocumentationQuality(disputeData.uppdrag_id),
      customer_history: await this.getCustomerHistory(disputeData.customer_id),
      insurance_coverage: await this.checkInsuranceCoverage(classification.type),
      evidence_strength: 0.7, // Placeholder
      precedents: []
    };

    // Calculate overall legal strength
    const legalStrength = this.calculateLegalStrength(factors);
    
    return {
      strength: legalStrength,
      position_strength: legalStrength > 0.7 ? 'strong' : legalStrength > 0.4 ? 'moderate' : 'weak',
      key_factors: factors,
      risks: this.identifyLegalRisks(factors),
      opportunities: this.identifyLegalOpportunities(factors),
      recommended_approach: this.recommendLegalApproach(legalStrength, factors),
      complexity: 0.5 // Placeholder
    };
  }

  private async analyzeContractTerms(uppdragId: number): Promise<number> {
    // Check if we have proper contract documentation
    const { data: uppdrag } = await supabase
      .from('uppdrag')
      .select('contract_signed, special_conditions')
      .eq('id', uppdragId)
      .single();

    return uppdrag?.contract_signed ? 0.8 : 0.4;
  }

  private async assessDocumentationQuality(uppdragId: number): Promise<number> {
    // Check if we have photos and proper documentation
    const { data: docs } = await supabase
      .from('job_photos')
      .select('id')
      .eq('uppdrag_id', uppdragId);

    return docs && docs.length > 5 ? 0.9 : 0.5;
  }

  private async getCustomerHistory(customerId: number): Promise<any> {
    const { data: history } = await supabase
      .from('legal_disputes')
      .select('id, status')
      .eq('customer_id', customerId);

    return {
      previous_disputes: history?.length || 0,
      complaint_prone: (history?.length || 0) > 2
    };
  }

  private async checkInsuranceCoverage(disputeType: string): Promise<boolean> {
    // Check if this type of dispute is covered by insurance
    return ['damage_claim', 'contract_breach'].includes(disputeType);
  }

  private calculateLegalStrength(factors: any): number {
    let strength = 0.5; // Base strength

    if (factors.contract_terms > 0.7) strength += 0.2;
    if (factors.documentation > 0.7) strength += 0.15;
    if (factors.customer_history.complaint_prone) strength -= 0.1;
    if (factors.insurance_coverage) strength += 0.1;

    return Math.max(0, Math.min(1, strength));
  }

  private identifyLegalRisks(factors: any): string[] {
    const risks = [];
    
    if (factors.contract_terms < 0.5) {
      risks.push("Svag kontraktsdokumentation");
    }
    if (factors.documentation < 0.5) {
      risks.push("Otillräcklig fotodokumentation");
    }
    if (factors.customer_history.complaint_prone) {
      risks.push("Kund med historik av klagomål");
    }
    
    return risks;
  }

  private identifyLegalOpportunities(factors: any): string[] {
    const opportunities = [];
    
    if (factors.contract_terms > 0.7) {
      opportunities.push("Starkt kontraktuellt skydd");
    }
    if (factors.insurance_coverage) {
      opportunities.push("Försäkringsskydd tillgängligt");
    }
    if (factors.documentation > 0.7) {
      opportunities.push("Utmärkt dokumentation");
    }
    
    return opportunities;
  }

  private recommendLegalApproach(strength: number, factors: any): string {
    if (strength > 0.7) {
      return "Professionellt försvar av position med öppenhet för dialog";
    } else if (strength > 0.4) {
      return "Förhandla fram ömsesidigt acceptabel lösning";
    } else {
      return "Snabb och rättvis förlikning för att minimera skada";
    }
  }

  private async generateResponseStrategy(legalAnalysis: LegalAnalysis): Promise<ResponseStrategy> {
    const strategies = {
      strong: {
        action: "defend_position_professionally",
        tone: "confident_but_respectful",
        offer_compromise: false,
        settlement_willingness: 0.1,
        insurance_involvement: false,
        escalation_threshold: 0.9
      },
      
      moderate: {
        action: "negotiate_resolution",
        tone: "professional_and_solution_focused",
        offer_compromise: true,
        settlement_willingness: 0.6,
        insurance_involvement: true,
        escalation_threshold: 0.7
      },
      
      weak: {
        action: "settle_quickly_and_fairly",
        tone: "apologetic_and_solution_focused",
        offer_compromise: true,
        settlement_willingness: 0.9,
        insurance_involvement: true,
        escalation_threshold: 0.3
      }
    };

    const selectedStrategy = strategies[legalAnalysis.position_strength];
    
    return {
      ...selectedStrategy,
      auto_response_eligible: legalAnalysis.strength > 0.3 && (legalAnalysis.complexity || 0.5) < 0.8,
      estimated_cost: await this.estimateResolutionCost(legalAnalysis),
      estimated_days: await this.estimateResolutionTime(legalAnalysis),
      success_probability: legalAnalysis.strength,
      escalate: legalAnalysis.strength < 0.3,
      insuranceClaim: legalAnalysis.key_factors.insurance_coverage
    };
  }

  private async estimateResolutionCost(legalAnalysis: LegalAnalysis): Promise<number> {
    // Base cost estimation
    if (legalAnalysis.position_strength === 'strong') return 500;
    if (legalAnalysis.position_strength === 'moderate') return 2500;
    return 5000;
  }

  private async estimateResolutionTime(legalAnalysis: LegalAnalysis): Promise<number> {
    // Base time estimation
    if (legalAnalysis.position_strength === 'strong') return 3;
    if (legalAnalysis.position_strength === 'moderate') return 7;
    return 14;
  }

  private async createLegalCase(
    disputeData: DisputeData, 
    classification: Classification,
    legalAnalysis: LegalAnalysis
  ) {
    const caseNumber = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    
    const { data: category } = await supabase
      .from('legal_case_categories')
      .select('id')
      .eq('category_name', classification.type)
      .single();

    const { data: caseRecord, error } = await supabase
      .from('legal_disputes')
      .insert({
        case_number: caseNumber,
        customer_id: disputeData.customer_id,
        uppdrag_id: disputeData.uppdrag_id,
        category_id: category?.id,
        dispute_title: disputeData.title,
        dispute_description: disputeData.description,
        incident_date: disputeData.incident_date,
        estimated_value: disputeData.estimated_value,
        urgency_level: classification.severity,
        status: 'new'
      })
      .select()
      .single();

    if (error) throw error;
    return caseRecord;
  }

  private async storeAIAnalysis(
    caseId: number,
    classification: Classification,
    legalAnalysis: LegalAnalysis,
    responseStrategy: ResponseStrategy
  ) {
    await supabase
      .from('ai_legal_analysis')
      .insert({
        dispute_id: caseId,
        ai_classification: {
          type: classification.type,
          confidence: classification.confidence,
          keywords_matched: classification.keywords
        },
        legal_strength_assessment: legalAnalysis.strength,
        risk_factors: legalAnalysis.risks,
        recommended_strategy: responseStrategy.action,
        estimated_resolution_time: responseStrategy.estimated_days,
        estimated_cost_range: {
          min: responseStrategy.estimated_cost * 0.7,
          max: responseStrategy.estimated_cost * 1.3
        },
        confidence_score: classification.confidence,
        escalation_recommended: responseStrategy.escalate || false,
        insurance_claim_recommended: responseStrategy.insuranceClaim || false
      });
  }

  async generateAutomaticResponse(caseRecord: any, strategy: ResponseStrategy) {
    const response = await this.generateResponseContent(caseRecord, strategy);
    
    // Store the communication
    await supabase
      .from('legal_communications')
      .insert({
        dispute_id: caseRecord.id,
        communication_type: 'initial_response',
        direction: 'outbound',
        sender: 'Nordflytt Juridiska Avdelningen',
        recipient: caseRecord.customer_email || 'Kund',
        subject: `Angående ert ärende ${caseRecord.case_number}`,
        content: response,
        ai_generated: true,
        template_used: `${caseRecord.category}_${strategy.tone}`
      });

    return response;
  }

  private async generateResponseContent(caseRecord: any, strategy: ResponseStrategy): Promise<string> {
    // This would be replaced with actual AI content generation
    const templates = {
      confident_but_respectful: `
Hej,

Tack för er kontakt angående ${caseRecord.dispute_title}.

Vi har genomfört en noggrann utredning av ärendet och kan konstatera att vi har agerat i enlighet med gällande avtal och branschpraxis.

Vi står naturligtvis till förfogande för vidare dialog om ni har ytterligare frågor.

Med vänlig hälsning,
Nordflytt Juridiska Avdelningen

Referensnummer: ${caseRecord.case_number}
      `,
      
      professional_and_solution_focused: `
Hej,

Tack för att ni kontaktat oss angående ${caseRecord.dispute_title}.

Vi tar alla kundfeedback på största allvar och vill gärna hitta en lösning som fungerar för alla parter.

Vårt förslag är att vi diskuterar ärendet vidare för att komma fram till en ömsesidigt acceptabel lösning.

Vänligen kontakta oss på 010-555 12 89 så tar vi detta vidare.

Med vänlig hälsning,
Nordflytt Kundservice

Referensnummer: ${caseRecord.case_number}
      `,
      
      apologetic_and_solution_focused: `
Hej,

Vi beklagar verkligen de problem som uppstått i samband med ${caseRecord.dispute_title}.

Vi tar fullt ansvar för situationen och vill omedelbart rätta till detta. 

Vänligen kontakta oss så fort som möjligt så löser vi detta på bästa sätt.

Med vänlig hälsning,
Nordflytt

Referensnummer: ${caseRecord.case_number}
      `
    };

    return templates[strategy.tone] || templates.professional_and_solution_focused;
  }
}