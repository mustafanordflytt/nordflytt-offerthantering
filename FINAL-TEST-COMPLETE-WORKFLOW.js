import puppeteer from 'puppeteer';

// FINAL TEST - Complete workflow with Maria Johansson
async function finalTestCompleteWorkflow() {
  console.log('🎯 FINAL TEST - COMPLETE DATABASE WORKFLOW\n');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    const results = {
      booking: {},
      offers: {},
      leads: {},
      calendar: {},
      staff: {},
      apis: {}
    };
    
    // Step 1: Create a fresh booking
    console.log('📝 STEP 1: Creating fresh booking for Maria Johansson...');
    
    const bookingData = {
      name: 'Maria Johansson Final Test',
      email: 'maria.final@example.com',
      phone: '+46 70 999 88 77',
      customerType: 'private',
      serviceType: 'moving',
      serviceTypes: ['Packhjälp', 'Flytt', 'Flyttstädning'],
      moveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      moveTime: '10:00',
      startAddress: 'Gamla Stan, Stockholm',
      endAddress: 'Vasastan, Stockholm',
      startFloor: '4',
      endFloor: '2',
      startElevator: 'none',
      endElevator: 'big',
      startParkingDistance: '30',
      endParkingDistance: '5',
      startLivingArea: '75',
      endLivingArea: '75',
      startPropertyType: 'apartment',
      endPropertyType: 'apartment',
      calculatedDistance: '4.5',
      packingService: 'Packhjälp delvis',
      cleaningService: 'Grundstädning',
      specialInstructions: 'Final test - Antika möbler',
      paymentMethod: 'invoice',
      estimatedVolume: 30
    };
    
    const bookingResponse = await fetch('http://localhost:3000/api/submit-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    
    results.booking = await bookingResponse.json();
    console.log('Booking result:', {
      success: results.booking.success,
      bookingId: results.booking.bookingId,
      database: results.booking.database
    });
    
    // Wait for data to propagate
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Check Offers page
    console.log('\n📊 STEP 2: Checking Offers page...');
    await page.goto('http://localhost:3000/crm/offerter', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check API first
    const offersApi = await page.evaluate(async () => {
      const response = await fetch('/api/offers');
      const data = await response.json();
      const mariaOffers = data.offers?.filter(o => 
        o.customerEmail?.includes('maria.final@example.com') ||
        o.customerName?.includes('Maria Johansson Final')
      );
      return {
        total: data.offers?.length || 0,
        mariaCount: mariaOffers?.length || 0,
        firstMaria: mariaOffers?.[0]
      };
    });
    
    results.apis.offers = offersApi;
    
    // Check page content
    results.offers = await page.evaluate(() => {
      const body = document.body.textContent || '';
      const rows = document.querySelectorAll('table tbody tr');
      const hasInTable = Array.from(rows).some(row => 
        row.textContent?.includes('Maria Johansson Final')
      );
      return {
        hasMaria: body.includes('Maria Johansson Final'),
        hasEmail: body.includes('maria.final@example.com'),
        hasInTable: hasInTable,
        rowCount: rows.length
      };
    });
    
    await page.screenshot({ path: 'final-test-offers.png' });
    
    // Step 3: Check Leads page
    console.log('\n📋 STEP 3: Checking Leads page...');
    await page.goto('http://localhost:3000/crm/leads', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    results.leads = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasMaria: body.includes('Maria Johansson Final') || body.includes('maria.final@example.com'),
        hasWebsiteSource: body.includes('website')
      };
    });
    
    await page.screenshot({ path: 'final-test-leads.png' });
    
    // Step 4: Check Calendar
    console.log('\n📅 STEP 4: Checking Calendar...');
    await page.goto('http://localhost:3000/crm/kalender', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    results.calendar = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasMaria: body.includes('Maria Johansson Final') || body.includes('maria.final@example.com'),
        hasAddress: body.includes('Gamla Stan') || body.includes('Vasastan')
      };
    });
    
    await page.screenshot({ path: 'final-test-calendar.png' });
    
    // Step 5: Check Staff App
    console.log('\n📱 STEP 5: Checking Staff App...');
    await page.goto('http://localhost:3000/staff', { waitUntil: 'networkidle0' });
    
    // Login
    await page.type('input[type="email"]', 'staff@nordflytt.se');
    await page.type('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    results.staff = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasMaria: body.includes('Maria Johansson Final'),
        hasServices: body.includes('Packhjälp') && body.includes('Flytt'),
        hasAddress: body.includes('Gamla Stan') || body.includes('Vasastan')
      };
    });
    
    await page.screenshot({ path: 'final-test-staff.png' });
    
    // Final Summary
    console.log('\n\n🏆 FINAL TEST RESULTS');
    console.log('=' .repeat(60));
    
    console.log('\n📊 Database Integration:');
    console.log(`Booking saved: ${results.booking.bookingId ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Database flag: ${results.booking.database ? 'TRUE ✅' : 'FALSE ❌'}`);
    
    console.log('\n📈 CRM Visibility:');
    console.log(`Offers page: ${results.offers.hasMaria ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);
    console.log(`  - In API: ${results.apis.offers.mariaCount > 0 ? `YES (${results.apis.offers.mariaCount})` : 'NO'}`);
    console.log(`  - In table: ${results.offers.hasInTable ? 'YES' : 'NO'}`);
    console.log(`Leads page: ${results.leads.hasMaria ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);
    console.log(`Calendar: ${results.calendar.hasMaria ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);
    console.log(`Staff app: ${results.staff.hasMaria ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);
    
    const successCount = [
      results.booking.bookingId,
      results.booking.database,
      results.offers.hasMaria,
      results.leads.hasMaria,
      results.calendar.hasMaria,
      results.staff.hasMaria
    ].filter(Boolean).length;
    
    console.log(`\n🎯 Overall Score: ${successCount}/6`);
    
    if (successCount === 6) {
      console.log('\n🎉 PERFECT! Complete database integration working!');
      console.log('   ✅ Booking saves to database');
      console.log('   ✅ Data visible in all CRM pages');
      console.log('   ✅ Staff can see assignments');
      console.log('   ✅ Ready for production!');
    } else {
      console.log('\n⚠️  Some components still need work');
      console.log('   See screenshots for details');
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('   - final-test-offers.png');
    console.log('   - final-test-leads.png');
    console.log('   - final-test-calendar.png');
    console.log('   - final-test-staff.png');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

finalTestCompleteWorkflow();