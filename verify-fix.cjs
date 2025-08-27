const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Verifying order confirmation page fix...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    let requestCount = 0;
    let consoleCount = 0;
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/order-confirmation/')) {
        requestCount++;
        console.log(`📡 Request #${requestCount} to order-confirmation page`);
      }
    });
    
    // Monitor console logs
    page.on('console', msg => {
      if (msg.text().includes('OrderConfirmationPage component loaded')) {
        consoleCount++;
        console.log(`📋 Component loaded #${consoleCount}`);
      }
    });
    
    // Navigate to order confirmation page
    console.log('📱 Navigating to order confirmation page...');
    await page.goto('http://localhost:3000/order-confirmation/7a34f656-c868-4c9c-96fa-9dc3242e3c7c', {
      waitUntil: 'networkidle2'
    });
    
    console.log('⏳ Waiting 5 seconds to monitor for refreshes...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📊 Results:');
    console.log(`- Total page requests: ${requestCount}`);
    console.log(`- Component loads: ${consoleCount}`);
    
    if (requestCount <= 1) {
      console.log('\n✅ SUCCESS: Page is not refreshing continuously!');
      console.log('The fix is working correctly.');
    } else {
      console.log('\n❌ PROBLEM: Page is still refreshing!');
      console.log(`Expected 1 request, but got ${requestCount}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();