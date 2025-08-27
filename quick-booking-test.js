const BASE_URL = 'http://localhost:3000';

// Color codes
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const reset = '\x1b[0m';

async function quickBookingTest() {
  console.log(`${blue}🧪 Quick Booking Flow Test${reset}`);
  console.log('============================\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  try {
    // Test 1: Check if booking form is accessible
    console.log(`${yellow}1. Testing booking form accessibility...${reset}`);
    const response = await fetch(`${BASE_URL}/form`);
    if (response.ok) {
      console.log(`${green}✓ Booking form accessible (${response.status})${reset}`);
      results.passed++;
    } else {
      console.log(`${red}✗ Booking form error (${response.status})${reset}`);
      results.failed++;
    }

    // Test 2: Check if Google Maps script loads
    console.log(`\n${yellow}2. Checking Google Maps integration...${reset}`);
    const html = await response.text();
    if (html.includes('maps.googleapis.com')) {
      console.log(`${green}✓ Google Maps script found${reset}`);
      results.passed++;
    } else {
      console.log(`${yellow}⚠ Google Maps script not found in HTML${reset}`);
      results.warnings++;
    }

    // Test 3: Check form components
    console.log(`\n${yellow}3. Checking form components...${reset}`);
    const components = [
      { pattern: 'CustomerType', name: 'Customer type selection' },
      { pattern: 'moving-type-card', name: 'Moving type cards' },
      { pattern: 'next-button', name: 'Navigation buttons' }
    ];

    for (const component of components) {
      if (html.includes(component.pattern)) {
        console.log(`${green}✓ ${component.name} found${reset}`);
        results.passed++;
      } else {
        console.log(`${yellow}⚠ ${component.name} not found${reset}`);
        results.warnings++;
      }
    }

    // Test 4: Check API endpoints
    console.log(`\n${yellow}4. Testing booking API...${reset}`);
    const bookingData = {
      customerType: 'private',
      customerInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '0701234567'
      },
      moveDetails: {
        moveDate: new Date().toISOString().split('T')[0],
        startAddress: 'Testgatan 1, Stockholm',
        endAddress: 'Testgatan 2, Stockholm'
      }
    };

    const apiResponse = await fetch(`${BASE_URL}/api/submit-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log(`${green}✓ Booking API working${reset}`);
      if (data.bookingId) {
        console.log(`${green}✓ Booking ID generated: ${data.bookingId}${reset}`);
        results.passed += 2;
      }
    } else {
      console.log(`${red}✗ Booking API error (${apiResponse.status})${reset}`);
      results.failed++;
    }

    // Test 5: Check Supabase connection
    console.log(`\n${yellow}5. Checking database connection...${reset}`);
    const envCheck = await fetch(`${BASE_URL}/api/check-env`);
    if (envCheck.ok) {
      const envData = await envCheck.json();
      if (envData.summary.supabase) {
        console.log(`${green}✓ Supabase configured${reset}`);
        results.passed++;
      } else {
        console.log(`${red}✗ Supabase not configured${reset}`);
        results.failed++;
      }
    }

  } catch (error) {
    console.error(`${red}✗ Test error: ${error.message}${reset}`);
    results.failed++;
  }

  // Summary
  console.log(`\n${blue}📊 Test Results${reset}`);
  console.log('===============');
  console.log(`${green}✅ Passed: ${results.passed}${reset}`);
  console.log(`${red}❌ Failed: ${results.failed}${reset}`);
  console.log(`${yellow}⚠️  Warnings: ${results.warnings}${reset}`);
  
  const totalTests = results.passed + results.failed;
  const successRate = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;
  console.log(`${blue}📈 Success rate: ${successRate}%${reset}`);

  // Next steps
  console.log(`\n${blue}📝 Next Steps:${reset}`);
  console.log('1. Open http://localhost:3000/form in browser');
  console.log('2. Complete a test booking manually');
  console.log('3. Check if SMS/Email is sent');
  console.log('4. Verify booking in Supabase');
  console.log('5. Test staff app at http://localhost:3000/staff');
}

// Run test
quickBookingTest().catch(console.error);