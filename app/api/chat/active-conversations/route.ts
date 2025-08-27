// =============================================================================
// NORDFLYTT AI CHATBOT - ACTIVE CONVERSATIONS API
// Get real-time active conversations for CRM dashboard
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/chat/active-conversations
 * Retrieve all currently active chatbot conversations
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Active conversations requested for CRM dashboard');
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const includeEscalated = url.searchParams.get('include_escalated') === 'true';
    
    // Mock active conversations - replace with actual database query
    const activeConversations = generateMockActiveConversations(limit, includeEscalated);
    
    // Calculate summary statistics
    const summary = {
      total_active: activeConversations.length,
      high_revenue_potential: activeConversations.filter(c => c.revenue_potential > 5000).length,
      escalation_candidates: activeConversations.filter(c => c.escalation_risk > 0.7).length,
      total_revenue_potential: activeConversations.reduce((sum, c) => sum + (c.revenue_potential || 0), 0),
      average_confidence: activeConversations.reduce((sum, c) => sum + c.ai_confidence, 0) / Math.max(activeConversations.length, 1),
      channels_breakdown: getChannelsBreakdown(activeConversations)
    };

    console.log('✅ Active conversations retrieved', {
      count: activeConversations.length,
      totalRevenuePotential: summary.total_revenue_potential,
      avgConfidence: Math.round(summary.average_confidence * 100)
    });

    return NextResponse.json({
      success: true,
      conversations: activeConversations,
      summary: summary,
      last_updated: new Date().toISOString(),
      system_health: {
        ai_performance: 0.94,
        response_time_avg: 850,
        escalation_rate: 0.12,
        customer_satisfaction: 4.6
      }
    });

  } catch (error) {
    console.error('❌ Failed to retrieve active conversations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve active conversations',
      details: error.message
    }, { status: 500 });
  }
}

// =============================================================================
// MOCK DATA GENERATION
// =============================================================================

function generateMockActiveConversations(limit: number, includeEscalated: boolean) {
  const conversations = [];
  const channels = ['website', 'whatsapp', 'email', 'facebook'];
  const customerNames = [
    'Anna Andersson', 'Erik Larsson', 'Maria Johansson', 'Lars Nilsson',
    'Karin Eriksson', 'Johan Petersson', 'Helena Gustafsson', 'Anders Jonsson',
    'Birgitta Carlsson', 'Mikael Svensson', 'Linda Olsson', 'Peter Lindqvist'
  ];
  
  const intents = [
    'booking_inquiry', 'price_request', 'team_tracking', 
    'complaint', 'payment_inquiry', 'service_question'
  ];

  const lastMessages = {
    booking_inquiry: [
      "Hej! Jag behöver hjälp med att flytta från Malmö till Stockholm. Vad kostar det?",
      "Kan ni hjälpa mig att flytta nästa vecka? Jag har en 3:a.",
      "Hej, jag vill boka en flytt. Är ni lediga den 25:e?"
    ],
    price_request: [
      "Vad kostar det att flytta en 2:a från Göteborg till Uppsala?",
      "Kan jag få en prisuppgift för flytt av kontor?",
      "Hej! Vad kostar det att packa och flytta en villa?"
    ],
    team_tracking: [
      "Hej, var är mitt team? De skulle vara här för 30 min sedan.",
      "Kan ni säga när teamet kommer? Jag väntar hemma.",
      "Hej, jag vill veta var lastbilen är nu."
    ],
    complaint: [
      "Teamet kom för sent och skötte sig illa. Vad gör ni åt det?",
      "Det blev skador på mina möbler under flytten. Hur löser vi detta?",
      "Jag är inte nöjd med servicen. Kan vi prata?"
    ],
    payment_inquiry: [
      "Jag har fått en faktura men förstår inte alla avgifter.",
      "När kommer RUT-avdraget?",
      "Kan jag betala i delbetalningar?"
    ],
    service_question: [
      "Erbjuder ni packning också?",
      "Kan ni hjälpa med städning efter flytten?",
      "Har ni försäkring för värdefulla saker?"
    ]
  };

  for (let i = 0; i < limit; i++) {
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const isExistingCustomer = Math.random() > 0.4;
    const aiConfidence = 0.6 + Math.random() * 0.4; // 60-100%
    const messagesCount = Math.floor(Math.random() * 20) + 3;
    const durationMinutes = Math.floor(Math.random() * 45) + 5;
    
    // Calculate revenue potential based on intent
    let revenuePotential = 0;
    if (intent === 'booking_inquiry') {
      revenuePotential = Math.floor(Math.random() * 15000) + 5000;
    } else if (intent === 'price_request') {
      revenuePotential = Math.floor(Math.random() * 10000) + 3000;
    } else if (intent === 'service_question') {
      revenuePotential = Math.floor(Math.random() * 5000) + 1000;
    }

    // Escalation risk based on intent and confidence
    let escalationRisk = 0.1 + Math.random() * 0.3;
    if (intent === 'complaint') escalationRisk = 0.7 + Math.random() * 0.3;
    if (aiConfidence < 0.7) escalationRisk += 0.2;
    escalationRisk = Math.min(escalationRisk, 1.0);

    const status = escalationRisk > 0.8 ? 'escalated' : 
                   escalationRisk > 0.6 ? 'waiting' : 'active';

    // Skip escalated if not requested
    if (status === 'escalated' && !includeEscalated) continue;

    const conversation = {
      id: 1000 + i,
      customer_name: customerNames[Math.floor(Math.random() * customerNames.length)],
      channel: channel,
      duration: `${durationMinutes} min`,
      messages_count: messagesCount,
      ai_confidence: Math.round(aiConfidence * 100) / 100,
      revenue_potential: revenuePotential,
      last_message: lastMessages[intent][Math.floor(Math.random() * lastMessages[intent].length)],
      is_existing_customer: isExistingCustomer,
      status: status,
      escalation_risk: Math.round(escalationRisk * 100) / 100,
      
      // System integration data
      systems_accessed: generateSystemsAccessed(intent, aiConfidence),
      
      // Customer intelligence
      customer_intelligence: {
        lifetime_value: isExistingCustomer ? Math.floor(Math.random() * 50000) + 10000 : Math.floor(Math.random() * 25000),
        churn_risk: Math.random() * 0.4 + (intent === 'complaint' ? 0.3 : 0),
        avg_satisfaction: 3 + Math.random() * 2
      },
      
      // Timestamps
      started_at: new Date(Date.now() - durationMinutes * 60 * 1000).toISOString(),
      last_activity: new Date(Date.now() - Math.random() * 300 * 1000).toISOString(), // Last 5 minutes
      
      // Intent and context
      primary_intent: intent,
      conversation_context: {
        topic_progression: generateTopicProgression(intent),
        sentiment_trend: generateSentimentTrend(intent, messagesCount),
        resolution_attempts: Math.floor(messagesCount / 5)
      }
    };

    conversations.push(conversation);
  }

  // Sort by last activity (most recent first)
  return conversations.sort((a, b) => 
    new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
  );
}

function generateSystemsAccessed(intent: string, confidence: number): string[] {
  const allSystems = ['phase1-5', 'financial', 'staff_app', 'crm_core'];
  const systems = ['crm_core']; // Always access CRM
  
  if (intent === 'booking_inquiry' || intent === 'price_request') {
    systems.push('phase1-5', 'financial');
  }
  
  if (intent === 'team_tracking') {
    systems.push('staff_app', 'phase1-5');
  }
  
  if (intent === 'payment_inquiry') {
    systems.push('financial');
  }
  
  if (confidence > 0.85) {
    // High confidence means good system integration
    return [...new Set(systems)];
  } else {
    // Lower confidence might mean fewer systems accessed
    return systems.slice(0, Math.max(1, systems.length - 1));
  }
}

function generateTopicProgression(intent: string): string[] {
  const progressions = {
    booking_inquiry: ['greeting', 'service_inquiry', 'location_details', 'pricing_discussion', 'scheduling'],
    price_request: ['greeting', 'service_details', 'location_gathering', 'quote_generation', 'negotiation'],
    team_tracking: ['greeting', 'order_lookup', 'location_check', 'eta_update'],
    complaint: ['greeting', 'issue_description', 'investigation', 'resolution_proposal'],
    payment_inquiry: ['greeting', 'invoice_lookup', 'explanation', 'payment_options'],
    service_question: ['greeting', 'service_inquiry', 'details_explanation', 'upsell_opportunity']
  };
  
  return progressions[intent] || ['greeting', 'inquiry', 'resolution'];
}

function generateSentimentTrend(intent: string, messageCount: number): number[] {
  const trend = [];
  let currentSentiment = intent === 'complaint' ? 0.3 : 0.7;
  
  for (let i = 0; i < Math.min(messageCount, 10); i++) {
    trend.push(Math.round(currentSentiment * 100) / 100);
    
    // Sentiment generally improves during conversation
    if (intent !== 'complaint') {
      currentSentiment = Math.min(1.0, currentSentiment + (Math.random() * 0.1));
    } else {
      // Complaints might start negative but should improve
      currentSentiment = Math.min(1.0, currentSentiment + (Math.random() * 0.15));
    }
  }
  
  return trend;
}

function getChannelsBreakdown(conversations: any[]): any {
  const breakdown = {};
  conversations.forEach(conv => {
    breakdown[conv.channel] = (breakdown[conv.channel] || 0) + 1;
  });
  return breakdown;
}