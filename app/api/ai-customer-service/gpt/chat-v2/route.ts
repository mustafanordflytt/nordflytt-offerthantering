import { NextRequest, NextResponse } from 'next/server';

// Custom GPT-aware chat endpoint that guides users appropriately
export async function POST(request: NextRequest) {
  try {
    const { message, customerId, conversationHistory } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message required' },
        { status: 400 }
      );
    }

    // Log for debugging
    console.log('=== Chat API v2 ===', {
      useProductionAPI: process.env.USE_PRODUCTION_API,
      hasCustomerId: !!customerId,
      messageLength: message.length
    });

    // Analyze message intent
    const intent = analyzeIntent(message);
    console.log('Message analysis:', { intent: intent.type, confidence: intent.confidence });

    // Generate appropriate response based on intent
    const response = generateSmartResponse(message, intent);

    return NextResponse.json({
      success: true,
      response: response.content,
      confidence: response.confidence,
      intent: intent.type,
      suggestions: response.suggestions,
      action: response.action
    });

  } catch (error: any) {
    console.error('Chat API v2 error:', error);
    return NextResponse.json(
      { error: error.message || 'Chat service temporarily unavailable' },
      { status: 500 }
    );
  }
}

function analyzeIntent(message: string) {
  const lowerMessage = message.toLowerCase();
  
  let intentType = 'general';
  let confidence = 0.8;
  
  if (lowerMessage.includes('pris') || lowerMessage.includes('offert') || lowerMessage.includes('kosta')) {
    intentType = 'pricing';
    confidence = 0.95;
  } else if (lowerMessage.includes('boka') || lowerMessage.includes('flytt')) {
    intentType = 'booking';
    confidence = 0.9;
  } else if (lowerMessage.includes('ändra') || lowerMessage.includes('avboka')) {
    intentType = 'modification';
    confidence = 0.9;
  } else if (lowerMessage.includes('problem') || lowerMessage.includes('fel') || lowerMessage.includes('klagomål')) {
    intentType = 'complaint';
    confidence = 0.85;
  } else if (lowerMessage.includes('rut') || lowerMessage.includes('avdrag')) {
    intentType = 'rut_info';
    confidence = 0.95;
  }
  
  return {
    type: intentType,
    confidence
  };
}

function generateSmartResponse(message: string, intent: any) {
  const responses: Record<string, any> = {
    pricing: {
      content: `Hej! 👋 Jag är Maja från Nordflytt!

För att ge dig en personlig prisoffert behöver jag din e-postadress så jag kan kolla upp din kundhistorik och ge dig exakt rätt pris med alla rabatter du har rätt till.

💡 **Tips:** För den mest personliga servicen med full tillgång till din kunddata, kan du chatta med mig direkt via vår huvudsida där jag har tillgång till:
✅ Din kompletta flytthistorik
✅ Personliga rabatter och erbjudanden
✅ Direkt bokning med RUT-avdrag
✅ Realtidsspårning av ditt flytteam

Vad är din e-postadress? 😊`,
      confidence: 0.95,
      suggestions: [
        { text: 'Beräkna RUT-avdrag', action: 'calculate_rut' },
        { text: 'Se standardpriser', action: 'show_prices' },
        { text: 'Öppna huvudchatten', action: 'open_custom_gpt' }
      ],
      action: 'request_email'
    },
    
    booking: {
      content: `Fantastiskt att du vill boka med oss! 🚛

För att skapa din bokning behöver jag veta:
📍 Från vilken adress flyttar du?
📍 Vart ska du flytta?
📅 När vill du flytta?
📦 Hur stor är bostaden?

**För snabbast bokning:** Du kan också använda vår smarta bokningsassistent som automatiskt:
- Känner igen dig som kund
- Föreslår datum baserat på tillgänglighet
- Beräknar exakt pris med RUT-avdrag
- Skickar bekräftelse direkt

Vill du att jag hjälper dig här eller föredrar du vår kompletta bokningsservice? 😊`,
      confidence: 0.9,
      suggestions: [
        { text: 'Starta bokning här', action: 'start_booking' },
        { text: 'Öppna smart bokning', action: 'open_custom_gpt' },
        { text: 'Se lediga tider', action: 'check_availability' }
      ],
      action: 'booking_options'
    },
    
    modification: {
      content: `Jag förstår att du vill göra ändringar! 

För att hjälpa dig på bästa sätt behöver jag verifiera din identitet. Kan du ange:
📧 Din e-postadress
📞 Mobilnummer kopplat till bokningen

**Snabbare alternativ:** I vår huvudchatt kan jag direkt:
- Se alla dina aktiva bokningar
- Göra ändringar utan verifiering
- Visa tillgängliga alternativ
- Bekräfta ändringar omedelbart

Hur vill du gå vidare? 🤔`,
      confidence: 0.9,
      suggestions: [
        { text: 'Ange uppgifter här', action: 'verify_identity' },
        { text: 'Öppna huvudchatten', action: 'open_custom_gpt' },
        { text: 'Ring kundtjänst', action: 'call_support' }
      ],
      action: 'modification_options'
    },
    
    complaint: {
      content: `Oj, det låter inte bra! Jag är ledsen att höra att något inte blev som förväntat. 😔

Jag skapar genast ett supportärende åt dig. För att hjälpa dig snabbast möjligt behöver jag:
📧 Din e-postadress
📱 Mobilnummer
📝 Beskriv gärna problemet

**Akut hjälp:** Om det är brådskande kan du:
📞 Ringa direkt: 08-123 456 78
💬 Chatta med mig i huvudchatten för omedelbar hjälp
📧 Maila: support@nordflytt.se

Jag är här för att lösa detta åt dig! 💪`,
      confidence: 0.95,
      suggestions: [
        { text: 'Skapa ärende', action: 'create_ticket' },
        { text: 'Ring nu', action: 'call_now' },
        { text: 'Akut chat', action: 'open_custom_gpt' }
      ],
      action: 'complaint_handling'
    },
    
    rut_info: {
      content: `RUT-avdraget är en av våra största fördelar! 💰

**Så fungerar RUT-avdraget hos Nordflytt:**
✅ 50% rabatt på arbetskostnaden
✅ Vi drar av direkt - du betalar bara halva priset
✅ Gäller flytt, packning och städning
✅ Max 50 000 kr avdrag per person och år

**Exempel:**
- Arbetskostnad: 4000 kr
- Du betalar: 2000 kr
- Vi sköter all administration!

**Beräkna din besparing:** I vår huvudchatt kan jag:
- Visa exakt hur mycket du sparar
- Kolla ditt återstående RUT-utrymme
- Optimera din flytt för max besparing

Vill du veta mer? 😊`,
      confidence: 0.95,
      suggestions: [
        { text: 'Beräkna min RUT', action: 'calculate_rut' },
        { text: 'Se prisexempel', action: 'show_examples' },
        { text: 'Öppna RUT-kalkylator', action: 'open_custom_gpt' }
      ],
      action: 'rut_information'
    },
    
    general: {
      content: `Hej! 👋 Jag är Maja från Nordflytt!

Jag hjälper dig gärna med allt från prisofferter till bokningar och kan svara på frågor om RUT-avdrag, kartonguthyrning och våra tjänster.

**Populära frågor jag kan hjälpa dig med:**
💰 Prisoffert för din flytt
📅 Boka flyttdatum
📦 Beställa flyttkartonger
🏠 RUT-avdrag och besparingar
🧹 Flyttstädning

**För bästa service:** I vår huvudchatt har jag tillgång till:
✅ Din kompletta kundhistorik
✅ Personliga erbjudanden
✅ Direkt bokning och ändringar
✅ Realtidsspårning

Vad kan jag hjälpa dig med idag? 😊`,
      confidence: 0.8,
      suggestions: [
        { text: 'Få prisoffert', action: 'get_quote' },
        { text: 'Boka flytt', action: 'book_move' },
        { text: 'Öppna huvudchat', action: 'open_custom_gpt' }
      ],
      action: 'general_help'
    }
  };
  
  const response = responses[intent.type] || responses.general;
  
  // Add Custom GPT link info if needed
  if (response.action === 'open_custom_gpt' || 
      response.suggestions?.some((s: any) => s.action === 'open_custom_gpt')) {
    response.customGptUrl = process.env.NEXT_PUBLIC_CUSTOM_GPT_URL || 'https://chatgpt.com/g/nordflytt-maja';
  }
  
  return response;
}