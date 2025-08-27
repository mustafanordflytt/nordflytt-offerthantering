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
    
    // Navigate to the offer page first
    console.log('📱 Navigating to offer page...');
    await page.goto('http://localhost:3002/offer/test-offer-id');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Click "Boka flytthjälp" button
    console.log('🎯 Clicking "Boka flytthjälp" button...');
    await page.click('button:has-text("Boka flytthjälp")');
    
    // Wait for BankID modal
    await page.waitForSelector('button:has-text("Öppna Mobilt BankID")', { timeout: 10000 });
    
    // Click BankID button
    console.log('🏦 Starting BankID authentication...');
    await page.click('button:has-text("Öppna Mobilt BankID")');
    
    // Wait for mock authentication (5 seconds)
    console.log('⏳ Waiting for mock authentication...');
    await page.waitForTimeout(6000);
    
    // Check if we're redirected to order confirmation
    await page.waitForFunction(
      () => window.location.pathname.includes('/order-confirmation'),
      { timeout: 10000 }
    );
    
    console.log('✅ Redirected to order confirmation page');
    
    // Now monitor for page refreshes
    console.log('👀 Monitoring for page refreshes for 10 seconds...');
    
    let refreshCount = 0;
    
    // Monitor navigation events
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        refreshCount++;
        console.log(`🔄 Page refresh detected! Count: ${refreshCount}`);
      }
    });
    
    // Also monitor console logs
    page.on('console', msg => {
      if (msg.text().includes('OrderConfirmationPage component loaded')) {
        console.log('📋 Component re-rendered');
      }
    });
    
    // Wait 10 seconds
    await page.waitForTimeout(10000);
    
    if (refreshCount > 1) {
      console.error(`❌ Page refreshed ${refreshCount} times - THIS IS THE BUG!`);
    } else {
      console.log('✅ Page did not refresh constantly - Bug is fixed!');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'order-confirmation-test.png' });
    console.log('📸 Screenshot saved as order-confirmation-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();