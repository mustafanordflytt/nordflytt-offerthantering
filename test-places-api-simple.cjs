const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing Google Places API (New) - Simple test\n');
  
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
      console.log('Browser console:', text);
    }
  });

  try {
    // Go to test autocomplete page
    console.log('📍 Creating test page...');
    await page.goto('http://localhost:3002');
    
    // Create a simple test page
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1>Test Google Places API (New)</h1>
          <div id="test-container" style="margin-top: 20px;">
            <p>Loading Google Maps...</p>
          </div>
          <div id="status" style="margin-top: 20px;"></div>
        </div>
      `;
    });
    
    // Wait for Google Maps to load
    console.log('⏳ Waiting for Google Maps...');
    await page.waitForFunction(
      () => window.google?.maps?.places?.PlaceAutocompleteElement,
      { timeout: 30000 }
    );
    
    console.log('✅ Google Maps loaded!');
    
    // Create PlaceAutocompleteElement
    const result = await page.evaluate(() => {
      try {
        const container = document.getElementById('test-container');
        const status = document.getElementById('status');
        
        // Create the new element
        const element = new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: 'se' },
          types: ['address']
        });
        
        // Style it
        element.style.width = '100%';
        element.style.height = '40px';
        element.style.border = '1px solid #d1d5db';
        element.style.borderRadius = '6px';
        element.style.padding = '8px 12px';
        element.style.fontSize = '14px';
        
        // Add placeholder
        const input = element.querySelector('input');
        if (input) {
          input.placeholder = 'Sök adress i Sverige...';
        }
        
        // Add event listener
        element.addEventListener('gmp-placeselect', (event) => {
          const place = event.place;
          if (place?.formattedAddress) {
            status.innerHTML = `<p style="color: green;">✅ Selected: ${place.formattedAddress}</p>`;
          }
        });
        
        // Clear container and add element
        container.innerHTML = '';
        container.appendChild(element);
        
        status.innerHTML = '<p style="color: green;">✅ PlaceAutocompleteElement created successfully!</p>';
        
        return { success: true, hasInput: !!input };
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('📊 Result:', result);
    
    if (result.success) {
      console.log('\n✅ PlaceAutocompleteElement is working!');
      
      // Type in the input
      await new Promise(r => setTimeout(r, 2000));
      
      console.log('⌨️  Typing "Kungsgatan Stockholm"...');
      await page.click('input');
      await page.keyboard.type('Kungsgatan Stockholm', { delay: 100 });
      
      // Wait for dropdown
      await new Promise(r => setTimeout(r, 3000));
      
      // Check for dropdown
      const hasDropdown = await page.evaluate(() => {
        const selectors = [
          '.pac-container',
          '[role="listbox"]',
          '.gm-style-iw',
          'div[class*="autocomplete"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && window.getComputedStyle(element).display !== 'none') {
            return true;
          }
        }
        return false;
      });
      
      if (hasDropdown) {
        console.log('✅ Autocomplete dropdown is visible!');
        
        // Get suggestions
        const suggestions = await page.evaluate(() => {
          const items = document.querySelectorAll('.pac-item, [role="option"]');
          return Array.from(items).slice(0, 5).map(item => item.textContent);
        });
        
        if (suggestions.length > 0) {
          console.log('\n📋 Suggestions:');
          suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
        }
      } else {
        console.log('⚠️  No dropdown visible');
      }
      
      await page.screenshot({ path: 'places-api-new-test-simple.png' });
      console.log('\n📸 Screenshot saved: places-api-new-test-simple.png');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'places-api-new-error.png', fullPage: true });
  }
  
  console.log('\n✅ Test complete. Browser remains open.');
  console.log('Press Ctrl+C to close.');
})();