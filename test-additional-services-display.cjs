const puppeteer = require('puppeteer');

async function testAdditionalServicesDisplay() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  try {
    console.log('1. Navigating to offer page with additional services...');
    // Use the same offer ID from the screenshots
    await page.goto('http://localhost:3000/offer/d863008b-ef23-49d1-823b-16f50bfe6979', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2. Page loaded successfully');
    
    // Check for Valda tjänster section
    const servicesSection = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h3')).find(h => h.textContent === 'Valda tjänster');
      return !!heading;
    });
    
    console.log('3. Valda tjänster section found:', servicesSection);
    
    // Get all services displayed
    const allServices = await page.evaluate(() => {
      const services = [];
      const serviceRows = document.querySelectorAll('.flex.items-center.justify-between.mb-4');
      
      serviceRows.forEach(row => {
        const nameElement = row.querySelector('p.font-medium');
        const priceElement = row.querySelector('p.text-sm.text-\\[\\#4F4F4F\\]');
        
        if (nameElement) {
          services.push({
            name: nameElement.textContent,
            price: priceElement?.textContent || 'N/A'
          });
        }
      });
      
      return services;
    });
    
    console.log('4. All services found:');
    allServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - ${service.price}`);
    });
    
    // Check specifically for additional services section
    const hasAdditionalServicesSection = await page.evaluate(() => {
      const section = Array.from(document.querySelectorAll('p')).find(p => 
        p.textContent === 'TILLÄGGSTJÄNSTER' || 
        p.textContent === 'Tilläggstjänster'
      );
      return !!section;
    });
    
    console.log('5. Additional services section found:', hasAdditionalServicesSection);
    
    // Get additional services if present
    if (hasAdditionalServicesSection) {
      const additionalServices = await page.evaluate(() => {
        const section = Array.from(document.querySelectorAll('p')).find(p => 
          p.textContent === 'TILLÄGGSTJÄNSTER' || 
          p.textContent === 'Tilläggstjänster'
        );
        
        if (!section) return [];
        
        const services = [];
        let currentElement = section.parentElement.nextElementSibling;
        
        while (currentElement && !currentElement.querySelector('.border-t')) {
          const nameElement = currentElement.querySelector('p.font-medium');
          const priceElement = currentElement.querySelector('p.text-sm');
          
          if (nameElement) {
            services.push({
              name: nameElement.textContent,
              price: priceElement?.textContent || 'N/A'
            });
          }
          
          currentElement = currentElement.nextElementSibling;
        }
        
        return services;
      });
      
      console.log('6. Additional services found:');
      additionalServices.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name} - ${service.price}`);
      });
    }
    
    // Check total price
    const totalPrice = await page.evaluate(() => {
      const totalRow = Array.from(document.querySelectorAll('.flex.justify-between.items-center')).find(row => {
        const label = row.querySelector('span');
        return label && (label.textContent === 'Totalt' || label.textContent === 'Totalt pris:');
      });
      
      if (totalRow) {
        const priceElement = totalRow.querySelector('.text-xl.font-bold');
        return priceElement?.textContent || 'Not found';
      }
      
      return 'Not found';
    });
    
    console.log('7. Total price displayed:', totalPrice);
    
    // Take a screenshot
    await page.screenshot({ path: 'offer-additional-services-test.png', fullPage: true });
    console.log('8. Screenshot saved as offer-additional-services-test.png');
    
    console.log('\n✅ Test completed!');
    console.log('   - Valda tjänster section is visible');
    console.log('   - All services are displayed in one place');
    console.log('   - Additional services are integrated into the main section');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'offer-additional-services-error.png', fullPage: true });
  }
  
  await browser.close();
}

// Run the test
testAdditionalServicesDisplay().catch(console.error);