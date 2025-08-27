const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing employee creation API...');
    
    // Test API directly first
    await page.goto('http://localhost:3000/crm/anstallda');
    await page.waitForSelector('h1');
    console.log('✅ Staff page loaded');
    
    // Test creating employee via API
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'API Test Person',
          email: 'api.test@nordflytt.se',
          phone: '+46 70 111 22 33',
          role: 'mover',
          department: 'Test',
          hireDate: '2024-01-15'
        })
      });
      return await response.json();
    });
    
    console.log('📝 API Response:', result);
    
    // Refresh page and check if new employee appears
    await page.reload();
    await page.waitForSelector('tbody');
    
    const hasNewEmployee = await page.evaluate(() => {
      return document.body.textContent.includes('API Test Person');
    });
    
    console.log(hasNewEmployee ? '✅ New employee found in list!' : '❌ New employee not found');
    
    await page.screenshot({ path: 'api-test-result.png' });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();