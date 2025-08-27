import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET() {
  try {
    if (!supabase) {
      // Return default mode if Supabase not configured
      return NextResponse.json({
        mode: 'suggest',
        changed_at: new Date().toISOString(),
        changed_by: 'system',
        reason: 'Default mode - Supabase not configured'
      });
    }

    const { data: currentMode, error } = await supabase
      .from('ai_mode_history')
      .select('new_mode, created_at, changed_by, reason')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching current AI mode:', error);
      // Return default mode on error
      return NextResponse.json({
        mode: 'suggest',
        changed_at: new Date().toISOString(),
        changed_by: 'system',
        reason: 'Default mode'
      });
    }
    
    return NextResponse.json({
      mode: currentMode?.new_mode || 'suggest',
      changed_at: currentMode?.created_at || new Date().toISOString(),
      changed_by: currentMode?.changed_by || 'system',
      reason: currentMode?.reason || 'Initial setup'
    });
    
  } catch (error: any) {
    console.error('AI mode fetch error:', error);
    // Return default mode on any error
    return NextResponse.json({
      mode: 'suggest',
      changed_at: new Date().toISOString(),
      changed_by: 'system',
      reason: 'Default mode due to error'
    });
  }
}