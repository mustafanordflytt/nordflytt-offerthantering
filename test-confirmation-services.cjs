const puppeteer = require('puppeteer');

async function testConfirmationPage() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('tillägg') || msg.text().includes('additional') || msg.text().includes('services')) {
      console.log(`Browser console: ${msg.text()}`);
    }
  });
  
  try {
    // Navigate to the confirmation page
    const confirmationUrl = 'http://localhost:3000/order-confirmation/b87bc970-d99f-45ae-aa8f-1fb8bb44c3e4';
    console.log('📍 Navigating to:', confirmationUrl);
    await page.goto(confirmationUrl, { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    await page.waitForSelector('.max-w-3xl', { timeout: 10000 });
    console.log('✅ Confirmation page loaded');
    
    // Look for additional services section
    const additionalServicesSection = await page.$('h4::-p-text(Tilläggstjänster)');
    if (additionalServicesSection) {
      console.log('✅ Found "Tilläggstjänster" section!');
      
      // Get all additional service items
      const services = await page.$$eval('.bg-blue-50', elements => 
        elements.map(el => ({
          name: el.querySelector('.font-medium')?.textContent || '',
          details: el.querySelector('.text-sm.text-gray-600')?.textContent || '',
          price: el.querySelector('.text-blue-600')?.textContent || ''
        }))
      );
      
      console.log('\n📋 Additional services found:');
      services.forEach(service => {
        console.log(`  - ${service.name}: ${service.price}`);
        console.log(`    ${service.details}`);
      });
      
      // Get total additional services cost
      const totalAdditional = await page.$eval('.bg-blue-100 .text-blue-800', el => el.textContent);
      console.log(`\n💰 ${totalAdditional}`);
    } else {
      console.log('❌ "Tilläggstjänster" section not found');
      
      // Check if there are any services at all
      const anyServices = await page.$$('.flex.justify-between.items-center');
      console.log(`Found ${anyServices.length} service items on the page`);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'confirmation-services-check.png', fullPage: true });
    console.log('📸 Screenshot saved as confirmation-services-check.png');
    
    // Keep browser open for 10 seconds to inspect
    console.log('\n⏱️ Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testConfirmationPage();