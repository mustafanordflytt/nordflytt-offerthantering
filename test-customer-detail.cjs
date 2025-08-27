const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing customer detail page...\n');
  
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
    
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'mustafa@nordflytt.se');
    await page.type('input[type="password"]', 'mustafa123');
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    // 2. Go to customers list
    console.log('\n2. Going to customers list...');
    await page.goto('http://localhost:3000/crm/kunder');
    await page.waitForSelector('table');
    
    // 3. Click on first customer
    console.log('\n3. Clicking on first customer...');
    const firstCustomerLink = await page.$('tbody tr:first-child td:first-child');
    
    if (firstCustomerLink) {
      const customerName = await page.evaluate(el => el.textContent, firstCustomerLink);
      console.log(`Clicking on customer: ${customerName}`);
      
      await Promise.all([
        page.waitForNavigation(),
        firstCustomerLink.click()
      ]);
      
      // 4. Wait for customer detail page
      console.log('\n4. Waiting for customer details...');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      // 5. Check what's displayed
      const pageData = await page.evaluate(() => {
        const title = document.querySelector('h1')?.textContent;
        const hasStats = !!document.querySelector('.grid .card');
        const hasTabs = !!document.querySelector('[role="tablist"]');
        const activeTab = document.querySelector('[role="tab"][aria-selected="true"]')?.textContent;
        
        // Check for customer info
        const customerInfo = {
          email: Array.from(document.querySelectorAll('span')).find(el => el.textContent?.includes('@'))?.textContent,
          phone: Array.from(document.querySelectorAll('span')).find(el => el.textContent?.includes('+46'))?.textContent
        };
        
        // Check for bookings
        const bookingRows = document.querySelectorAll('tbody tr');
        
        return {
          title,
          hasStats,
          hasTabs,
          activeTab,
          customerInfo,
          bookingCount: bookingRows.length,
          url: window.location.href
        };
      });
      
      console.log('\n5. Page data:', JSON.stringify(pageData, null, 2));
      
      // 6. Take screenshot
      await page.screenshot({ path: 'customer-detail-page.png', fullPage: true });
      
      // 7. Try clicking on tabs
      console.log('\n6. Testing tabs...');
      const tabs = await page.$$('[role="tab"]');
      
      for (let i = 0; i < Math.min(tabs.length, 3); i++) {
        const tabText = await page.evaluate(el => el.textContent, tabs[i]);
        console.log(`Clicking tab: ${tabText}`);
        
        await tabs[i].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const tabContent = await page.evaluate(() => {
          const activeContent = document.querySelector('[role="tabpanel"]:not([hidden])');
          return activeContent?.textContent?.substring(0, 100);
        });
        
        console.log(`Tab content preview: ${tabContent}...`);
      }
      
    } else {
      console.log('No customer found to click on');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'customer-detail-error.png' });
  }
  
  console.log('\n✅ Done! Check customer-detail-page.png');
  await browser.close();
})();