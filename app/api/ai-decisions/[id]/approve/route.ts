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
        status: 'approved',
        message: 'Mock approval'
      });
    }

    const { feedback } = await request.json();
    
    const { data, error } = await supabase
      .from('ai_decisions')
      .update({
        status: 'approved',
        executed_at: new Date().toISOString(),
        user_feedback: feedback
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error approving AI decision:', error);
      throw error;
    }
    
    // Execute the approved decision
    await executeAIDecision(data);
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('AI decision approval error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to approve AI decision' 
    }, { status: 500 });
  }
}

async function executeAIDecision(decision: any) {
  if (!supabase || !decision) return;
  
  console.log('Executing AI decision:', decision.id);
  
  // Update status to executed
  await supabase
    .from('ai_decisions')
    .update({
      status: 'executed',
      execution_result: { 
        executed_at: new Date().toISOString(),
        success: true 
      }
    })
    .eq('id', decision.id);
    
  // Record learning metric
  await supabase
    .from('ai_learning_metrics')
    .insert([{
      metric_type: 'decision_execution',
      module: decision.module,
      value: 1,
      metadata: { 
        decision_id: decision.id,
        decision_type: decision.decision_type 
      }
    }]);
}