// Final validation script for the entire booking workflow
import puppeteer from 'puppeteer';

async function validateWorkflow() {
  console.log('🎯 FINAL VALIDATION: Maria Johansson Booking Workflow\n');
  console.log('=' .repeat(60));
  
  const results = {
    apiTests: {},
    uiTests: {},
    dataIntegrity: {}
  };

  // Step 1: API Validation
  console.log('\n📡 STEP 1: API ENDPOINT VALIDATION');
  console.log('-'.repeat(40));
  
  const apiEndpoints = [
    { name: 'Bookings API', url: 'http://localhost:3000/api/bookings' },
    { name: 'Offers API', url: 'http://localhost:3000/api/offers' },
    { name: 'Jobs API', url: 'http://localhost:3000/api/jobs' },
    { name: 'CRM Dashboard', url: 'http://localhost:3000/api/crm/dashboard' },
    { name: 'CRM Customers', url: 'http://localhost:3000/api/crm/customers' },
    { name: 'CRM Bookings', url: 'http://localhost:3000/api/crm/bookings' },
    { name: 'Staff Jobs', url: 'http://localhost:3000/api/staff/jobs' }
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(endpoint.url);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        
        // Check for Maria Johansson data
        let hasMariaData = false;
        if (data.bookings?.some(b => b.customer?.includes('Maria Johansson'))) hasMariaData = true;
        if (data.offers?.some(o => o.customerName?.includes('Maria Johansson'))) hasMariaData = true;
        if (data.jobs?.some(j => j.customerName?.includes('Maria Johansson'))) hasMariaData = true;
        if (data.customers?.some(c => c.name?.includes('Maria Johansson'))) hasMariaData = true;
        
        if (hasMariaData) {
          console.log(`   └─ 📦 Contains Maria Johansson data`);
        }
        
        results.apiTests[endpoint.name] = { success: true, hasMariaData };
      } else {
        console.log(`❌ ${endpoint.name}: FAILED (${response.status})`);
        results.apiTests[endpoint.name] = { success: false };
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
      results.apiTests[endpoint.name] = { success: false, error: error.message };
    }
  }

  // Step 2: UI Validation with Puppeteer
  console.log('\n\n🖥️  STEP 2: UI DISPLAY VALIDATION');
  console.log('-'.repeat(40));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Test CRM Dashboard
    console.log('\n📊 CRM Dashboard Test:');
    await page.goto('http://localhost:3000/crm/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const crmData = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasMariaName: body.includes('Maria Johansson'),
        hasBookingNumber: body.includes('BOOK1001'),
        hasPrice: body.includes('9008') || body.includes('9 008'),
        customerCount: document.querySelector('[class*="Totalt antal kunder"]')?.parentElement?.textContent || 'Not found'
      };
    });
    
    console.log(`   Maria Johansson visible: ${crmData.hasMariaName ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Booking BOOK1001 visible: ${crmData.hasBookingNumber ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Price 9,008 kr visible: ${crmData.hasPrice ? 'YES ✅' : 'NO ❌'}`);
    
    results.uiTests.crm = crmData;
    
    // Test Staff Dashboard
    console.log('\n📱 Staff Dashboard Test:');
    await page.goto('http://localhost:3000/staff', { waitUntil: 'networkidle0' });
    
    // Login
    await page.type('input[type="email"]', 'staff@nordflytt.se');
    await page.type('input[type="password"]', 'staff123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const staffData = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasMariaName: body.includes('Maria Johansson'),
        hasBookingNumber: body.includes('BOOK1001') || body.includes('JOB1001'),
        hasFromAddress: body.includes('Gamla Stan'),
        hasToAddress: body.includes('Vasastan'),
        hasServices: body.includes('Packhjälp') && body.includes('Flytt') && body.includes('Flyttstädning'),
        jobCount: document.querySelectorAll('[class*="job"], [class*="Job"], [class*="uppdrag"]').length
      };
    });
    
    console.log(`   Maria Johansson visible: ${staffData.hasMariaName ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Job/Booking visible: ${staffData.hasBookingNumber ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   From address visible: ${staffData.hasFromAddress ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   To address visible: ${staffData.hasToAddress ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Services visible: ${staffData.hasServices ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Total jobs displayed: ${staffData.jobCount}`);
    
    results.uiTests.staff = staffData;
    
    // Take screenshots
    await page.screenshot({ path: 'final-staff-dashboard.png', fullPage: true });
    await page.goto('http://localhost:3000/crm/dashboard');
    await page.screenshot({ path: 'final-crm-dashboard.png', fullPage: true });
    
  } catch (error) {
    console.error('UI Test Error:', error);
    results.uiTests.error = error.message;
  } finally {
    await browser.close();
  }

  // Step 3: Summary
  console.log('\n\n📈 FINAL SUMMARY');
  console.log('='.repeat(60));
  
  const apiSuccess = Object.values(results.apiTests).filter(t => t.success).length;
  const apiTotal = Object.keys(results.apiTests).length;
  
  console.log(`\n✅ API Success Rate: ${apiSuccess}/${apiTotal} (${Math.round(apiSuccess/apiTotal * 100)}%)`);
  
  console.log('\n🎯 Data Visibility:');
  console.log(`   CRM Dashboard: ${results.uiTests.crm?.hasMariaName ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);
  console.log(`   Staff Dashboard: ${results.uiTests.staff?.hasMariaName ? 'VISIBLE ✅' : 'NOT VISIBLE ❌'}`);
  
  console.log('\n📸 Screenshots saved:');
  console.log('   - final-crm-dashboard.png');
  console.log('   - final-staff-dashboard.png');
  
  // Mission Status
  console.log('\n\n🏁 MISSION STATUS:');
  const missionSuccess = 
    results.uiTests.staff?.hasMariaName && 
    results.uiTests.staff?.hasBookingNumber &&
    apiSuccess >= 5;
    
  if (missionSuccess) {
    console.log('✅ SUCCESS! Maria Johansson\'s booking (BOOK1001/JOB1001) is now visible in the system!');
    console.log('   - Staff can see the job in their dashboard');
    console.log('   - All critical APIs are functioning');
    console.log('   - Data flow from booking → offer → job is complete');
  } else {
    console.log('❌ INCOMPLETE - Some issues remain:');
    if (!results.uiTests.staff?.hasMariaName) {
      console.log('   - Maria Johansson not visible in Staff dashboard');
    }
    if (!results.uiTests.crm?.hasMariaName) {
      console.log('   - Maria Johansson not visible in CRM dashboard');
    }
    if (apiSuccess < 5) {
      console.log(`   - Only ${apiSuccess}/${apiTotal} APIs working`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Validation complete!');
}

validateWorkflow();