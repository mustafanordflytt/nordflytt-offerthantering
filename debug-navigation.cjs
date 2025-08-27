const puppeteer = require('puppeteer');

(async () => {
  console.log('🧪 Debugging navigation issue...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: true
    });
    const page = await browser.newPage();
    
    // Log ALL console messages
    page.on('console', msg => {
      console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    });
    
    // Log ALL navigations with details
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        console.log(`\n🔄 NAVIGATION DETECTED:`);
        console.log(`   URL: ${frame.url()}`);
        console.log(`   Time: ${new Date().toISOString()}`);
      }
    });
    
    // Log network responses
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/order-confirmation/') && !url.includes('.js') && !url.includes('.css')) {
        console.log(`\n📡 RESPONSE: ${response.status()} ${url}`);
      }
    });
    
    // Navigate
    console.log('\n📱 Initial navigation...');
    const testOrderId = '7a34f656-c868-4c9c-96fa-9dc3242e3c7c';
    await page.goto(`http://localhost:3000/order-confirmation/${testOrderId}`, {
      waitUntil: 'networkidle0'
    });
    
    console.log('\n⏳ Watching for 5 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();