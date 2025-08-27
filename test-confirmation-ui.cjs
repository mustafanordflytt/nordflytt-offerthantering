const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Navigating to confirmation page...');
    await page.goto('http://localhost:3000/order-confirmation/6cb25b02-22e4-4e19-9ea0-9d67870cc9b2', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('✅ Page loaded!');
    
    // Wait for services section
    await page.waitForSelector('h3:has-text("Bokade tjänster")', { timeout: 5000 });
    console.log('✅ Found "Bokade tjänster" section');
    
    // Check for services
    const services = await page.$$eval('.space-y-4 > div', elements => 
      elements.map(el => ({
        name: el.querySelector('p.font-medium')?.textContent,
        price: el.querySelector('span.font-medium')?.textContent
      }))
    );
    
    console.log('📋 Services found:', services);
    
    // Check for optional services (Packning/Flyttstädning)
    const optionalServices = await page.$$eval('div.bg-gray-50.opacity-60', elements => 
      elements.map(el => ({
        name: el.querySelector('p.font-medium')?.textContent,
        status: el.querySelector('p.text-sm.text-gray-500')?.textContent
      }))
    );
    
    console.log('📋 Optional services:', optionalServices);
    
    // Check for additional services section
    const hasAdditionalServices = await page.$('h3:has-text("Tilläggstjänster under uppdraget")');
    console.log('📋 Additional services section exists:', !!hasAdditionalServices);
    
    // Take screenshot
    await page.screenshot({ path: 'confirmation-ui-test.png', fullPage: true });
    console.log('📸 Screenshot saved as confirmation-ui-test.png');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'confirmation-ui-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();