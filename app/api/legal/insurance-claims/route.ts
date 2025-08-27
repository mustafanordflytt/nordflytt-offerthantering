import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const disputeId = searchParams.get('dispute_id');
    
    let query = supabase
      .from('insurance_claims')
      .select(`
        *,
        legal_disputes (
          title,
          customer_id,
          kunder (namn)
        )
      `)
      .order('submitted_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (disputeId) {
      query = query.eq('dispute_id', disputeId);
    }

    const { data: claims, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ claims });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch insurance claims' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dispute_id } = body;

    // Generate claim reference
    const claimReference = `CLM-${Date.now().toString(36).toUpperCase()}`;

    // Get dispute details to determine insurance provider and amount
    const { data: dispute } = await supabase
      .from('legal_disputes')
      .select('estimated_value, case_category_id')
      .eq('id', dispute_id)
      .single();

    // Create insurance claim
    const { data: claim, error } = await supabase
      .from('insurance_claims')
      .insert({
        dispute_id,
        claim_reference: claimReference,
        insurance_provider: 'Trygg-Hansa', // Default provider
        claim_amount: dispute?.estimated_value || 0,
        status: 'pending',
        submitted_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      claim
    });
  } catch (error) {
    console.error('Error creating insurance claim:', error);
    return NextResponse.json(
      { error: 'Failed to create insurance claim' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, payout_amount, rejection_reason } = body;

    const updateData: any = {
      status,
      response_date: new Date().toISOString()
    };

    if (payout_amount !== undefined) {
      updateData.payout_amount = payout_amount;
    }

    if (rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data: claim, error } = await supabase
      .from('insurance_claims')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      claim
    });
  } catch (error) {
    console.error('Error updating insurance claim:', error);
    return NextResponse.json(
      { error: 'Failed to update insurance claim' },
      { status: 500 }
    );
  }
}