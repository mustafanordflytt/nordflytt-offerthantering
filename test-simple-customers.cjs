const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing simple customers page...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('customers') || text.includes('Fetched')) {
      console.log('Console:', text);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/crm/customers')) {
      console.log(`API Response: ${response.status()}`);
    }
  });
  
  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/crm/login');
    
    await page.type('input[type="email"]', 'mustafa@nordflytt.se');
    await page.type('input[type="password"]', 'mustafa123');
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    // 2. Go to customers
    console.log('\n2. Navigating to customers...');
    await page.goto('http://localhost:3000/crm/kunder');
    
    // 3. Wait for content
    console.log('\n3. Waiting for data...');
    
    // Wait for either table or error
    await page.waitForSelector('table, [role="alert"]', { timeout: 10000 });
    
    // 4. Check result
    const result = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      const errorElement = document.querySelector('[role="alert"]');
      const statsCards = document.querySelectorAll('.card');
      
      // Get first few customers
      const customerData = Array.from(rows).slice(0, 3).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          name: cells[0]?.textContent,
          email: cells[1]?.textContent,
          phone: cells[2]?.textContent
        };
      });
      
      return {
        hasError: !!errorElement,
        errorText: errorElement?.textContent,
        customerCount: rows.length,
        statsCardCount: statsCards.length,
        sampleCustomers: customerData,
        pageTitle: document.querySelector('h1')?.textContent
      };
    });
    
    console.log('\n4. Result:', JSON.stringify(result, null, 2));
    
    await page.screenshot({ path: 'simple-customers-result.png', fullPage: true });
    
    // 5. Test adding new customer button
    console.log('\n5. Testing New Customer button...');
    const newCustomerButton = await page.$('a[href="/crm/kunder/new"]');
    if (newCustomerButton) {
      console.log('Found "Ny Kund" button');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'simple-customers-error.png' });
  }
  
  console.log('\n✅ Done! Check simple-customers-result.png');
  await browser.close();
})();