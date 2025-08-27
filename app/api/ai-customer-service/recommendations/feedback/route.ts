import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: NextRequest) {
  try {
    const { 
      customerId, 
      recommendationId, 
      feedbackType, 
      feedbackText,
      conversionValue 
    } = await request.json();
    
    if (!customerId || !recommendationId || !feedbackType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate feedback type
    const validFeedbackTypes = ['interested', 'not_interested', 'already_have', 'maybe_later'];
    if (!validFeedbackTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }
    
    if (!supabase) {
      // Mock response for demo
      return NextResponse.json({
        success: true,
        feedbackId: `feedback-${Date.now()}`,
        message: getResponseMessage(feedbackType),
        nextRecommendation: feedbackType === 'interested' ? 
          await getNextRecommendation(customerId) : null
      });
    }
    
    // Store feedback in database
    const { data, error } = await supabase
      .from('recommendation_feedback')
      .insert({
        customer_id: customerId,
        recommendation_id: recommendationId,
        feedback_type: feedbackType,
        feedback_text: feedbackText,
        conversion_value: conversionValue || 0
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update recommendation engine learning
    await updateRecommendationEngine(customerId, recommendationId, feedbackType);
    
    // Get response based on feedback
    const response = {
      success: true,
      feedbackId: data.id,
      message: getResponseMessage(feedbackType),
      nextRecommendation: feedbackType === 'interested' ? 
        await getNextRecommendation(customerId) : null
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Recommendation feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const recommendationId = searchParams.get('recommendationId');
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      );
    }
    
    if (!supabase) {
      // Mock response for demo
      return NextResponse.json({
        feedback: [
          {
            id: 'feedback-1',
            recommendationId: 'rec-1',
            feedbackType: 'interested',
            feedbackText: 'Bra förslag!',
            conversionValue: 5000,
            createdAt: new Date().toISOString()
          }
        ],
        summary: {
          totalFeedback: 1,
          interestRate: 100,
          conversionRate: 50,
          averageValue: 5000
        }
      });
    }
    
    // Build query
    let query = supabase
      .from('recommendation_feedback')
      .select('*')
      .eq('customer_id', customerId);
    
    if (recommendationId) {
      query = query.eq('recommendation_id', recommendationId);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Calculate summary statistics
    const summary = calculateFeedbackSummary(data || []);
    
    return NextResponse.json({
      feedback: data || [],
      summary
    });
    
  } catch (error: any) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

function getResponseMessage(feedbackType: string): string {
  const messages = {
    interested: '✅ Utmärkt! Jag hjälper dig gärna med det. Ska vi boka in den tjänsten?',
    not_interested: '👍 Förstått! Jag noterar det för framtiden.',
    already_have: '✓ Bra att veta! Då fokuserar vi på andra tjänster.',
    maybe_later: '📝 Noterat! Jag påminner dig närmare flytten om du vill.'
  };
  
  return messages[feedbackType as keyof typeof messages] || 'Tack för din feedback!';
}

async function updateRecommendationEngine(
  customerId: string, 
  recommendationId: string, 
  feedbackType: string
) {
  // Update ML model weights based on feedback
  // This would integrate with your recommendation engine
  
  const weight = {
    interested: 1.2,
    not_interested: 0.7,
    already_have: 0.9,
    maybe_later: 1.0
  }[feedbackType] || 1.0;
  
  // Log learning event
  if (supabase) {
    await supabase
      .from('ai_learning_events')
      .insert({
        module: 'recommendations',
        event_type: 'feedback_received',
        customer_id: customerId,
        data: {
          recommendation_id: recommendationId,
          feedback_type: feedbackType,
          weight_adjustment: weight
        }
      });
  }
}

async function getNextRecommendation(customerId: string) {
  // Get next best recommendation based on updated model
  if (!supabase) {
    return {
      id: 'rec-next',
      service: 'städning',
      reason: 'Populärt tillägg för packningstjänst',
      confidence: 0.82,
      estimatedValue: 3500
    };
  }
  
  // This would call your recommendation engine
  const { data } = await supabase
    .from('service_recommendations')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .order('confidence_score', { ascending: false })
    .limit(1)
    .single();
  
  return data;
}

function calculateFeedbackSummary(feedback: any[]) {
  const total = feedback.length;
  if (total === 0) {
    return {
      totalFeedback: 0,
      interestRate: 0,
      conversionRate: 0,
      averageValue: 0
    };
  }
  
  const interested = feedback.filter(f => f.feedback_type === 'interested').length;
  const converted = feedback.filter(f => f.conversion_value > 0).length;
  const totalValue = feedback.reduce((sum, f) => sum + (f.conversion_value || 0), 0);
  
  return {
    totalFeedback: total,
    interestRate: Math.round((interested / total) * 100),
    conversionRate: Math.round((converted / total) * 100),
    averageValue: Math.round(totalValue / (converted || 1))
  };
}