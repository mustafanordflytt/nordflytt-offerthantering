import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Nordflytt Custom GPT System Prompt
const NORDFLYTT_SYSTEM_PROMPT = `Du är Nordflytt AI, en specialiserad kundtjänstassistent för Nordflytt - Sveriges ledande flyttföretag.

DITT UPPDRAG:
- Hjälpa kunder med flyttfrågor, bokningar, priser och tjänster
- Alltid vara hjälpsam, professionell och lösningsorienterad
- Fokusera på Nordflytt's unika fördelar: RUT-avdrag, miljövänlighet, 24/7 service

NORDFLYTT TJÄNSTER:
1. Flyttjänster: Privatflytt, kontorsflytt, pianoflytt, internationell flytt
2. Tilläggstjänster: Packning, uppackning, städning, magasinering
3. Specialtjänster: Återvinning, möbelmontering, värdetransport

PRISSÄTTNING (inkl. RUT-avdrag):
- Baslön personal: 410 kr/tim (205 kr efter RUT)
- Flyttbil: 890 kr/tim
- Packmaterial: Från 20 kr/kartong
- Volymjustering: 240 kr/m³ (om faktisk > bokad volym)
- Parkering över 5m: 99 kr/meter

VIKTIGA REGLER:
1. ALLTID nämn RUT-avdraget när du diskuterar priser
2. Kräv säkerhetsverifiering för bokningsändringar
3. Var extra hjälpsam med VIP-kunder (lifetime value > 50,000 SEK)
4. Föreslå relevanta tilläggstjänster baserat på kundens behov
5. ALDRIG lova specifika tider utan att kontrollera tillgänglighet

KOMMUNIKATIONSSTIL:
- Vänlig men professionell
- Använd kundens förnamn när det är känt
- Korta, tydliga svar
- Proaktiva förslag
- Svenska som huvudspråk`;

export async function POST(request: NextRequest) {
  try {
    const { customerId, message, conversationHistory } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message required' },
        { status: 400 }
      );
    }
    
    // Extensive debugging of environment variables and configuration
    const useProductionAPI = process.env.USE_PRODUCTION_API === 'true';
    const productionApiUrl = process.env.NEXT_PUBLIC_PRODUCTION_API_URL || 'https://api.nordflytt.se';
    const apiKey = process.env.NORDFLYTT_GPT_API_KEY || 'nordflytt_gpt_api_key_2025';
    
    console.log('=== AI Customer Service API Debug ===');
    console.log('Environment Variables:');
    console.log('  USE_PRODUCTION_API:', process.env.USE_PRODUCTION_API);
    console.log('  NEXT_PUBLIC_PRODUCTION_API_URL:', process.env.NEXT_PUBLIC_PRODUCTION_API_URL);
    console.log('  NORDFLYTT_GPT_API_KEY:', process.env.NORDFLYTT_GPT_API_KEY ? '***' + process.env.NORDFLYTT_GPT_API_KEY.slice(-4) : 'NOT SET');
    console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '***' + process.env.OPENAI_API_KEY.slice(-4) : 'NOT SET');
    console.log('');
    console.log('Parsed Configuration:');
    console.log('  useProductionAPI:', useProductionAPI);
    console.log('  productionApiUrl:', productionApiUrl);
    console.log('  apiKey:', apiKey ? '***' + apiKey.slice(-4) : 'NOT SET');
    console.log('');
    console.log('Request Data:');
    console.log('  customerId:', customerId);
    console.log('  message:', message);
    console.log('  conversationHistory length:', conversationHistory?.length || 0);
    
    if (useProductionAPI) {
      try {
        // Try multiple possible endpoints
        const endpoints = [
          '/gpt-rag/chat',
          '/api/gpt-rag/chat',
          '/chat',
          '/api/chat',
          '/ai/chat',
          '/api/ai/chat'
        ];
        
        let successfulResponse = null;
        
        for (const endpoint of endpoints) {
          const fullUrl = `${productionApiUrl}${endpoint}`;
          console.log(`\nTrying endpoint: ${fullUrl}`);
          
          const requestBody = JSON.stringify({
            customerId: customerId || 'anonymous',
            message,
            conversationHistory
          });
          
          console.log('Request headers:', {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ***${apiKey.slice(-4)}`
          });
          console.log('Request body:', requestBody);
          
          const productionResponse = await fetch(fullUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: requestBody
          });
          
          console.log(`Response status: ${productionResponse.status}`);
          console.log(`Response status text: ${productionResponse.statusText}`);
          
          const responseHeaders: any = {};
          productionResponse.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });
          console.log('Response headers:', responseHeaders);
          
          const responseText = await productionResponse.text();
          console.log('Response body:', responseText);
          
          if (productionResponse.ok) {
            try {
              const data = JSON.parse(responseText);
              console.log('Successfully parsed response:', data);
              successfulResponse = data;
              break;
            } catch (parseError) {
              console.error('Failed to parse successful response:', parseError);
            }
          }
        }
        
        if (successfulResponse) {
          console.log('Returning successful production API response');
          return NextResponse.json(successfulResponse);
        } else {
          console.error('All production API endpoints failed');
        }
      } catch (error) {
        console.error('Production API error:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        // Fall through to local handling
      }
    }
    
    console.log('\nFalling back to local/mock handling...');
    
    // Fallback: Local handling for development
    let customerContext = null;
    if (customerId) {
      customerContext = await getCustomerContext(customerId);
    }
    
    const intent = analyzeIntent(message);
    
    if (intent.requiresVerification && !intent.isVerified) {
      return NextResponse.json({
        requiresVerification: true,
        message: 'För att göra ändringar i din bokning behöver jag verifiera din identitet.',
        intent: intent.type,
        confidence: 0.95
      });
    }
    
    const response = await generateGPTResponse(
      message, 
      conversationHistory, 
      customerContext,
      intent
    );
    
    if (customerId && supabase) {
      await logConversation(customerId, message, response);
    }
    
    return NextResponse.json({
      success: true,
      response: response.content,
      confidence: response.confidence,
      intent: intent.type,
      suggestions: response.suggestions
    });
    
  } catch (error: any) {
    console.error('GPT chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Chat service temporarily unavailable' },
      { status: 500 }
    );
  }
}

async function getCustomerContext(customerId: string) {
  if (!supabase) {
    return {
      isVIP: true,
      preferredName: 'Anna',
      activeBooking: {
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        services: ['flytt', 'packning']
      },
      preferences: {
        communicationStyle: 'friendly',
        favoriteServices: ['packning', 'städning']
      }
    };
  }
  
  const { data } = await supabase.rpc('get_customer_context', { 
    p_customer_id: customerId 
  });
  
  return data;
}

function analyzeIntent(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Booking change intents
  const bookingChangeKeywords = [
    'ändra', 'flytta', 'boka om', 'avboka', 'ställa in', 
    'byta datum', 'byta tid', 'ändra bokning'
  ];
  
  const requiresVerification = bookingChangeKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Categorize intent
  let intentType = 'general_inquiry';
  
  if (lowerMessage.includes('pris') || lowerMessage.includes('kosta')) {
    intentType = 'pricing_inquiry';
  } else if (lowerMessage.includes('boka') && !requiresVerification) {
    intentType = 'new_booking';
  } else if (requiresVerification) {
    intentType = 'booking_change';
  } else if (lowerMessage.includes('tjänst') || lowerMessage.includes('hjälp')) {
    intentType = 'service_inquiry';
  }
  
  return {
    type: intentType,
    requiresVerification,
    isVerified: false,
    confidence: 0.85
  };
}

async function generateGPTResponse(
  message: string, 
  history: any[], 
  context: any,
  intent: any
) {
  // For demo without OpenAI API
  if (!OPENAI_API_KEY) {
    return generateMockResponse(message, context, intent);
  }
  
  try {
    // Build contextual prompt
    const contextPrompt = context ? `
KUNDKONTEXT:
- Namn: ${context.customer?.preferredName || 'Kund'}
- VIP: ${context.customer?.isVIP ? 'Ja' : 'Nej'}
- Aktiv bokning: ${context.activeBooking ? `Ja, ${new Date(context.activeBooking.date).toLocaleDateString('sv-SE')}` : 'Nej'}
- Favorittjänster: ${context.preferences?.favoriteServices?.join(', ') || 'Inga'}
- Kommunikationsstil: ${context.preferences?.communicationStyle || 'professional'}
` : '';
    
    const messages = [
      { role: 'system', content: NORDFLYTT_SYSTEM_PROMPT + contextPrompt },
      ...history.slice(-5), // Last 5 messages for context
      { role: 'user', content: message }
    ];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.3,
        frequency_penalty: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error('OpenAI API error');
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Generate suggestions based on response
    const suggestions = generateSuggestions(intent, context);
    
    return {
      content,
      confidence: 0.95,
      suggestions
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateMockResponse(message, context, intent);
  }
}

function generateMockResponse(message: string, context: any, intent: any) {
  const responses = {
    pricing_inquiry: `Med RUT-avdrag blir priserna mycket förmånliga! 

Våra priser:
• Personal: 205 kr/tim (efter RUT, ordinarie 410 kr)
• Flyttbil: 890 kr/tim
• Packmaterial: från 20 kr/kartong

För en 2:a på ca 50m² brukar totalkostnaden hamna runt 8,000-12,000 kr efter RUT-avdrag. 

Vill du ha en exakt offert för din flytt?`,
    
    new_booking: `Perfekt! Jag hjälper dig gärna att boka din flytt. 

För att ge dig en exakt offert behöver jag veta:
📍 Från vilken adress flyttar du?
📍 Vart ska du flytta?
📅 När vill du flytta?
📦 Hur stor är bostaden (antal rum)?

Våra populäraste tilläggstjänster är packning och flyttstädning - båda med RUT-avdrag!`,
    
    booking_change: `Jag förstår att du vill ändra din bokning. För din säkerhet behöver jag verifiera din identitet först.

Klicka på "Skicka säkerhetskod" så skickar jag en kod till din registrerade e-post.`,
    
    service_inquiry: `Vi erbjuder kompletta flyttlösningar! 

🚚 **Huvudtjänster:**
• Privatflytt & Kontorsflytt
• Packning & Uppackning (RUT)
• Flyttstädning (RUT)
• Magasinering

✨ **Specialtjänster:**
• Pianoflytt
• Värdetransport
• Återvinning & Avfallshantering
• Möbelmontering

Alla våra tjänster är försäkrade och vi arbetar miljövänligt. Vad är du mest intresserad av?`,
    
    general_inquiry: `Hej${context?.customer?.preferredName ? ' ' + context.customer.preferredName : ''}! 

Jag är här för att hjälpa dig med allt som rör din flytt. Du kan fråga mig om:
• Priser och offerter
• Boka ny flytt
• Ändra befintlig bokning
• Våra tjänster
• RUT-avdrag

Vad kan jag hjälpa dig med idag?`
  };
  
  const suggestions = generateSuggestions(intent, context);
  
  return {
    content: responses[intent.type as keyof typeof responses] || responses.general_inquiry,
    confidence: 0.85,
    suggestions
  };
}

function generateSuggestions(intent: any, context: any) {
  const suggestions = [];
  
  // Always suggest relevant services
  if (context?.preferences?.favoriteServices?.includes('packning')) {
    suggestions.push({
      type: 'service',
      text: 'Behöver du hjälp med uppackning också?',
      service: 'uppackning'
    });
  }
  
  // Upcoming booking reminders
  if (context?.activeBooking) {
    const daysUntil = Math.ceil(
      (new Date(context.activeBooking.date).getTime() - Date.now()) / 
      (1000 * 60 * 60 * 24)
    );
    
    if (daysUntil <= 7) {
      suggestions.push({
        type: 'reminder',
        text: `Din flytt är om ${daysUntil} dagar. Glöm inte inventarielistan!`,
        action: 'prepare_inventory'
      });
    }
  }
  
  // Price-conscious suggestions
  if (intent.type === 'pricing_inquiry') {
    suggestions.push({
      type: 'savings',
      text: 'Visste du att flyttstädning också ger RUT-avdrag?',
      service: 'städning'
    });
  }
  
  return suggestions;
}

async function logConversation(customerId: string, message: string, response: any) {
  if (!supabase) return;
  
  try {
    // Find or create conversation
    const { data: conversation } = await supabase
      .from('customer_conversations')
      .select('id')
      .eq('customer_id', customerId)
      .eq('channel', 'chat')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let conversationId = conversation?.id;
    
    if (!conversationId) {
      const { data: newConv } = await supabase
        .from('customer_conversations')
        .insert({
          customer_id: customerId,
          channel: 'chat',
          subject: 'AI Chat Support',
          status: 'open',
          category: 'general_support'
        })
        .select()
        .single();
      
      conversationId = newConv?.id;
    }
    
    // Log messages
    if (conversationId) {
      await supabase
        .from('conversation_messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_type: 'customer',
            sender_id: customerId,
            content: message
          },
          {
            conversation_id: conversationId,
            sender_type: 'ai',
            sender_id: 'nordflytt-ai',
            content: response.content,
            confidence_score: response.confidence
          }
        ]);
    }
  } catch (error) {
    console.error('Failed to log conversation:', error);
  }
}