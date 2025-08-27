import { NextRequest, NextResponse } from 'next/server';
import { RiskAssessmentEngine } from '@/lib/legal/RiskAssessmentEngine';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id } = body;

    const riskEngine = new RiskAssessmentEngine();
    let assessment;

    if (type === 'job') {
      assessment = await riskEngine.assessJobRisk(id);
    } else if (type === 'customer') {
      assessment = await riskEngine.assessCustomerRisk(id);
    } else {
      return NextResponse.json(
        { error: 'Invalid assessment type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error('Error performing risk assessment:', error);
    return NextResponse.json(
      { error: 'Failed to perform risk assessment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const referenceId = searchParams.get('reference_id');
    
    let query = supabase
      .from('risk_assessments')
      .select('*')
      .order('assessment_date', { ascending: false });

    if (type) {
      query = query.eq('assessment_type', type);
    }

    if (referenceId) {
      query = query.eq('reference_id', referenceId);
    }

    const { data: assessments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assessments });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch risk assessments' },
      { status: 500 }
    );
  }
}