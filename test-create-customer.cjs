const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing customer creation...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('Console:', msg.text()));
  
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
    console.log('\n2. Going to customers...');
    await page.goto('http://localhost:3000/crm/kunder');
    await page.waitForSelector('table');
    
    // Count initial customers
    const initialCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log(`Initial customer count: ${initialCount}`);
    
    // 3. Click new customer button
    console.log('\n3. Clicking new customer button...');
    await page.click('a[href="/crm/kunder/new"]');
    await page.waitForNavigation();
    await page.waitForSelector('form');
    
    // 4. Fill form
    console.log('\n4. Filling customer form...');
    await page.waitForSelector('input#name', { timeout: 5000 });
    await page.type('input#name', 'Test Kund AB');
    await page.type('input[id="email"]', 'test@testkund.se');
    await page.type('input[id="phone"]', '+46701234567');
    
    // Select business type
    await page.click('button[role="combobox"]');
    await page.waitForSelector('[role="option"]');
    await page.click('[role="option"][data-value="business"]');
    
    await page.type('input[id="organizationNumber"]', '556677-8899');
    await page.type('input[id="address"]', 'Testgatan 123, 12345 Stockholm');
    await page.type('textarea[id="notes"]', 'Testkund skapad via Puppeteer');
    
    await page.screenshot({ path: 'new-customer-form.png' });
    
    // 5. Submit form
    console.log('\n5. Submitting form...');
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    // 6. Verify we're back on customers page
    await page.waitForSelector('table');
    
    // Count new customers
    const newCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });
    
    console.log(`\n6. New customer count: ${newCount}`);
    console.log(`Customers added: ${newCount - initialCount}`);
    
    // Look for the new customer
    const newCustomer = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const testRow = rows.find(row => row.textContent?.includes('Test Kund AB'));
      return testRow ? testRow.textContent : null;
    });
    
    if (newCustomer) {
      console.log('\n✅ Success! New customer found:', newCustomer.substring(0, 100));
    } else {
      console.log('\n❌ New customer not found in table');
    }
    
    await page.screenshot({ path: 'customers-after-create.png' });
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'create-customer-error.png' });
  }
  
  console.log('\n✅ Done! Check screenshots');
  await browser.close();
})();