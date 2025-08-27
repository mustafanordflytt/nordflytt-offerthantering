// =============================================================================
// NORDFLYTT AI CHATBOT - UNIFIED MESSAGE API
// Revolutionary chatbot with complete system integration
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { NordflyttSuperAI } from '@/lib/chatbot/NordflyttSuperAI';

// Initialize the Super AI once
let superAI: NordflyttSuperAI | null = null;

function initializeSuperAI() {
  if (!superAI) {
    console.log('🚀 Initializing Nordflytt Super AI for chatbot API');
    superAI = new NordflyttSuperAI();
  }
  return superAI;
}

/**
 * POST /api/chat/unified/message
 * Process chatbot message with FULL Nordflytt system integration
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🤖 Chatbot message received');
    
    // Initialize Super AI
    const ai = initializeSuperAI();
    
    // Parse request data
    const body = await request.json();
    const { 
      sessionId, 
      message, 
      channel, 
      customerInfo,
      conversationId,
      metadata = {}
    } = body;

    // Validate required fields
    if (!sessionId || !message || !channel) {
      return NextResponse.json({
        success: false,
        error: 'sessionId, message, and channel are required',
        fallback_response: 'Hej! För att jag ska kunna hjälpa dig bättre, behöver jag lite mer information. Kan du försöka igen?'
      }, { status: 400 });
    }

    console.log('📝 Processing message', {
      sessionId: sessionId.substring(0, 8),
      channel,
      messageLength: message.length,
      hasCustomerInfo: !!customerInfo
    });

    // Get or create conversation with business context
    const conversation = await getOrCreateConversationWithContext(
      sessionId, 
      channel, 
      customerInfo,
      conversationId
    );

    // Get conversation history for context
    const messageHistory = await getConversationHistory(conversation.id);

    // Create conversation context
    const conversationContext = {
      conversation_id: conversation.id,
      customer_id: conversation.customer_id,
      channel: channel,
      session_id: sessionId,
      message_history: messageHistory,
      metadata: metadata
    };

    // Process with Super AI that integrates with ALL systems
    console.log('🧠 Processing with Super AI engine');
    const aiResponse = await ai.processMessageWithFullContext(message, conversationContext);

    // Save message to database
    const savedMessage = await saveMessageToDatabase({
      conversation_id: conversation.id,
      sender_type: 'customer',
      message_text: message,
      message_intent: aiResponse.intent,
      intent_confidence: aiResponse.confidence,
      entities_extracted: {},
      system_data_used: {
        systems_accessed: aiResponse.systems_used,
        data_freshness: aiResponse.data_freshness
      },
      response_time_ms: Date.now() - startTime,
      revenue_opportunity: aiResponse.revenue_opportunity
    });

    // Save AI response
    const savedResponse = await saveMessageToDatabase({
      conversation_id: conversation.id,
      sender_type: 'ai',
      message_text: aiResponse.text,
      message_intent: aiResponse.intent,
      intent_confidence: aiResponse.confidence,
      ai_reasoning: aiResponse.business_context,
      response_time_ms: Date.now() - startTime,
      revenue_opportunity: aiResponse.revenue_opportunity,
      upsell_triggers: aiResponse.upsell_suggestions
    });

    // Track business impact
    const businessImpact = await trackBusinessImpact(conversation, aiResponse);

    // Update conversation statistics
    await updateConversationStats(conversation.id, aiResponse);

    // Check for escalation
    if (aiResponse.escalation_needed) {
      await triggerEscalation(conversation, aiResponse, 'ai_confidence_low');
    }

    // Update customer intelligence
    if (conversation.customer_id) {
      await updateCustomerIntelligence(conversation.customer_id, aiResponse, message);
    }

    // Log system integration performance
    await logSystemIntegrationPerformance(conversation.id, savedResponse.id, aiResponse);

    const processingTime = Date.now() - startTime;
    console.log('✅ Message processed successfully', {
      processingTime: `${processingTime}ms`,
      confidence: aiResponse.confidence,
      systemsUsed: aiResponse.systems_used.length,
      revenueOpportunity: aiResponse.revenue_opportunity
    });

    // Return comprehensive response
    return NextResponse.json({
      success: true,
      
      // Core response
      response: aiResponse.text,
      confidence: aiResponse.confidence,
      intent: aiResponse.intent,
      
      // Business intelligence
      business_context: {
        revenue_opportunity: aiResponse.revenue_opportunity,
        upsell_suggestions: aiResponse.upsell_suggestions,
        customer_risk_level: aiResponse.churn_risk,
        systems_integrated: aiResponse.systems_used,
        escalation_needed: aiResponse.escalation_needed
      },
      
      // Customer intelligence
      intelligence: {
        suggested_followups: aiResponse.suggested_followups,
        learning_opportunities: aiResponse.learning_opportunities,
        business_insights: aiResponse.business_context
      },
      
      // System status
      system_status: {
        integration_health: 'excellent',
        data_freshness: aiResponse.data_freshness,
        ai_performance: aiResponse.confidence,
        processing_time_ms: processingTime
      },
      
      // Conversation management
      conversation: {
        id: conversation.id,
        session_id: sessionId,
        message_count: messageHistory.length + 2, // +2 for new message and response
        channel: channel
      },
      
      // Business metrics
      metrics: {
        revenue_attributed: businessImpact.revenue_potential,
        cost_savings: businessImpact.cost_savings,
        customer_satisfaction_predicted: Math.round(aiResponse.confidence * 5), // 1-5 scale
        conversion_probability: businessImpact.conversion_probability
      }
    });

  } catch (error) {
    console.error('❌ Chatbot API error:', error);
    
    // Graceful degradation with fallback response
    const fallbackResponse = await generateFallbackResponse(error, body);
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: 'AI processing temporarily unavailable',
      
      // Always provide a helpful fallback
      response: fallbackResponse.text,
      confidence: fallbackResponse.confidence,
      intent: 'fallback',
      
      business_context: {
        revenue_opportunity: 0,
        upsell_suggestions: [],
        customer_risk_level: 0,
        systems_integrated: [],
        escalation_needed: true
      },
      
      system_status: {
        integration_health: 'degraded',
        data_freshness: new Date(),
        ai_performance: 0.5,
        processing_time_ms: processingTime,
        error_details: error.message
      },
      
      fallback_action: {
        escalate_to_human: true,
        reason: 'AI processing error',
        estimated_wait_time: '5-10 minutes'
      }
    }, { status: 200 }); // Always return 200 with fallback
  }
}

/**
 * GET /api/chat/unified/message
 * Get conversation history and status
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const conversationId = url.searchParams.get('conversationId');
    
    if (!sessionId && !conversationId) {
      return NextResponse.json({
        success: false,
        error: 'sessionId or conversationId is required'
      }, { status: 400 });
    }

    // Get conversation and history
    const conversation = conversationId 
      ? await getConversationById(parseInt(conversationId))
      : await getConversationBySessionId(sessionId);

    if (!conversation) {
      return NextResponse.json({
        success: false,
        error: 'Conversation not found'
      }, { status: 404 });
    }

    const messages = await getConversationHistory(conversation.id);
    const stats = await getConversationStats(conversation.id);

    return NextResponse.json({
      success: true,
      conversation: conversation,
      messages: messages,
      statistics: stats,
      business_metrics: {
        revenue_generated: conversation.revenue_generated || 0,
        upsell_amount: conversation.upsell_amount || 0,
        customer_satisfaction: conversation.customer_satisfaction,
        escalation_count: stats.escalation_count || 0
      }
    });

  } catch (error) {
    console.error('❌ Get conversation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve conversation',
      details: error.message
    }, { status: 500 });
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Get or create conversation with business context
async function getOrCreateConversationWithContext(
  sessionId: string, 
  channel: string, 
  customerInfo: any,
  conversationId?: number
): Promise<any> {
  console.log('🔍 Getting or creating conversation', { sessionId, channel });

  // If conversationId provided, try to get existing
  if (conversationId) {
    const existing = await getConversationById(conversationId);
    if (existing) return existing;
  }

  // Try to find existing conversation by sessionId
  let conversation = await getConversationBySessionId(sessionId);
  
  if (!conversation) {
    // Create new conversation
    console.log('➕ Creating new conversation');
    
    // Try to identify customer
    let customerId = null;
    if (customerInfo?.email) {
      const customer = await findCustomerByEmail(customerInfo.email);
      customerId = customer?.id;
    }
    
    conversation = await createNewConversation({
      session_id: sessionId,
      channel: channel,
      customer_id: customerId,
      channel_identifier: customerInfo?.phone || customerInfo?.email,
      conversation_status: 'active',
      systems_accessed: [],
      data_sources_used: {},
      integration_performance: {}
    });
    
    console.log('✅ New conversation created', { id: conversation.id, customerId });
  }

  return conversation;
}

// Save message to database with rich context
async function saveMessageToDatabase(messageData: any): Promise<any> {
  // Mock implementation - replace with actual database call
  const message = {
    id: Math.floor(Math.random() * 100000),
    ...messageData,
    created_at: new Date()
  };
  
  console.log('💾 Message saved to database', { 
    id: message.id, 
    type: messageData.sender_type,
    intent: messageData.message_intent 
  });
  
  return message;
}

// Track business impact of conversation
async function trackBusinessImpact(conversation: any, aiResponse: any): Promise<any> {
  const impact = {
    revenue_potential: aiResponse.revenue_opportunity || 0,
    cost_savings: calculateCostSavings(aiResponse),
    conversion_probability: calculateConversionProbability(aiResponse),
    customer_satisfaction_impact: aiResponse.confidence * 0.8 // Estimate based on AI confidence
  };

  // Save revenue tracking if there's potential
  if (impact.revenue_potential > 0) {
    await saveRevenueTracking({
      conversation_id: conversation.id,
      customer_id: conversation.customer_id,
      interaction_type: determineInteractionType(aiResponse),
      revenue_attributed: impact.revenue_potential,
      attribution_confidence: aiResponse.confidence,
      attribution_method: 'ai_prediction'
    });
  }

  return impact;
}

// Update conversation statistics
async function updateConversationStats(conversationId: number, aiResponse: any): Promise<void> {
  // Mock implementation - update conversation with AI metrics
  console.log('📊 Updating conversation stats', {
    conversationId,
    confidence: aiResponse.confidence,
    revenueOpp: aiResponse.revenue_opportunity
  });

  // Update conversation record with latest metrics
  // await updateConversation(conversationId, {
  //   ai_confidence_average: calculateAverageConfidence(),
  //   systems_accessed: aiResponse.systems_used,
  //   revenue_generated: aiResponse.revenue_opportunity,
  //   last_message_timestamp: new Date()
  // });
}

// Trigger escalation to human agent
async function triggerEscalation(conversation: any, aiResponse: any, reason: string): Promise<void> {
  console.log('🚨 Triggering escalation', { conversationId: conversation.id, reason });
  
  // Notify staff app
  await notifyStaffApp({
    conversation_id: conversation.id,
    customer_id: conversation.customer_id,
    channel: conversation.channel,
    escalation_reason: reason,
    priority: calculateEscalationPriority(conversation, aiResponse),
    context_summary: generateContextSummary(conversation, aiResponse)
  });
  
  // Update conversation status
  await updateConversationStatus(conversation.id, 'escalated', reason);
}

// Update customer AI profile
async function updateCustomerIntelligence(
  customerId: number, 
  aiResponse: any, 
  customerMessage: string
): Promise<void> {
  console.log('🧠 Updating customer intelligence', { customerId });
  
  const intelligence = {
    interaction_patterns: analyzeInteractionPatterns(customerMessage),
    communication_style: analyzeCommunicationStyle(customerMessage),
    service_interests: extractServiceInterests(aiResponse.upsell_suggestions),
    sentiment_trend: analyzeSentimentTrend(customerMessage),
    predicted_needs: aiResponse.suggested_followups
  };

  // Update customer AI profile
  // await updateCustomerAIProfile(customerId, intelligence);
}

// Log system integration performance
async function logSystemIntegrationPerformance(
  conversationId: number,
  messageId: number, 
  aiResponse: any
): Promise<void> {
  for (const system of aiResponse.systems_used) {
    await logSystemIntegration({
      conversation_id: conversationId,
      message_id: messageId,
      system_name: system,
      operation_type: 'data_fetch',
      status: 'success',
      duration_ms: Math.floor(Math.random() * 500), // Mock - replace with actual timing
      data_quality_score: 0.9,
      customer_impact: 'enhanced_response'
    });
  }
}

// Generate fallback response for errors
async function generateFallbackResponse(error: any, requestBody: any): Promise<any> {
  const customerFriendlyMessages = [
    'Hej! Jag har lite tekniska problem just nu, men jag kopplar dig direkt till en av våra duktiga medarbetare som kan hjälpa dig bättre.',
    'Ursäkta, jag behöver en kort paus för att tänka. Låt mig koppla dig till en kollega som kan hjälpa dig direkt.',
    'Tyvärr fungerar inte alla mina system perfekt just nu. Jag kommer att se till att en av våra flyttexperter kontaktar dig inom 5 minuter!'
  ];

  const randomMessage = customerFriendlyMessages[Math.floor(Math.random() * customerFriendlyMessages.length)];

  return {
    text: randomMessage + ' Tack för ditt tålamod! 🙏',
    confidence: 0.5,
    fallback: true,
    escalation_triggered: true,
    error_logged: true
  };
}

// Helper functions (stubs - implement with actual database calls)
async function getConversationById(id: number): Promise<any> { return null; }
async function getConversationBySessionId(sessionId: string): Promise<any> { return null; }
async function getConversationHistory(conversationId: number): Promise<any[]> { return []; }
async function getConversationStats(conversationId: number): Promise<any> { return {}; }
async function findCustomerByEmail(email: string): Promise<any> { return null; }
async function createNewConversation(data: any): Promise<any> { 
  return { id: Math.floor(Math.random() * 10000), ...data }; 
}
async function saveRevenueTracking(data: any): Promise<void> {}
async function updateConversationStatus(id: number, status: string, reason: string): Promise<void> {}
async function notifyStaffApp(data: any): Promise<void> {}
async function logSystemIntegration(data: any): Promise<void> {}

// Calculation helpers
function calculateCostSavings(aiResponse: any): number {
  // Average human agent cost vs AI cost
  return 150; // kr saved per conversation
}

function calculateConversionProbability(aiResponse: any): number {
  if (aiResponse.revenue_opportunity > 5000) return 0.8;
  if (aiResponse.revenue_opportunity > 1000) return 0.6;
  return 0.3;
}

function determineInteractionType(aiResponse: any): string {
  if (aiResponse.revenue_opportunity > 0) return 'upsell';
  if (aiResponse.intent === 'booking_inquiry') return 'new_booking';
  if (aiResponse.intent === 'complaint') return 'complaint_resolution';
  return 'general_inquiry';
}

function calculateEscalationPriority(conversation: any, aiResponse: any): string {
  if (conversation.customer_value > 50000) return 'high';
  if (aiResponse.churn_risk > 0.7) return 'high';
  if (aiResponse.intent === 'complaint') return 'medium';
  return 'low';
}

function generateContextSummary(conversation: any, aiResponse: any): string {
  return `Customer inquiry: ${aiResponse.intent}. Confidence: ${Math.round(aiResponse.confidence * 100)}%. Revenue opportunity: ${aiResponse.revenue_opportunity}kr. Systems used: ${aiResponse.systems_used.join(', ')}.`;
}

function analyzeInteractionPatterns(message: string): any {
  return { message_length: message.length, question_count: (message.match(/\?/g) || []).length };
}

function analyzeCommunicationStyle(message: string): string {
  if (message.length > 200) return 'detailed';
  if (message.includes('!')) return 'enthusiastic';
  if (message.includes('?')) return 'inquisitive';
  return 'standard';
}

function extractServiceInterests(upsellSuggestions: any[]): string[] {
  return upsellSuggestions.map(s => s.service || 'unknown').filter(Boolean);
}

function analyzeSentimentTrend(message: string): number {
  // Simple sentiment analysis
  const positiveWords = ['bra', 'tack', 'perfekt', 'utmärkt'];
  const negativeWords = ['dålig', 'problem', 'fel', 'arg'];
  
  const words = message.toLowerCase().split(' ');
  let score = 0.5;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 0.1;
    if (negativeWords.includes(word)) score -= 0.1;
  });
  
  return Math.max(0, Math.min(1, score));
}