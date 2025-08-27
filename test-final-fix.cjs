const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Final test of order confirmation fix...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    let navigationCount = 0;
    let fetchOrderCount = 0;
    
    // Monitor console logs for our specific fetch
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Försöker hämta offert med ID:')) {
        fetchOrderCount++;
        console.log(`📊 Fetch order attempt #${fetchOrderCount}`);
      }
    });
    
    // Monitor actual page navigations (not internal React re-renders)
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationCount++;
        console.log(`🔄 Page navigation #${navigationCount}`);
      }
    });
    
    // Navigate to order confirmation page
    console.log('📱 Navigating to order confirmation page...');
    const testOrderId = '7a34f656-c868-4c9c-96fa-9dc3242e3c7c';
    await page.goto(`http://localhost:3000/order-confirmation/${testOrderId}`);
    
    // Initial wait
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Monitor for 8 more seconds
    console.log('⏳ Monitoring for 8 seconds...');
    
    const startTime = Date.now();
    while (Date.now() - startTime < 8000) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check current URL
      const currentUrl = page.url();
      if (!currentUrl.includes('/order-confirmation/')) {
        console.log('⚠️ Page navigated away from order confirmation');
      }
    }
    
    console.log('\n📊 Final Results:');
    console.log(`- Page navigations: ${navigationCount}`);
    console.log(`- Fetch order calls: ${fetchOrderCount}`);
    
    // In React StrictMode, we expect up to 2 fetch calls on initial load
    if (navigationCount === 1 && fetchOrderCount <= 2) {
      console.log('\n✅ SUCCESS: Order confirmation page is stable!');
      console.log('The page loaded once and fetched data appropriately.');
      console.log('(Note: 2 fetch calls in dev mode is normal due to React StrictMode)');
    } else if (navigationCount > 1) {
      console.log('\n❌ ISSUE: Page is navigating/refreshing!');
    } else if (fetchOrderCount > 2) {
      console.log('\n⚠️ WARNING: Multiple fetch attempts detected');
      console.log('This might indicate the useEffect is firing multiple times');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'order-confirmation-final-test.png' });
    console.log('\n📸 Screenshot saved');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();