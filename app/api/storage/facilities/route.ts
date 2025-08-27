import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: facilities, error } = await supabase
      .from('storage_facilities')
      .select('*')
      .eq('status', 'active')
      .order('facility_name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ facilities });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch storage facilities' },
      { status: 500 }
    );
  }
}