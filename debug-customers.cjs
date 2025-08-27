const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Debugging customer loading...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable detailed console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('Failed') || text.includes('customers')) {
      console.log('Browser console:', text);
    }
  });
  
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  // Monitor network
  page.on('response', response => {
    if (response.url().includes('/api/crm/customers')) {
      console.log(`\nAPI Response: ${response.url()}`);
      console.log(`Status: ${response.status()}`);
      response.json().then(data => {
        console.log('Response data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      }).catch(() => {});
    }
  });
  
  try {
    // 1. Quick login with localStorage
    console.log('1. Setting up authentication...');
    await page.goto('http://localhost:3000/crm/login');
    
    await page.evaluate(() => {
      const user = {
        id: '6a8589db-f55a-4e97-bd46-1dfb8b725909',
        email: 'mustafa@nordflytt.se',
        name: 'Mustafa Abdulkarim',
        role: 'admin',
        permissions: ['*']
      };
      localStorage.setItem('crm-user', JSON.stringify(user));
      localStorage.setItem('crm-token', 'mustafa-admin-token');
    });
    
    // 2. Navigate to customers
    console.log('\n2. Navigating to customers page...');
    await page.goto('http://localhost:3000/crm/kunder', { waitUntil: 'networkidle2' });
    
    // 3. Wait and check periodically
    console.log('\n3. Checking page state...');
    
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const state = await page.evaluate(() => {
        const loadingText = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent && el.textContent.includes('Laddar kunder')
        );
        
        const errorText = document.querySelector('[role="alert"], .error, .text-red-500');
        const table = document.querySelector('table');
        const rows = document.querySelectorAll('tbody tr');
        
        // Check localStorage
        const storedCustomers = localStorage.getItem('crm-customers');
        let customerCount = 0;
        if (storedCustomers) {
          try {
            const parsed = JSON.parse(storedCustomers);
            customerCount = parsed.state?.customers?.length || 0;
          } catch (e) {}
        }
        
        return {
          hasLoading: !!loadingText,
          hasError: !!errorText,
          errorText: errorText?.textContent,
          hasTable: !!table,
          rowCount: rows.length,
          storedCustomerCount: customerCount,
          bodyText: document.body.innerText.substring(0, 200)
        };
      });
      
      console.log(`\nAttempt ${i + 1}:`, JSON.stringify(state, null, 2));
      
      if (state.hasTable && state.rowCount > 0) {
        console.log('\n✅ Customers loaded successfully!');
        break;
      }
    }
    
    // 4. Check network tab for errors
    console.log('\n4. Checking for JavaScript errors...');
    const jsErrors = await page.evaluate(() => {
      return window.__errors || [];
    });
    
    if (jsErrors.length > 0) {
      console.log('JavaScript errors found:', jsErrors);
    }
    
    await page.screenshot({ path: 'customers-debug.png', fullPage: true });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  console.log('\n📸 Screenshot saved: customers-debug.png');
  console.log('\n👀 Browser left open for inspection. Check the Console and Network tabs!');
})();