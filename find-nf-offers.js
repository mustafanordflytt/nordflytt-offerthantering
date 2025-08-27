const fetch = require('node-fetch');

async function findNFOffers() {
  console.log('\n🔍 SEARCHING FOR NF- OFFERS IN DATABASE\n');
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Step 1: Check the offers API (which actually reads from bookings table)
    console.log('📋 Step 1: Checking /api/offers endpoint...\n');
    
    const offersResponse = await fetch(`${baseUrl}/api/offers`);
    const offersData = await offersResponse.json();
    
    if (Array.isArray(offersData)) {
      console.log(`Found ${offersData.length} offers total`);
      
      // Find all NF- prefixed offers
      const nfOffers = offersData.filter(offer => 
        offer.quote_number?.startsWith('NF-') || 
        offer.reference?.startsWith('NF-')
      );
      
      console.log(`Found ${nfOffers.length} NF- prefixed offers:\n`);
      
      nfOffers.forEach(offer => {
        console.log(`- ${offer.quote_number || offer.reference}`);
        console.log(`  Customer: ${offer.customer_name} (${offer.customer_email})`);
        console.log(`  Date: ${offer.move_date} at ${offer.move_time}`);
        console.log(`  Status: ${offer.status}`);
        console.log(`  Amount: ${offer.total_amount} kr`);
        console.log(`  Created: ${new Date(offer.created_at).toLocaleString()}`);
        console.log('');
      });
      
      // Check for specific offer
      const targetOffer = offersData.find(o => 
        o.quote_number === 'NF-23857BDE' || 
        o.reference === 'NF-23857BDE'
      );
      
      if (targetOffer) {
        console.log('✅ FOUND TARGET OFFER NF-23857BDE:');
        console.log(JSON.stringify(targetOffer, null, 2));
      } else {
        console.log('❌ Target offer NF-23857BDE not found');
      }
    }
    
    // Step 2: Direct database search
    console.log('\n📊 Step 2: Direct database search...\n');
    
    const searchResponse = await fetch(`${baseUrl}/api/debug/find-offer-data?search=NF-23857BDE`);
    const searchData = await searchResponse.json();
    
    if (searchData.analysis) {
      console.log('Database analysis:');
      console.log('- Tables with NF- data:', searchData.analysis.tablesWithNFData.join(', '));
      console.log('- Tables with search result:', searchData.analysis.tablesWithSearchResult.join(', '));
      
      // Show where data was found
      for (const [tableName, info] of Object.entries(searchData.findings)) {
        if (info.searchResultCount > 0) {
          console.log(`\n✅ Found in ${tableName}:`);
          console.log(JSON.stringify(info.searchResults[0], null, 2));
        }
      }
    }
    
    // Step 3: Check bookings table directly
    console.log('\n📋 Step 3: Checking bookings table directly...\n');
    
    const bookingsResponse = await fetch(`${baseUrl}/api/debug/find-offer-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName: 'bookings' })
    });
    
    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      console.log(`Bookings table: ${bookingsData.totalRows} total rows`);
      
      if (bookingsData.referenceColumns) {
        console.log('\nReference columns in bookings table:');
        bookingsData.referenceColumns.forEach(col => {
          if (col.hasNFPrefix) {
            console.log(`✅ ${col.column}: Contains NF- prefixed data`);
            console.log(`   Samples: ${col.sampleValues.join(', ')}`);
          }
        });
      }
    }
    
    console.log('\n🎯 SUMMARY:\n');
    console.log('The CRM UI reads from the /api/offers endpoint');
    console.log('The /api/offers endpoint reads from the "bookings" table');
    console.log('New submissions should be saved to "bookings" table to appear in CRM');
    
  } catch (error) {
    console.error('❌ Search failed:', error);
  }
}

// Run the search
findNFOffers().then(() => {
  console.log('\n✅ Search complete!\n');
}).catch(console.error);