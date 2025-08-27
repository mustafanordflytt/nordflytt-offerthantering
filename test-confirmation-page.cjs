const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Go to confirmation page
    await page.goto('http://localhost:3001/order-confirmation/af14e6dc-23ba-4a14-95e8-8bd06c97bedc', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'confirmation-page-fixed.png', fullPage: true });
    console.log('Screenshot taken: confirmation-page-fixed.png');
    
    // Check for additional services section
    const servicesSection = await page.$('.space-y-3');
    if (servicesSection) {
      console.log('✅ Services section found');
      
      // Check for specific services
      const packingService = await page.$x("//*[contains(text(), 'Packhjälp')]");
      const boxesService = await page.$x("//*[contains(text(), 'Flyttkartonger')]");
      
      if (packingService.length > 0) {
        console.log('✅ Packhjälp service displayed');
      }
      
      if (boxesService.length > 0) {
        console.log('✅ Flyttkartonger service displayed');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await browser.close();
})();