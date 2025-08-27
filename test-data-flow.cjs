const puppeteer = require('puppeteer');

async function testDataFlow() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('additional') || msg.text().includes('services')) {
      console.log('Console:', msg.text());
    }
  });
  
  try {
    console.log('1. Navigating to order confirmation page...');
    // Using a known booking ID from previous tests
    await page.goto('http://localhost:3000/order-confirmation/d863008b-ef23-49d1-823b-16f50bfe6979', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what services are displayed
    console.log('2. Checking displayed services...');
    
    const services = await page.evaluate(() => {
      const serviceElements = document.querySelectorAll('.text-gray-700');
      const services = [];
      
      serviceElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && (text.includes('hjälp') || text.includes('städning') || text.includes('Packning') || 
                     text.includes('Upphängning') || text.includes('Möbelmontering') || 
                     text.includes('Bortforsling') || text.includes('Flyttkartonger'))) {
          services.push(text);
        }
      });
      
      // Also check for services in any list items
      const listItems = document.querySelectorAll('li');
      listItems.forEach(li => {
        const text = li.textContent?.trim();
        if (text && text.includes('✓')) {
          services.push(text);
        }
      });
      
      return services;
    });
    
    console.log('3. Found services:', services);
    
    // Check console logs for data flow debugging
    console.log('4. Waiting for console logs about services data...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'order-confirmation-services.png', fullPage: true });
    console.log('5. Screenshot saved as order-confirmation-services.png');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'data-flow-error.png', fullPage: true });
  }
  
  await browser.close();
}

// Run the test
testDataFlow().catch(console.error);