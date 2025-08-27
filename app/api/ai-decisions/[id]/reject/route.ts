import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      return NextResponse.json({
        id: params.id,
        status: 'rejected',
        message: 'Mock rejection'
      });
    }

    const { reason } = await request.json();
    
    const { data, error } = await supabase
      .from('ai_decisions')
      .update({
        status: 'rejected',
        user_feedback: { reason }
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error rejecting AI decision:', error);
      throw error;
    }
    
    // Learn from rejection
    await recordAILearning({
      metric_type: 'rejection_feedback',
      module: data.module,
      value: 0,
      metadata: { 
        decision_id: params.id, 
        reason,
        decision_type: data.decision_type 
      }
    });
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('AI decision rejection error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to reject AI decision' 
    }, { status: 500 });
  }
}

async function recordAILearning(learningData: any) {
  if (!supabase) return;
  
  try {
    await supabase
      .from('ai_learning_metrics')
      .insert([learningData]);
  } catch (error) {
    console.error('Failed to record AI learning:', error);
  }
}