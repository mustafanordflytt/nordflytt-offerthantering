import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking bookings table raw data...');
    
    // Get ALL bookings without any filtering
    const { data: bookings, error, count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to query bookings',
        details: error 
      }, { status: 500 });
    }
    
    // Find NF- prefixed bookings
    const nfBookings = bookings?.filter(b => 
      b.reference?.startsWith('NF-') || 
      b.id?.startsWith('NF-') ||
      JSON.stringify(b).includes('NF-')
    ) || [];
    
    // Look for specific references
    const targetReferences = ['NF-23857BDE', 'NF-D6DC82E4'];
    const foundTargets: any[] = [];
    
    for (const ref of targetReferences) {
      const found = bookings?.find(b => 
        b.reference === ref || 
        b.id === ref ||
        JSON.stringify(b).includes(ref)
      );
      
      if (found) {
        foundTargets.push({
          reference: ref,
          booking: found
        });
      }
    }
    
    // Get column names if we have data
    const columns = bookings && bookings.length > 0 ? Object.keys(bookings[0]) : [];
    
    return NextResponse.json({
      summary: {
        totalBookings: count || 0,
        returnedBookings: bookings?.length || 0,
        nfPrefixedCount: nfBookings.length,
        columns: columns,
        timestamp: new Date().toISOString()
      },
      targetSearch: {
        searchedFor: targetReferences,
        found: foundTargets.length,
        results: foundTargets
      },
      nfBookings: {
        count: nfBookings.length,
        samples: nfBookings.slice(0, 5).map(b => ({
          id: b.id,
          reference: b.reference,
          customer_name: b.customer_name,
          customer_email: b.customer_email,
          created_at: b.created_at,
          status: b.status
        }))
      },
      latestBookings: bookings?.slice(0, 5).map(b => ({
        id: b.id,
        reference: b.reference,
        customer_name: b.customer_name,
        customer_email: b.customer_email,
        created_at: b.created_at,
        status: b.status,
        hasNF: JSON.stringify(b).includes('NF-')
      })),
      rawSample: bookings && bookings.length > 0 ? bookings[0] : null
    });
    
  } catch (error) {
    console.error('💥 Error:', error);
    return NextResponse.json({ 
      error: 'Failed to check bookings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}