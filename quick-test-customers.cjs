const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Quick customer test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Login properly
    await page.goto('http://localhost:3000/crm/login');
    
    // Fill in login form
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'mustafa@nordflytt.se');
    await page.type('input[type="password"]', 'mustafa123');
    
    // Submit
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    // Now go to customers
    await page.goto('http://localhost:3000/crm/kunder');
    
    // Wait for content
    await page.waitForSelector('h1', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Give time for data to load
    
    // Take screenshot
    await page.screenshot({ path: 'customers-quick-test.png', fullPage: true });
    
    // Check what's displayed
    const pageInfo = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent;
      const rows = document.querySelectorAll('tbody tr');
      const firstCustomer = rows[0]?.querySelector('td')?.textContent;
      const hasTable = !!document.querySelector('table');
      const loading = document.body.textContent?.includes('Laddar');
      
      return {
        title,
        hasTable,
        rowCount: rows.length,
        firstCustomer,
        isLoading: loading
      };
    });
    
    console.log('Page info:', JSON.stringify(pageInfo, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n👀 Browser left open for inspection');
})();