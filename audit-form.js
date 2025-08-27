import puppeteer from 'puppeteer';

async function auditForm() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  const info = [];
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  // Listen for request failures
  page.on('requestfailed', request => {
    errors.push(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    console.log('🔍 Starting form audit...\n');
    
    // 1. Load the form page
    console.log('📄 Loading form page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Check page title
    const title = await page.title();
    info.push(`Page title: ${title}`);
    
    // 2. Check Step 1 - Customer Type
    console.log('\n🧪 Testing Step 1 - Customer Type...');
    
    // Check if customer type cards exist
    const customerTypeCards = await page.$$('.moving-type-card');
    if (customerTypeCards.length !== 2) {
      warnings.push(`Expected 2 customer type cards, found ${customerTypeCards.length}`);
    }
    
    // Click private customer
    await page.click('.moving-type-card:first-child');
    await new Promise(r => setTimeout(r, 500));
    
    // Try to proceed without filling fields
    await page.click('.next-button');
    await new Promise(r => setTimeout(r, 500));
    
    // Check validation errors
    const nameError = await page.$eval('.text-red-500', el => el.textContent).catch(() => null);
    if (!nameError) {
      errors.push('No validation error shown for empty name field');
    }
    
    // Fill in the form
    await page.type('input[placeholder*="namn"]', 'Test Testsson');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="tel"]', '0701234567');
    
    // Proceed to next step
    await page.click('.next-button');
    await new Promise(r => setTimeout(r, 1000));
    
    // 3. Check Step 2 - Moving Info
    console.log('\n🧪 Testing Step 2 - Moving Info...');
    
    // Check if move type cards exist
    const moveTypeCards = await page.$$('.moving-type-card');
    if (moveTypeCards.length < 3) {
      warnings.push(`Expected at least 3 move type cards, found ${moveTypeCards.length}`);
    }
    
    // Select local move
    await page.click('.moving-type-card:first-child');
    
    // Check for address autocomplete
    const startAddressInput = await page.$('input[placeholder*="Gatuadress"]');
    if (!startAddressInput) {
      errors.push('Start address input not found');
    }
    
    // Check if Google Maps is loaded
    const googleMapsLoaded = await page.evaluate(() => {
      return typeof google !== 'undefined' && google.maps;
    });
    if (!googleMapsLoaded) {
      errors.push('Google Maps API not loaded');
    }
    
    // Fill addresses
    await page.type('input[placeholder*="Gatuadress"]:nth-of-type(1)', 'Kungsgatan 1, Stockholm');
    await page.type('input[placeholder*="Gatuadress"]:nth-of-type(2)', 'Drottninggatan 1, Stockholm');
    
    // Select move size
    await page.click('.moving-type-card:nth-child(2)'); // Medium size
    
    // Check floor selectors
    const floorSelects = await page.$$('select');
    if (floorSelects.length < 2) {
      warnings.push('Floor selectors not found');
    }
    
    // Proceed to next step
    await page.click('.next-button');
    await new Promise(r => setTimeout(r, 1000));
    
    // 4. Check Step 3 - Services
    console.log('\n🧪 Testing Step 3 - Services...');
    
    // Check base price calculation
    const basePrice = await page.$eval('.text-lg.font-semibold', el => el.textContent).catch(() => null);
    if (!basePrice || !basePrice.includes('kr')) {
      errors.push('Base price not displayed correctly');
    }
    
    // Check additional services
    const additionalServices = await page.$$('.border.rounded-md.p-4');
    if (additionalServices.length === 0) {
      errors.push('No additional services found');
    }
    
    // Select a service and check price update
    if (additionalServices.length > 0) {
      await page.click('.border.rounded-md.p-4:first-child');
      await new Promise(r => setTimeout(r, 500));
      
      // Check if total price updated
      const totalPrice = await page.$eval('.text-xl.font-bold', el => el.textContent).catch(() => null);
      if (!totalPrice) {
        errors.push('Total price not updated after selecting service');
      }
    }
    
    // Proceed to next step
    await page.click('.next-button');
    await new Promise(r => setTimeout(r, 1000));
    
    // 5. Check Step 4 - Summary
    console.log('\n🧪 Testing Step 4 - Summary...');
    
    // Check if summary sections exist
    const summaryExists = await page.$('.bg-gray-50.p-4.rounded-md');
    if (!summaryExists) {
      errors.push('Summary section not displayed');
    }
    
    // Check for booking button
    const bookingButton = await page.$('button:has-text("Boka flytthjälp")');
    if (!bookingButton) {
      errors.push('Booking button not found');
    }
    
    // 6. Check responsive design
    console.log('\n📱 Testing responsive design...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(r => setTimeout(r, 500));
    
    // Check if elements are still visible
    const mobileButtonVisible = await page.$('.next-button');
    if (!mobileButtonVisible) {
      warnings.push('Navigation buttons not visible on mobile');
    }
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 500));
    
    // 7. Performance checks
    console.log('\n⚡ Checking performance...');
    const performanceTiming = await page.evaluate(() => {
      const timing = window.performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      };
    });
    
    if (performanceTiming.loadTime > 3000) {
      warnings.push(`Page load time is slow: ${performanceTiming.loadTime}ms`);
    }
    
    // 8. Security checks
    console.log('\n🔒 Checking security...');
    
    // Check for exposed API keys in page source
    const pageSource = await page.content();
    if (pageSource.includes('AIzaSy') || pageSource.includes('sk-')) {
      errors.push('Potential API keys exposed in page source');
    }
    
    // Check HTTPS in production
    const currentURL = page.url();
    info.push(`Current URL: ${currentURL}`);
    
  } catch (error) {
    errors.push(`Test error: ${error.message}`);
  } finally {
    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('📊 AUDIT RESULTS');
    console.log('='.repeat(50));
    
    if (errors.length > 0) {
      console.log('\n❌ KRITISKA PROBLEM:');
      errors.forEach(err => console.log(`  • ${err}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  VARNINGAR:');
      warnings.forEach(warn => console.log(`  • ${warn}`));
    }
    
    if (info.length > 0) {
      console.log('\nℹ️  INFORMATION:');
      info.forEach(i => console.log(`  • ${i}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n✅ Inga problem hittades!');
    }
    
    console.log('\n' + '='.repeat(50));
    
    await browser.close();
  }
}

auditForm();