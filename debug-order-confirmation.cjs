const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Debugging order confirmation page...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: true
    });
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
    });
    
    // Log errors
    page.on('pageerror', error => {
      console.log('[BROWSER ERROR]', error.message);
    });
    
    // Navigate directly to order confirmation page
    const testOrderId = '7a34f656-c868-4c9c-96fa-9dc3242e3c7c';
    console.log(`📱 Navigating to order confirmation page: ${testOrderId}`);
    await page.goto(`http://localhost:3000/order-confirmation/${testOrderId}`, {
      waitUntil: 'networkidle0'
    });
    
    // Wait a bit to see console output
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-order-confirmation.png' });
    console.log('📸 Screenshot saved');
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser is open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep running
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
})();