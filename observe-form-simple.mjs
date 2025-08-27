import puppeteer from 'puppeteer';
import fs from 'fs';

console.log('🔍 FORMULÄR-OBSERVATÖR\n');
console.log('Instruktioner:');
console.log('1. Fyll i formuläret i webbläsaren som öppnas');
console.log('2. Välj ALLA extratjänster (packning, städning, kartonger)');
console.log('3. Jag tar screenshots automatiskt');
console.log('4. Stäng webbläsaren när du är klar\n');

async function observe() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  const screenshots = [];
  let count = 0;
  
  // Go to form
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'observe-00-start.png', fullPage: true });
  console.log('📸 Screenshot: observe-00-start.png (startpage)\n');
  
  // Auto-screenshot on navigation
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      console.log(`\n🔄 Navigerade till: ${url}`);
      
      // Wait a bit for page to load
      await new Promise(r => setTimeout(r, 2000));
      
      count++;
      const filename = `observe-${String(count).padStart(2, '0')}-auto.png`;
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`📸 Screenshot: ${filename}`);
      
      // Check content
      const content = await page.content();
      console.log('\n🔍 Kontrollerar innehåll:');
      console.log('  Packning & emballering:', content.includes('Packning & emballering') ? '✅ FINNS' : '❌ SAKNAS');
      console.log('  Flyttstädning:', content.includes('Flyttstädning') ? '✅ FINNS' : '❌ SAKNAS');
      console.log('  Kartonger:', content.includes('kartong') ? '✅ FINNS' : '❌ SAKNAS');
      
      // Special check for offer page
      if (url.includes('/offer/')) {
        console.log('\n⭐ OFFERT-SIDA DETEKTERAD! Analyserar...');
        
        // Look for price elements
        const prices = await page.$$eval('[class*="kr"], [class*="SEK"]', elements => 
          elements.map(el => el.textContent).filter(t => t && t.match(/\d/))
        );
        
        if (prices.length > 0) {
          console.log('\n💰 Priser hittade:');
          prices.slice(0, 10).forEach(p => console.log(`  - ${p}`));
        }
      }
    }
  });
  
  // Take periodic screenshots
  const interval = setInterval(async () => {
    try {
      const url = page.url();
      if (url && url !== 'about:blank') {
        count++;
        const filename = `observe-${String(count).padStart(2, '0')}-periodic.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`\n📸 Periodisk screenshot: ${filename}`);
        
        // Check what step we're on
        const stepInfo = await page.evaluate(() => {
          const progressBar = document.querySelector('[class*="progress"]');
          const heading = document.querySelector('h1, h2, h3');
          const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent);
          
          return {
            heading: heading ? heading.textContent : 'Unknown',
            hasProgress: !!progressBar,
            buttons: buttons.filter(b => b).slice(0, 3)
          };
        });
        
        console.log(`  Steg: ${stepInfo.heading}`);
        if (stepInfo.buttons.length > 0) {
          console.log(`  Knappar: ${stepInfo.buttons.join(', ')}`);
        }
      }
    } catch (e) {
      // Page might be navigating
    }
  }, 15000); // Every 15 seconds
  
  // Wait for browser to close
  await new Promise((resolve) => {
    browser.on('disconnected', () => {
      clearInterval(interval);
      console.log('\n\n✅ Observation avslutad!');
      console.log('Screenshots sparade:');
      console.log('  - observe-00-start.png');
      for (let i = 1; i <= count; i++) {
        console.log(`  - observe-${String(i).padStart(2, '0')}-*.png`);
      }
      resolve();
    });
  });
}

observe().catch(console.error);