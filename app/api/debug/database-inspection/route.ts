import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting comprehensive database inspection...');

    // TASK 1: Get all tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_all_tables');

    let tableList: string[] = [];
    
    if (tablesError) {
      console.log('Using fallback method to get tables...');
      // Fallback: Try known table names
      const knownTables = [
        'offers', 'quotes', 'bookings', 'customers', 'leads', 'jobs',
        'employees', 'contracts', 'partners', 'suppliers', 'invoices',
        'offers_view', 'quotes_view', 'bookings_view'
      ];
      
      tableList = [];
      for (const tableName of knownTables) {
        try {
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (count !== null) {
            tableList.push(tableName);
          }
        } catch (e) {
          // Table doesn't exist
        }
      }
    } else {
      tableList = tables?.map((t: any) => t.table_name) || [];
    }

    console.log('📋 Found tables:', tableList);

    // TASK 2: Inspect structure of offer-related tables
    const tableStructures: Record<string, any> = {};
    const offerRelatedTables = ['offers', 'quotes', 'bookings', 'customers', 'leads', 'jobs'];
    
    for (const tableName of offerRelatedTables) {
      if (tableList.includes(tableName)) {
        try {
          // Get first row to see structure
          const { data: sample, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!error && sample && sample.length > 0) {
            tableStructures[tableName] = {
              columns: Object.keys(sample[0]),
              sampleRow: sample[0]
            };
          }
        } catch (e) {
          console.error(`Error inspecting ${tableName}:`, e);
        }
      }
    }

    // TASK 3: Raw data dump from each table
    const rawData: Record<string, any> = {};
    
    // Get all data from offer-related tables
    for (const tableName of ['offers', 'quotes', 'bookings']) {
      if (tableList.includes(tableName)) {
        try {
          const { data, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(10);
          
          rawData[tableName] = {
            totalCount: count,
            recentRows: data,
            columns: data && data.length > 0 ? Object.keys(data[0]) : []
          };
        } catch (e) {
          console.error(`Error fetching from ${tableName}:`, e);
        }
      }
    }

    // TASK 4: Search for specific reference
    const searchTerm = 'NF-23857BDE';
    const searchResults: Record<string, any[]> = {};
    
    for (const tableName of tableList) {
      try {
        // Try text search on all columns
        const { data } = await supabase
          .from(tableName)
          .select('*')
          .or(`reference.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%,booking_reference.ilike.%${searchTerm}%`);
        
        if (data && data.length > 0) {
          searchResults[tableName] = data;
        }
        
        // Also try JSON column search if applicable
        if (['offers', 'quotes', 'bookings'].includes(tableName)) {
          const { data: jsonSearch } = await supabase
            .from(tableName)
            .select('*')
            .filter('metadata', 'cs', `{"reference":"${searchTerm}"}`);
          
          if (jsonSearch && jsonSearch.length > 0) {
            searchResults[`${tableName}_metadata`] = jsonSearch;
          }
        }
      } catch (e) {
        // Skip tables that don't have searchable columns
      }
    }

    // TASK 5: Check CRM-specific views or tables
    const crmSpecificChecks: Record<string, any> = {};
    
    // Check if there are any views
    try {
      const { data: views } = await supabase
        .rpc('get_all_views');
      
      if (views) {
        crmSpecificChecks.views = views.map((v: any) => v.view_name);
      }
    } catch (e) {
      // No views or RPC not available
    }

    // Try to find any table with 'NF-' prefixed data
    const nfPrefixSearch: Record<string, any> = {};
    for (const tableName of tableList) {
      try {
        const { data, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .or(`reference.ilike.NF-%,booking_reference.ilike.NF-%,name.ilike.NF-%`)
          .limit(5);
        
        if (data && data.length > 0) {
          nfPrefixSearch[tableName] = {
            count: count,
            samples: data
          };
        }
      } catch (e) {
        // Skip
      }
    }

    // Generate comprehensive report
    const report = {
      summary: {
        tablesFound: tableList.length,
        tableNames: tableList,
        timestamp: new Date().toISOString()
      },
      tableStructures,
      rawDataSamples: rawData,
      searchResults: {
        searchTerm,
        foundIn: Object.keys(searchResults),
        details: searchResults
      },
      nfPrefixData: {
        tablesWithNFPrefix: Object.keys(nfPrefixSearch),
        samples: nfPrefixSearch
      },
      crmSpecificChecks,
      recommendations: generateRecommendations(tableList, searchResults, nfPrefixSearch)
    };

    return NextResponse.json(report, { status: 200 });

  } catch (error) {
    console.error('💥 Database inspection error:', error);
    return NextResponse.json({ 
      error: 'Database inspection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

function generateRecommendations(tables: string[], searchResults: any, nfData: any): string[] {
  const recommendations: string[] = [];
  
  if (!tables.includes('offers') && tables.includes('quotes')) {
    recommendations.push('❗ No "offers" table found, but "quotes" table exists. The CRM might be using "quotes" as the primary offer storage.');
  }
  
  if (Object.keys(searchResults).length === 0) {
    recommendations.push('⚠️ The reference "NF-23857BDE" was not found in any table. It might be stored in a different format or column.');
  }
  
  if (Object.keys(nfData).length > 0) {
    recommendations.push(`✅ Found NF- prefixed data in tables: ${Object.keys(nfData).join(', ')}. These are likely the primary storage tables.`);
  }
  
  if (tables.includes('bookings') && tables.includes('quotes')) {
    recommendations.push('💡 Both "bookings" and "quotes" tables exist. Check if they store the same data or have different purposes.');
  }
  
  return recommendations;
}

// Additional endpoint to search specific table
export async function POST(request: NextRequest) {
  try {
    const { tableName, searchTerm } = await request.json();
    
    if (!tableName) {
      return NextResponse.json({ error: 'Table name required' }, { status: 400 });
    }
    
    // Get all data from specified table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(100);
    
    if (error) {
      return NextResponse.json({ 
        error: `Failed to query ${tableName}`,
        details: error.message 
      }, { status: 400 });
    }
    
    // If search term provided, filter results
    let filteredData = data;
    if (searchTerm && data) {
      filteredData = data.filter(row => 
        JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return NextResponse.json({
      tableName,
      totalRows: count,
      returnedRows: data?.length || 0,
      filteredRows: filteredData?.length || 0,
      columns: data && data.length > 0 ? Object.keys(data[0]) : [],
      data: filteredData,
      searchTerm
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Table query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}