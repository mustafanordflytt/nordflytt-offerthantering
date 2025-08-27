import puppeteer from 'puppeteer';

async function testBookingFormWithAllServices() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100, // Slow down for visibility
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  
  try {
    console.log('📝 Starting booking form test with all extra services...\n');

    // 1. Navigate to form
    console.log('1. Navigating to booking form...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Step 1 - Customer Type - Click on private customer div
    console.log('2. Step 1 - Selecting customer type...');
    // The form uses divs with onClick, not buttons with values
    await page.click('div[class*="cursor-pointer"][class*="border-2"]:has-text("Privatperson")');
    await new Promise(r => setTimeout(r, 1000));

    // Step 2 - Contact Info
    console.log('3. Step 2 - Filling contact information...');
    await page.type('input[name="name"]', 'Test Kund');
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="phone"]', '0701234567');
    
    await page.click('button:has-text("Fortsätt")');
    await new Promise(r => setTimeout(r, 1000));

    // Step 3 - Service Type
    console.log('4. Step 3 - Selecting services...');
    // Click on service cards
    await page.click('div[class*="border-2"]:has-text("Flytt")');
    await page.click('div[class*="border-2"]:has-text("Packning")');
    await page.click('div[class*="border-2"]:has-text("Städning")');
    await new Promise(r => setTimeout(r, 500));
    
    await page.click('button:has-text("Fortsätt")');
    await new Promise(r => setTimeout(r, 1000));

    // Step 4 - Move Details
    console.log('5. Step 4 - Filling move details...');
    
    // Date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.type('input[name="moveDate"]', dateStr);
    await page.type('input[name="moveTime"]', '10:00');
    
    // Start Address
    await page.type('input[name="startAddress"]', 'Drottninggatan 1, Stockholm');
    await page.type('input[name="startLivingArea"]', '85');
    await page.select('select[name="startPropertyType"]', 'apartment');
    await page.select('select[name="startFloor"]', '3');
    await page.select('select[name="startElevator"]', 'normal');
    await page.type('input[name="startParkingDistance"]', '15');
    
    // End Address
    await page.type('input[name="endAddress"]', 'Kungsgatan 10, Stockholm');
    await page.type('input[name="endLivingArea"]', '85');
    await page.select('select[name="endPropertyType"]', 'apartment');
    await page.select('select[name="endFloor"]', '2');
    await page.select('select[name="endElevator"]', 'small');
    await page.type('input[name="endParkingDistance"]', '20');
    
    await page.click('button:has-text("Fortsätt")');
    await new Promise(r => setTimeout(r, 1000));

    // Step 5 - Inventory (just continue)
    console.log('6. Step 5 - Skipping inventory...');
    await page.click('button:has-text("Fortsätt")');
    await new Promise(r => setTimeout(r, 1000));

    // Step 6 - EXTRA SERVICES (This is what we're testing!)
    console.log('7. Step 6 - SELECTING ALL EXTRA SERVICES...');
    
    // Select packing service
    const packingOptions = await page.$$('label:has-text("Packning")');
    if (packingOptions.length > 0) {
      console.log('   - Selecting packing service...');
      await packingOptions[0].click();
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Select cleaning service
    const cleaningOptions = await page.$$('label:has-text("Flyttstädning")');
    if (cleaningOptions.length > 0) {
      console.log('   - Selecting cleaning service...');
      await cleaningOptions[0].click();
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Select additional services (checkboxes for business services)
    console.log('   - Looking for additional services...');
    const additionalServices = [
      'Möbelmontering',
      'Upphängning & installation',
      'Bortforsling & återvinning'
    ];
    
    for (const service of additionalServices) {
      const checkbox = await page.$(`label:has-text("${service}")`);
      if (checkbox) {
        console.log(`   - Selecting ${service}...`);
        await checkbox.click();
        await new Promise(r => setTimeout(r, 200));
      }
    }
    
    // Take screenshot of selected services
    await page.screenshot({ 
      path: 'test-step6-extra-services.png',
      fullPage: true 
    });
    console.log('   ✅ Screenshot saved: test-step6-extra-services.png\n');
    
    await page.click('button:has-text("Fortsätt")');
    await new Promise(r => setTimeout(r, 1000));

    // Step 7 - Moving Materials
    console.log('8. Step 7 - Adding moving materials...');
    
    // Add some boxes
    const smallBoxInput = await page.$('input[name="smallBoxes"]');
    const mediumBoxInput = await page.$('input[name="mediumBoxes"]');
    const largeBoxInput = await page.$('input[name="largeBoxes"]');
    
    if (smallBoxInput) await smallBoxInput.type('10');
    if (mediumBoxInput) await mediumBoxInput.type('5');
    if (largeBoxInput) await largeBoxInput.type('3');
    
    await page.click('button:has-text("Fortsätt")');
    await new Promise(r => setTimeout(r, 1000));

    // Step 8 - Summary
    console.log('9. Step 8 - Review summary...');
    
    // Take screenshot of summary
    await page.screenshot({ 
      path: 'test-step8-summary.png',
      fullPage: true 
    });
    console.log('   ✅ Screenshot saved: test-step8-summary.png');
    
    // Look for extra services in summary
    const summaryContent = await page.content();
    console.log('\n📊 Checking if extra services appear in summary:');
    console.log('   - Packning & emballering:', summaryContent.includes('Packning') ? '✅ FOUND' : '❌ MISSING');
    console.log('   - Flyttstädning:', summaryContent.includes('Flyttstädning') ? '✅ FOUND' : '❌ MISSING');
    console.log('   - Möbelmontering:', summaryContent.includes('Möbelmontering') ? '✅ FOUND' : '❌ MISSING');
    console.log('   - Upphängning:', summaryContent.includes('Upphängning') ? '✅ FOUND' : '❌ MISSING');
    
    // Submit form
    console.log('\n10. Submitting form...');
    await page.click('button:has-text("Skicka bokning")');
    
    // Wait for response (might redirect to offer page)
    await new Promise(r => setTimeout(r, 5000));
    
    // Check where we ended up
    const currentUrl = page.url();
    console.log('\n📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/offer/')) {
      console.log('✅ Successfully reached offer page!');
      
      // Wait for content to load
      await new Promise(r => setTimeout(r, 3000));
      
      // Take screenshot of offer page
      await page.screenshot({ 
        path: 'test-offer-page-with-services.png',
        fullPage: true 
      });
      console.log('   ✅ Screenshot saved: test-offer-page-with-services.png');
      
      // Check offer content
      const offerContent = await page.content();
      console.log('\n📊 Checking if extra services appear in offer:');
      console.log('   - Packning & emballering:', offerContent.includes('Packning') ? '✅ FOUND' : '❌ MISSING');
      console.log('   - Flyttstädning:', offerContent.includes('Flyttstädning') ? '✅ FOUND' : '❌ MISSING');
      console.log('   - Möbelmontering:', offerContent.includes('Möbelmontering') ? '✅ FOUND' : '❌ MISSING');
      console.log('   - Upphängning:', offerContent.includes('Upphängning') ? '✅ FOUND' : '❌ MISSING');
      
      // Check price breakdown
      console.log('\n💰 Checking price display:');
      const priceElements = await page.$$eval('.font-semibold', elements => 
        elements.map(el => el.textContent)
      );
      console.log('   Price elements found:', priceElements.filter(p => p && p.includes('kr')));
      
    } else if (currentUrl.includes('/order-confirmation/')) {
      console.log('✅ Reached confirmation page!');
      await page.screenshot({ 
        path: 'test-confirmation-page.png',
        fullPage: true 
      });
    } else {
      console.log('❌ Unexpected page. Current URL:', currentUrl);
      await page.screenshot({ 
        path: 'test-unexpected-page.png',
        fullPage: true 
      });
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'test-error-screenshot.png' });
  }

  console.log('\n✅ Test completed! Check the screenshots:');
  console.log('   - test-step6-extra-services.png');
  console.log('   - test-step8-summary.png');
  console.log('   - test-offer-page-with-services.png');
  
  // Keep browser open for manual inspection
  console.log('\n🔍 Browser will stay open for manual inspection...');
  console.log('   Close the browser window when done.');
}

// Run the test
testBookingFormWithAllServices().catch(console.error);