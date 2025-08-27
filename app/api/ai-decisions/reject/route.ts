import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: NextRequest) {
  try {
    const { decision_id, reason, alternative_action } = await request.json();
    
    if (!decision_id || !reason) {
      return NextResponse.json(
        { error: 'Decision ID and reason are required' },
        { status: 400 }
      );
    }
    
    if (!supabase) {
      // Return mock response if Supabase not configured
      return NextResponse.json({
        id: decision_id,
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: 'user',
        reason,
        alternative_action,
        message: 'Decision rejected successfully (mock)'
      });
    }
    
    // Update decision status
    const { data: decision, error } = await supabase
      .from('ai_decisions')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: 'user', // In real app, get from auth
        user_feedback: {
          rejection_reason: reason,
          alternative_action
        },
        execution_result: {
          status: 'rejected',
          reason
        }
      })
      .eq('id', decision_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error rejecting decision:', error);
      throw error;
    }
    
    // Record learning feedback
    try {
      await supabase
        .from('ai_learning_metrics')
        .insert([{
          metric_type: 'decision_accuracy',
          module: decision.module,
          value: 0, // Rejected = 0% accuracy
          baseline_value: decision.confidence_score,
          metadata: {
            decision_id,
            feedback_type: 'rejection',
            rejection_reason: reason,
            alternative_action
          }
        }]);
    } catch (learningError) {
      console.error('Failed to record learning metric:', learningError);
      // Continue even if learning fails
    }
    
    return NextResponse.json({
      id: decision_id,
      status: 'rejected',
      rejected_at: decision.rejected_at,
      message: 'Beslut avvisat och loggat för framtida förbättring'
    });
    
  } catch (error: any) {
    console.error('Decision rejection error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to reject decision' 
    }, { status: 500 });
  }
}