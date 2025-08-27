const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Testing order confirmation page refresh issue...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Navigate directly to order confirmation page with test ID
    const testOrderId = '7a34f656-c868-4c9c-96fa-9dc3242e3c7c';
    console.log(`📱 Navigating to order confirmation page: ${testOrderId}`);
    await page.goto(`http://localhost:3000/order-confirmation/${testOrderId}`);
    
    // Monitor for page refreshes
    console.log('👀 Monitoring for page refreshes for 10 seconds...');
    
    let refreshCount = 0;
    let navigationCount = 0;
    
    // Monitor navigation events
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationCount++;
        console.log(`🔄 Navigation detected! Count: ${navigationCount}`);
      }
    });
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/order-confirmation/')) {
        refreshCount++;
        console.log(`📡 Network request to order-confirmation! Count: ${refreshCount}`);
      }
    });
    
    // Also monitor console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('OrderConfirmationPage component loaded')) {
        console.log('📋 Component mounted/re-rendered');
      }
      if (text.includes('Error fetching order')) {
        console.log('❌ Error fetching order detected');
      }
    });
    
    // Wait 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log(`\n📊 Results:`);
    console.log(`- Navigation events: ${navigationCount}`);
    console.log(`- Network requests to page: ${refreshCount}`);
    
    if (navigationCount > 1 || refreshCount > 2) {
      console.error(`\n❌ Page is refreshing constantly - BUG STILL EXISTS!`);
    } else {
      console.log(`\n✅ Page is not refreshing constantly - Bug appears to be fixed!`);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'order-confirmation-test-simple.png' });
    console.log('📸 Screenshot saved as order-confirmation-test-simple.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();