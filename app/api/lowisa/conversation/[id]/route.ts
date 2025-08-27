import { NextResponse } from 'next/server';

// In-memory storage for demo (matches the chat route)
const conversationStore: { [key: number]: any } = {};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const candidateId = parseInt(params.id);

    // In production, fetch from Supabase
    // const { data, error } = await supabase
    //   .from('lowisa_conversations')
    //   .select('*')
    //   .eq('application_id', candidateId)
    //   .order('created_at', { ascending: true });

    const conversation = conversationStore[candidateId] || {
      messages: [],
      informationStatus: {
        korkort: false,
        arbetserfarenhet: false,
        tillganglighet: false,
        svenska: false,
        isComplete: false,
        completionRate: 0
      }
    };

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}