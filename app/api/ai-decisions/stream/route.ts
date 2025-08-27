import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      // Return mock data if Supabase not configured
      return NextResponse.json({
        decisions: [
          {
            id: '1',
            decision_type: 'staff_assignment',
            module: 'operations',
            description: 'Tilldela Team Erik till Stockholm jobb',
            confidence_score: 92.5,
            impact_level: 'medium',
            status: 'pending',
            ai_mode: 'suggest',
            created_at: new Date().toISOString()
          }
        ],
        total: 1,
        has_more: false
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const module = searchParams.get('module');
    
    let query = supabase
      .from('ai_decisions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (module) {
      query = query.eq('module', module);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching AI decisions:', error);
      throw error;
    }
    
    return NextResponse.json({
      decisions: data || [],
      total: data?.length || 0,
      has_more: (data?.length || 0) === limit
    });
    
  } catch (error: any) {
    console.error('AI decisions stream error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch AI decisions',
      decisions: [],
      total: 0,
      has_more: false
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({
        id: 'mock-' + Date.now(),
        status: 'created',
        message: 'Mock AI decision created'
      });
    }

    const decisionData = await request.json();
    
    const { data, error } = await supabase
      .from('ai_decisions')
      .insert([{
        decision_type: decisionData.type,
        module: decisionData.module,
        description: decisionData.description,
        confidence_score: decisionData.confidence,
        impact_level: decisionData.impact || 'medium',
        ai_mode: decisionData.mode || 'suggest',
        context_data: decisionData.context,
        recommendations: decisionData.recommendations
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating AI decision:', error);
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('AI decision creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create AI decision' 
    }, { status: 500 });
  }
}