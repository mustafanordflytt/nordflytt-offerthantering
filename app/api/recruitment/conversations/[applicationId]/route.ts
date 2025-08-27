import { NextResponse } from 'next/server';

// Mock conversation data
const MOCK_CONVERSATIONS: Record<number, any[]> = {
  1: [
    {
      id: 'conv-1',
      application_id: 1,
      sender: 'lowisa',
      message: 'Hej Anna! 👋\n\nVälkommen till Nordflytt! Jag heter Lowisa och jag är här för att hjälpa dig med din ansökan.\n\nJag ser att du är intresserad av att jobba som flyttpersonal. Det låter spännande!\n\nFör att kunna gå vidare med din ansökan behöver jag ställa några korta frågor. Det tar bara några minuter.\n\nÄr det okej att vi börjar?',
      timestamp: '2024-01-16T10:00:00Z'
    },
    {
      id: 'conv-2',
      application_id: 1,
      sender: 'candidate',
      message: 'Hej Lowisa! Ja absolut, det går bra.',
      timestamp: '2024-01-16T10:05:00Z'
    },
    {
      id: 'conv-3',
      application_id: 1,
      sender: 'lowisa',
      message: 'Perfekt! Låt oss börja. 😊\n\nFörst undrar jag - har du körkort? Och i så fall, vilken typ? (B, C, CE eller annat)',
      timestamp: '2024-01-16T10:05:30Z'
    },
    {
      id: 'conv-4',
      application_id: 1,
      sender: 'candidate',
      message: 'Ja, jag har B-körkort sedan 5 år tillbaka.',
      timestamp: '2024-01-16T10:07:00Z'
    },
    {
      id: 'conv-5',
      application_id: 1,
      sender: 'lowisa',
      message: 'Utmärkt! B-körkort är perfekt för många av våra uppdrag. 🚗\n\nNästa fråga - kan du berätta lite om din arbetserfarenhet? Har du jobbat med flytt, städ, lager, restaurang eller bygg tidigare?',
      timestamp: '2024-01-16T10:07:30Z'
    }
  ],
  2: [
    {
      id: 'conv-6',
      application_id: 2,
      sender: 'lowisa',
      message: 'Hej Mohammed! 👋\n\nVälkommen till Nordflytt! Jag heter Lowisa och jag är här för att hjälpa dig med din ansökan.\n\nJag ser att du är intresserad av att jobba som chaufför. Det låter spännande!\n\nFör att kunna gå vidare med din ansökan behöver jag ställa några korta frågor. Det tar bara några minuter.\n\nÄr det okej att vi börjar?',
      timestamp: '2024-01-17T09:00:00Z'
    },
    {
      id: 'conv-7',
      application_id: 2,
      sender: 'candidate',
      message: 'Hej! Ja det är ok.',
      timestamp: '2024-01-17T09:02:00Z'
    },
    {
      id: 'conv-8',
      application_id: 2,
      sender: 'lowisa',
      message: 'Bra! Jag ser i din ansökan att du söker tjänst som chaufför. Vilken typ av körkort har du?',
      timestamp: '2024-01-17T09:02:30Z'
    },
    {
      id: 'conv-9',
      application_id: 2,
      sender: 'candidate',
      message: 'Jag har CE-körkort med ADR. Har kört lastbil i 5 år.',
      timestamp: '2024-01-17T09:04:00Z'
    }
  ],
  3: []
};

export async function GET(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const applicationId = parseInt(params.applicationId);
    
    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // In production, fetch from Supabase
    // const { data: conversations, error } = await supabase
    //   .from('recruitment_conversations')
    //   .select('*')
    //   .eq('application_id', applicationId)
    //   .order('timestamp', { ascending: true });

    const conversations = MOCK_CONVERSATIONS[applicationId] || [];

    // Calculate conversation statistics
    const stats = {
      totalMessages: conversations.length,
      candidateMessages: conversations.filter(c => c.sender === 'candidate').length,
      lowisaMessages: conversations.filter(c => c.sender === 'lowisa').length,
      lastMessageTime: conversations.length > 0 
        ? conversations[conversations.length - 1].timestamp 
        : null,
      conversationStarted: conversations.length > 0 
        ? conversations[0].timestamp 
        : null
    };

    return NextResponse.json({
      conversations,
      stats,
      application_id: applicationId
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const applicationId = parseInt(params.applicationId);
    const body = await request.json();
    const { message, sender, metadata } = body;

    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
      );
    }

    if (!message || !sender) {
      return NextResponse.json(
        { error: 'Missing required fields: message, sender' },
        { status: 400 }
      );
    }

    const newConversation = {
      id: `conv-${Date.now()}`,
      application_id: applicationId,
      message,
      sender,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    // In production, save to Supabase
    // const { data, error } = await supabase
    //   .from('recruitment_conversations')
    //   .insert(newConversation)
    //   .select()
    //   .single();

    // For demo, add to mock data
    if (!MOCK_CONVERSATIONS[applicationId]) {
      MOCK_CONVERSATIONS[applicationId] = [];
    }
    MOCK_CONVERSATIONS[applicationId].push(newConversation);

    return NextResponse.json({
      success: true,
      conversation: newConversation,
      message: 'Conversation saved successfully'
    });

  } catch (error) {
    console.error('Error saving conversation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}