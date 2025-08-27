const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Manual form test...');
    
    // Go to staff page
    await page.goto('http://localhost:3000/crm/anstallda');
    await page.waitForSelector('h1');
    
    // Go to new employee form
    await page.click('a[href="/crm/anstallda/new"]');
    await page.waitForSelector('form');
    console.log('✅ Form loaded');
    
    // Fill out form
    await page.type('input#name', 'Manual Test Person');
    await page.type('input#email', 'manual.test@nordflytt.se');
    await page.type('input#phone', '+46 70 555 44 33');
    await page.type('input#department', 'Manual Test Dept');
    await page.type('input#hireDate', '2024-01-15');
    
    console.log('✅ Form filled');
    
    // Submit without selecting role (should work now)
    await page.click('button[type="submit"]');
    console.log('✅ Form submitted');
    
    // Wait for redirect
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Redirected to staff page');
    
    // Check if new employee appears
    const found = await page.evaluate(() => {
      return document.body.textContent.includes('Manual Test Person');
    });
    
    console.log(found ? '✅ SUCCESS: Employee found in list!' : '❌ Employee not found');
    
    await page.screenshot({ path: 'manual-test-result.png' });
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'manual-test-error.png' });
  } finally {
    await browser.close();
  }
})();