import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Skapa reviews-tabell
    const { error: reviewsError } = await supabase.rpc('create_reviews_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS reviews (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          order_id TEXT NOT NULL,
          rating INTEGER NOT NULL,
          feedback TEXT,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          needs_follow_up BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
          UNIQUE(order_id)
        );
      `
    });

    if (reviewsError) {
      console.error('Error creating reviews table:', reviewsError);
      throw reviewsError;
    }

    // Skapa follow_ups-tabell
    const { error: followUpsError } = await supabase.rpc('create_follow_ups_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS follow_ups (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          review_id UUID REFERENCES reviews(id),
          order_id TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
        );
      `
    });

    if (followUpsError) {
      console.error('Error creating follow_ups table:', followUpsError);
      throw followUpsError;
    }

    return NextResponse.json({ success: true, message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup database' },
      { status: 500 }
    );
  }
} 