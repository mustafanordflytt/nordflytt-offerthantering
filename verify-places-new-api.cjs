const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Verifying Places API (New) is working...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Google') || text.includes('Places') || text.includes('✅') || text.includes('❌')) {
      console.log('Browser:', text);
    }
  });

  try {
    // Go directly to form
    console.log('📍 Navigating to form...');
    await page.goto('http://localhost:3002/form', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Quick navigation to Step 4
    await new Promise(r => setTimeout(r, 2000));
    
    // Click through steps quickly
    await page.click('.cursor-pointer'); // Step 1
    await new Promise(r => setTimeout(r, 1000));
    
    await page.click('.cursor-pointer'); // Step 2
    await new Promise(r => setTimeout(r, 500));
    await page.click('button[type="submit"]'); // Next
    await new Promise(r => setTimeout(r, 1000));
    
    await page.click('button[type="submit"]'); // Step 3 Next
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('\n✅ At Step 4 - Address input page');
    
    // Check API status
    const apiStatus = await page.evaluate(() => {
      return {
        googleLoaded: !!window.google,
        mapsLoaded: !!window.google?.maps,
        placesLoaded: !!window.google?.maps?.places,
        PlaceAutocompleteElement: !!window.google?.maps?.places?.PlaceAutocompleteElement,
        oldAutocomplete: !!window.google?.maps?.places?.Autocomplete
      };
    });
    
    console.log('\n📊 API Status:', apiStatus);
    
    // Check for status message
    const statusText = await page.$eval('.text-green-600', el => el.textContent).catch(() => 'No status');
    console.log('📍 Component status:', statusText);
    
    // Find and interact with address field
    const addressFields = await page.$$('input[placeholder*="adress"], input[placeholder*="Sök"]');
    console.log(`\n🔍 Found ${addressFields.length} address input fields`);
    
    if (addressFields.length > 0) {
      // Click and type in first field
      await addressFields[0].click();
      console.log('⌨️ Typing "Kungsgatan Stockholm"...');
      await page.keyboard.type('Kungsgatan Stockholm', { delay: 100 });
      
      // Wait for dropdown
      await new Promise(r => setTimeout(r, 3000));
      
      // Check for autocomplete dropdown
      const hasDropdown = await page.evaluate(() => {
        // Check for various dropdown selectors
        const selectors = [
          '.pac-container',
          '[role="listbox"]',
          '.gm-style-iw',
          'div[class*="autocomplete"]',
          'div[class*="suggestions"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && window.getComputedStyle(element).display !== 'none') {
            return { found: true, selector };
          }
        }
        
        return { found: false };
      });
      
      if (hasDropdown.found) {
        console.log(`\n✅ SUCCESS! Autocomplete dropdown is visible (${hasDropdown.selector})`);
        
        // Get suggestions
        const suggestions = await page.evaluate(() => {
          const items = document.querySelectorAll('.pac-item, [role="option"]');
          return Array.from(items).slice(0, 5).map(item => item.textContent);
        });
        
        if (suggestions.length > 0) {
          console.log('\n📋 Address suggestions:');
          suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
        }
        
        await page.screenshot({ 
          path: 'places-api-new-working.png',
          fullPage: false 
        });
        console.log('\n📸 Success screenshot: places-api-new-working.png');
      } else {
        console.log('\n⚠️ No dropdown visible yet');
        
        await page.screenshot({ 
          path: 'places-api-new-checking.png',
          fullPage: false 
        });
        console.log('📸 Debug screenshot: places-api-new-checking.png');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ 
      path: 'places-api-new-error.png',
      fullPage: true 
    });
  }
  
  console.log('\n✅ Test complete. Browser remains open.');
  console.log('Press Ctrl+C to close.');
})();