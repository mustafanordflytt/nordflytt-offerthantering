import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: NextRequest) {
  try {
    const { mode, reason, changed_by = 'system' } = await request.json();
    
    // Validate mode
    if (!['suggest', 'auto', 'full'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be suggest, auto, or full.' },
        { status: 400 }
      );
    }
    
    if (!supabase) {
      // Return mock response if Supabase not configured
      return NextResponse.json({
        success: true,
        mode: mode,
        changed_at: new Date().toISOString(),
        message: `AI mode changed to ${mode} (mock)`
      });
    }
    
    // Get current mode
    const { data: currentModeData } = await supabase
      .from('ai_mode_history')
      .select('new_mode')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const currentMode = currentModeData?.new_mode;
    
    // Only create record if mode is actually changing
    if (currentMode !== mode) {
      const { data, error } = await supabase
        .from('ai_mode_history')
        .insert([{
          previous_mode: currentMode || null,
          new_mode: mode,
          reason,
          changed_by
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error setting AI mode:', error);
        throw error;
      }
      
      // Update autonomous configuration for all modules
      try {
        await supabase
          .from('autonomous_config')
          .upsert([
            {
              module: 'global',
              setting_key: 'ai_mode',
              setting_value: { mode },
              updated_by: changed_by
            }
          ], {
            onConflict: 'module,setting_key'
          });
      } catch (configError) {
        console.error('Error updating autonomous config:', configError);
        // Continue even if config update fails
      }
      
      return NextResponse.json({
        success: true,
        mode: mode,
        changed_at: data.created_at,
        message: `AI-läge ändrat till ${mode}`
      });
    } else {
      return NextResponse.json({
        success: true,
        mode: mode,
        message: 'Läget är oförändrat'
      });
    }
    
  } catch (error: any) {
    console.error('AI mode change error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to change AI mode' 
    }, { status: 500 });
  }
}