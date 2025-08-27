const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing customer detail navigation...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Monitor console
  page.on('console', msg => {
    if (msg.text().includes('Error')) {
      console.log('Browser error:', msg.text());
    }
  });
  
  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/crm/login');
    
    await page.waitForSelector('input[type="email"]');
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
    
    // 3. Get first customer ID
    const firstCustomerId = await page.evaluate(() => {
      const firstRow = document.querySelector('tbody tr');
      return firstRow?.getAttribute('key') || firstRow?.querySelector('a')?.href.split('/').pop();
    });
    
    console.log(`First customer ID: ${firstCustomerId}`);
    
    // 4. Navigate directly to customer detail
    if (firstCustomerId) {
      console.log('\n3. Going to customer detail page...');
      await page.goto(`http://localhost:3000/crm/kunder/${firstCustomerId}`);
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 5. Check page content
      const pageContent = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.querySelector('h1')?.textContent,
          hasError: !!document.querySelector('[role="alert"]'),
          errorText: document.querySelector('[role="alert"]')?.textContent,
          bodyText: document.body.textContent?.substring(0, 500)
        };
      });
      
      console.log('\n4. Page content:', JSON.stringify(pageContent, null, 2));
      
      await page.screenshot({ path: 'customer-detail-simple.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'customer-detail-error.png' });
  }
  
  console.log('\n✅ Done! Check customer-detail-simple.png');
  await browser.close();
})();