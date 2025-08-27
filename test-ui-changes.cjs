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
    await page.screenshot({ path: 'confirmation-ui-improved.png', fullPage: true });
    console.log('Screenshot taken: confirmation-ui-improved.png');
    
    // Check for the improved text
    const improvedText = await page.$x("//*[contains(text(), 'Du kan lägga till dessa tjänster')]");
    if (improvedText.length > 0) {
      console.log('✅ Förklarande text finns');
    }
    
    // Check that duplicate total is removed
    const totalText = await page.$x("//*[contains(text(), 'Totalt tilläggstjänster:')]");
    if (totalText.length === 0) {
      console.log('✅ Dubbel summering borttagen');
    }
    
    // Check for improved service descriptions
    const packingDesc = await page.$x("//*[contains(text(), 'Vi packar dina ägodelar professionellt')]");
    const cleaningDesc = await page.$x("//*[contains(text(), 'Professionell slutstädning')]");
    
    if (packingDesc.length > 0) {
      console.log('✅ Förbättrad beskrivning för packning');
    }
    
    if (cleaningDesc.length > 0) {
      console.log('✅ Förbättrad beskrivning för flyttstädning');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await browser.close();
})();