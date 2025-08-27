const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Testing complete order confirmation flow...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('OrderConfirmationPage component loaded')) {
        console.log('📋 Component loaded/re-rendered');
      }
      if (msg.text().includes('Error fetching order')) {
        console.log('❌ Error fetching order');
      }
    });
    
    // Test 1: Direct navigation to order confirmation
    console.log('\n📍 Test 1: Direct navigation to order confirmation page');
    const testOrderId = '7a34f656-c868-4c9c-96fa-9dc3242e3c7c';
    await page.goto(`http://localhost:3000/order-confirmation/${testOrderId}`);
    
    // Wait for page to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if error message is displayed
    const errorElement = await page.$('h2:has-text("Ett fel uppstod")');
    if (errorElement) {
      console.log('✅ Error page displayed correctly (order not found)');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'order-confirmation-fixed.png' });
    console.log('\n📸 Screenshot saved as order-confirmation-fixed.png');
    console.log('\n✅ All tests completed\!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
EOF < /dev/null