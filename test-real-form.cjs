const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing Google Autocomplete on REAL form (port 3000)\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Log console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Google') || text.includes('Places') || text.includes('✅') || text.includes('❌')) {
      console.log('Browser:', text);
    }
  });

  try {
    // Go to the REAL form on port 3000
    console.log('📍 Going to http://localhost:3000/form...');
    await page.goto('http://localhost:3000/form', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('✅ Page loaded successfully!\n');
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'real-form-initial.png',
      fullPage: false 
    });
    console.log('📸 Initial screenshot: real-form-initial.png\n');
    
    // Navigate to Step 4 (address inputs)
    console.log('⏭️  Navigating to address input step...');
    
    // Step 1 - Click first option (Private customer)
    const cards1 = await page.$$('.cursor-pointer');
    if (cards1.length > 0) {
      await cards1[0].click();
      console.log('✅ Step 1: Selected customer type');
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Step 2 - Click first option (Moving service)
    const cards2 = await page.$$('.cursor-pointer');
    if (cards2.length > 0) {
      await cards2[0].click();
      console.log('✅ Step 2: Selected service type');
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Click Next buttons to get to Step 4
    for (let i = 0; i < 2; i++) {
      const nextBtn = await page.$('button[type="submit"]');
      if (nextBtn) {
        await nextBtn.click();
        console.log(`✅ Clicked Next button ${i+1}`);
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    
    // Wait for Step 4 to load
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('\n📍 Should now be at Step 4 (address inputs)');
    
    // Check Google Maps API status
    const apiStatus = await page.evaluate(() => ({
      google: !!window.google,
      maps: !!window.google?.maps,
      places: !!window.google?.maps?.places,
      newAPI: !!window.google?.maps?.places?.PlaceAutocompleteElement,
      oldAPI: !!window.google?.maps?.places?.Autocomplete
    }));
    
    console.log('\n📊 Google Maps API Status:');
    console.log('  - Google loaded:', apiStatus.google ? '✅' : '❌');
    console.log('  - Maps loaded:', apiStatus.maps ? '✅' : '❌');
    console.log('  - Places loaded:', apiStatus.places ? '✅' : '❌');
    console.log('  - PlaceAutocompleteElement (NEW):', apiStatus.newAPI ? '✅ AVAILABLE' : '❌');
    console.log('  - Autocomplete (OLD):', apiStatus.oldAPI ? '⚠️  Deprecated' : '❌');
    
    // Look for address inputs
    const addressInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const addressInputs = [];
      
      inputs.forEach(input => {
        if (input.placeholder && (
          input.placeholder.toLowerCase().includes('adress') ||
          input.placeholder.toLowerCase().includes('sök')
        )) {
          addressInputs.push({
            placeholder: input.placeholder,
            id: input.id,
            parent: input.parentElement?.className
          });
        }
      });
      
      return addressInputs;
    });
    
    console.log(`\n🔍 Found ${addressInputs.length} address input(s):`, addressInputs);
    
    if (addressInputs.length > 0) {
      // Click and type in first address input
      console.log('\n⌨️  Testing autocomplete in first address field...');
      
      const firstInput = await page.$('input[placeholder*="adress"], input[placeholder*="Sök"]');
      if (firstInput) {
        await firstInput.click();
        
        // Clear field first
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        
        // Type address
        await page.keyboard.type('Kungsgatan 1, Stockholm', { delay: 100 });
        
        console.log('⏳ Waiting for autocomplete dropdown...');
        await new Promise(r => setTimeout(r, 3000));
        
        // Check for dropdown
        const dropdownInfo = await page.evaluate(() => {
          const selectors = ['.pac-container', '[role="listbox"]', '.gm-style-pbt'];
          const found = [];
          
          selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el && window.getComputedStyle(el).display !== 'none') {
                found.push({
                  selector,
                  visible: true,
                  childCount: el.children.length
                });
              }
            });
          });
          
          return found;
        });
        
        if (dropdownInfo.length > 0) {
          console.log('\n✅ SUCCESS! Autocomplete dropdown is visible:', dropdownInfo);
          
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
            path: 'real-form-autocomplete-working.png',
            fullPage: false 
          });
          console.log('\n📸 Success screenshot: real-form-autocomplete-working.png');
          
        } else {
          console.log('\n⚠️  No autocomplete dropdown visible');
          
          await page.screenshot({ 
            path: 'real-form-autocomplete-not-working.png',
            fullPage: false 
          });
          console.log('📸 Debug screenshot: real-form-autocomplete-not-working.png');
        }
      }
    } else {
      console.log('\n❌ No address inputs found on this page');
      
      await page.screenshot({ 
        path: 'real-form-no-inputs.png',
        fullPage: false 
      });
      console.log('📸 Debug screenshot: real-form-no-inputs.png');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ 
      path: 'real-form-error.png',
      fullPage: true 
    });
  }
  
  console.log('\n✅ Test complete. Browser remains open.');
  console.log('Check the screenshots to see the results.');
  console.log('Press Ctrl+C to close.');
})();