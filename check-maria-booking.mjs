async function checkMariaBooking() {
  console.log('🔍 Checking for Maria Johansson booking in database...\n');
  
  try {
    // Check offers API
    console.log('1️⃣ Checking Offers API...');
    const offersResponse = await fetch('http://localhost:3000/api/offers');
    const offers = await offersResponse.json();
    
    console.log(`Total offers: ${offers.length}`);
    
    // Look for Maria's booking
    const mariaOffers = offers.filter(offer => 
      offer.customer_name?.toLowerCase().includes('maria') ||
      offer.customer_email?.toLowerCase().includes('maria') ||
      offer.quote_number === 'BOOK1001' ||
      offer.reference === 'BOOK1001'
    );
    
    if (mariaOffers.length > 0) {
      console.log('✅ Found Maria\'s offers:');
      mariaOffers.forEach(offer => {
        console.log(`  - ${offer.quote_number}: ${offer.customer_name} (${offer.customer_email})`);
        console.log(`    Status: ${offer.status}, Date: ${offer.move_date}`);
      });
    } else {
      console.log('❌ No offers found for Maria Johansson');
      
      // Show sample of what's in the database
      console.log('\nSample of existing offers:');
      offers.slice(0, 5).forEach(offer => {
        console.log(`  - ${offer.quote_number}: ${offer.customer_name} (${offer.customer_email})`);
      });
    }
    
    // Check leads API
    console.log('\n2️⃣ Checking Leads API...');
    const leadsResponse = await fetch('http://localhost:3000/api/crm/leads');
    const leadsData = await leadsResponse.json();
    
    if (leadsData.leads) {
      console.log(`Total leads: ${leadsData.leads.length}`);
      
      const mariaLeads = leadsData.leads.filter(lead => 
        lead.name?.toLowerCase().includes('maria') ||
        lead.email?.toLowerCase().includes('maria')
      );
      
      if (mariaLeads.length > 0) {
        console.log('✅ Found Maria\'s leads:');
        mariaLeads.forEach(lead => {
          console.log(`  - ${lead.name} (${lead.email})`);
          console.log(`    Status: ${lead.status}, Value: ${lead.estimatedValue}`);
        });
      } else {
        console.log('❌ No leads found for Maria Johansson');
      }
    }
    
    // Check jobs API
    console.log('\n3️⃣ Checking Jobs API...');
    const jobsResponse = await fetch('http://localhost:3000/api/crm/jobs');
    const jobsData = await jobsResponse.json();
    
    if (jobsData.jobs) {
      console.log(`Total jobs: ${jobsData.jobs.length}`);
      
      const mariaJobs = jobsData.jobs.filter(job => 
        job.customerName?.toLowerCase().includes('maria') ||
        job.customerEmail?.toLowerCase().includes('maria') ||
        job.bookingNumber === 'BOOK1001'
      );
      
      if (mariaJobs.length > 0) {
        console.log('✅ Found Maria\'s jobs:');
        mariaJobs.forEach(job => {
          console.log(`  - ${job.bookingNumber}: ${job.customerName} (${job.customerEmail})`);
          console.log(`    Date: ${job.moveDate}, Status: ${job.status}`);
        });
      } else {
        console.log('❌ No jobs found for Maria Johansson');
      }
    }
    
    // Check Supabase directly for bookings
    console.log('\n4️⃣ Checking database directly...');
    const supabaseUrl = 'https://dbevjdoatbsciclkqvqe.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZXZqZG9hdGJzY2ljbGtxdnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ0MjI5MjUsImV4cCI6MjA0MDAwODkyNX0.XBTBdueRWFqn0YHGVvhH5pVEQl_dDJBAb5qY-cs0LHo';
    
    // Check bookings table
    const bookingsResponse = await fetch(`${supabaseUrl}/rest/v1/bookings?select=*&or=(customer_name.ilike.%maria%25,customer_email.ilike.%maria%25,reference.eq.BOOK1001)`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (bookingsResponse.ok) {
      const bookings = await bookingsResponse.json();
      console.log(`Found ${bookings.length} bookings matching 'Maria' or 'BOOK1001'`);
      
      if (bookings.length > 0) {
        console.log('✅ Maria\'s bookings in database:');
        bookings.forEach(booking => {
          console.log(`  - ${booking.reference}: ${booking.customer_name} (${booking.customer_email})`);
          console.log(`    Created: ${booking.created_at}`);
        });
      }
    }
    
    // Check offers table
    const offersDbResponse = await fetch(`${supabaseUrl}/rest/v1/offers?select=*&or=(name.ilike.%maria%25,email.ilike.%maria%25,reference.eq.BOOK1001)`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (offersDbResponse.ok) {
      const offersDb = await offersDbResponse.json();
      console.log(`\nFound ${offersDb.length} offers in database matching 'Maria' or 'BOOK1001'`);
      
      if (offersDb.length > 0) {
        console.log('✅ Maria\'s offers in database:');
        offersDb.forEach(offer => {
          console.log(`  - ${offer.reference}: ${offer.name} (${offer.email})`);
          console.log(`    Created: ${offer.created_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking for Maria\'s booking:', error);
  }
}

checkMariaBooking();