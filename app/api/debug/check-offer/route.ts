import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  
  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false });
  
  return NextResponse.json({ offers });
}