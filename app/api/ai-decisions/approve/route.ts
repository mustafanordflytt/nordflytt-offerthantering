import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: NextRequest) {
  try {
    const { decision_id, feedback, adjustments } = await request.json();
    
    if (!decision_id) {
      return NextResponse.json(
        { error: 'Decision ID is required' },
        { status: 400 }
      );
    }
    
    if (!supabase) {
      // Return mock response if Supabase not configured
      return NextResponse.json({
        id: decision_id,
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'user',
        feedback,
        adjustments,
        message: 'Decision approved successfully (mock)'
      });
    }
    
    // Update decision status
    const { data: decision, error } = await supabase
      .from('ai_decisions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'user', // In real app, get from auth
        user_feedback: {
          ...adjustments,
          feedback
        },
        execution_result: {
          status: 'pending_execution',
          adjustments_applied: adjustments || {}
        }
      })
      .eq('id', decision_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error approving decision:', error);
      throw error;
    }
    
    // Record learning feedback
    try {
      await supabase
        .from('ai_learning_metrics')
        .insert([{
          metric_type: 'decision_accuracy',
          module: decision.module,
          value: 100, // Approved = 100% accuracy
          baseline_value: decision.confidence_score,
          metadata: {
            decision_id,
            feedback_type: 'approval',
            adjustments_made: !!adjustments
          }
        }]);
    } catch (learningError) {
      console.error('Failed to record learning metric:', learningError);
      // Continue even if learning fails
    }
    
    return NextResponse.json({
      id: decision_id,
      status: 'approved',
      approved_at: decision.approved_at,
      message: 'Beslut godkänt och kommer att verkställas'
    });
    
  } catch (error: any) {
    console.error('Decision approval error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to approve decision' 
    }, { status: 500 });
  }
}