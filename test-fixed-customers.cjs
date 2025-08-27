const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing fixed customer display...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
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
    
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 });
    
    // 3. Check customer data
    console.log('\n3. Checking customer data...');
    
    const customerData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const firstFive = rows.slice(0, 5).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          name: cells[0]?.textContent?.trim(),
          email: cells[1]?.textContent?.trim(),
          phone: cells[2]?.textContent?.trim(),
          type: cells[3]?.textContent?.trim()
        };
      });
      
      return {
        totalRows: rows.length,
        hasUnknown: rows.some(row => row.textContent?.includes('Unknown')),
        sampleCustomers: firstFive
      };
    });
    
    console.log('Results:', JSON.stringify(customerData, null, 2));
    
    // 4. Test search
    console.log('\n4. Testing search...');
    await page.type('input[placeholder*="Sök"]', 'Mustafa');
    await page.waitForTimeout(1000);
    
    const searchResults = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return {
        rowCount: rows.length,
        firstResult: rows[0]?.querySelector('td')?.textContent
      };
    });
    
    console.log('Search results:', searchResults);
    
    await page.screenshot({ path: 'customers-fixed.png', fullPage: true });
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'customers-fixed-error.png' });
  }
  
  console.log('\n✅ Done! Check customers-fixed.png');
  await browser.close();
})();