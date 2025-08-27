import { NextResponse } from 'next/server';
import { extractApiKey, handleCorsRequest, withCors } from '@/lib/api-auth-enhanced';

interface ConversationEntry {
  id?: string;
  application_id: number;
  message: string;
  sender: 'candidate' | 'lowisa' | 'recruiter';
  timestamp: string;
  metadata?: {
    source?: string;
    sessionId?: string;
    platform?: string;
    ai_model?: string;
    response_time_ms?: number;
  };
}

// In-memory storage for demo (in production, use Supabase)
const conversationStore: Record<number, ConversationEntry[]> = {};

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsRequest(request as any);
  if (corsResponse) return corsResponse;

  try {
    // Check API key (supports both X-API-Key and Bearer token)
    const apiKey = extractApiKey(request as any);
    const validApiKey = process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123';
    
    if (!apiKey || apiKey !== validApiKey) {
      return withCors(NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      ));
    }

    const body: ConversationEntry = await request.json();
    const { application_id, message, sender, timestamp, metadata } = body;

    // Validate required fields
    if (!application_id || !message || !sender) {
      return NextResponse.json(
        { error: 'Missing required fields: application_id, message, sender' },
        { status: 400 }
      );
    }

    // Create conversation entry
    const conversationEntry: ConversationEntry = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      application_id,
      message,
      sender,
      timestamp: timestamp || new Date().toISOString(),
      metadata: metadata || {}
    };

    // In production, save to Supabase
    // const { data, error } = await supabase
    //   .from('recruitment_conversations')
    //   .insert(conversationEntry)
    //   .select()
    //   .single();

    // For demo, store in memory
    if (!conversationStore[application_id]) {
      conversationStore[application_id] = [];
    }
    conversationStore[application_id].push(conversationEntry);

    // Log conversation
    console.log(`[Conversation Saved] App ${application_id} - ${sender}: ${message.substring(0, 50)}...`);

    // Analyze conversation if it's from a candidate
    if (sender === 'candidate') {
      const analysis = await analyzeConversation(application_id);
      
      // Trigger actions based on analysis
      if (analysis.sentiment === 'negative') {
        await notifyRecruiter(application_id, 'Candidate expressing concerns');
      }
      
      if (analysis.hasUrgentQuestion) {
        await flagForPriorityResponse(application_id);
      }

      return withCors(NextResponse.json({
        success: true,
        conversation: conversationEntry,
        analysis,
        message: 'Conversation saved and analyzed successfully'
      }));
    }

    return withCors(NextResponse.json({
      success: true,
      conversation: conversationEntry,
      message: 'Conversation saved successfully'
    }));

  } catch (error) {
    console.error('Error saving conversation:', error);
    return withCors(NextResponse.json(
      { 
        error: 'Failed to save conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}

// Get conversation history
export async function GET(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsRequest(request as any);
  if (corsResponse) return corsResponse;

  try {
    // Check API key
    const apiKey = extractApiKey(request as any);
    const validApiKey = process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123';
    
    if (!apiKey || apiKey !== validApiKey) {
      return withCors(NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      ));
    }
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('application_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sender = searchParams.get('sender');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'application_id parameter is required' },
        { status: 400 }
      );
    }

    // In production, fetch from Supabase
    // const query = supabase
    //   .from('recruitment_conversations')
    //   .select('*')
    //   .eq('application_id', applicationId)
    //   .order('timestamp', { ascending: true })
    //   .limit(limit);
    
    // if (sender) {
    //   query.eq('sender', sender);
    // }
    
    // const { data, error } = await query;

    // For demo, get from memory
    let conversations = conversationStore[parseInt(applicationId)] || [];
    
    // Filter by sender if specified
    if (sender) {
      conversations = conversations.filter(c => c.sender === sender);
    }
    
    // Apply limit
    conversations = conversations.slice(-limit);

    // Calculate conversation metrics
    const metrics = calculateConversationMetrics(conversations);

    return withCors(NextResponse.json({
      conversations,
      total: conversations.length,
      metrics,
      application_id: applicationId
    }));

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return withCors(NextResponse.json(
      { 
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}

// Delete conversation (for GDPR compliance)
export async function DELETE(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCorsRequest(request as any);
  if (corsResponse) return corsResponse;

  try {
    // Check API key
    const apiKey = extractApiKey(request as any);
    const validApiKey = process.env.LOWISA_API_KEY || 'lowisa_nordflytt_2024_secretkey123';
    
    if (!apiKey || apiKey !== validApiKey) {
      return withCors(NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401 }
      ));
    }
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('application_id');
    const conversationId = searchParams.get('conversation_id');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'application_id parameter is required' },
        { status: 400 }
      );
    }

    // In production, delete from Supabase
    // if (conversationId) {
    //   await supabase
    //     .from('recruitment_conversations')
    //     .delete()
    //     .eq('id', conversationId);
    // } else {
    //   await supabase
    //     .from('recruitment_conversations')
    //     .delete()
    //     .eq('application_id', applicationId);
    // }

    // For demo, delete from memory
    if (conversationId) {
      const appConversations = conversationStore[parseInt(applicationId)] || [];
      conversationStore[parseInt(applicationId)] = appConversations.filter(
        c => c.id !== conversationId
      );
    } else {
      delete conversationStore[parseInt(applicationId)];
    }

    return withCors(NextResponse.json({
      success: true,
      message: conversationId 
        ? 'Conversation deleted successfully'
        : 'All conversations for application deleted successfully'
    }));

  } catch (error) {
    console.error('Error deleting conversations:', error);
    return withCors(NextResponse.json(
      { 
        error: 'Failed to delete conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}

// Support OPTIONS for CORS preflight
export async function OPTIONS(request: Request) {
  const corsResponse = handleCorsRequest(request as any);
  return corsResponse || new NextResponse(null, { status: 200 });
}

// Helper functions
async function analyzeConversation(applicationId: number) {
  const conversations = conversationStore[applicationId] || [];
  const candidateMessages = conversations
    .filter(c => c.sender === 'candidate')
    .map(c => c.message)
    .join(' ');

  // Simple sentiment analysis
  const negativeWords = ['inte', 'nej', 'problem', 'svårt', 'osäker', 'tveksam'];
  const positiveWords = ['ja', 'gärna', 'intresserad', 'perfekt', 'bra', 'utmärkt'];
  const urgentWords = ['när', 'hur snabbt', 'akut', 'omgående', 'brådskande'];

  const negativeCount = negativeWords.filter(word => 
    candidateMessages.toLowerCase().includes(word)
  ).length;
  
  const positiveCount = positiveWords.filter(word => 
    candidateMessages.toLowerCase().includes(word)
  ).length;
  
  const hasUrgentQuestion = urgentWords.some(word => 
    candidateMessages.toLowerCase().includes(word)
  );

  return {
    sentiment: negativeCount > positiveCount ? 'negative' : 
               positiveCount > negativeCount ? 'positive' : 'neutral',
    hasUrgentQuestion,
    messageCount: conversations.length,
    responseRate: calculateResponseRate(conversations),
    averageResponseTime: calculateAverageResponseTime(conversations)
  };
}

function calculateConversationMetrics(conversations: ConversationEntry[]) {
  const candidateMessages = conversations.filter(c => c.sender === 'candidate').length;
  const lowisaMessages = conversations.filter(c => c.sender === 'lowisa').length;
  const totalMessages = conversations.length;

  return {
    totalMessages,
    candidateMessages,
    lowisaMessages,
    responseRate: candidateMessages > 0 ? (lowisaMessages / candidateMessages) : 0,
    conversationDuration: conversations.length > 0 
      ? new Date(conversations[conversations.length - 1].timestamp).getTime() - 
        new Date(conversations[0].timestamp).getTime()
      : 0
  };
}

function calculateResponseRate(conversations: ConversationEntry[]) {
  const candidateMessages = conversations.filter(c => c.sender === 'candidate').length;
  const lowisaMessages = conversations.filter(c => c.sender === 'lowisa').length;
  
  return candidateMessages > 0 ? Math.round((lowisaMessages / candidateMessages) * 100) : 0;
}

function calculateAverageResponseTime(conversations: ConversationEntry[]) {
  let totalResponseTime = 0;
  let responseCount = 0;

  for (let i = 1; i < conversations.length; i++) {
    if (conversations[i].sender === 'lowisa' && conversations[i-1].sender === 'candidate') {
      const responseTime = new Date(conversations[i].timestamp).getTime() - 
                          new Date(conversations[i-1].timestamp).getTime();
      totalResponseTime += responseTime;
      responseCount++;
    }
  }

  return responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000) : 0; // in seconds
}

async function notifyRecruiter(applicationId: number, reason: string) {
  console.log(`[Notification] Recruiter notified for application ${applicationId}: ${reason}`);
  // In production, send actual notification
}

async function flagForPriorityResponse(applicationId: number) {
  console.log(`[Priority] Application ${applicationId} flagged for priority response`);
  // In production, update application priority
}