import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log the tracking data
    console.log('GPT Interaction Tracked:', {
      session_id: data.session_id,
      interaction_type: data.interaction_type,
      customer_email: data.customer_email,
      revenue_impact: data.revenue_impact,
      timestamp: data.timestamp
    });

    // If we have a database connection, store in gpt_api_metrics
    if (supabase) {
      const { error } = await supabase
        .from('gpt_api_metrics')
        .insert({
          endpoint: `/gpt-rag/${data.interaction_type}`,
          method: 'POST',
          status_code: 200,
          response_time_ms: Math.floor(Math.random() * 1000) + 200, // Mock response time
          customer_email: data.customer_email,
          api_key_used: 'nordflytt_gpt_api_key_2025',
          request_body: data.metadata || {},
          timestamp: data.timestamp
        });

      if (error) {
        console.error('Failed to store analytics:', error);
      }

      // Also update the GPT session if session_id is provided
      if (data.session_id) {
        await supabase
          .from('gpt_sessions')
          .upsert({
            session_id: data.session_id,
            customer_email: data.customer_email,
            updated_at: new Date().toISOString(),
            conversation_context: {
              last_interaction: data.interaction_type,
              revenue_impact: data.revenue_impact
            }
          }, {
            onConflict: 'session_id'
          });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Interaction tracked successfully' 
    });

  } catch (error: any) {
    console.error('Failed to track GPT interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}