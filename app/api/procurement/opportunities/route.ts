import { NextRequest, NextResponse } from 'next/server';

/**
 * NORDFLYTT PUBLIC PROCUREMENT OPPORTUNITIES API
 * Handles CRUD operations for procurement opportunities
 */

// Mock database - in production this would connect to PostgreSQL
const mockOpportunities = [
  {
    id: 1,
    tender_id: "STHLM-2025-001",
    title: "Ramavtal kontorsflyttar Stockholms Stad",
    entity_name: "Stockholms Stad",
    entity_type: "kommun",
    estimated_value: 5000000,
    deadline_date: "2025-03-15T14:00:00Z",
    description: "Ramavtal för kontorsflyttar inom Stockholms Stad med fokus på hållbarhet och kostnadseffektivitet",
    category: "flyttjänster",
    subcategory: "kontorsflytt",
    procurement_type: "ramavtal",
    status: "identified",
    win_probability: 0.75,
    strategic_importance: "critical",
    ai_analysis: {
      summary: "Hög potential med AI-fördelar",
      advantages: ["AI optimization", "Cost efficiency", "Local presence"],
      challenges: ["Large scale", "Multiple stakeholders", "Established relationships"],
      confidence_score: 0.85,
      recommendations: [
        "Focus on AI technology advantages",
        "Emphasize cost savings",
        "Build stakeholder relationships"
      ]
    },
    opportunity_source: "Visma Commerce",
    requirements: {
      environmentalCertification: true,
      digitalDocumentation: true,
      realTimeTracking: true,
      qualityAssurance: "mandatory"
    },
    created_at: "2025-01-15T08:00:00Z",
    updated_at: "2025-01-15T08:00:00Z"
  },
  {
    id: 2,
    tender_id: "RSTHLM-2025-001",
    title: "Sjukhusflyttar Region Stockholm",
    entity_name: "Region Stockholm", 
    entity_type: "region",
    estimated_value: 3500000,
    deadline_date: "2025-02-28T12:00:00Z",
    description: "Specialiserade flyttar av medicinsk utrustning och känsliga material",
    category: "flyttjänster",
    subcategory: "sjukhusflytt",
    procurement_type: "öppen upphandling",
    status: "analyzing",
    win_probability: 0.65,
    strategic_importance: "high",
    ai_analysis: {
      summary: "Specialiserade krav, AI-fördelar tydliga",
      advantages: ["Specialized equipment handling", "24/7 availability", "Security protocols"],
      challenges: ["Security requirements", "Complex logistics", "Healthcare regulations"],
      confidence_score: 0.78,
      recommendations: [
        "Highlight healthcare specialization",
        "Demonstrate security compliance",
        "Show 24/7 capability"
      ]
    },
    opportunity_source: "TED Database",
    requirements: {
      medicalEquipmentHandling: true,
      securityClearance: "required",
      emergencyAvailability: "24/7",
      insurance: "comprehensive"
    },
    created_at: "2025-01-14T10:30:00Z",
    updated_at: "2025-01-15T09:15:00Z"
  },
  {
    id: 3,
    tender_id: "SOLNA-2025-001",
    title: "Skolflyttar Solna Kommun sommaren 2025",
    entity_name: "Solna Kommun",
    entity_type: "kommun", 
    estimated_value: 800000,
    deadline_date: "2025-04-10T16:00:00Z",
    description: "Flytt av skolor och förskolor under sommarsemester",
    category: "flyttjänster",
    subcategory: "skolflyttar",
    procurement_type: "direktupphandling",
    status: "offer_ready",
    win_probability: 0.80,
    strategic_importance: "high",
    ai_analysis: {
      summary: "Utmärkt match för AI-kapacitet",
      advantages: ["Summer schedule flexibility", "School specialization", "Local presence"],
      challenges: ["Time constraints", "Sensitive equipment", "Multiple locations"],
      confidence_score: 0.88,
      recommendations: [
        "Emphasize summer scheduling advantage",
        "Show school moving expertise",
        "Highlight local Stockholm presence"
      ]
    },
    opportunity_source: "Entity Website",
    requirements: {
      summerSchedule: true,
      sensitiveEquipment: true,
      childSafetyCompliance: true
    },
    created_at: "2025-01-13T14:20:00Z",
    updated_at: "2025-01-15T11:45:00Z"
  }
];

export async function GET(request: NextRequest) {
  console.log('📋 Fetching procurement opportunities');
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const entityType = searchParams.get('entity_type');
    const importance = searchParams.get('importance');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter opportunities based on query parameters
    let filteredOpportunities = mockOpportunities;

    if (status && status !== 'all') {
      filteredOpportunities = filteredOpportunities.filter(opp => opp.status === status);
    }

    if (entityType && entityType !== 'all') {
      filteredOpportunities = filteredOpportunities.filter(opp => opp.entity_type === entityType);
    }

    if (importance && importance !== 'all') {
      filteredOpportunities = filteredOpportunities.filter(opp => opp.strategic_importance === importance);
    }

    // Apply pagination
    const paginatedOpportunities = filteredOpportunities.slice(offset, offset + limit);

    console.log(`✅ Found ${filteredOpportunities.length} opportunities (showing ${paginatedOpportunities.length})`);

    return NextResponse.json({
      success: true,
      data: paginatedOpportunities,
      total: filteredOpportunities.length,
      limit,
      offset,
      filters: {
        status,
        entity_type: entityType,
        importance
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch opportunities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('📝 Creating new procurement opportunity');

  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['tender_id', 'title', 'entity_name', 'estimated_value', 'deadline_date'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new opportunity with AI analysis
    const newOpportunity = {
      id: mockOpportunities.length + 1,
      tender_id: body.tender_id,
      title: body.title,
      entity_name: body.entity_name,
      entity_type: body.entity_type || 'kommun',
      estimated_value: body.estimated_value,
      deadline_date: body.deadline_date,
      description: body.description || '',
      category: body.category || 'flyttjänster',
      subcategory: body.subcategory || 'kontorsflytt',
      procurement_type: body.procurement_type || 'öppen upphandling',
      status: 'identified',
      win_probability: body.win_probability || calculateWinProbability(body),
      strategic_importance: body.strategic_importance || calculateStrategicImportance(body),
      ai_analysis: body.ai_analysis || generateAIAnalysis(body),
      opportunity_source: body.opportunity_source || 'Manual Entry',
      requirements: body.requirements || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to mock database
    mockOpportunities.push(newOpportunity);

    console.log(`✅ Created opportunity: ${newOpportunity.title}`);
    console.log(`   Value: ${(newOpportunity.estimated_value / 1000).toFixed(0)}k SEK`);
    console.log(`   Win Probability: ${(newOpportunity.win_probability * 100).toFixed(0)}%`);

    return NextResponse.json({
      success: true,
      data: newOpportunity,
      message: 'Procurement opportunity created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Failed to create opportunity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}

// Helper functions for AI analysis
function calculateWinProbability(opportunityData: any): number {
  let probability = 0.5; // Base 50%
  
  // AI technology advantage
  if (opportunityData.requirements?.digitalDocumentation || 
      opportunityData.requirements?.realTimeTracking) {
    probability += 0.2; // +20% for tech requirements
  }
  
  // Cost efficiency advantage for larger contracts
  if (opportunityData.estimated_value > 1000000) {
    probability += 0.15; // +15% for large contracts
  }
  
  // Stockholm local presence
  if (opportunityData.entity_type === 'kommun') {
    probability += 0.1; // +10% for municipal contracts
  }
  
  // Environmental requirements
  if (opportunityData.requirements?.environmentalCertification) {
    probability += 0.15; // +15% for sustainability focus
  }
  
  return Math.min(0.95, probability); // Max 95% probability
}

function calculateStrategicImportance(opportunityData: any): 'critical' | 'high' | 'medium' | 'low' {
  // Stockholm Stad and Region Stockholm are critical
  if (opportunityData.entity_name?.includes('Stockholm') && 
      (opportunityData.entity_type === 'kommun' || opportunityData.entity_type === 'region')) {
    return 'critical';
  }
  
  // Large contracts are high importance
  if (opportunityData.estimated_value > 3000000) {
    return 'high';
  }
  
  // Medium value contracts
  if (opportunityData.estimated_value > 1000000) {
    return 'medium';
  }
  
  return 'low';
}

function generateAIAnalysis(opportunityData: any): any {
  const advantages = [
    "AI-driven operational efficiency",
    "Real-time transparency and tracking",
    "Cost optimization through automation"
  ];
  
  const challenges = [
    "Competition from established players",
    "Complex procurement requirements"
  ];
  
  // Add specific advantages based on requirements
  if (opportunityData.requirements?.realTimeTracking) {
    advantages.push("Advanced IoT and real-time monitoring capabilities");
  }
  
  if (opportunityData.requirements?.environmentalCertification) {
    advantages.push("AI-optimized routes for minimal environmental impact");
  }
  
  // Add specific challenges based on opportunity characteristics
  if (opportunityData.estimated_value > 5000000) {
    challenges.push("Large contract scale requires extensive references");
  }
  
  if (opportunityData.requirements?.securityClearance) {
    challenges.push("Security clearance requirements for personnel");
  }
  
  return {
    summary: "AI analysis completed - favorable opportunity profile",
    advantages,
    challenges,
    confidence_score: Math.random() * 0.3 + 0.7, // 70-100% confidence
    recommendations: [
      "Emphasize AI technology leadership",
      "Highlight cost efficiency advantages",
      "Demonstrate compliance capabilities"
    ]
  };
}