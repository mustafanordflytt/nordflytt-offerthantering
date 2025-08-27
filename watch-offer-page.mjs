import puppeteer from 'puppeteer';

console.log('🔍 OFFER PAGE WATCHER\n');
console.log('Jag väntar på att du ska komma till offert-sidan...\n');

async function watchForOffer() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  
  // Start at current form
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  console.log('✅ Webbläsare öppen - fortsätt fylla i formuläret\n');
  
  let offerDetected = false;
  
  // Monitor for navigation to offer page
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      
      if (url.includes('/offer/') && !offerDetected) {
        offerDetected = true;
        console.log('\n🎯 OFFERT-SIDA DETEKTERAD!');
        console.log(`URL: ${url}\n`);
        
        // Wait for page to fully load
        console.log('⏳ Väntar på att sidan ska laddas...');
        await new Promise(r => setTimeout(r, 3000));
        
        // Take screenshot
        await page.screenshot({ path: 'offer-page-full.png', fullPage: true });
        console.log('📸 Screenshot: offer-page-full.png\n');
        
        // Analyze content
        console.log('🔍 ANALYSERAR OFFERT-INNEHÅLL:\n');
        
        const analysis = await page.evaluate(() => {
          const content = document.body.textContent || '';
          const html = document.body.innerHTML || '';
          
          // Check for services
          const services = {
            'Packning & emballering': content.includes('Packning & emballering'),
            'Packning': content.includes('Packning') && !content.includes('Ingen packning'),
            'Flyttstädning': content.includes('Flyttstädning'),
            'Städning': content.includes('Städning') && !content.includes('Ingen städning'),
            'Kartong': content.includes('kartong') || content.includes('Kartong'),
            'Låda/Lådor': content.includes('låd') || content.includes('Låd'),
            'Box/Boxar': content.includes('box') || content.includes('Box'),
            'Möbelmontering': content.includes('Möbelmontering'),
            'Upphängning': content.includes('Upphängning'),
            'Bortforsling': content.includes('Bortforsling')
          };
          
          // Find all price elements
          const priceElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const text = el.textContent || '';
            return text.includes('kr') || text.includes('SEK');
          }).map(el => el.textContent?.trim()).filter(t => t && t.length < 50);
          
          // Find sections/divs that might contain service info
          const serviceSections = Array.from(document.querySelectorAll('div, section')).filter(el => {
            const text = el.textContent || '';
            return (text.includes('Tjänst') || text.includes('Tillägg') || text.includes('Inkluderat') || 
                   text.includes('Vald') || text.includes('Extra'));
          }).map(el => el.textContent?.substring(0, 200));
          
          return {
            services,
            priceElements: priceElements.slice(0, 20),
            serviceSections: serviceSections.slice(0, 5),
            hasTable: html.includes('<table'),
            hasList: html.includes('<ul') || html.includes('<ol')
          };
        });
        
        // Report findings
        console.log('📋 TJÄNSTER - Finns de med?');
        console.log('================================');
        Object.entries(analysis.services).forEach(([service, found]) => {
          console.log(`${service}: ${found ? '✅ HITTAD' : '❌ SAKNAS'}`);
        });
        
        console.log('\n💰 PRISELEMENT HITTADE:');
        console.log('================================');
        analysis.priceElements.forEach(price => {
          console.log(`  - ${price}`);
        });
        
        if (analysis.serviceSections.length > 0) {
          console.log('\n📑 MÖJLIGA TJÄNST-SEKTIONER:');
          console.log('================================');
          analysis.serviceSections.forEach((section, i) => {
            console.log(`${i + 1}. ${section}...\n`);
          });
        }
        
        console.log('\n📊 SIDSTRUKTUR:');
        console.log(`  - Innehåller tabell: ${analysis.hasTable ? 'Ja' : 'Nej'}`);
        console.log(`  - Innehåller lista: ${analysis.hasList ? 'Ja' : 'Nej'}`);
        
        // Look specifically for the missing services section
        const missingServicesCheck = await page.evaluate(() => {
          // Check if there's supposed to be a services section
          const possibleContainers = Array.from(document.querySelectorAll('*')).filter(el => {
            const classes = el.className || '';
            const id = el.id || '';
            return classes.includes('service') || classes.includes('tjänst') || 
                   id.includes('service') || id.includes('tjänst');
          });
          
          return {
            containerCount: possibleContainers.length,
            containerInfo: possibleContainers.slice(0, 3).map(el => ({
              tag: el.tagName,
              classes: el.className,
              hasContent: (el.textContent || '').length > 0
            }))
          };
        });
        
        if (missingServicesCheck.containerCount > 0) {
          console.log('\n🔍 HITTADE SERVICE-CONTAINERS:');
          console.log(`Antal: ${missingServicesCheck.containerCount}`);
          missingServicesCheck.containerInfo.forEach(info => {
            console.log(`  - ${info.tag} (${info.classes}) - Har innehåll: ${info.hasContent ? 'Ja' : 'Nej'}`);
          });
        }
        
        console.log('\n✅ Analys klar! Kolla screenshot: offer-page-full.png');
      }
    }
  });
  
  // Keep running
  await new Promise(() => {}); // Never resolves, keeps watching
}

watchForOffer().catch(console.error);