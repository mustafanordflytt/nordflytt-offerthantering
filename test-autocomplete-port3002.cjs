const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting autocomplete test on port 3002...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });
  
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });

  try {
    // Test the simple autocomplete page on port 3002
    console.log('📍 Navigating to http://localhost:3002/test-simple-autocomplete');
    await page.goto('http://localhost:3002/test-simple-autocomplete', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);
    
    // Check if page loaded
    const title = await page.$eval('h1', el => el.textContent);
    console.log('✅ Page loaded:', title);
    
    // Find the input field
    const input = await page.$('input[type="text"]');
    if (!input) {
      console.error('❌ Input field not found!');
      return;
    }
    
    console.log('✅ Input field found');
    
    // Type in the input
    console.log('⌨️ Typing "Kung" in the input field...');
    await input.click();
    await page.keyboard.type('Kung', { delay: 100 });
    
    // Wait for autocomplete dropdown
    await page.waitForTimeout(1000);
    
    // Check if dropdown is visible
    const dropdown = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const dropdownDiv = divs.find(div => {
        const style = window.getComputedStyle(div);
        return style.position === 'absolute' && 
               style.zIndex === '1000' &&
               div.children.length > 0;
      });
      
      if (dropdownDiv) {
        return {
          visible: true,
          suggestions: Array.from(dropdownDiv.children).map(child => child.textContent)
        };
      }
      return { visible: false };
    });
    
    if (dropdown.visible) {
      console.log('✅ Dropdown is visible!');
      console.log('📋 Suggestions:', dropdown.suggestions);
      
      // Take a screenshot
      await page.screenshot({ 
        path: 'autocomplete-working-port3002.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: autocomplete-working-port3002.png');
      
      // Click the first suggestion
      const firstSuggestion = await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        const suggestionDiv = divs.find(div => 
          div.textContent && div.textContent.includes('Kungsgatan 1')
        );
        if (suggestionDiv) {
          suggestionDiv.click();
          return true;
        }
        return false;
      });
      
      if (firstSuggestion) {
        console.log('✅ Clicked first suggestion');
        await page.waitForTimeout(1000);
        
        // Check the input value
        const inputValue = await page.$eval('input[type="text"]', el => el.value);
        console.log('📝 Final input value:', inputValue);
      }
    } else {
      console.error('❌ Dropdown not visible!');
      
      // Debug: Check page structure
      const pageStructure = await page.evaluate(() => {
        return {
          inputValue: document.querySelector('input[type="text"]')?.value,
          allDivs: Array.from(document.querySelectorAll('div')).length,
          bodyHTML: document.body.innerHTML.substring(0, 500)
        };
      });
      
      console.log('🔍 Debug info:', pageStructure);
      
      await page.screenshot({ 
        path: 'autocomplete-not-working-port3002.png',
        fullPage: true 
      });
      console.log('📸 Debug screenshot saved: autocomplete-not-working-port3002.png');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: 'error-screenshot-port3002.png',
      fullPage: true 
    });
  }
  
  console.log('\n✅ Test completed. Browser will remain open for manual inspection.');
  console.log('Press Ctrl+C to close.');
})();