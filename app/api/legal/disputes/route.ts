import { NextRequest, NextResponse } from 'next/server';
import { LegalDisputeResolution } from '@/lib/legal/LegalDisputeResolution';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');
    
    let query = supabase
      .from('legal_disputes')
      .select(`
        *,
        kunder (namn),
        legal_case_categories (category_name, severity_level),
        ai_legal_analysis (
          legal_strength_assessment,
          estimated_cost_range,
          confidence_score,
          generated_response,
          escalation_recommended
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: disputes, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ disputes });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      uppdrag_id,
      title,
      description,
      estimated_value,
      incident_date
    } = body;

    // Use AI to analyze and create the dispute
    const legalAI = new LegalDisputeResolution();
    const result = await legalAI.handleIncomingDispute({
      customer_id,
      uppdrag_id,
      title,
      description,
      estimated_value,
      incident_date
    });

    return NextResponse.json({
      success: true,
      dispute: result
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    );
  }
}