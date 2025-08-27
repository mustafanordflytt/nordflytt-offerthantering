import puppeteer from 'puppeteer';

async function testBookingFormWithAllServices() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300, // Slower for better visibility
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  
  try {
    console.log('📝 Starting booking form test with all extra services...\n');

    // Navigate to form
    console.log('1. Navigating to booking form...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Step 1 - Customer Type - Use evaluate to click the right element
    console.log('2. Step 1 - Selecting customer type (Privatperson)...');
    await page.evaluate(() => {
      const privateDiv = Array.from(document.querySelectorAll('div')).find(el => 
        el.textContent?.includes('Privatperson') && el.className.includes('cursor-pointer')
      );
      if (privateDiv) privateDiv.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 2 - Contact Info
    console.log('3. Step 2 - Filling contact information...');
    await page.type('input[name="name"]', 'Test Kund');
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="phone"]', '0701234567');
    
    // Click continue button
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 3 - Service Type
    console.log('4. Step 3 - Selecting all three services...');
    
    // Select Flytt
    await page.evaluate(() => {
      const flyttDiv = Array.from(document.querySelectorAll('div')).find(el => 
        el.textContent?.includes('Flytt') && el.textContent?.includes('Transport av dina') && el.className.includes('border')
      );
      if (flyttDiv) flyttDiv.click();
    });
    await new Promise(r => setTimeout(r, 300));
    
    // Select Packning
    await page.evaluate(() => {
      const packDiv = Array.from(document.querySelectorAll('div')).find(el => 
        el.textContent?.includes('Packning') && el.textContent?.includes('Professionell') && el.className.includes('border')
      );
      if (packDiv) packDiv.click();
    });
    await new Promise(r => setTimeout(r, 300));
    
    // Select Städning
    await page.evaluate(() => {
      const cleanDiv = Array.from(document.querySelectorAll('div')).find(el => 
        el.textContent?.includes('Städning') && el.textContent?.includes('Flyttstädning') && el.className.includes('border')
      );
      if (cleanDiv) cleanDiv.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    // Continue
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
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
    
    // Continue
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 5 - Inventory (just continue)
    console.log('6. Step 5 - Skipping inventory...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 6 - EXTRA SERVICES (This is what we're testing!)
    console.log('7. Step 6 - SELECTING ALL EXTRA SERVICES...');
    
    // Select packing service - "Packning & emballering"
    console.log('   - Looking for packing service options...');
    await page.evaluate(() => {
      const packingRadio = Array.from(document.querySelectorAll('input[type="radio"]')).find(input => {
        const label = input.closest('label');
        return label && label.textContent?.includes('Packning & emballering');
      });
      if (packingRadio) {
        console.log('Found packing radio:', packingRadio);
        packingRadio.click();
      }
    });
    await new Promise(r => setTimeout(r, 500));
    
    // Select cleaning service - "Flyttstädning"  
    console.log('   - Looking for cleaning service options...');
    await page.evaluate(() => {
      const cleaningRadio = Array.from(document.querySelectorAll('input[type="radio"]')).find(input => {
        const label = input.closest('label');
        return label && label.textContent?.includes('Flyttstädning') && !label.textContent?.includes('Ingen');
      });
      if (cleaningRadio) {
        console.log('Found cleaning radio:', cleaningRadio);
        cleaningRadio.click();
      }
    });
    await new Promise(r => setTimeout(r, 500));
    
    // Select additional business services (if checkboxes exist)
    console.log('   - Looking for additional services checkboxes...');
    const checkboxCount = await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      let count = 0;
      checkboxes.forEach(checkbox => {
        const label = checkbox.closest('label');
        if (label && (
          label.textContent?.includes('Möbelmontering') ||
          label.textContent?.includes('Upphängning') ||
          label.textContent?.includes('Bortforsling')
        )) {
          checkbox.click();
          count++;
        }
      });
      return count;
    });
    console.log(`   - Selected ${checkboxCount} additional services`);
    
    // Take screenshot of selected services
    await page.screenshot({ 
      path: 'test-step6-extra-services.png',
      fullPage: true 
    });
    console.log('   ✅ Screenshot saved: test-step6-extra-services.png\n');
    
    // Continue
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 7 - Moving Materials
    console.log('8. Step 7 - Adding moving materials...');
    
    // Try to find and fill box inputs
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="number"]');
      if (inputs[0]) inputs[0].value = '10'; // Small boxes
      if (inputs[1]) inputs[1].value = '5';  // Medium boxes
      if (inputs[2]) inputs[2].value = '3';  // Large boxes
    });
    
    // Continue
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Fortsätt')
      );
      if (button) button.click();
    });
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
    console.log('   - Packning & emballering:', summaryContent.includes('Packning & emballering') ? '✅ FOUND' : '❌ MISSING');
    console.log('   - Flyttstädning:', summaryContent.includes('Flyttstädning') ? '✅ FOUND' : '❌ MISSING');
    console.log('   - Möbelmontering:', summaryContent.includes('Möbelmontering') ? '✅ FOUND' : '❌ MISSING');
    console.log('   - Upphängning:', summaryContent.includes('Upphängning') ? '✅ FOUND' : '❌ MISSING');
    console.log('   - Bortforsling:', summaryContent.includes('Bortforsling') ? '✅ FOUND' : '❌ MISSING');
    
    // Submit form
    console.log('\n10. Submitting form...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(el => 
        el.textContent?.includes('Skicka')
      );
      if (button) button.click();
    });
    
    // Wait for response
    await new Promise(r => setTimeout(r, 10000));
    
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
      console.log('   - Packning & emballering:', offerContent.includes('Packning & emballering') ? '✅ FOUND' : '❌ MISSING');
      console.log('   - Flyttstädning:', offerContent.includes('Flyttstädning') ? '✅ FOUND' : '❌ MISSING');
      console.log('   - Möbelmontering:', offerContent.includes('Möbelmontering') ? '✅ FOUND' : '❌ MISSING');
      console.log('   - Upphängning:', offerContent.includes('Upphängning') ? '✅ FOUND' : '❌ MISSING');
      console.log('   - Bortforsling:', offerContent.includes('Bortforsling') ? '✅ FOUND' : '❌ MISSING');
      
      // Check price breakdown
      console.log('\n💰 Checking price display:');
      const priceElements = await page.$$eval('[class*="font-semibold"], [class*="font-bold"]', elements => 
        elements.map(el => el.textContent).filter(text => text && text.includes('kr'))
      );
      console.log('   Price elements found:', priceElements);
      
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