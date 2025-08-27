const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing NEW Google PlaceAutocompleteElement API...\n');
  
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

  page.on('pageerror', error => {
    console.error('Page error:', error.message);
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
    
    // Wait for page to load
    await new Promise(r => setTimeout(r, 2000));
    
    // Step 1 - Click first option
    const step1 = await page.$('.cursor-pointer');
    if (step1) {
      await step1.click();
      console.log('✅ Step 1: Selected customer type');
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Step 2 - Click first option and next
    const step2Card = await page.$('.cursor-pointer');
    if (step2Card) {
      await step2Card.click();
      console.log('✅ Step 2: Selected service type');
      await new Promise(r => setTimeout(r, 500));
      
      const nextButton = await page.$('button[type="submit"]');
      if (nextButton) {
        await nextButton.click();
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    // Step 3 - Just click next
    const step3Next = await page.$('button[type="submit"]');
    if (step3Next) {
      await step3Next.click();
      console.log('✅ Step 3: Skipped additional services');
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Now we should be at Step 4
    console.log('\n📍 At Step 4 - Testing NEW PlaceAutocompleteElement...');
    
    // Wait for Google to load
    await new Promise(r => setTimeout(r, 5000));
    
    // Check status text
    const statusText = await page.evaluate(() => {
      const statusElements = document.querySelectorAll('.text-green-600, .text-amber-600');
      return Array.from(statusElements).map(el => el.textContent).join(' | ');
    });
    
    console.log('📊 Status:', statusText);
    
    // Check if PlaceAutocompleteElement exists
    const hasNewElement = await page.evaluate(() => {
      return !!window.google?.maps?.places?.PlaceAutocompleteElement;
    });
    
    console.log('🔍 PlaceAutocompleteElement available:', hasNewElement ? 'YES' : 'NO');
    
    // Look for the Google-generated input
    const googleInputs = await page.evaluate(() => {
      const allInputs = document.querySelectorAll('input');
      const googleInputs = [];
      
      allInputs.forEach(input => {
        if (input.placeholder && (
          input.placeholder.includes('adress') || 
          input.placeholder.includes('address') ||
          input.placeholder.includes('Sök')
        )) {
          googleInputs.push({
            id: input.id,
            placeholder: input.placeholder,
            parent: input.parentElement?.className,
            value: input.value
          });
        }
      });
      
      return googleInputs;
    });
    
    console.log('\n🔍 Found inputs:', googleInputs);
    
    // Try to type in the first address input
    if (googleInputs.length > 0) {
      // Focus and type in the input
      const firstInput = await page.$('input[placeholder*="adress"]') || await page.$('input[placeholder*="Sök"]');
      
      if (firstInput) {
        console.log('\n⌨️ Typing in address field...');
        await firstInput.click();
        await firstInput.type('Kungsgatan', { delay: 100 });
        
        // Wait for autocomplete
        await new Promise(r => setTimeout(r, 3000));
        
        // Check for Google dropdown (new style)
        const hasDropdown = await page.evaluate(() => {
          // Look for the new dropdown structure
          const dropdowns = document.querySelectorAll('[role="listbox"], .pac-container, .gm-style-pbt');
          return dropdowns.length > 0;
        });
        
        console.log('📊 Dropdown visible:', hasDropdown ? 'YES' : 'NO');
        
        // Take screenshot
        await page.screenshot({ 
          path: 'new-google-api-test.png',
          fullPage: false 
        });
        console.log('\n📸 Screenshot saved: new-google-api-test.png');
      }
    }
    
    // Debug: Check what Google APIs are loaded
    const googleAPIs = await page.evaluate(() => {
      if (!window.google) return 'Google not loaded';
      
      return {
        maps: !!window.google.maps,
        places: !!window.google.maps?.places,
        Autocomplete: !!window.google.maps?.places?.Autocomplete,
        PlaceAutocompleteElement: !!window.google.maps?.places?.PlaceAutocompleteElement,
        PlacesService: !!window.google.maps?.places?.PlacesService
      };
    });
    
    console.log('\n🔍 Google APIs loaded:', googleAPIs);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ 
      path: 'error-new-api-test.png',
      fullPage: true 
    });
  }
  
  console.log('\n✅ Test completed. Browser remains open.');
  console.log('Press Ctrl+C to close.');
})();