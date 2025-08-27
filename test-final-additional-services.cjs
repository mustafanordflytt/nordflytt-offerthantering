const puppeteer = require('puppeteer');

async function testFinalAdditionalServices() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to offer page...');
    await page.goto('http://localhost:3000/offer/d863008b-ef23-49d1-823b-16f50bfe6979', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2. Page loaded successfully');
    
    // Look for TILLÄGGSTJÄNSTER section
    const additionalServicesSection = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('p'));
      const section = elements.find(p => 
        p.textContent === 'TILLÄGGSTJÄNSTER' || 
        p.textContent === 'Tilläggstjänster' ||
        p.classList.contains('uppercase')
      );
      return section ? section.textContent : null;
    });
    
    console.log('3. Additional services section:', additionalServicesSection);
    
    // Get all services in Valda tjänster
    const allServices = await page.evaluate(() => {
      const services = [];
      
      // Find the Valda tjänster card
      const cards = Array.from(document.querySelectorAll('.mt-6.p-5.border'));
      const valdaTjansterCard = cards.find(card => {
        const heading = card.querySelector('h3');
        return heading && heading.textContent === 'Valda tjänster';
      });
      
      if (!valdaTjansterCard) return services;
      
      // Get all service rows
      const serviceRows = valdaTjansterCard.querySelectorAll('.flex.items-center.justify-between.mb-4');
      
      serviceRows.forEach(row => {
        const nameElement = row.querySelector('p.font-medium');
        const priceElement = row.querySelector('p.text-sm');
        
        if (nameElement) {
          services.push({
            name: nameElement.textContent,
            price: priceElement?.textContent || 'N/A',
            hasCheckIcon: !!row.querySelector('.text-\\[\\#4CAF50\\]')
          });
        }
      });
      
      return services;
    });
    
    console.log('4. Services in Valda tjänster:');
    allServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - ${service.price} ${service.hasCheckIcon ? '✓' : ''}`);
    });
    
    // Check for specific services
    const hasMontering = allServices.some(s => s.name.includes('Möbelmontering'));
    const hasUpphangning = allServices.some(s => s.name.includes('Upphängning'));
    const hasBortforsling = allServices.some(s => s.name.includes('Bortforsling'));
    
    console.log('\n5. Additional services check:');
    console.log('   - Möbelmontering:', hasMontering ? '✓ Found' : '✗ Not found');
    console.log('   - Upphängning & installation:', hasUpphangning ? '✓ Found' : '✗ Not found');
    console.log('   - Bortforsling & återvinning:', hasBortforsling ? '✓ Found' : '✗ Not found');
    
    // Take a screenshot
    await page.screenshot({ path: 'final-additional-services-test.png', fullPage: true });
    console.log('\n6. Screenshot saved as final-additional-services-test.png');
    
    if (hasMontering && hasUpphangning && hasBortforsling) {
      console.log('\n✅ SUCCESS! All additional services are now displayed in Valda tjänster!');
    } else {
      console.log('\n⚠️  Some additional services are still missing');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'final-additional-services-error.png', fullPage: true });
  }
  
  await browser.close();
}

// Run the test
testFinalAdditionalServices().catch(console.error);