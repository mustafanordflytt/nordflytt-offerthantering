const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing Google Autocomplete directly in the form...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Enable detailed console logging
  page.on('console', msg => {
    console.log('Browser:', msg.text());
  });
  
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });

  try {
    // Navigate directly to the form
    console.log('📍 Going to http://localhost:3002/form');
    await page.goto('http://localhost:3002/form', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait a bit for everything to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot of the current state
    await page.screenshot({ 
      path: 'form-current-state.png',
      fullPage: false 
    });
    console.log('📸 Screenshot saved: form-current-state.png');
    
    // Check what's on the page
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check for any error messages
    const hasError = await page.$('.text-red-500');
    if (hasError) {
      const errorText = await page.$eval('.text-red-500', el => el.textContent);
      console.log('❌ Error found:', errorText);
    }
    
    // Try to find address inputs by various selectors
    const selectors = [
      'input[placeholder*="adress"]',
      'input[id*="address"]',
      'input[name*="address"]',
      '#startAddress',
      '#endAddress',
      'input[type="text"]'
    ];
    
    for (const selector of selectors) {
      const found = await page.$(selector);
      if (found) {
        console.log(`✅ Found input with selector: ${selector}`);
        const placeholder = await page.$eval(selector, el => el.placeholder);
        console.log(`   Placeholder: ${placeholder}`);
      }
    }
    
    // Get current URL
    const currentUrl = page.url();
    console.log('🔗 Current URL:', currentUrl);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: 'form-error-state.png',
      fullPage: true 
    });
  }
  
  console.log('\n✅ Browser will remain open for manual inspection.');
  console.log('Press Ctrl+C to close.');
})();