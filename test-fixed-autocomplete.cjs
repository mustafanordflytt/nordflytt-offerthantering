const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing fixed Google Autocomplete...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture all console logs
  page.on('console', msg => {
    console.log('Browser:', msg.text());
  });

  try {
    // Navigate to form
    console.log('📍 Navigating to form page...');
    await page.goto('http://localhost:3002/form', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Navigate to Step 4
    console.log('\n⏭️ Navigating to Step 4...');
    
    // Wait for and click through steps
    await new Promise(r => setTimeout(r, 2000));
    
    // Step 1 - Click Privatperson
    const step1 = await page.$('.cursor-pointer');
    if (step1) {
      await step1.click();
      console.log('✅ Step 1: Selected customer type');
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Step 2 - Click Flyttstädning and then Nästa
    const step2Card = await page.$('.cursor-pointer');
    if (step2Card) {
      await step2Card.click();
      console.log('✅ Step 2: Selected service type');
      await new Promise(r => setTimeout(r, 500));
      
      // Click Nästa button
      const nextButton = await page.$('button[type="submit"]');
      if (nextButton) {
        await nextButton.click();
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    // Step 3 - Just click Nästa
    const step3Next = await page.$('button[type="submit"]');
    if (step3Next) {
      await step3Next.click();
      console.log('✅ Step 3: Skipped additional services');
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Now we should be at Step 4
    console.log('\n📍 At Step 4 - Testing address autocomplete...');
    
    // Wait for the status indicator
    await new Promise(r => setTimeout(r, 3000));
    
    // Check for status text
    const statusText = await page.evaluate(() => {
      const greenText = document.querySelector('.text-green-600');
      const amberText = document.querySelector('.text-amber-600');
      
      if (greenText) return greenText.textContent;
      if (amberText) return amberText.textContent;
      return 'No status found';
    });
    
    console.log('📊 Status:', statusText);
    
    // Find the start address input
    const startAddressInput = await page.$('#startAddress');
    if (!startAddressInput) {
      console.error('❌ Start address input not found!');
      return;
    }
    
    console.log('\n🔤 Typing in address field...');
    await startAddressInput.click();
    await startAddressInput.type('Kungsgatan', { delay: 100 });
    
    // Wait for autocomplete
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for Google dropdown
    const hasDropdown = await page.evaluate(() => {
      const pacContainer = document.querySelector('.pac-container');
      if (!pacContainer) return false;
      
      const display = window.getComputedStyle(pacContainer).display;
      const visibility = window.getComputedStyle(pacContainer).visibility;
      
      return display !== 'none' && visibility !== 'hidden';
    });
    
    if (hasDropdown) {
      console.log('✅ Google autocomplete dropdown is visible!');
      
      // Get suggestions
      const suggestions = await page.evaluate(() => {
        const items = document.querySelectorAll('.pac-item');
        return Array.from(items).map(item => item.textContent);
      });
      
      console.log('\n📋 Suggestions found:', suggestions.length);
      suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
      
      // Try to click first suggestion
      const firstSuggestion = await page.$('.pac-item');
      if (firstSuggestion) {
        await firstSuggestion.click();
        console.log('\n✅ Clicked first suggestion');
        
        await new Promise(r => setTimeout(r, 1000));
        
        // Check the input value
        const inputValue = await page.$eval('#startAddress', el => el.value);
        console.log('📝 Selected address:', inputValue);
      }
      
      await page.screenshot({ 
        path: 'autocomplete-fixed-working.png',
        fullPage: false 
      });
      console.log('\n📸 Screenshot saved: autocomplete-fixed-working.png');
    } else {
      console.log('❌ No Google autocomplete dropdown found');
      
      // Debug info
      const debugInfo = await page.evaluate(() => {
        return {
          hasGoogleMaps: !!window.google?.maps?.places,
          inputValue: document.querySelector('#startAddress')?.value,
          pacContainerExists: !!document.querySelector('.pac-container'),
          allDivs: document.querySelectorAll('div').length
        };
      });
      
      console.log('\n🔍 Debug info:', debugInfo);
      
      await page.screenshot({ 
        path: 'autocomplete-fixed-not-working.png',
        fullPage: false 
      });
      console.log('📸 Debug screenshot saved: autocomplete-fixed-not-working.png');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ 
      path: 'error-fixed-test.png',
      fullPage: true 
    });
  }
  
  console.log('\n✅ Test completed. Browser remains open.');
  console.log('Press Ctrl+C to close.');
})();