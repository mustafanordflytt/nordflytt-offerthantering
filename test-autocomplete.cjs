const puppeteer = require('puppeteer');

async function testAutocomplete() {
  console.log('🧪 Testing Google Autocomplete in Offer Form\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Google') || text.includes('autocomplete') || text.includes('Maps')) {
      console.log('Browser console:', text);
    }
  });
  
  try {
    // Navigate to the form
    console.log('1️⃣ Navigating to form...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if Google Maps is loaded
    const googleMapsLoaded = await page.evaluate(() => {
      return {
        google: typeof window.google !== 'undefined',
        maps: typeof window.google?.maps !== 'undefined',
        places: typeof window.google?.maps?.places !== 'undefined'
      };
    });
    
    console.log('📊 Google Maps status:', googleMapsLoaded);
    
    // Navigate through the form to Step 4
    console.log('\n2️⃣ Navigating to address step...');
    
    // Step 1: Choose customer type (Private)
    await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const privateLabel = labels.find(label => label.textContent?.includes('Privat'));
      if (privateLabel) privateLabel.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 2: Fill contact info
    const hasNameField = await page.$('input[name="name"]');
    if (hasNameField) {
      await page.type('input[name="name"]', 'Test User');
      await page.type('input[type="email"], input[name="email"]', 'test@example.com');
      await page.type('input[type="tel"], input[name="phone"]', '0701234567');
      
      // Click next
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => btn.textContent?.includes('Nästa'));
        if (nextBtn) nextBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Step 3: Choose service (Moving)
    const hasServiceButtons = await page.$('button[data-service="moving"]');
    if (hasServiceButtons) {
      await page.click('button[data-service="moving"]');
      await new Promise(r => setTimeout(r, 500));
      
      // Click next
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => btn.textContent?.includes('Nästa'));
        if (nextBtn) nextBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Step 4: Now we should be at the address step
    console.log('\n3️⃣ Testing autocomplete...');
    
    // Check if we have address inputs
    const startAddressInput = await page.$('input#startAddress');
    const endAddressInput = await page.$('input#endAddress');
    
    if (startAddressInput) {
      console.log('✅ Found address inputs');
      
      // Take screenshot before typing
      await page.screenshot({ path: 'screenshots/autocomplete-1-before.png', fullPage: true });
      
      // Focus and type in start address
      await startAddressInput.click();
      await page.keyboard.type('Kungsgatan ', { delay: 100 });
      
      // Wait for autocomplete dropdown
      await new Promise(r => setTimeout(r, 2000));
      
      // Take screenshot with dropdown
      await page.screenshot({ path: 'screenshots/autocomplete-2-dropdown.png', fullPage: true });
      
      // Check if autocomplete dropdown appeared
      const hasAutocompleteDropdown = await page.evaluate(() => {
        const pacContainers = document.querySelectorAll('.pac-container');
        return pacContainers.length > 0 && Array.from(pacContainers).some(el => el.style.display !== 'none');
      });
      
      console.log(`📍 Autocomplete dropdown visible: ${hasAutocompleteDropdown ? '✅ YES' : '❌ NO'}`);
      
      if (hasAutocompleteDropdown) {
        // Try to select first suggestion
        await page.keyboard.press('ArrowDown');
        await new Promise(r => setTimeout(r, 500));
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 1000));
        
        // Get the selected value
        const selectedAddress = await page.evaluate(() => {
          const input = document.querySelector('input#startAddress');
          return input?.value || '';
        });
        
        console.log(`📍 Selected address: "${selectedAddress}"`);
      }
      
      // Test end address too
      if (endAddressInput) {
        await endAddressInput.click();
        await page.keyboard.type('Drottninggatan ', { delay: 100 });
        await new Promise(r => setTimeout(r, 2000));
        
        const hasEndAutocomplete = await page.evaluate(() => {
          const pacContainers = document.querySelectorAll('.pac-container');
          return pacContainers.length > 0 && Array.from(pacContainers).some(el => el.style.display !== 'none');
        });
        
        console.log(`📍 End address autocomplete: ${hasEndAutocomplete ? '✅ YES' : '❌ NO'}`);
      }
      
      // Final screenshot
      await page.screenshot({ path: 'screenshots/autocomplete-3-final.png', fullPage: true });
      
    } else {
      console.log('❌ Could not find address inputs - not at Step 4');
    }
    
    // Check console for any errors
    const jsErrors = await page.evaluate(() => {
      return window.__errors || [];
    });
    
    if (jsErrors.length > 0) {
      console.log('\n⚠️ JavaScript errors found:');
      jsErrors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('\n✅ Test completed!');
    console.log('\nScreenshots saved:');
    console.log('- screenshots/autocomplete-1-before.png');
    console.log('- screenshots/autocomplete-2-dropdown.png');
    console.log('- screenshots/autocomplete-3-final.png');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'screenshots/autocomplete-error.png', fullPage: true });
  } finally {
    // Inject error tracking
    await page.evaluate(() => {
      window.__errors = [];
      window.addEventListener('error', (e) => {
        window.__errors.push(e.message);
      });
    });
    
    await new Promise(r => setTimeout(r, 5000)); // Keep browser open
    await browser.close();
  }
}

// Run the test
testAutocomplete().catch(console.error);