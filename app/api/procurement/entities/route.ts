import { NextRequest, NextResponse } from 'next/server';

/**
 * NORDFLYTT PUBLIC ENTITIES API
 * Manages Stockholm public sector entities and relationships
 */

// Mock database for public entities
const mockEntities = [
  {
    id: 1,
    entity_name: "Stockholms Stad",
    entity_type: "kommun",
    org_number: "212000-0142",
    municipality: "Stockholm",
    region: "Stockholm",
    annual_moving_budget: 20000000,
    procurement_system: "Visma Commerce",
    relationship_status: "prospective",
    ai_priority_score: 0.95,
    market_value_potential: 15000000,
    competitive_position: "strong_opportunity",
    contact_info: {
      website: "stockholm.se",
      procurement_email: "upphandling@stockholm.se",
      main_phone: "+46 8 508 290 00"
    },
    decision_makers: [
      {
        role: "Lokalförsörjningschef",
        department: "Fastighetskontoret",
        influence: "critical"
      },
      {
        role: "Upphandlingschef", 
        department: "Ekonomiavdelningen",
        influence: "critical"
      },
      {
        role: "Stadsdirektör",
        department: "Stadsledningskontoret",
        influence: "critical"
      }
    ],
    key_contacts: [],
    last_contact: null,
    notes: "Largest opportunity in Stockholm. Requires strategic approach and proven track record.",
    created_at: "2025-01-10T08:00:00Z",
    updated_at: "2025-01-15T10:00:00Z"
  },
  {
    id: 2,
    entity_name: "Region Stockholm",
    entity_type: "region",
    org_number: "232100-0016",
    municipality: "Stockholm",
    region: "Stockholm",
    annual_moving_budget: 15000000,
    procurement_system: "TED + Visma Commerce",
    relationship_status: "contacted",
    ai_priority_score: 0.90,
    market_value_potential: 12000000,
    competitive_position: "developing",
    contact_info: {
      website: "regionstockholm.se",
      procurement_email: "inkop@regionstockholm.se",
      main_phone: "+46 8 123 456 78"
    },
    decision_makers: [
      {
        role: "Regionservice Chef",
        department: "Regionservice",
        influence: "high"
      },
      {
        role: "Inköpschef",
        department: "Inköp och upphandling",
        influence: "critical"
      },
      {
        role: "Säkerhetschef",
        department: "Säkerhetsavdelningen",
        influence: "high"
      }
    ],
    key_contacts: [
      {
        name: "Anna Karlsson",
        role: "Inköpschef",
        email: "anna.karlsson@regionstockholm.se",
        last_contact: "2025-01-10"
      }
    ],
    last_contact: "2025-01-10",
    notes: "Healthcare specialization required. Security clearance needed for personnel.",
    created_at: "2025-01-10T08:30:00Z",
    updated_at: "2025-01-10T15:30:00Z"
  },
  {
    id: 3,
    entity_name: "Solna Kommun",
    entity_type: "kommun",
    org_number: "211200-2403",
    municipality: "Solna", 
    region: "Stockholm",
    annual_moving_budget: 3000000,
    procurement_system: "Visma Commerce",
    relationship_status: "engaged",
    ai_priority_score: 0.85,
    market_value_potential: 2500000,
    competitive_position: "strong",
    contact_info: {
      website: "solna.se",
      procurement_email: "upphandling@solna.se",
      main_phone: "+46 8 579 050 00"
    },
    decision_makers: [
      {
        role: "Kommunchef",
        department: "Kommunledningskontoret",
        influence: "critical"
      },
      {
        role: "Inköpschef",
        department: "Ekonomiavdelningen", 
        influence: "high"
      },
      {
        role: "Fastighetschef",
        department: "Tekniska förvaltningen",
        influence: "high"
      }
    ],
    key_contacts: [
      {
        name: "Erik Johansson", 
        role: "Fastighetschef",
        email: "erik.johansson@solna.se",
        last_contact: "2025-01-12"
      },
      {
        name: "Maria Lindberg",
        role: "Inköpschef", 
        email: "maria.lindberg@solna.se",
        last_contact: "2025-01-08"
      }
    ],
    last_contact: "2025-01-12",
    notes: "Excellent pilot opportunity. Strong interest in AI technology and innovation.",
    created_at: "2025-01-08T09:00:00Z",
    updated_at: "2025-01-12T16:20:00Z"
  },
  {
    id: 4,
    entity_name: "Sundbybergs Kommun",
    entity_type: "kommun",
    org_number: "212000-2528",
    municipality: "Sundbyberg",
    region: "Stockholm",
    annual_moving_budget: 1500000,
    procurement_system: "Visma Commerce",
    relationship_status: "prospective",
    ai_priority_score: 0.80,
    market_value_potential: 1200000,
    competitive_position: "opportunity",
    contact_info: {
      website: "sundbyberg.se",
      procurement_email: "inkop@sundbyberg.se",
      main_phone: "+46 8 566 280 00"
    },
    decision_makers: [
      {
        role: "Kommunchef",
        department: "Kommunledningskontoret",
        influence: "critical"
      },
      {
        role: "IT-chef",
        department: "IT-avdelningen",
        influence: "medium"
      },
      {
        role: "Innovationschef",
        department: "Utvecklingsavdelningen",
        influence: "medium"
      }
    ],
    key_contacts: [],
    last_contact: null,
    notes: "Innovation-focused municipality. Perfect for AI technology positioning.",
    created_at: "2025-01-10T11:00:00Z",
    updated_at: "2025-01-10T11:00:00Z"
  },
  {
    id: 11,
    entity_name: "Skatteverket",
    entity_type: "myndighet",
    org_number: "202100-6012",
    municipality: "Stockholm",
    region: "Stockholm", 
    annual_moving_budget: 8000000,
    procurement_system: "TED",
    relationship_status: "prospective",
    ai_priority_score: 0.85,
    market_value_potential: 6000000,
    competitive_position: "challenging",
    contact_info: {
      website: "skatteverket.se",
      procurement_email: "upphandling@skatteverket.se",
      main_phone: "+46 771 567 567"
    },
    decision_makers: [
      {
        role: "Myndighetschef",
        department: "Ledning",
        influence: "critical"
      },
      {
        role: "Säkerhetschef",
        department: "Säkerhetsavdelningen",
        influence: "critical"
      },
      {
        role: "Upphandlingschef",
        department: "Ekonomiavdelningen",
        influence: "high"
      }
    ],
    key_contacts: [],
    last_contact: null,
    notes: "High security requirements. National agency with complex procurement processes.",
    created_at: "2025-01-10T12:00:00Z",
    updated_at: "2025-01-10T12:00:00Z"
  }
];

export async function GET(request: NextRequest) {
  console.log('🏛️ Fetching public entities');
  
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const relationshipStatus = searchParams.get('relationship_status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter entities based on query parameters
    let filteredEntities = mockEntities;

    if (entityType && entityType !== 'all') {
      filteredEntities = filteredEntities.filter(entity => entity.entity_type === entityType);
    }

    if (relationshipStatus && relationshipStatus !== 'all') {
      filteredEntities = filteredEntities.filter(entity => entity.relationship_status === relationshipStatus);
    }

    if (priority) {
      const priorityThreshold = {
        'high': 0.8,
        'medium': 0.6,
        'low': 0.0
      };
      const threshold = priorityThreshold[priority] || 0.0;
      filteredEntities = filteredEntities.filter(entity => entity.ai_priority_score >= threshold);
    }

    // Sort by AI priority score (highest first)
    filteredEntities.sort((a, b) => b.ai_priority_score - a.ai_priority_score);

    // Apply pagination
    const paginatedEntities = filteredEntities.slice(offset, offset + limit);

    // Calculate summary statistics
    const summaryStats = {
      total_entities: mockEntities.length,
      by_type: {
        kommun: mockEntities.filter(e => e.entity_type === 'kommun').length,
        region: mockEntities.filter(e => e.entity_type === 'region').length,
        myndighet: mockEntities.filter(e => e.entity_type === 'myndighet').length
      },
      by_relationship: {
        prospective: mockEntities.filter(e => e.relationship_status === 'prospective').length,
        contacted: mockEntities.filter(e => e.relationship_status === 'contacted').length,
        engaged: mockEntities.filter(e => e.relationship_status === 'engaged').length,
        client: mockEntities.filter(e => e.relationship_status === 'client').length
      },
      total_market_potential: mockEntities.reduce((sum, entity) => sum + entity.market_value_potential, 0),
      average_priority_score: mockEntities.reduce((sum, entity) => sum + entity.ai_priority_score, 0) / mockEntities.length,
      high_priority_entities: mockEntities.filter(e => e.ai_priority_score >= 0.8).length
    };

    console.log(`✅ Found ${filteredEntities.length} entities (showing ${paginatedEntities.length})`);
    console.log(`💰 Total market potential: ${(summaryStats.total_market_potential / 1000000).toFixed(1)}M SEK`);

    return NextResponse.json({
      success: true,
      data: paginatedEntities,
      total: filteredEntities.length,
      limit,
      offset,
      summary: summaryStats,
      filters: {
        entity_type: entityType,
        relationship_status: relationshipStatus,
        priority
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch entities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🏛️ Creating new public entity');

  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['entity_name', 'entity_type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new entity with AI analysis
    const newEntity = {
      id: mockEntities.length + 1,
      entity_name: body.entity_name,
      entity_type: body.entity_type,
      org_number: body.org_number || '',
      municipality: body.municipality || 'Stockholm',
      region: body.region || 'Stockholm',
      annual_moving_budget: body.annual_moving_budget || estimateMovingBudget(body),
      procurement_system: body.procurement_system || determineProcurementSystem(body),
      relationship_status: 'prospective',
      ai_priority_score: body.ai_priority_score || calculateAIPriorityScore(body),
      market_value_potential: body.market_value_potential || calculateMarketPotential(body),
      competitive_position: body.competitive_position || assessCompetitivePosition(body),
      contact_info: body.contact_info || generateDefaultContactInfo(body),
      decision_makers: body.decision_makers || generateDefaultDecisionMakers(body),
      key_contacts: [],
      last_contact: null,
      notes: body.notes || `New ${body.entity_type} entity added to Stockholm public sector database.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to mock database
    mockEntities.push(newEntity);

    console.log(`✅ Created entity: ${newEntity.entity_name}`);
    console.log(`   Type: ${newEntity.entity_type}`);
    console.log(`   Market potential: ${(newEntity.market_value_potential / 1000000).toFixed(1)}M SEK`);
    console.log(`   AI priority score: ${(newEntity.ai_priority_score * 100).toFixed(0)}%`);

    return NextResponse.json({
      success: true,
      data: newEntity,
      message: 'Public entity created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Failed to create entity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create entity' },
      { status: 500 }
    );
  }
}

// Helper functions for AI analysis
function estimateMovingBudget(entityData: any): number {
  const baseBudgets = {
    'kommun': 2000000,  // 2M SEK base for municipality
    'region': 8000000,  // 8M SEK base for region
    'myndighet': 5000000 // 5M SEK base for government agency
  };
  
  let budget = baseBudgets[entityData.entity_type] || 1000000;
  
  // Adjust based on entity name (size indicators)
  if (entityData.entity_name.includes('Stockholm') && entityData.entity_type === 'kommun') {
    budget = 20000000; // Stockholm Stadt is much larger
  }
  
  if (entityData.entity_name.includes('Region')) {
    budget = 15000000; // Regions are typically large
  }
  
  return budget;
}

function determineProcurementSystem(entityData: any): string {
  const systemMapping = {
    'kommun': 'Visma Commerce',
    'region': 'TED + Visma Commerce', 
    'myndighet': 'TED'
  };
  
  return systemMapping[entityData.entity_type] || 'Visma Commerce';
}

function calculateAIPriorityScore(entityData: any): number {
  let score = 0.5; // Base score
  
  // Entity type priority
  if (entityData.entity_type === 'kommun') score += 0.2; // Municipalities easier to approach
  if (entityData.entity_type === 'region') score += 0.1; // Regions moderate
  if (entityData.entity_type === 'myndighet') score += 0.05; // Agencies most challenging
  
  // Stockholm focus boost
  if (entityData.municipality === 'Stockholm' || entityData.entity_name.includes('Stockholm')) {
    score += 0.25; // Stockholm entities are strategic priority
  }
  
  // Size factor
  const estimatedBudget = estimateMovingBudget(entityData);
  if (estimatedBudget > 10000000) score += 0.15; // Large opportunities
  if (estimatedBudget > 5000000) score += 0.1;   // Medium opportunities
  
  return Math.min(0.95, score);
}

function calculateMarketPotential(entityData: any): number {
  const annualBudget = estimateMovingBudget(entityData);
  
  // Market potential is typically 60-80% of annual budget (realistic capture rate)
  const captureRate = entityData.entity_type === 'kommun' ? 0.75 : 0.65;
  
  return Math.round(annualBudget * captureRate);
}

function assessCompetitivePosition(entityData: any): string {
  const priorityScore = calculateAIPriorityScore(entityData);
  
  if (priorityScore >= 0.85) return 'strong_opportunity';
  if (priorityScore >= 0.7) return 'opportunity';
  if (priorityScore >= 0.55) return 'developing';
  return 'challenging';
}

function generateDefaultContactInfo(entityData: any): any {
  const domain = entityData.entity_name.toLowerCase()
    .replace('kommun', '')
    .replace('region', '')
    .replace('stockholm', 'stockholm')
    .trim() + '.se';
  
  return {
    website: domain,
    procurement_email: `upphandling@${domain}`,
    main_phone: "+46 8 XXX XX XX"
  };
}

function generateDefaultDecisionMakers(entityData: any): any[] {
  const baseMakers = [
    {
      role: "Inköpschef",
      department: "Ekonomiavdelningen",
      influence: "critical"
    },
    {
      role: "Fastighetschef",
      department: "Tekniska förvaltningen", 
      influence: "high"
    }
  ];
  
  // Add entity-specific decision makers
  if (entityData.entity_type === 'kommun') {
    baseMakers.unshift({
      role: "Kommunchef",
      department: "Kommunledningskontoret",
      influence: "critical"
    });
  }
  
  if (entityData.entity_type === 'region') {
    baseMakers.unshift({
      role: "Regiondirektör", 
      department: "Regionstyrelsen",
      influence: "critical"
    });
    baseMakers.push({
      role: "Säkerhetschef",
      department: "Säkerhetsavdelningen",
      influence: "high"
    });
  }
  
  if (entityData.entity_type === 'myndighet') {
    baseMakers.unshift({
      role: "Myndighetschef",
      department: "Ledning",
      influence: "critical"
    });
    baseMakers.push({
      role: "Säkerhetschef",
      department: "Säkerhetsavdelningen", 
      influence: "critical"
    });
  }
  
  return baseMakers;
}