const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Debugging store and API integration...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable ALL console logging
  page.on('console', msg => console.log('Browser:', msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  // Monitor network
  const apiCalls = [];
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      apiCalls.push({
        url: response.url(),
        status: response.status(),
        time: new Date().toISOString()
      });
    }
  });
  
  try {
    // 1. Login directly with API
    console.log('1. Testing direct API call...');
    await page.goto('http://localhost:3000/crm/login');
    
    const apiTest = await page.evaluate(async () => {
      // Set auth token
      localStorage.setItem('crm-token', 'mustafa-admin-token');
      
      // Test API directly
      try {
        const response = await fetch('/api/crm/customers', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mustafa-admin-token'
          }
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        
        return {
          status: response.status,
          success: data.success,
          customerCount: data.customers?.length || 0,
          error: data.error
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('API Test Result:', apiTest);
    
    // 2. Now test the actual page
    console.log('\n2. Testing customer page with store...');
    
    // Login properly
    await page.type('input[type="email"]', 'mustafa@nordflytt.se');
    await page.type('input[type="password"]', 'mustafa123');
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    // Go to customers
    await page.goto('http://localhost:3000/crm/kunder');
    
    // 3. Debug the store state
    console.log('\n3. Checking store state...');
    
    // Wait a bit for React to render
    await page.waitForTimeout(3000);
    
    const storeState = await page.evaluate(() => {
      // Check if store exists
      const storeKeys = Object.keys(localStorage).filter(key => key.includes('crm'));
      
      // Try to access the component state via React DevTools if available
      const reactFiber = document.querySelector('[data-reactroot]')?._reactRootContainer?._internalRoot?.current;
      
      return {
        localStorageKeys: storeKeys,
        hasReactRoot: !!reactFiber,
        // Check if customers are in DOM
        loadingVisible: !!document.querySelector('*:contains("Laddar kunder")'),
        tableVisible: !!document.querySelector('table'),
        bodyHtml: document.body.innerHTML.substring(0, 500)
      };
    });
    
    console.log('Store State:', JSON.stringify(storeState, null, 2));
    
    // 4. Try to manually trigger store update
    console.log('\n4. Manually triggering store update...');
    
    const manualUpdate = await page.evaluate(async () => {
      // Import and call store directly
      try {
        // Check if fetchCustomers is available globally
        const buttons = Array.from(document.querySelectorAll('button'));
        const updateBtn = buttons.find(b => b.textContent?.includes('Uppdatera'));
        if (updateBtn) {
          updateBtn.click();
          return { clicked: true };
        }
        return { clicked: false, buttons: buttons.map(b => b.textContent) };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Manual Update Result:', manualUpdate);
    
    // 5. Wait and check final state
    await page.waitForTimeout(3000);
    
    const finalCheck = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      const cards = document.querySelectorAll('.card');
      const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500');
      
      return {
        tableRows: rows.length,
        cardCount: cards.length,
        hasErrors: errorElements.length > 0,
        errorTexts: Array.from(errorElements).map(el => el.textContent),
        // Check specific elements
        hasLoadingSpinner: !!document.querySelector('.animate-spin'),
        loadingText: document.body.textContent?.includes('Laddar kunder'),
        // Get any visible text
        visibleText: Array.from(document.querySelectorAll('h1, h2, h3, p')).map(el => el.textContent).filter(Boolean).slice(0, 10)
      };
    });
    
    console.log('\n5. Final Check:', JSON.stringify(finalCheck, null, 2));
    console.log('\n6. API Calls Made:', apiCalls);
    
    await page.screenshot({ path: 'store-debug.png', fullPage: true });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  console.log('\n✅ Done! Screenshot saved as store-debug.png');
  console.log('👀 Browser left open. Check Console and Network tabs!');
})();