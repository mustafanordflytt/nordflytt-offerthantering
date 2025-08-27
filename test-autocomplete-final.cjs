const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing Google Autocomplete after switching to Places API (New)\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Log relevant console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Google') || text.includes('Places') || text.includes('✅') || text.includes('❌')) {
      console.log('Browser:', text);
    }
  });

  try {
    // Go to form
    console.log('📍 Navigating to form...');
    await page.goto('http://localhost:3002/form', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Quick navigation to Step 4
    console.log('⏭️  Quick navigation to address step...\n');
    
    // Step 1
    const cards = await page.$$('.cursor-pointer');
    if (cards.length > 0) {
      await cards[0].click();
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Step 2
    const cards2 = await page.$$('.cursor-pointer');
    if (cards2.length > 0) {
      await cards2[0].click();
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Click Next buttons
    for (let i = 0; i < 2; i++) {
      const nextBtn = await page.$('button[type="submit"]');
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    // Wait for address inputs to load
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('📍 Now at address input step\n');
    
    // Check API status
    const apiStatus = await page.evaluate(() => ({
      google: !!window.google,
      maps: !!window.google?.maps,
      places: !!window.google?.maps?.places,
      newAPI: !!window.google?.maps?.places?.PlaceAutocompleteElement,
      oldAPI: !!window.google?.maps?.places?.Autocomplete
    }));
    
    console.log('📊 Google Maps API Status:');
    console.log('  - Google loaded:', apiStatus.google ? '✅' : '❌');
    console.log('  - Maps loaded:', apiStatus.maps ? '✅' : '❌');
    console.log('  - Places loaded:', apiStatus.places ? '✅' : '❌');
    console.log('  - PlaceAutocompleteElement (NEW):', apiStatus.newAPI ? '✅ AVAILABLE' : '❌');
    console.log('  - Autocomplete (OLD):', apiStatus.oldAPI ? '⚠️  Deprecated' : '❌');
    
    // Find address inputs
    const addressInputs = await page.$$('input[placeholder*="adress"], input[placeholder*="Sök"]');
    console.log(`\n🔍 Found ${addressInputs.length} address input(s)`);
    
    if (addressInputs.length > 0) {
      // Click and type in first input
      console.log('\n⌨️  Testing autocomplete...');
      await addressInputs[0].click();
      
      // Clear any existing text
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      
      // Type address
      await page.keyboard.type('Kungsgatan Stockholm', { delay: 100 });
      
      console.log('⏳ Waiting for autocomplete dropdown...');
      await new Promise(r => setTimeout(r, 3000));
      
      // Check for dropdown
      const dropdownVisible = await page.evaluate(() => {
        const dropdownSelectors = [
          '.pac-container',
          '[role="listbox"]',
          '.gm-style-pbt',
          'div[class*="autocomplete"]'
        ];
        
        for (const selector of dropdownSelectors) {
          const el = document.querySelector(selector);
          if (el && window.getComputedStyle(el).display !== 'none') {
            return { visible: true, selector };
          }
        }
        return { visible: false };
      });
      
      if (dropdownVisible.visible) {
        console.log(`\n✅ SUCCESS! Autocomplete dropdown is visible (${dropdownVisible.selector})`);
        
        // Get suggestions
        const suggestions = await page.evaluate(() => {
          const items = document.querySelectorAll('.pac-item, [role="option"]');
          return Array.from(items).slice(0, 5).map(el => el.textContent?.trim());
        });
        
        if (suggestions.length > 0) {
          console.log('\n📋 Address suggestions:');
          suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
        }
        
        await page.screenshot({ 
          path: 'autocomplete-working.png',
          fullPage: false 
        });
        console.log('\n📸 Success screenshot saved: autocomplete-working.png');
        
      } else {
        console.log('\n⚠️  No autocomplete dropdown visible');
        
        await page.screenshot({ 
          path: 'autocomplete-not-working.png',
          fullPage: false 
        });
        console.log('📸 Debug screenshot saved: autocomplete-not-working.png');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ 
      path: 'autocomplete-error.png',
      fullPage: true 
    });
  }
  
  console.log('\n✅ Test complete. Browser remains open.');
  console.log('Press Ctrl+C to close.');
})();