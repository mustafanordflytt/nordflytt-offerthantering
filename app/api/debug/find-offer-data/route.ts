import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams.get('search') || 'NF-23857BDE';
  
  console.log(`🔍 Searching for: ${searchParam}`);
  
  const results: any = {
    searchTerm: searchParam,
    timestamp: new Date().toISOString(),
    findings: {}
  };

  // List of all possible tables to check
  const tablesToCheck = [
    'offers',
    'quotes', 
    'bookings',
    'customers',
    'leads',
    'jobs',
    'invoices',
    'offert',  // Swedish variant
    'offerter', // Swedish plural
    'quote_requests',
    'orders',
    'work_orders',
    'projects',
    'estimates'
  ];

  // Check each table
  for (const tableName of tablesToCheck) {
    try {
      console.log(`Checking ${tableName}...`);
      
      // First, check if table exists by trying to count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`✅ Table ${tableName} exists with ${count} rows`);
        
        // Get sample data
        const { data: sampleData } = await supabase
          .from(tableName)
          .select('*')
          .limit(5)
          .order('created_at', { ascending: false });
        
        // Search for our reference
        let searchResults = [];
        
        // Try multiple search approaches
        try {
          // Approach 1: Direct column search
          const { data: directSearch } = await supabase
            .from(tableName)
            .select('*')
            .or(`reference.eq.${searchParam},id.eq.${searchParam},booking_reference.eq.${searchParam}`);
          
          if (directSearch && directSearch.length > 0) {
            searchResults = directSearch;
          }
        } catch (e) {
          // Column might not exist
        }
        
        // Approach 2: LIKE search
        if (searchResults.length === 0) {
          try {
            const { data: likeSearch } = await supabase
              .from(tableName)
              .select('*')
              .or(`reference.ilike.%${searchParam}%,id.ilike.%${searchParam}%`);
            
            if (likeSearch && likeSearch.length > 0) {
              searchResults = likeSearch;
            }
          } catch (e) {
            // Column might not exist
          }
        }
        
        // Approach 3: Search in all text columns
        if (searchResults.length === 0 && sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0]);
          const textColumns = columns.filter(col => {
            const sampleValue = sampleData[0][col];
            return typeof sampleValue === 'string' || sampleValue === null;
          });
          
          for (const col of textColumns) {
            try {
              const { data: colSearch } = await supabase
                .from(tableName)
                .select('*')
                .ilike(col, `%${searchParam}%`);
              
              if (colSearch && colSearch.length > 0) {
                searchResults = colSearch;
                break;
              }
            } catch (e) {
              // Skip this column
            }
          }
        }
        
        // Check for NF- prefixed data
        const { data: nfData } = await supabase
          .from(tableName)
          .select('*')
          .limit(10)
          .or('reference.ilike.NF-%,id.ilike.NF-%,booking_reference.ilike.NF-%,name.ilike.NF-%');
        
        results.findings[tableName] = {
          exists: true,
          rowCount: count,
          columns: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
          searchResultCount: searchResults.length,
          searchResults: searchResults,
          nfPrefixedDataCount: nfData?.length || 0,
          nfPrefixedSamples: nfData?.slice(0, 3),
          sampleRows: sampleData?.slice(0, 2)
        };
      }
    } catch (error) {
      console.log(`❌ Table ${tableName} does not exist or error:`, error);
      results.findings[tableName] = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Generate analysis
  const analysis = {
    tablesFound: Object.keys(results.findings).filter(t => results.findings[t].exists),
    tablesWithSearchResult: Object.keys(results.findings).filter(t => 
      results.findings[t].searchResultCount > 0
    ),
    tablesWithNFData: Object.keys(results.findings).filter(t => 
      results.findings[t].nfPrefixedDataCount > 0
    ),
    recommendations: []
  };

  // Add recommendations
  if (analysis.tablesWithSearchResult.length > 0) {
    analysis.recommendations.push(
      `✅ Found "${searchParam}" in tables: ${analysis.tablesWithSearchResult.join(', ')}`
    );
  } else {
    analysis.recommendations.push(
      `❌ Could not find "${searchParam}" in any table. It might be stored differently.`
    );
  }

  if (analysis.tablesWithNFData.length > 0) {
    analysis.recommendations.push(
      `📋 Tables containing NF- prefixed data: ${analysis.tablesWithNFData.join(', ')}`
    );
  }

  results.analysis = analysis;

  return NextResponse.json(results);
}

// POST endpoint to check a specific table in detail
export async function POST(request: NextRequest) {
  try {
    const { tableName } = await request.json();
    
    console.log(`📊 Detailed inspection of table: ${tableName}`);
    
    // Get all data from the table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      return NextResponse.json({ 
        error: `Failed to query ${tableName}`,
        details: error 
      }, { status: 400 });
    }
    
    // Analyze the data structure
    const analysis: any = {
      tableName,
      totalRows: count,
      returnedRows: data?.length || 0,
      columns: data && data.length > 0 ? Object.keys(data[0]) : [],
      data: data
    };
    
    // Find columns that might contain offer references
    if (data && data.length > 0) {
      const referenceColumns = [];
      const columns = Object.keys(data[0]);
      
      for (const col of columns) {
        const values = data.slice(0, 10).map(row => row[col]).filter(v => v);
        const hasNFPrefix = values.some(v => 
          typeof v === 'string' && v.startsWith('NF-')
        );
        
        if (hasNFPrefix || col.includes('ref') || col.includes('id')) {
          referenceColumns.push({
            column: col,
            sampleValues: [...new Set(values)].slice(0, 5),
            hasNFPrefix
          });
        }
      }
      
      analysis.referenceColumns = referenceColumns;
    }
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Detailed inspection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}