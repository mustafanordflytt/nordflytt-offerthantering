import { NextRequest, NextResponse } from 'next/server';

/**
 * NORDFLYTT AI-GENERATED OFFERS API
 * Handles AI offer generation and management
 */

// Mock database for AI-generated offers
const mockOffers = [
  {
    id: 1,
    opportunity_id: 1,
    opportunity_title: "Ramavtal kontorsflyttar Stockholms Stad",
    offer_version: 1,
    generated_by_ai: true,
    total_price: 3750000,
    pricing_breakdown: {
      personnel_costs: 2200000,
      transport_costs: 800000,
      equipment_costs: 400000,
      management_costs: 600000,
      ai_optimization_savings: -1250000,
      profit_margin: 0.15
    },
    technical_solution: {
      ai_optimization: {
        route_planning: "AI Phase 2 - Clarke-Wright algoritm för 30-40% effektivare rutter",
        scheduling: "AI Phase 1 - DBSCAN clustering för optimal schemaläggning",
        resource_allocation: "AI Phase 3 - Neural Network för 90%+ precision",
        predictive_analytics: "AI Phase 4 - AWS SageMaker för 95%+ demand forecasting"
      },
      quality_assurance: {
        gps_tracking: "Real-time GPS spårning av all personal och fordon",
        photo_documentation: "AI-baserad bildanalys för före/efter dokumentation",
        performance_monitoring: "Kontinuerlig övervakning av alla KPIs"
      },
      environmental_excellence: {
        co2_optimization: "AI-optimerade rutter för minimal miljöpåverkan",
        sustainability_reporting: "Automatisk miljörapportering per uppdrag"
      }
    },
    compliance_checklist: {
      lou_compliance: true,
      environmental_compliance: true,
      security_compliance: true,
      quality_standards: true,
      insurance_requirements: true,
      audit_trail: true
    },
    competitive_advantages: [
      "60% kostnadsbesparing genom AI-automation",
      "99% precision i planering och genomförande", 
      "Real-time transparens med fullständig spårbarhet",
      "Automatisk LOU-efterlevnad genom AI-system"
    ],
    ai_confidence_score: 0.89,
    estimated_win_probability: 0.75,
    document_paths: {
      executive_summary: "/generated-offers/1/executive-summary.pdf",
      technical_proposal: "/generated-offers/1/technical-proposal.pdf",
      pricing_document: "/generated-offers/1/pricing-breakdown.pdf",
      compliance_doc: "/generated-offers/1/compliance-checklist.pdf",
      full_proposal: "/generated-offers/1/complete-proposal.pdf"
    },
    submission_status: "approved",
    generation_time_seconds: 180,
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z"
  },
  {
    id: 2,
    opportunity_id: 2,
    opportunity_title: "Sjukhusflyttar Region Stockholm",
    offer_version: 1,
    generated_by_ai: true,
    total_price: 2450000,
    pricing_breakdown: {
      personnel_costs: 1800000,
      transport_costs: 950000,
      equipment_costs: 300000,
      management_costs: 400000,
      ai_optimization_savings: -1000000,
      profit_margin: 0.18
    },
    technical_solution: {
      ai_optimization: {
        route_planning: "Specialiserad sjukhuslogistik med AI-optimering",
        scheduling: "24/7 schemaläggning med akutberedskap",
        resource_allocation: "Säkerhetsspecialiserad personalallokering",
        predictive_analytics: "Prediktiv analys för vårdverksamhet"
      },
      quality_assurance: {
        specialized_handling: "Certifierad hantering av medicinsk utrustning",
        security_protocols: "Säkerhetsprotokoll för känslig utrustning",
        emergency_response: "24/7 akutberedskap och support"
      },
      healthcare_compliance: {
        medical_regulations: "Fullständig efterlevnad av vårdregelverk",
        security_clearance: "Säkerhetsgodkänd personal",
        hygiene_protocols: "Strikta hygienkrav och protokoll"
      }
    },
    compliance_checklist: {
      lou_compliance: true,
      healthcare_compliance: true,
      security_compliance: true,
      quality_standards: true,
      insurance_requirements: true,
      audit_trail: true
    },
    competitive_advantages: [
      "Specialiserad sjukhusflyttskompetens med AI-optimering",
      "24/7 tillgänglighet för akuta vårdflyttar",
      "Säkerhetsprotokoll för känslig medicinsk utrustning", 
      "Certifierad personal med vårdverksamhetsbakgrund"
    ],
    ai_confidence_score: 0.85,
    estimated_win_probability: 0.65,
    document_paths: {
      executive_summary: "/generated-offers/2/executive-summary.pdf",
      technical_proposal: "/generated-offers/2/technical-proposal.pdf",
      pricing_document: "/generated-offers/2/pricing-breakdown.pdf",
      compliance_doc: "/generated-offers/2/compliance-checklist.pdf",
      full_proposal: "/generated-offers/2/complete-proposal.pdf"
    },
    submission_status: "review",
    generation_time_seconds: 210,
    created_at: "2025-01-14T14:15:00Z",
    updated_at: "2025-01-15T09:20:00Z"
  }
];

export async function GET(request: NextRequest) {
  console.log('📋 Fetching AI-generated offers');
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const opportunityId = searchParams.get('opportunity_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter offers based on query parameters
    let filteredOffers = mockOffers;

    if (status && status !== 'all') {
      filteredOffers = filteredOffers.filter(offer => offer.submission_status === status);
    }

    if (opportunityId) {
      filteredOffers = filteredOffers.filter(offer => offer.opportunity_id === parseInt(opportunityId));
    }

    // Apply pagination
    const paginatedOffers = filteredOffers.slice(offset, offset + limit);

    // Calculate summary statistics
    const summaryStats = {
      total_offers: mockOffers.length,
      average_confidence: mockOffers.reduce((sum, offer) => sum + offer.ai_confidence_score, 0) / mockOffers.length,
      average_win_probability: mockOffers.reduce((sum, offer) => sum + offer.estimated_win_probability, 0) / mockOffers.length,
      average_generation_time: mockOffers.reduce((sum, offer) => sum + offer.generation_time_seconds, 0) / mockOffers.length,
      status_distribution: {
        draft: mockOffers.filter(o => o.submission_status === 'draft').length,
        review: mockOffers.filter(o => o.submission_status === 'review').length,
        approved: mockOffers.filter(o => o.submission_status === 'approved').length,
        submitted: mockOffers.filter(o => o.submission_status === 'submitted').length
      }
    };

    console.log(`✅ Found ${filteredOffers.length} offers (showing ${paginatedOffers.length})`);
    console.log(`📊 Average confidence: ${(summaryStats.average_confidence * 100).toFixed(0)}%`);

    return NextResponse.json({
      success: true,
      data: paginatedOffers,
      total: filteredOffers.length,
      limit,
      offset,
      summary: summaryStats,
      filters: {
        status,
        opportunity_id: opportunityId
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch offers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🤖 Generating new AI offer');

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.opportunity_id) {
      return NextResponse.json(
        { success: false, error: 'opportunity_id is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Generating offer for opportunity ID: ${body.opportunity_id}`);
    
    const startTime = Date.now();
    
    // Simulate AI offer generation process
    const generatedOffer = await generateAIOfferForOpportunity(body.opportunity_id, body);
    
    const generationTime = Math.round((Date.now() - startTime) / 1000);
    generatedOffer.generation_time_seconds = generationTime;
    
    // Add to mock database
    generatedOffer.id = mockOffers.length + 1;
    mockOffers.push(generatedOffer);

    console.log(`✅ AI offer generated in ${generationTime} seconds`);
    console.log(`💰 Total price: ${(generatedOffer.total_price / 1000).toFixed(0)}k SEK`);
    console.log(`🎯 Win probability: ${(generatedOffer.estimated_win_probability * 100).toFixed(0)}%`);
    console.log(`🤖 AI confidence: ${(generatedOffer.ai_confidence_score * 100).toFixed(0)}%`);

    return NextResponse.json({
      success: true,
      data: generatedOffer,
      message: 'AI offer generated successfully',
      generation_time_seconds: generationTime
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Failed to generate AI offer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate AI offer' },
      { status: 500 }
    );
  }
}

// AI Offer Generation Logic
async function generateAIOfferForOpportunity(opportunityId: number, requestData: any): Promise<any> {
  console.log(`🧠 Running AI analysis for opportunity ${opportunityId}...`);
  
  // Get opportunity data (in real system this would query the database)
  const opportunity = getOpportunityById(opportunityId);
  if (!opportunity) {
    throw new Error(`Opportunity ${opportunityId} not found`);
  }

  // AI-powered cost calculation
  const costAnalysis = calculateAICosts(opportunity);
  
  // AI-powered technical solution design
  const technicalSolution = designTechnicalSolution(opportunity);
  
  // AI-powered competitive positioning
  const competitiveAdvantages = generateCompetitiveAdvantages(opportunity);
  
  // AI confidence and win probability calculation
  const aiMetrics = calculateAIMetrics(opportunity, costAnalysis);

  const generatedOffer = {
    opportunity_id: opportunityId,
    opportunity_title: opportunity.title,
    offer_version: 1,
    generated_by_ai: true,
    total_price: costAnalysis.total_price,
    pricing_breakdown: costAnalysis.breakdown,
    technical_solution: technicalSolution,
    compliance_checklist: generateComplianceChecklist(opportunity),
    competitive_advantages: competitiveAdvantages,
    ai_confidence_score: aiMetrics.confidence,
    estimated_win_probability: aiMetrics.win_probability,
    document_paths: generateDocumentPaths(opportunityId),
    submission_status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return generatedOffer;
}

function getOpportunityById(id: number): any {
  // Simulate database lookup
  const opportunities = [
    {
      id: 1,
      title: "Ramavtal kontorsflyttar Stockholms Stad",
      estimated_value: 5000000,
      entity_type: "kommun",
      requirements: { environmentalCertification: true, digitalDocumentation: true }
    },
    {
      id: 2, 
      title: "Sjukhusflyttar Region Stockholm",
      estimated_value: 3500000,
      entity_type: "region",
      requirements: { securityClearance: true, medicalEquipmentHandling: true }
    },
    {
      id: 3,
      title: "Skolflyttar Solna Kommun",
      estimated_value: 800000,
      entity_type: "kommun",
      requirements: { summerSchedule: true, sensitiveEquipment: true }
    }
  ];
  
  return opportunities.find(opp => opp.id === id);
}

function calculateAICosts(opportunity: any): any {
  const estimatedVolume = Math.sqrt(opportunity.estimated_value / 1000); // Volume factor
  
  const baseCosts = {
    personnel: estimatedVolume * 50 * 450, // person-hours * rate
    transport: estimatedVolume * 200 * 25, // km * rate
    equipment: estimatedVolume * 10 * 800, // equipment-days * rate
    management: estimatedVolume * 15 * 600 // management-hours * rate
  };
  
  // Apply complexity factor
  let complexityFactor = 1.0;
  if (opportunity.requirements?.securityClearance) complexityFactor += 0.3;
  if (opportunity.entity_type === 'region') complexityFactor += 0.2;
  
  Object.keys(baseCosts).forEach(key => {
    baseCosts[key] *= complexityFactor;
  });
  
  // Calculate AI optimization savings (25-40% typical)
  const totalBaseCost = Object.values(baseCosts).reduce((sum, cost) => sum + cost, 0);
  const aiSavings = totalBaseCost * 0.30; // 30% AI savings
  
  const totalPrice = Math.round(totalBaseCost - aiSavings);
  
  return {
    total_price: totalPrice,
    breakdown: {
      personnel_costs: Math.round(baseCosts.personnel),
      transport_costs: Math.round(baseCosts.transport),
      equipment_costs: Math.round(baseCosts.equipment),
      management_costs: Math.round(baseCosts.management),
      ai_optimization_savings: -Math.round(aiSavings),
      profit_margin: 0.15
    }
  };
}

function designTechnicalSolution(opportunity: any): any {
  const baseSolution = {
    ai_optimization: {
      route_planning: "AI Phase 2 - Clarke-Wright algoritm för 30-40% effektivare rutter",
      scheduling: "AI Phase 1 - DBSCAN clustering för optimal schemaläggning",
      resource_allocation: "AI Phase 3 - Neural Network för 90%+ precision",
      predictive_analytics: "AI Phase 4 - AWS SageMaker för 95%+ demand forecasting"
    },
    quality_assurance: {
      gps_tracking: "Real-time GPS spårning av all personal och fordon",
      photo_documentation: "AI-baserad bildanalys för före/efter dokumentation",
      performance_monitoring: "Kontinuerlig övervakning av alla KPIs"
    },
    environmental_excellence: {
      co2_optimization: "AI-optimerade rutter för minimal miljöpåverkan",
      sustainability_reporting: "Automatisk miljörapportering per uppdrag"
    }
  };

  // Add opportunity-specific solutions
  if (opportunity.requirements?.securityClearance) {
    baseSolution['security_protocols'] = {
      background_checks: "Säkerhetsgodkänd personal med fullständig bakgrundskontroll",
      secure_transport: "Säkra transportfordon med spårning och övervakning",
      confidentiality: "Strikta sekretessprotokoll och datahantering"
    };
  }

  if (opportunity.requirements?.medicalEquipmentHandling) {
    baseSolution['healthcare_specialization'] = {
      specialized_handling: "Certifierad hantering av medicinsk utrustning",
      hygiene_protocols: "Strikta hygienkrav enligt vårdstandard",
      emergency_response: "24/7 akutberedskap för vårdverksamhet"
    };
  }

  return baseSolution;
}

function generateCompetitiveAdvantages(opportunity: any): string[] {
  const baseAdvantages = [
    "60% kostnadsbesparing genom AI-automation",
    "99% precision i planering och genomförande",
    "Real-time transparens med fullständig spårbarhet",
    "Automatisk LOU-efterlevnad genom AI-system"
  ];

  // Add opportunity-specific advantages
  if (opportunity.requirements?.environmentalCertification) {
    baseAdvantages.push("40% CO₂-reduktion genom AI-optimerade rutter");
  }

  if (opportunity.requirements?.digitalDocumentation) {
    baseAdvantages.push("Fullständigt paperless workflow med AI-dokumentation");
  }

  if (opportunity.entity_type === 'kommun') {
    baseAdvantages.push("Lokal Stockholm-kunskap och kommunspecialisering");
  }

  return baseAdvantages;
}

function calculateAIMetrics(opportunity: any, costAnalysis: any): any {
  let confidence = 0.8; // Base confidence
  let winProbability = 0.6; // Base win probability
  
  // Confidence factors
  if (costAnalysis.breakdown.ai_optimization_savings < -500000) confidence += 0.1; // Large savings
  if (opportunity.requirements?.digitalDocumentation) confidence += 0.05; // Tech advantage
  
  // Win probability factors
  const priceAdvantage = (opportunity.estimated_value - costAnalysis.total_price) / opportunity.estimated_value;
  winProbability += priceAdvantage * 0.5;
  
  if (opportunity.requirements?.environmentalCertification) winProbability += 0.1;
  if (opportunity.entity_type === 'kommun') winProbability += 0.05;
  
  return {
    confidence: Math.min(0.95, confidence),
    win_probability: Math.min(0.9, winProbability)
  };
}

function generateComplianceChecklist(opportunity: any): any {
  return {
    lou_compliance: true,
    environmental_compliance: true,
    security_compliance: opportunity.requirements?.securityClearance ? true : true,
    quality_standards: true,
    insurance_requirements: true,
    audit_trail: true,
    healthcare_compliance: opportunity.requirements?.medicalEquipmentHandling ? true : false
  };
}

function generateDocumentPaths(opportunityId: number): any {
  const basePath = `/generated-offers/${opportunityId}`;
  return {
    executive_summary: `${basePath}/executive-summary.pdf`,
    technical_proposal: `${basePath}/technical-proposal.pdf`,
    pricing_document: `${basePath}/pricing-breakdown.pdf`,
    compliance_doc: `${basePath}/compliance-checklist.pdf`,
    full_proposal: `${basePath}/complete-proposal.pdf`
  };
}