const fetch = require('node-fetch');

async function inspectDatabase() {
  console.log('\n🔍 DATABASE INSPECTION REPORT\n');
  console.log('=' * 50);
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Step 1: Find where offer data lives
    console.log('\n📋 STEP 1: Searching for offer NF-23857BDE...\n');
    
    const searchResponse = await fetch(`${baseUrl}/api/debug/find-offer-data?search=NF-23857BDE`);
    const searchData = await searchResponse.json();
    
    if (searchData.analysis) {
      console.log('Tables found:', searchData.analysis.tablesFound.join(', '));
      console.log('Tables with search results:', searchData.analysis.tablesWithSearchResult.join(', ') || 'NONE');
      console.log('Tables with NF- data:', searchData.analysis.tablesWithNFData.join(', ') || 'NONE');
      
      // Show findings for each table
      console.log('\n📊 TABLE DETAILS:\n');
      
      for (const [tableName, info] of Object.entries(searchData.findings)) {
        if (info.exists) {
          console.log(`\n${tableName.toUpperCase()}:`);
          console.log(`- Rows: ${info.rowCount}`);
          console.log(`- Columns: ${info.columns?.join(', ') || 'unknown'}`);
          console.log(`- Search results: ${info.searchResultCount}`);
          console.log(`- NF- prefixed data: ${info.nfPrefixedDataCount}`);
          
          if (info.searchResults && info.searchResults.length > 0) {
            console.log(`\n✅ FOUND "${searchData.searchTerm}" in ${tableName}:`);
            console.log(JSON.stringify(info.searchResults[0], null, 2));
          }
          
          if (info.nfPrefixedSamples && info.nfPrefixedSamples.length > 0) {
            console.log(`\nSample NF- data from ${tableName}:`);
            info.nfPrefixedSamples.forEach((row, idx) => {
              console.log(`${idx + 1}. ${row.reference || row.id || JSON.stringify(row).substring(0, 100)}`);
            });
          }
        }
      }
    }
    
    // Step 2: If we found tables with NF data, inspect them in detail
    const tablesWithData = searchData.analysis?.tablesWithNFData || [];
    
    if (tablesWithData.length > 0) {
      console.log('\n\n📊 STEP 2: Detailed inspection of tables with NF- data...\n');
      
      for (const tableName of tablesWithData) {
        const detailResponse = await fetch(`${baseUrl}/api/debug/find-offer-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableName })
        });
        
        const detailData = await detailResponse.json();
        
        console.log(`\n🔍 ${tableName.toUpperCase()} DETAILED INSPECTION:`);
        console.log(`Total rows: ${detailData.totalRows}`);
        console.log(`Columns: ${detailData.columns?.join(', ')}`);
        
        if (detailData.referenceColumns && detailData.referenceColumns.length > 0) {
          console.log('\nReference columns found:');
          detailData.referenceColumns.forEach(col => {
            console.log(`- ${col.column}: ${col.sampleValues.join(', ')}`);
          });
        }
        
        if (detailData.data && detailData.data.length > 0) {
          console.log(`\nFirst row structure:`);
          const firstRow = detailData.data[0];
          Object.entries(firstRow).forEach(([key, value]) => {
            const displayValue = value !== null ? 
              (typeof value === 'object' ? JSON.stringify(value) : String(value)).substring(0, 50) : 
              'null';
            console.log(`  ${key}: ${displayValue}${String(value).length > 50 ? '...' : ''}`);
          });
        }
      }
    }
    
    // Step 3: Try to find the specific offer using different approaches
    console.log('\n\n📋 STEP 3: Alternative search approaches...\n');
    
    // Check if it's in quotes table
    const quotesCheck = await fetch(`${baseUrl}/api/debug/find-offer-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName: 'quotes' })
    });
    
    if (quotesCheck.ok) {
      const quotesData = await quotesCheck.json();
      console.log('QUOTES table:', quotesData.totalRows || 0, 'rows');
      
      if (quotesData.data) {
        const nfQuotes = quotesData.data.filter(q => 
          JSON.stringify(q).includes('NF-')
        );
        if (nfQuotes.length > 0) {
          console.log(`Found ${nfQuotes.length} quotes with NF- references`);
        }
      }
    }
    
    // Final recommendations
    console.log('\n\n🎯 CONCLUSIONS:\n');
    
    if (searchData.analysis?.recommendations) {
      searchData.analysis.recommendations.forEach(rec => {
        console.log(`• ${rec}`);
      });
    }
    
    // Add custom recommendations based on findings
    if (tablesWithData.length === 0) {
      console.log('\n⚠️  WARNING: No tables found with NF- prefixed data!');
      console.log('   This suggests:');
      console.log('   1. The offers might be stored with different reference format');
      console.log('   2. The CRM might be using a different database/schema');
      console.log('   3. The data might be in a view or computed column');
    } else if (!searchData.analysis?.tablesWithSearchResult.includes('offers')) {
      console.log('\n💡 IMPORTANT: The "offers" table exists but doesn\'t contain the searched reference.');
      console.log('   Check if the CRM is using a different table like:', tablesWithData.join(', '));
    }
    
  } catch (error) {
    console.error('❌ Inspection failed:', error);
  }
}

// Run the inspection
inspectDatabase().then(() => {
  console.log('\n✅ Inspection complete!\n');
}).catch(console.error);