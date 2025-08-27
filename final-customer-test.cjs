const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Final customer display test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/crm/login');
    
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'mustafa@nordflytt.se');
    await page.type('input[type="password"]', 'mustafa123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('Login successful');
    
    // 2. Navigate to customers
    console.log('\n2. Going to customers page...');
    await page.goto('http://localhost:3000/crm/kunder', { waitUntil: 'networkidle2' });
    
    // 3. Wait for data to load
    console.log('\n3. Waiting for data...');
    await page.waitForSelector('table', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Take screenshot
    await page.screenshot({ path: 'customers-final-display.png', fullPage: true });
    
    // 5. Check what's displayed
    const pageData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const stats = Array.from(document.querySelectorAll('.card')).map(card => {
        const title = card.querySelector('p')?.textContent;
        const value = card.querySelector('.text-2xl')?.textContent;
        return { title, value };
      });
      
      const firstFiveCustomers = rows.slice(0, 5).map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          name: cells[0]?.textContent?.trim(),
          email: cells[1]?.textContent?.trim(),
          phone: cells[2]?.textContent?.trim()
        };
      });
      
      return {
        totalRows: rows.length,
        stats,
        sampleCustomers: firstFiveCustomers,
        hasUnknown: document.body.textContent?.includes('Unknown')
      };
    });
    
    console.log('\n4. Results:');
    console.log(JSON.stringify(pageData, null, 2));
    
    // 6. Test search functionality
    console.log('\n5. Testing search...');
    await page.type('input[placeholder*="Sök"]', 'mustafa');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const searchResults = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });
    
    console.log(`Search for "mustafa" returned ${searchResults} results`);
    
    await page.screenshot({ path: 'customers-search-test.png', fullPage: true });
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'customers-error.png' });
  }
  
  console.log('\n✅ Done! Check:');
  console.log('- customers-final-display.png');
  console.log('- customers-search-test.png');
  
  await browser.close();
})();