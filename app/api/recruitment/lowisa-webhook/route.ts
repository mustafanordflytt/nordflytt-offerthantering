import { NextResponse } from 'next/server';

interface WebhookPayload {
  applicationId: number;
  message: string;
  sender: 'candidate' | 'lowisa';
  timestamp: string;
  metadata?: {
    source?: string;
    sessionId?: string;
    platform?: string;
  };
}

interface ConversationContext {
  applicationId: number;
  candidateName: string;
  position: string;
  currentStage: string;
  previousMessages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

export async function POST(request: Request) {
  try {
    // Check API key
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
    const validApiKey = process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123';
    
    if (apiKey !== validApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const body: WebhookPayload = await request.json();
    const { applicationId, message, sender, timestamp, metadata } = body;

    // Validate webhook payload
    if (!applicationId || !message || !sender) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, message, sender' },
        { status: 400 }
      );
    }

    // Log webhook reception
    console.log(`[Lowisa Webhook] Received ${sender} message for application ${applicationId}`);

    // Save the incoming message
    await saveConversation({
      application_id: applicationId,
      message,
      sender,
      timestamp: timestamp || new Date().toISOString(),
      metadata
    });

    // If message is from candidate, generate Lowisa's response
    if (sender === 'candidate') {
      const response = await generateLowisaResponse(applicationId, message);
      
      // Save Lowisa's response
      await saveConversation({
        application_id: applicationId,
        message: response.message,
        sender: 'lowisa',
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          ai_model: 'gpt-4-turbo',
          response_time_ms: response.processingTime
        }
      });

      // Check if information is complete
      const completeness = await checkInformationCompleteness(applicationId);
      
      if (completeness.isComplete) {
        // Update candidate stage
        await updateCandidateStage(applicationId, 'typeform_sent');
        
        // Send Typeform link
        await sendTypeformLink(applicationId);
      }

      return NextResponse.json({
        success: true,
        response: response.message,
        completeness,
        applicationId,
        timestamp: new Date().toISOString()
      });
    }

    // If message is from Lowisa (for logging purposes)
    return NextResponse.json({
      success: true,
      message: 'Lowisa message logged successfully',
      applicationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Lowisa Webhook] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error processing webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateLowisaResponse(applicationId: number, candidateMessage: string) {
  const startTime = Date.now();
  
  try {
    // Get candidate context
    const context = await getCandidateContext(applicationId);
    
    // For demo purposes, return a mock response
    // In production, integrate with OpenAI API
    const processingTime = Date.now() - startTime;
    
    // Analyze the message for keywords
    const message = candidateMessage.toLowerCase();
    let responseMessage = '';
    
    if (message.includes('hej') || message.includes('hallå') || message.includes('hejsan')) {
      responseMessage = `Hej ${context.candidateName}! Tack för ditt intresse för jobbet som ${context.position}. Låt mig ställa några frågor för att lära känna dig bättre. Har du körkort? Och i så fall, vilken typ?`;
    } else if (message.includes('körkort') || message.includes('b-körkort') || message.includes('c-körkort')) {
      responseMessage = 'Perfekt! Det är bra att ha körkort i den här branschen. Kan du berätta om din tidigare arbetserfarenhet? Har du jobbat med flytt, städ, lager eller liknande?';
    } else if (message.includes('erfarenhet') || message.includes('jobbat') || message.includes('arbetat')) {
      responseMessage = 'Det låter bra! Vilka dagar och tider kan du jobba? Är du flexibel för extra pass?';
    } else if (message.includes('dagar') || message.includes('tid') || message.includes('flexibel')) {
      responseMessage = 'Utmärkt! Sista frågan - hur bedömer du dina svenskkunskaper? Det är viktigt för kommunikation med både kollegor och kunder.';
    } else if (message.includes('svenska') || message.includes('språk')) {
      responseMessage = 'Tack för dina svar! Nästa steg är vårt formulär: https://syn7dh9e02w.typeform.com/to/pUeKubsb';
    } else {
      responseMessage = 'Tack för informationen! Kan du berätta mer om din bakgrund och erfarenhet?';
    }

    return {
      message: responseMessage,
      processingTime
    };
  } catch (error) {
    console.error('Error generating Lowisa response:', error);
    return {
      message: 'Ursäkta, jag hade tekniska problem. Kan du upprepa ditt meddelande?',
      processingTime: Date.now() - startTime
    };
  }
}

async function getCandidateContext(applicationId: number): Promise<ConversationContext> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Fetch candidate info
  const candidateResponse = await fetch(`${baseUrl}/api/recruitment/candidate-info?id=${applicationId}`, {
    headers: { 'X-API-Key': process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123' }
  });
  const candidate = await candidateResponse.json();
  
  // Fetch conversation history
  const conversationResponse = await fetch(`${baseUrl}/api/recruitment/conversations/${applicationId}`);
  const conversations = await conversationResponse.ok ? await conversationResponse.json() : { conversations: [] };
  
  return {
    applicationId,
    candidateName: candidate.first_name ? `${candidate.first_name} ${candidate.last_name}` : 'Kandidat',
    position: candidate.desired_position || 'flyttpersonal',
    currentStage: candidate.current_stage || 'email_screening',
    previousMessages: (conversations.conversations || []).map((conv: any) => ({
      role: conv.sender === 'candidate' ? 'user' : 'assistant',
      content: conv.message,
      timestamp: conv.timestamp
    }))
  };
}

async function saveConversation(data: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/recruitment/save-conversation`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to save conversation');
  }
  
  return response.json();
}

async function checkInformationCompleteness(applicationId: number) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  // Get all conversations
  const response = await fetch(`${baseUrl}/api/recruitment/conversations/${applicationId}`);
  const result = await response.json();
  const conversations = result.conversations || [];
  
  const candidateMessages = conversations
    .filter((c: any) => c.sender === 'candidate')
    .map((c: any) => c.message)
    .join(' ');

  // Check for required information
  const checks = {
    körkort: /körkort|b-körkort|c-körkort|ce-körkort|licens|körkortet|b\s*körkort|ja.*körkort|har.*körkort/i.test(candidateMessages),
    arbetserfarenhet: /arbete|jobb|erfarenhet|arbetat|jobbat|år|månader|flytt|städ|lager|logistik|restaurang|bygg/i.test(candidateMessages),
    tillgänglighet: /tid|dagar|vecka|måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag|flexibel|tillgänglig|kan.*jobba|pass/i.test(candidateMessages),
    svenska: /svenska|språk|pratar|förstår|flyt|bra|utmärkt|modersmål|flytande/i.test(candidateMessages)
  };

  const completedAreas = Object.values(checks).filter(Boolean).length;
  const isComplete = completedAreas >= 4;

  return {
    isComplete,
    completedAreas,
    totalAreas: 4,
    completionRate: Math.round((completedAreas / 4) * 100),
    missing: Object.keys(checks).filter(key => !checks[key as keyof typeof checks]),
    details: checks
  };
}

async function updateCandidateStage(applicationId: number, newStage: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/recruitment/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_stage: newStage,
      updated_at: new Date().toISOString()
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update candidate stage');
  }
  
  return response.json();
}

async function sendTypeformLink(applicationId: number) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  // Get candidate info
  const candidateResponse = await fetch(`${baseUrl}/api/recruitment/candidate-info?id=${applicationId}`, {
    headers: { 'X-API-Key': process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123' }
  });
  const candidate = await candidateResponse.json();
  
  // Send email with Typeform link
  const emailResponse = await fetch(`${baseUrl}/api/recruitment/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: candidate.email,
      subject: 'Nästa steg i din ansökan hos Nordflytt',
      template: 'typeform_invitation',
      data: {
        candidateName: candidate.first_name,
        typeformUrl: 'https://syn7dh9e02w.typeform.com/to/pUeKubsb',
        applicationId
      }
    })
  });
  
  if (!emailResponse.ok) {
    console.error('Failed to send Typeform email');
  }
  
  return emailResponse.ok;
}